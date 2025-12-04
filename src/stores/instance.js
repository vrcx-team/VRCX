import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import {
    checkVRChatCache,
    compareByDisplayName,
    compareById,
    compareByLocationAt,
    displayLocation,
    getAvailablePlatforms,
    getBundleDateSize,
    getGroupName,
    getWorldName,
    hasGroupPermission,
    isRealInstance,
    parseLocation,
    replaceBioSymbols,
    replaceReactiveObject
} from '../shared/utils';
import { instanceRequest, userRequest, worldRequest } from '../api';
import { database } from '../service/database';
import { instanceContentSettings } from '../shared/constants';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';

export const useInstanceStore = defineStore('Instance', () => {
    const locationStore = useLocationStore();
    const worldStore = useWorldStore();
    const friendStore = useFriendStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const groupStore = useGroupStore();
    const notificationStore = useNotificationStore();
    const uiStore = useUiStore();
    const userStore = useUserStore();
    const sharedFeedStore = useSharedFeedStore();
    const photonStore = usePhotonStore();
    const { t } = useI18n();

    const state = reactive({
        updatePlayerListTimer: null,
        updatePlayerListPending: false
    });

    let cachedInstances = new Map();

    const lastInstanceApplied = ref('');

    const currentInstanceWorld = ref({
        ref: {},
        instance: {},
        isPC: false,
        isQuest: false,
        isIos: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        inCache: false,
        cacheSize: '',
        bundleSizes: [],
        lastUpdated: ''
    });

    const currentInstanceLocation = ref({});

    const queuedInstances = reactive(new Map());

    const previousInstancesInfoDialogVisible = ref(false);

    const previousInstancesInfoDialogInstanceId = ref('');

    const instanceJoinHistory = reactive(new Map());

    const currentInstanceUsersData = ref([]);
    const currentInstanceUsersTable = computed(() => {
        return {
            data: currentInstanceWorld.value.ref.id
                ? currentInstanceUsersData.value
                : [],
            tableProps: {
                stripe: true,
                size: 'small',
                defaultSort: {
                    prop: 'timer',
                    order: 'descending'
                }
            },
            layout: 'table'
        };
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            currentInstanceUsersData.value = [];
            instanceJoinHistory.clear();
            previousInstancesInfoDialogVisible.value = false;
            cachedInstances.clear();
            queuedInstances.clear();
            if (isLoggedIn) {
                getInstanceJoinHistory();
            }
        },
        { flush: 'sync' }
    );

    async function getInstanceJoinHistory() {
        try {
            const data = await database.getInstanceJoinHistory();
            instanceJoinHistory.clear();
            for (const [key, value] of data) {
                instanceJoinHistory.set(key, value);
            }
        } catch (error) {
            console.error('Failed to get instance join history:', error);
        }
    }

    function addInstanceJoinHistory(location, dateTime) {
        if (!location || !dateTime) {
            return;
        }

        if (instanceJoinHistory.has(location)) {
            instanceJoinHistory.delete(location);
        }

        const epoch = new Date(dateTime).getTime();
        instanceJoinHistory.set(location, epoch);
    }

    function showPreviousInstancesInfoDialog(instanceId) {
        previousInstancesInfoDialogVisible.value = true;
        previousInstancesInfoDialogInstanceId.value = instanceId;
    }

    function updateCurrentInstanceWorld() {
        let L;
        let instanceId = locationStore.lastLocation.location;
        if (locationStore.lastLocation.location === 'traveling') {
            instanceId = locationStore.lastLocationDestination;
        }
        if (!instanceId) {
            currentInstanceWorld.value = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            currentInstanceLocation.value = {};
        } else if (instanceId !== currentInstanceLocation.value.tag) {
            currentInstanceWorld.value = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            L = parseLocation(instanceId);
            currentInstanceLocation.value = L;
            worldRequest
                .getWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    currentInstanceWorld.value.ref = args.ref;
                    const { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    currentInstanceWorld.value.isPC = isPC;
                    currentInstanceWorld.value.isQuest = isQuest;
                    currentInstanceWorld.value.isIos = isIos;
                    currentInstanceWorld.value.avatarScalingDisabled =
                        args.ref?.tags.includes(
                            'feature_avatar_scaling_disabled'
                        );
                    currentInstanceWorld.value.focusViewDisabled =
                        args.ref?.tags.includes('feature_focus_view_disabled');
                    checkVRChatCache(args.ref)
                        .then((cacheInfo) => {
                            if (cacheInfo.Item1 > 0) {
                                currentInstanceWorld.value.inCache = true;
                                currentInstanceWorld.value.cacheSize = `${(
                                    cacheInfo.Item1 / 1048576
                                ).toFixed(2)} MB`;
                            }
                        })
                        .catch((error) => {
                            console.error(
                                'Error checking VRChat cache:',
                                error
                            );
                        });
                    getBundleDateSize(args.ref)
                        .then((bundleSizes) => {
                            currentInstanceWorld.value.bundleSizes =
                                bundleSizes;
                        })
                        .catch((error) => {
                            console.error(
                                'Error fetching bundle sizes:',
                                error
                            );
                        });
                    return args;
                })
                .catch((error) => {
                    console.error('Error fetching world data:', error);
                });
        } else {
            worldRequest
                .getCachedWorld({
                    worldId: currentInstanceLocation.value.worldId
                })
                .then((args) => {
                    currentInstanceWorld.value.ref = args.ref;
                    const { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    currentInstanceWorld.value.isPC = isPC;
                    currentInstanceWorld.value.isQuest = isQuest;
                    currentInstanceWorld.value.isIos = isIos;
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            currentInstanceWorld.value.inCache = true;
                            currentInstanceWorld.value.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                });
        }
        if (isRealInstance(instanceId)) {
            const ref = cachedInstances.get(instanceId);
            if (typeof ref !== 'undefined') {
                currentInstanceWorld.value.instance = ref;
            } else {
                L = parseLocation(instanceId);
                if (L.isRealInstance) {
                    instanceRequest
                        .getInstance({
                            worldId: L.worldId,
                            instanceId: L.instanceId
                        })
                        .then((args) => {
                            currentInstanceWorld.value.instance = args.ref;
                        })
                        .catch((error) => {
                            console.error(
                                'Error fetching instance data:',
                                error
                            );
                        });
                }
            }
        }
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyInstance(json) {
        if (!json?.id) {
            return null;
        }
        if (!json.$fetchedAt) {
            json.$fetchedAt = new Date().toJSON();
        }
        let ref = cachedInstances.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                location: '',
                instanceId: '',
                name: '',
                worldId: '',
                type: '',
                ownerId: '',
                tags: [],
                active: false,
                full: false,
                n_users: 0,
                hasCapacityForYou: true, // not present depending on endpoint
                capacity: 0,
                recommendedCapacity: 0,
                userCount: 0,
                queueEnabled: false, // only present with group instance type
                queueSize: 0, // only present when queuing is enabled
                platforms: {},
                gameServerVersion: 0,
                hardClose: null, // boolean or null
                closedAt: null, // string or null
                secureName: '',
                shortName: '',
                world: {},
                users: [], // only present when you're the owner
                clientNumber: '',
                contentSettings: {},
                photonRegion: '',
                region: '',
                canRequestInvite: false,
                permanent: false,
                private: '', // part of instance tag
                hidden: '', // part of instance tag
                nonce: '', // only present when you're the owner
                strict: false, // deprecated
                displayName: null,
                groupAccessType: null, // only present with group instance type
                roleRestricted: false, // only present with group instance type
                instancePersistenceEnabled: null,
                playerPersistenceEnabled: null,
                ageGate: null,
                // VRCX
                $fetchedAt: '',
                $disabledContentSettings: [],
                ...json
            };
            cachedInstances.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        ref.$location = parseLocation(ref.location);
        if (ref.world?.id) {
            worldRequest
                .getCachedWorld({
                    worldId: ref.world.id
                })
                .then((args) => {
                    ref.world = args.ref;
                    return args;
                });
        }
        ref.$disabledContentSettings = [];
        if (json.contentSettings && Object.keys(json.contentSettings).length) {
            for (const setting of instanceContentSettings) {
                if (
                    typeof json.contentSettings[setting] === 'undefined' ||
                    json.contentSettings[setting] === true
                ) {
                    continue;
                }
                ref.$disabledContentSettings.push(setting);
            }
        }
        if (ref.displayName) {
            ref.displayName = replaceBioSymbols(ref.displayName);
        }
        if (
            userStore.userDialog.visible &&
            userStore.userDialog.ref?.$location?.tag === ref.id
        ) {
            userStore.applyUserDialogLocation();
        }
        if (
            worldStore.worldDialog.visible &&
            worldStore.worldDialog.id === ref.worldId
        ) {
            applyWorldDialogInstances();
        }
        if (
            groupStore.groupDialog.visible &&
            groupStore.groupDialog.id === ref.ownerId
        ) {
            applyGroupDialogInstances();
        }
        for (const groupInstance of groupStore.groupInstances) {
            if (groupInstance.instance.id === ref.id) {
                groupInstance.instance = ref;
            }
        }
        lastInstanceApplied.value = ref.id;
        return ref;
    }

    async function getInstanceName(location) {
        let instanceName = '';

        const L = parseLocation(location);
        if (L.isRealInstance && L.worldId && L.instanceId) {
            const args = await instanceRequest.getCachedInstance({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
            instanceName = args.ref.displayName;
        }

        return instanceName;
    }

    /**
     *
     * @param {string} worldId
     * @param {any} options
     * @returns {Promise<{json: *, params}|null>}
     */
    async function createNewInstance(worldId = '', options) {
        let D = options;

        if (!D) {
            D = {
                loading: false,
                accessType: await configRepository.getString(
                    'instanceDialogAccessType',
                    'public'
                ),
                region: await configRepository.getString(
                    'instanceRegion',
                    'US West'
                ),
                worldId: worldId,
                groupId: await configRepository.getString(
                    'instanceDialogGroupId',
                    ''
                ),
                groupAccessType: await configRepository.getString(
                    'instanceDialogGroupAccessType',
                    'plus'
                ),
                ageGate: await configRepository.getBool(
                    'instanceDialogAgeGate',
                    false
                ),
                queueEnabled: await configRepository.getBool(
                    'instanceDialogQueueEnabled',
                    true
                ),
                roleIds: [],
                groupRef: {}
            };
        }

        let type = 'public';
        let canRequestInvite = false;
        switch (D.accessType) {
            case 'friends':
                type = 'friends';
                break;
            case 'friends+':
                type = 'hidden';
                break;
            case 'invite':
                type = 'private';
                break;
            case 'invite+':
                type = 'private';
                canRequestInvite = true;
                break;
            case 'group':
                type = 'group';
                break;
        }
        let region = 'us';
        if (D.region === 'US East') {
            region = 'use';
        } else if (D.region === 'Europe') {
            region = 'eu';
        } else if (D.region === 'Japan') {
            region = 'jp';
        }
        const params = {
            type,
            canRequestInvite,
            worldId: D.worldId,
            ownerId: userStore.currentUser.id,
            region
        };
        if (type === 'group') {
            params.groupAccessType = D.groupAccessType;
            params.ownerId = D.groupId;
            params.queueEnabled = D.queueEnabled;
            if (D.groupAccessType === 'members') {
                params.roleIds = D.roleIds;
            }
        }
        if (
            D.ageGate &&
            type === 'group' &&
            hasGroupPermission(D.groupRef, 'group-instance-age-gated-create')
        ) {
            params.ageGate = true;
        }
        if (D.displayName) {
            params.displayName = D.displayName;
        }
        try {
            const args = await instanceRequest.createInstance(params);
            return args;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function applyWorldDialogInstances() {
        let ref;
        let instance;
        const D = worldStore.worldDialog;
        if (!D.visible) {
            return;
        }
        const instances = {};
        if (D.ref.instances) {
            for (instance of D.ref.instances) {
                // instance = [ instanceId, occupants ]
                const instanceId = instance[0];
                instances[instanceId] = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
            }
        }
        const { instanceId, shortName } = D?.$location || {};
        if (instanceId && typeof instances[instanceId] === 'undefined') {
            instances[instanceId] = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName,
                ref: {}
            };
        }
        const cachedCurrentUser = userStore.cachedUsers.get(
            userStore.currentUser.id
        );
        const lastLocation$ = cachedCurrentUser?.$location;
        const playersInInstance = locationStore.lastLocation.playerList;
        if (lastLocation$?.worldId === D.id && playersInInstance.size > 0) {
            // pull instance json from cache
            const friendsInInstance = locationStore.lastLocation.friendList;
            instance = {
                id: lastLocation$.instanceId,
                tag: lastLocation$.tag,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[instance.id] = instance;
            for (const friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                const addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = userStore.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (const friend of friendStore.friends.values()) {
            const { ref } = friend;
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.worldId !== D.id ||
                (ref.$location.instanceId === lastLocation$?.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === locationStore.lastLocation.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            const { instanceId } = ref.$location;
            instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref);
        }
        ref = userStore.cachedUsers.get(userStore.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.worldId === D.id) {
            const { instanceId } = ref.$location;
            instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref); // add self
        }
        const rooms = [];
        for (instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(`${D.id}:${instance.id}`);
            instance.location = L.tag;
            if (!L.shortName) {
                L.shortName = instance.shortName;
            }
            instance.$location = L;
            L.user = {};
            if (L.userId) {
                ref = userStore.cachedUsers.get(L.userId);
                if (typeof ref === 'undefined') {
                    userRequest
                        .getUser({
                            userId: L.userId
                        })
                        .then((args) => {
                            if (args.ref.id === L.userId) {
                                Object.assign(L.user, args.ref);
                                instance.$location = L;
                                applyWorldDialogInstances();
                            }
                        });
                } else {
                    L.user = ref;
                }
            }
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (appearanceSettingsStore.instanceUsersSortAlphabetical) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance from cache
        for (const room of rooms) {
            ref = cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                Object.assign(room.ref, ref);
            }
        }
        rooms.sort(function (a, b) {
            // sort selected and current instance to top
            if (
                b.location === D.$location.tag ||
                b.location === lastLocation$?.tag
            ) {
                // sort selected instance above current instance
                if (a.location === D.$location.tag) {
                    return -1;
                }
                return 1;
            }
            if (
                a.location === D.$location.tag ||
                a.location === lastLocation$?.tag
            ) {
                // sort selected instance above current instance
                if (b.location === D.$location.tag) {
                    return 1;
                }
                return -1;
            }
            // sort by number of users when no friends in instance
            if (
                a.users.length === 0 &&
                b.users.length === 0 &&
                a.ref?.userCount !== b.ref?.userCount
            ) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length !== b.users.length) {
                if (a.users.length < b.users.length) {
                    return 1;
                }
                return -1;
            }
            // sort by id
            return compareById(a, b);
        });
        D.rooms = rooms;
    }

    /**
     *
     * @param {object} inputInstances
     */
    function applyGroupDialogInstances(inputInstances) {
        let ref;
        let instance;
        const D = groupStore.groupDialog;
        if (!D.visible) {
            return;
        }
        const instances = {};
        for (instance of D.instances) {
            instances[instance.tag] = {
                ...instance,
                friendCount: 0,
                users: []
            };
        }
        if (typeof inputInstances !== 'undefined') {
            for (instance of inputInstances) {
                instances[instance.location] = {
                    id: instance.instanceId,
                    tag: instance.location,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: instance.shortName,
                    ref: instance
                };
            }
        }
        const cachedCurrentUser = userStore.cachedUsers.get(
            userStore.currentUser.id
        );
        const lastLocation$ = cachedCurrentUser?.$location;
        const currentLocation = lastLocation$?.tag;
        const playersInInstance = locationStore.lastLocation.playerList;
        if (lastLocation$?.groupId === D.id && playersInInstance.size > 0) {
            const friendsInInstance = locationStore.lastLocation.friendList;
            instance = {
                id: lastLocation$.instanceId,
                tag: currentLocation,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[currentLocation] = instance;
            for (const friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                const addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = userStore.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (const friend of friendStore.friends.values()) {
            const { ref } = friend;
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.groupId !== D.id ||
                (ref.$location.instanceId === lastLocation$?.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === locationStore.lastLocation.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            const { instanceId, tag } = ref.$location;
            instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref);
        }
        ref = userStore.cachedUsers.get(userStore.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.groupId === D.id) {
            const { instanceId, tag } = ref.$location;
            instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref); // add self
        }
        const rooms = [];
        for (instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(instance.tag);
            instance.location = instance.tag;
            instance.$location = L;
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (appearanceSettingsStore.instanceUsersSortAlphabetical) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance
        for (const room of rooms) {
            ref = cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                Object.assign(room.ref, ref);
            } else if (isRealInstance(room.tag)) {
                instanceRequest.getInstance({
                    worldId: room.$location.worldId,
                    instanceId: room.$location.instanceId
                });
            }
        }
        rooms.sort(function (a, b) {
            // sort current instance to top
            if (b.location === currentLocation) {
                return 1;
            }
            if (a.location === currentLocation) {
                return -1;
            }
            // sort by number of users when no friends in instance
            if (a.users.length === 0 && b.users.length === 0) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length < b.users.length) {
                return 1;
            }
            return -1;
        });
        D.instances = rooms;
    }

    function removeAllQueuedInstances() {
        queuedInstances.forEach((ref) => {
            ElMessage({
                message: `Removed instance ${ref.$worldName} from queue`,
                type: 'info'
            });
            ref.$msgBox?.close();
        });
        queuedInstances.clear();
    }

    /**
     *
     * @param {string} instanceId
     */
    function removeQueuedInstance(instanceId) {
        const ref = queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            queuedInstances.delete(instanceId);
        }
    }

    /**
     *
     * @param {string} instanceId
     */
    function applyQueuedInstance(instanceId) {
        queuedInstances.forEach((ref) => {
            if (ref.location !== instanceId) {
                ElMessage({
                    message: t('message.instance.removed_form_queue', {
                        worldName: ref.$worldName
                    }),
                    type: 'info'
                });
                ref.$msgBox?.close();
                queuedInstances.delete(ref.location);
            }
        });
        if (!instanceId) {
            return;
        }
        if (!queuedInstances.has(instanceId)) {
            const L = parseLocation(instanceId);
            if (L.isRealInstance) {
                instanceRequest
                    .getInstance({
                        worldId: L.worldId,
                        instanceId: L.instanceId
                    })
                    .then((args) => {
                        if (args.json?.queueSize) {
                            instanceQueueUpdate(
                                instanceId,
                                args.json?.queueSize,
                                args.json?.queueSize
                            );
                        }
                    })
                    .catch((error) => {
                        console.error(
                            'Error fetching instance data for queue:',
                            error
                        );
                    });
            }
            instanceQueueUpdate(instanceId, 0, 0);
        }
    }

    /**
     *
     * @param {string} instanceId
     */
    function instanceQueueReady(instanceId) {
        const ref = queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            queuedInstances.delete(instanceId);
        }
        const L = parseLocation(instanceId);
        const group = groupStore.cachedGroups.get(L.groupId);
        const groupName = group?.name ?? '';
        const worldName = ref?.$worldName ?? '';
        const location = displayLocation(instanceId, worldName, groupName);
        ElMessage({
            message: `Instance ready to join ${location}`,
            type: 'success'
        });
        const noty = {
            created_at: new Date().toJSON(),
            type: 'group.queueReady',
            imageUrl: group?.iconUrl,
            message: `Instance ready to join ${location}`,
            location: instanceId,
            groupName,
            worldName
        };
        if (
            notificationStore.notificationTable.filters[0].value.length === 0 ||
            notificationStore.notificationTable.filters[0].value.includes(
                noty.type
            )
        ) {
            uiStore.notifyMenu('notification');
        }
        notificationStore.queueNotificationNoty(noty);
        notificationStore.notificationTable.data.push(noty);
        sharedFeedStore.updateSharedFeed(true);
    }

    /**
     *
     * @param {string} instanceId
     * @param {number} position
     * @param {number} queueSize
     * @returns {Promise<void>}
     */
    async function instanceQueueUpdate(instanceId, position, queueSize) {
        let ref = queuedInstances.get(instanceId);
        if (typeof ref === 'undefined') {
            ref = {
                $msgBox: null,
                $groupName: '',
                $worldName: '',
                location: instanceId,
                position: 0,
                queueSize: 0,
                updatedAt: 0
            };
        }
        ref.position = position;
        ref.queueSize = queueSize;
        ref.updatedAt = Date.now();
        if (!ref.$groupName) {
            ref.$groupName = await getGroupName(instanceId);
        }
        if (!ref.$worldName) {
            ref.$worldName = await getWorldName(instanceId);
        }
        const location = displayLocation(
            instanceId,
            ref.$worldName,
            ref.$groupName
        );
        ref.$msgBox?.close();
        ref.$msgBox = ElMessage({
            message: `You are in position ${ref.position} of ${ref.queueSize} in the queue for ${location} `,
            type: 'info',
            duration: 0,
            showClose: true,
            customClass: 'vrc-instance-queue-message'
        });
        queuedInstances.set(instanceId, ref);
        // workerTimers.setTimeout(this.instanceQueueTimeout, 3600000);
    }

    function getCurrentInstanceUserList() {
        if (!watchState.isFriendsLoaded) {
            return;
        }
        if (state.updatePlayerListTimer) {
            state.updatePlayerListPending = true;
        } else {
            updatePlayerListExecute();
            state.updatePlayerListTimer = setTimeout(() => {
                if (state.updatePlayerListPending) {
                    updatePlayerListExecute();
                }
                state.updatePlayerListTimer = null;
            }, 150);
        }
    }

    function updatePlayerListExecute() {
        try {
            updatePlayerListDebounce();
        } catch (err) {
            console.error(err);
        }
        state.updatePlayerListTimer = null;
        state.updatePlayerListPending = false;
    }

    function updatePlayerListDebounce() {
        const users = [];
        const pushUser = function (ref) {
            let photonId = -1;
            let isFriend = false;
            let isBlocked = false;
            let isMuted = false;
            let isAvatarInteractionDisabled = false;
            let isChatBoxMuted = false;
            let ageVerified = false;
            photonStore.photonLobbyCurrent.forEach((ref1, id) => {
                if (typeof ref1 !== 'undefined') {
                    if (
                        (typeof ref.id !== 'undefined' &&
                            typeof ref1.id !== 'undefined' &&
                            ref1.id === ref.id) ||
                        (typeof ref.displayName !== 'undefined' &&
                            typeof ref1.displayName !== 'undefined' &&
                            ref1.displayName === ref.displayName)
                    ) {
                        photonId = id;
                    }
                }
            });
            let isMaster = false;
            if (
                photonStore.photonLobbyMaster !== 0 &&
                photonId === photonStore.photonLobbyMaster
            ) {
                isMaster = true;
            }
            let isModerator = false;
            const lobbyJointime = photonStore.photonLobbyJointime.get(photonId);
            let inVRMode = null;
            let groupOnNameplate = '';
            if (typeof lobbyJointime !== 'undefined') {
                inVRMode = lobbyJointime.inVRMode;
                groupOnNameplate = lobbyJointime.groupOnNameplate;
                isModerator = lobbyJointime.canModerateInstance;
            }
            // if (groupOnNameplate) {
            //     API.getCachedGroup({
            //         groupId: groupOnNameplate
            //     }).then((args) => {
            //         groupOnNameplate = args.ref.name;
            //     });
            // }
            let timeoutTime = 0;
            if (typeof ref.id !== 'undefined') {
                isFriend = ref.isFriend;
                if (
                    photonStore.timeoutHudOverlayFilter === 'VIP' ||
                    photonStore.timeoutHudOverlayFilter === 'Friends'
                ) {
                    photonStore.photonLobbyTimeout.forEach((ref1) => {
                        if (ref1.userId === ref.id) {
                            timeoutTime = ref1.time;
                        }
                    });
                } else {
                    photonStore.photonLobbyTimeout.forEach((ref1) => {
                        if (ref1.displayName === ref.displayName) {
                            timeoutTime = ref1.time;
                        }
                    });
                }
                isBlocked = ref.$moderations.isBlocked;
                isMuted = ref.$moderations.isMuted;
                isAvatarInteractionDisabled =
                    ref.$moderations.isAvatarInteractionDisabled;
                isChatBoxMuted = ref.$moderations.isChatBoxMuted;
                ageVerified = ref.ageVerificationStatus === '18+';
            }
            users.push({
                ref,
                displayName: ref.displayName,
                timer: ref.$location_at,
                $trustSortNum: ref.$trustSortNum ?? 0,
                photonId,
                isMaster,
                isModerator,
                inVRMode,
                groupOnNameplate,
                isFriend,
                timeoutTime,
                isBlocked,
                isMuted,
                isAvatarInteractionDisabled,
                isChatBoxMuted,
                ageVerified
            });
        };

        const playersInInstance = locationStore.lastLocation.playerList;
        if (playersInInstance.size > 0) {
            let ref = userStore.cachedUsers.get(userStore.currentUser.id);
            if (typeof ref !== 'undefined' && playersInInstance.has(ref.id)) {
                pushUser(ref);
            }
            for (const player of playersInInstance.values()) {
                // if friend isn't in instance add them
                if (player.displayName === userStore.currentUser.displayName) {
                    continue;
                }
                const addUser = !users.some(function (user) {
                    return player.displayName === user.displayName;
                });
                if (addUser) {
                    ref = userStore.cachedUsers.get(player.userId);
                    if (typeof ref !== 'undefined') {
                        pushUser(ref);
                    } else {
                        let { joinTime } =
                            locationStore.lastLocation.playerList.get(
                                player.userId
                            );
                        if (!joinTime) {
                            joinTime = Date.now();
                        }
                        ref = {
                            // if userId is missing just push displayName
                            displayName: player.displayName,
                            $location_at: joinTime,
                            $online_for: joinTime
                        };
                        pushUser(ref);
                    }
                }
            }
        }
        currentInstanceUsersData.value = users;
    }

    // $app.methods.instanceQueueClear = function () {
    //     // remove all instances from queue
    //     queuedInstances.forEach((ref) => {
    //         ref.$msgBox.close();
    //         queuedInstances.delete(ref.location);
    //     });
    // };

    return {
        state,

        cachedInstances,
        lastInstanceApplied,
        currentInstanceWorld,
        currentInstanceLocation,
        queuedInstances,
        previousInstancesInfoDialogVisible,
        previousInstancesInfoDialogInstanceId,
        instanceJoinHistory,
        currentInstanceUsersTable,

        applyInstance,
        updateCurrentInstanceWorld,
        createNewInstance,
        applyWorldDialogInstances,
        applyGroupDialogInstances,
        removeAllQueuedInstances,
        removeQueuedInstance,
        applyQueuedInstance,
        instanceQueueReady,
        instanceQueueUpdate,
        showPreviousInstancesInfoDialog,
        addInstanceJoinHistory,
        getCurrentInstanceUserList,
        getInstanceJoinHistory,
        getInstanceName
    };
});
