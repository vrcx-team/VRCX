import { defineStore } from 'pinia';
import Vue, { computed, reactive, watch } from 'vue';
import { instanceRequest, userRequest, worldRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { database } from '../service/database';
import { watchState } from '../service/watchState';
import { instanceContentSettings } from '../shared/constants';
import {
    checkVRChatCache,
    compareByDisplayName,
    compareByLocationAt,
    displayLocation,
    getAvailablePlatforms,
    getBundleDateSize,
    getGroupName,
    getWorldName,
    hasGroupPermission,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { useI18n } from 'vue-i18n-bridge';

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
        cachedInstances: new Map(),
        currentInstanceWorld: {
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
        },
        currentInstanceLocation: {},
        queuedInstances: new Map(),
        previousInstancesInfoDialogVisible: false,
        previousInstancesInfoDialogInstanceId: '',
        instanceJoinHistory: new Map(),
        currentInstanceUserList: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'timer',
                    order: 'descending'
                }
            },
            layout: 'table'
        },
        updatePlayerListTimer: null,
        updatePlayerListPending: false
    });

    const cachedInstances = computed({
        get() {
            return state.cachedInstances;
        },
        set(value) {
            state.cachedInstances = value;
        }
    });

    const currentInstanceWorld = computed({
        get: () => state.currentInstanceWorld,
        set: (value) => {
            state.currentInstanceWorld = value;
        }
    });

    const currentInstanceLocation = computed({
        get: () => state.currentInstanceLocation,
        set: (value) => {
            state.currentInstanceLocation = value;
        }
    });

    const queuedInstances = computed({
        get: () => state.queuedInstances,
        set: (value) => {
            state.queuedInstances = value;
        }
    });

    const previousInstancesInfoDialogVisible = computed({
        get: () => state.previousInstancesInfoDialogVisible,
        set: (value) => {
            state.previousInstancesInfoDialogVisible = value;
        }
    });

    const previousInstancesInfoDialogInstanceId = computed({
        get: () => state.previousInstancesInfoDialogInstanceId,
        set: (value) => {
            state.previousInstancesInfoDialogInstanceId = value;
        }
    });

    const instanceJoinHistory = computed({
        get: () => state.instanceJoinHistory,
        set: (value) => {
            state.instanceJoinHistory = value;
        }
    });

    const currentInstanceUserList = computed({
        get: () => state.currentInstanceUserList,
        set: (value) => {
            state.currentInstanceUserList = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.currentInstanceUserList.data = [];
            state.instanceJoinHistory = new Map();
            state.previousInstancesInfoDialogVisible = false;
            state.cachedInstances.clear();
            state.queuedInstances.clear();
            if (isLoggedIn) {
                getInstanceJoinHistory();
            }
        },
        { flush: 'sync' }
    );

    async function getInstanceJoinHistory() {
        state.instanceJoinHistory = await database.getInstanceJoinHistory();
    }

    function addInstanceJoinHistory(location, dateTime) {
        if (!location || !dateTime) {
            return;
        }

        if (state.instanceJoinHistory.has(location)) {
            state.instanceJoinHistory.delete(location);
        }

        const epoch = new Date(dateTime).getTime();
        state.instanceJoinHistory.set(location, epoch);
    }

    function showPreviousInstancesInfoDialog(instanceId) {
        state.previousInstancesInfoDialogVisible = true;
        state.previousInstancesInfoDialogInstanceId = instanceId;
    }

    function updateCurrentInstanceWorld() {
        let L;
        let instanceId = locationStore.lastLocation.location;
        if (locationStore.lastLocation.location === 'traveling') {
            instanceId = locationStore.lastLocationDestination;
        }
        if (!instanceId) {
            state.currentInstanceWorld = {
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
            state.currentInstanceLocation = {};
        } else if (instanceId !== state.currentInstanceLocation.tag) {
            state.currentInstanceWorld = {
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
            state.currentInstanceLocation = L;
            worldRequest
                .getWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    state.currentInstanceWorld.ref = args.ref;
                    const { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    state.currentInstanceWorld.isPC = isPC;
                    state.currentInstanceWorld.isQuest = isQuest;
                    state.currentInstanceWorld.isIos = isIos;
                    state.currentInstanceWorld.avatarScalingDisabled =
                        args.ref?.tags.includes(
                            'feature_avatar_scaling_disabled'
                        );
                    state.currentInstanceWorld.focusViewDisabled =
                        args.ref?.tags.includes('feature_focus_view_disabled');
                    checkVRChatCache(args.ref)
                        .then((cacheInfo) => {
                            if (cacheInfo.Item1 > 0) {
                                state.currentInstanceWorld.inCache = true;
                                state.currentInstanceWorld.cacheSize = `${(
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
                            state.currentInstanceWorld.bundleSizes =
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
                    worldId: state.currentInstanceLocation.worldId
                })
                .then((args) => {
                    state.currentInstanceWorld.ref = args.ref;
                    const { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    state.currentInstanceWorld.isPC = isPC;
                    state.currentInstanceWorld.isQuest = isQuest;
                    state.currentInstanceWorld.isIos = isIos;
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            state.currentInstanceWorld.inCache = true;
                            state.currentInstanceWorld.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                });
        }
        if (isRealInstance(instanceId)) {
            const ref = state.cachedInstances.get(instanceId);
            if (typeof ref !== 'undefined') {
                state.currentInstanceWorld.instance = ref;
            } else {
                L = parseLocation(instanceId);
                if (L.isRealInstance) {
                    instanceRequest
                        .getInstance({
                            worldId: L.worldId,
                            instanceId: L.instanceId
                        })
                        .then((args) => {
                            state.currentInstanceWorld.instance = args.ref;
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
        let ref = state.cachedInstances.get(json.id);
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
            state.cachedInstances.set(ref.id, ref);
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
        if (
            userStore.userDialog.visible &&
            userStore.userDialog.ref.$location.tag === ref.id
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
        return ref;
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
        const { instanceId, shortName } = D.$location;
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
        const lastLocation$ = cachedCurrentUser.$location;
        const playersInInstance = locationStore.lastLocation.playerList;
        if (lastLocation$.worldId === D.id && playersInInstance.size > 0) {
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
                (ref.$location.instanceId === lastLocation$.instanceId &&
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
            if (L.userId) {
                ref = userStore.cachedUsers.get(L.userId);
                if (typeof ref === 'undefined') {
                    userRequest
                        .getUser({
                            userId: L.userId
                        })
                        .then((args) => {
                            Vue.set(L, 'user', args.ref);
                            return args;
                        })
                        .catch((error) => {
                            console.error('Error fetching user:', error);
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
            ref = state.cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
            }
        }
        rooms.sort(function (a, b) {
            // sort selected and current instance to top
            if (
                b.location === D.$location.tag ||
                b.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (a.location === D.$location.tag) {
                    return -1;
                }
                return 1;
            }
            if (
                a.location === D.$location.tag ||
                a.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (b.location === D.$location.tag) {
                    return 1;
                }
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
        const lastLocation$ = cachedCurrentUser.$location;
        const currentLocation = lastLocation$.tag;
        const playersInInstance = locationStore.lastLocation.playerList;
        if (lastLocation$.groupId === D.id && playersInInstance.size > 0) {
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
                (ref.$location.instanceId === lastLocation$.instanceId &&
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
            ref = cachedInstances.value.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
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
        state.queuedInstances.forEach((ref) => {
            $app.$message({
                message: `Removed instance ${ref.$worldName} from queue`,
                type: 'info'
            });
            ref.$msgBox?.close();
        });
        state.queuedInstances.clear();
    }

    /**
     *
     * @param {string} instanceId
     */
    function removeQueuedInstance(instanceId) {
        const ref = state.queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            state.queuedInstances.delete(instanceId);
        }
    }

    /**
     *
     * @param {string} instanceId
     */
    function applyQueuedInstance(instanceId) {
        state.queuedInstances.forEach((ref) => {
            if (ref.location !== instanceId) {
                $app.$message({
                    message: t('message.instance.removed_form_queue', {
                        worldName: ref.$worldName
                    }),
                    type: 'info'
                });
                ref.$msgBox?.close();
                state.queuedInstances.delete(ref.location);
            }
        });
        if (!instanceId) {
            return;
        }
        if (!state.queuedInstances.has(instanceId)) {
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
        const ref = state.queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            state.queuedInstances.delete(instanceId);
        }
        const L = parseLocation(instanceId);
        const group = groupStore.cachedGroups.get(L.groupId);
        const groupName = group?.name ?? '';
        const worldName = ref?.$worldName ?? '';
        const location = displayLocation(instanceId, worldName, groupName);
        $app.$message({
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
        let ref = state.queuedInstances.get(instanceId);
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
        if (!ref.$msgBox || ref.$msgBox.closed) {
            ref.$msgBox = $app.$message({
                message: '',
                type: 'info',
                duration: 0,
                showClose: true,
                customClass: 'vrc-instance-queue-message'
            });
        }
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
        ref.$msgBox.message = `You are in position ${ref.position} of ${ref.queueSize} in the queue for ${location} `;
        state.queuedInstances.set(instanceId, ref);
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
            let photonId = '';
            let isFriend = false;
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
                timeoutTime
            });
            // get block, mute
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
        state.currentInstanceUserList.data = users;
    }

    // $app.methods.instanceQueueClear = function () {
    //     // remove all instances from queue
    //     state.queuedInstances.forEach((ref) => {
    //         ref.$msgBox.close();
    //         state.queuedInstances.delete(ref.location);
    //     });
    // };

    return {
        state,
        cachedInstances,
        currentInstanceWorld,
        currentInstanceLocation,
        queuedInstances,
        previousInstancesInfoDialogVisible,
        previousInstancesInfoDialogInstanceId,
        instanceJoinHistory,
        currentInstanceUserList,
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
        getInstanceJoinHistory
    };
});
