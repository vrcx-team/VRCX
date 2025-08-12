import Noty from 'noty';
import { defineStore } from 'pinia';
import Vue, { computed, reactive, watch } from 'vue';
import { notificationRequest, userRequest, worldRequest } from '../api';
import configRepository from '../service/config';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import { watchState } from '../service/watchState';
import {
    checkCanInvite,
    displayLocation,
    extractFileId,
    extractFileVersion,
    getUserMemo,
    parseLocation,
    removeFromArray
} from '../shared/utils';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useLocationStore } from './location';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUserStore } from './user';

export const useNotificationStore = defineStore('Notification', () => {
    const generalSettingsStore = useGeneralSettingsStore();
    const locationStore = useLocationStore();
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const userStore = useUserStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const uiStore = useUiStore();
    const gameStore = useGameStore();
    const sharedFeedStore = useSharedFeedStore();
    const state = reactive({
        notificationInitStatus: false,
        notificationTable: {
            data: [],
            filters: [
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                },
                {
                    prop: ['senderUsername', 'message'],
                    value: ''
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'created_at',
                    order: 'descending'
                }
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 20, 25, 50, 100]
            }
        },
        unseenNotifications: [],
        isNotificationsLoading: false,
        notyMap: []
    });

    async function init() {
        state.notificationTable.filters[0].value = JSON.parse(
            await configRepository.getString(
                'VRCX_notificationTableFilters',
                '[]'
            )
        );
    }

    init();

    const notificationInitStatus = computed({
        get: () => state.notificationInitStatus,
        set: (value) => {
            state.notificationInitStatus = value;
        }
    });

    const notificationTable = computed({
        get: () => state.notificationTable,
        set: (value) => {
            state.notificationTable = value;
        }
    });

    const unseenNotifications = computed({
        get: () => state.unseenNotifications,
        set: (value) => {
            state.unseenNotifications = value;
        }
    });

    const isNotificationsLoading = computed({
        get: () => state.isNotificationsLoading,
        set: (value) => {
            state.isNotificationsLoading = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.isNotificationsLoading = false;
            state.notificationTable.data = [];
            if (isLoggedIn) {
                initNotifications();
            }
        },
        { flush: 'sync' }
    );

    function handleNotification(args) {
        args.ref = applyNotification(args.json);
        const { ref } = args;
        const array = state.notificationTable.data;
        const { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                Vue.set(array, i, ref);
                return;
            }
        }
        if (ref.senderUserId !== userStore.currentUser.id) {
            if (
                ref.type !== 'friendRequest' &&
                ref.type !== 'ignoredFriendRequest' &&
                !ref.type.includes('.')
            ) {
                database.addNotificationToDatabase(ref);
            }
            if (watchState.isFriendsLoaded && state.notificationInitStatus) {
                if (
                    state.notificationTable.filters[0].value.length === 0 ||
                    state.notificationTable.filters[0].value.includes(ref.type)
                ) {
                    uiStore.notifyMenu('notification');
                }
                state.unseenNotifications.push(ref.id);
                queueNotificationNoty(ref);
            }
        }
        state.notificationTable.data.push(ref);
        sharedFeedStore.updateSharedFeed(true);
        const D = userStore.userDialog;
        if (
            D.visible === false ||
            ref.$isDeleted ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id
        ) {
            return;
        }
        D.incomingRequest = true;
    }

    function handleNotificationHide(args) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        args.ref = ref;
        if (
            ref.type === 'friendRequest' ||
            ref.type === 'ignoredFriendRequest' ||
            ref.type.includes('.')
        ) {
            for (let i = array.length - 1; i >= 0; i--) {
                if (array[i].id === ref.id) {
                    array.splice(i, 1);
                    break;
                }
            }
        } else {
            ref.$isExpired = true;
            database.updateNotificationExpired(ref);
        }
        handleNotificationExpire({
            ref,
            params: {
                notificationId: ref.id
            }
        });
    }

    function handleNotificationV2Update(args) {
        const notificationId = args.params.notificationId;
        const json = args.json;
        if (!json) {
            return;
        }
        json.id = notificationId;
        handleNotification({
            json,
            params: {
                notificationId
            }
        });
        if (json.seen) {
            handleNotificationSee({
                params: {
                    notificationId
                }
            });
        }
    }

    function handlePipelineNotification(args) {
        const ref = args.json;
        if (
            ref.type !== 'requestInvite' ||
            generalSettingsStore.autoAcceptInviteRequests === 'Off'
        ) {
            return;
        }

        let currentLocation = locationStore.lastLocation.location;
        if (locationStore.lastLocation.location === 'traveling') {
            currentLocation = locationStore.lastLocationDestination;
        }
        if (!currentLocation) {
            return;
        }
        if (
            generalSettingsStore.autoAcceptInviteRequests === 'All Favorites' &&
            !favoriteStore.favoriteFriends.some(
                (x) => x.id === ref.senderUserId
            )
        ) {
            return;
        }
        if (
            generalSettingsStore.autoAcceptInviteRequests ===
                'Selected Favorites' &&
            !friendStore.localFavoriteFriends.has(ref.senderUserId)
        ) {
            return;
        }
        if (!checkCanInvite(currentLocation)) {
            return;
        }

        const L = parseLocation(currentLocation);
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .then((args1) => {
                notificationRequest
                    .sendInvite(
                        {
                            instanceId: L.tag,
                            worldId: L.tag,
                            worldName: args1.ref.name,
                            rsvp: true
                        },
                        ref.senderUserId
                    )
                    .then((_args) => {
                        const text = `Auto invite sent to ${ref.senderUsername}`;
                        if (AppGlobal.errorNoty) {
                            AppGlobal.errorNoty.close();
                        }
                        AppGlobal.errorNoty = new Noty({
                            type: 'info',
                            text
                        });
                        AppGlobal.errorNoty.show();
                        console.log(text);
                        notificationRequest.hideNotification({
                            notificationId: ref.id
                        });
                        return _args;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            });
    }

    function handleNotificationSee(args) {
        const { notificationId } = args.params;
        removeFromArray(state.unseenNotifications, notificationId);
        if (state.unseenNotifications.length === 0) {
            uiStore.removeNotify('notification');
        }
    }

    function handleNotificationAccept(args) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        args.ref = ref;
        handleNotificationExpire({
            ref,
            params: {
                notificationId: ref.id
            }
        });
        friendStore.handleFriendAdd({
            params: {
                userId: ref.senderUserId
            }
        });

        const D = userStore.userDialog;
        if (
            D.visible === false ||
            typeof args.ref === 'undefined' ||
            args.ref.type !== 'friendRequest' ||
            args.ref.senderUserId !== D.id
        ) {
            return;
        }
        D.isFriend = true;
    }

    function handleNotificationExpire(args) {
        const { ref } = args;
        const D = userStore.userDialog;
        if (
            D.visible === false ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id
        ) {
            return;
        }
        D.incomingRequest = false;
    }

    /**
     *
     * @param {object} json
     * @returns {object}
     */
    function applyNotification(json) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === json.id) {
                ref = array[i];
                break;
            }
        }
        // delete any null in json
        for (const key in json) {
            if (json[key] === null) {
                delete json[key];
            }
        }
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                senderUserId: '',
                senderUsername: '',
                type: '',
                message: '',
                details: {},
                seen: false,
                created_at: '',
                // VRCX
                $isExpired: false,
                //
                ...json
            };
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (ref.details !== Object(ref.details)) {
            let details = {};
            if (ref.details !== '{}') {
                try {
                    const object = JSON.parse(ref.details);
                    if (object === Object(object)) {
                        details = object;
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            ref.details = details;
        }
        return ref;
    }

    function expireFriendRequestNotifications() {
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' ||
                array[i].type === 'ignoredFriendRequest' ||
                array[i].type.includes('.')
            ) {
                array.splice(i, 1);
            }
        }
    }

    /**
     *
     * @param {string} notificationId
     */
    function expireNotification(notificationId) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        database.updateNotificationExpired(ref);
        handleNotificationExpire({
            ref,
            params: {
                notificationId: ref.id
            }
        });
    }

    function handleNotificationV2(args) {
        const json = args.json;
        json.created_at = json.createdAt;
        if (json.title && json.message) {
            json.message = `${json.title}, ${json.message}`;
        } else if (json.title) {
            json.message = json.title;
        }
        handleNotification({
            json,
            params: {
                notificationId: json.id
            }
        });
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async function refreshNotifications() {
        state.isNotificationsLoading = true;
        let count;
        let params;
        try {
            expireFriendRequestNotifications();
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args = await notificationRequest.getNotifications(params);
                for (const json of args.json) {
                    handleNotification({
                        json,
                        params: {
                            notificationId: json.id
                        }
                    });
                }
                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args =
                    await notificationRequest.getNotificationsV2(params);

                for (const json of args.json) {
                    json.created_at = json.createdAt;
                    if (json.title && json.message) {
                        json.message = `${json.title}, ${json.message}`;
                    } else if (json.title) {
                        json.message = json.title;
                    }
                    handleNotification({
                        json,
                        params: {
                            notificationId: json.id
                        }
                    });
                }

                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args =
                    await notificationRequest.getHiddenFriendRequests(params);
                for (const json of args.json) {
                    json.type = 'ignoredFriendRequest';
                    handleNotification({
                        json,
                        params: {
                            notificationId: json.id
                        }
                    });
                }
                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            state.isNotificationsLoading = false;
            state.notificationInitStatus = true;
        }
    }

    /**
     *
     * @param {object} noty
     */
    function queueNotificationNoty(noty) {
        noty.isFriend = friendStore.friends.has(noty.senderUserId);
        noty.isFavorite = friendStore.localFavoriteFriends.has(
            noty.senderUserId
        );
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            playNoty(noty);
        }
    }

    function playNoty(noty) {
        if (
            userStore.currentUser.status === 'busy' ||
            !watchState.isFriendsLoaded
        ) {
            return;
        }
        let displayName = '';
        if (noty.displayName) {
            displayName = noty.displayName;
        } else if (noty.senderUsername) {
            displayName = noty.senderUsername;
        } else if (noty.sourceDisplayName) {
            displayName = noty.sourceDisplayName;
        }
        if (displayName) {
            // don't play noty twice
            const notyId = `${noty.type},${displayName}`;
            if (
                state.notyMap[notyId] &&
                state.notyMap[notyId] >= noty.created_at
            ) {
                return;
            }
            state.notyMap[notyId] = noty.created_at;
        }
        const bias = new Date(Date.now() - 60000).toJSON();
        if (noty.created_at < bias) {
            // don't play noty if it's over 1min old
            return;
        }

        const notiConditions = {
            Always: () => true,
            'Inside VR': () => gameStore.isSteamVRRunning,
            'Outside VR': () => !gameStore.isSteamVRRunning,
            'Game Closed': () => !gameStore.isGameRunning, // Also known as "Outside VRChat"
            'Game Running': () => gameStore.isGameRunning, // Also known as "Inside VRChat"
            'Desktop Mode': () =>
                gameStore.isGameNoVR && gameStore.isGameRunning,
            AFK: () =>
                notificationsSettingsStore.afkDesktopToast &&
                gameStore.isHmdAfk &&
                gameStore.isGameRunning &&
                !gameStore.isGameNoVR
        };

        const playNotificationTTS =
            notiConditions[notificationsSettingsStore.notificationTTS]?.();
        const playDesktopToast =
            notiConditions[notificationsSettingsStore.desktopToast]?.() ||
            notiConditions['AFK']();

        const playOverlayToast =
            notiConditions[notificationsSettingsStore.overlayToast]?.();
        const playOverlayNotification =
            notificationsSettingsStore.overlayNotifications && playOverlayToast;
        const playXSNotification =
            notificationsSettingsStore.xsNotifications && playOverlayToast;
        const playOvrtHudNotifications =
            notificationsSettingsStore.ovrtHudNotifications && playOverlayToast;
        const playOvrtWristNotifications =
            notificationsSettingsStore.ovrtWristNotifications &&
            playOverlayToast;

        let message = '';
        if (noty.title) {
            message = `${noty.title}, ${noty.message}`;
        } else if (noty.message) {
            message = noty.message;
        }
        const messageList = [
            'inviteMessage',
            'requestMessage',
            'responseMessage'
        ];
        for (let k = 0; k < messageList.length; k++) {
            if (
                typeof noty.details !== 'undefined' &&
                typeof noty.details[messageList[k]] !== 'undefined'
            ) {
                message = `, ${noty.details[messageList[k]]}`;
            }
        }
        if (playNotificationTTS) {
            playNotyTTS(noty, displayName, message);
        }
        if (
            playDesktopToast ||
            playXSNotification ||
            playOvrtHudNotifications ||
            playOvrtWristNotifications ||
            playOverlayNotification
        ) {
            if (notificationsSettingsStore.imageNotifications) {
                notySaveImage(noty).then((image) => {
                    if (playXSNotification) {
                        displayXSNotification(noty, message, image);
                    }
                    if (
                        playOvrtHudNotifications ||
                        playOvrtWristNotifications
                    ) {
                        displayOvrtNotification(
                            playOvrtHudNotifications,
                            playOvrtWristNotifications,
                            noty,
                            message,
                            image
                        );
                    }
                    if (playDesktopToast) {
                        displayDesktopToast(noty, message, image);
                    }
                    if (playOverlayNotification) {
                        displayOverlayNotification(noty, message, image);
                    }
                });
            } else {
                if (playXSNotification) {
                    displayXSNotification(noty, message, '');
                }
                if (playOvrtHudNotifications || playOvrtWristNotifications) {
                    displayOvrtNotification(
                        playOvrtHudNotifications,
                        playOvrtWristNotifications,
                        noty,
                        message,
                        ''
                    );
                }
                if (playDesktopToast) {
                    displayDesktopToast(noty, message, '');
                }
                if (playOverlayNotification) {
                    displayOverlayNotification(noty, message, '');
                }
            }
        }
    }

    /**
     *
     * @param {object} noty
     * @param {string} displayName
     * @param {string} message
     */
    async function playNotyTTS(noty, displayName, message) {
        if (notificationsSettingsStore.notificationTTSNickName) {
            const userId = getUserIdFromNoty(noty);
            const memo = await getUserMemo(userId);
            if (memo.memo) {
                const array = memo.memo.split('\n');
                const nickName = array[0];
                displayName = nickName;
            }
        }
        switch (noty.type) {
            case 'OnPlayerJoined':
                notificationsSettingsStore.speak(`${displayName} has joined`);
                break;
            case 'OnPlayerLeft':
                notificationsSettingsStore.speak(`${displayName} has left`);
                break;
            case 'OnPlayerJoining':
                notificationsSettingsStore.speak(`${displayName} is joining`);
                break;
            case 'GPS':
                notificationsSettingsStore.speak(
                    `${displayName} is in ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`
                );
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`;
                }
                notificationsSettingsStore.speak(
                    `${displayName} has logged in${locationName}`
                );
                break;
            case 'Offline':
                notificationsSettingsStore.speak(
                    `${displayName} has logged out`
                );
                break;
            case 'Status':
                notificationsSettingsStore.speak(
                    `${displayName} status is now ${noty.status} ${noty.statusDescription}`
                );
                break;
            case 'invite':
                notificationsSettingsStore.speak(
                    `${displayName} has invited you to ${displayLocation(
                        noty.details.worldId,
                        noty.details.worldName,
                        noty.groupName
                    )}${message}`
                );
                break;
            case 'requestInvite':
                notificationsSettingsStore.speak(
                    `${displayName} has requested an invite${message}`
                );
                break;
            case 'inviteResponse':
                notificationsSettingsStore.speak(
                    `${displayName} has responded to your invite${message}`
                );
                break;
            case 'requestInviteResponse':
                notificationsSettingsStore.speak(
                    `${displayName} has responded to your invite request${message}`
                );
                break;
            case 'friendRequest':
                notificationsSettingsStore.speak(
                    `${displayName} has sent you a friend request`
                );
                break;
            case 'Friend':
                notificationsSettingsStore.speak(
                    `${displayName} is now your friend`
                );
                break;
            case 'Unfriend':
                notificationsSettingsStore.speak(
                    `${displayName} is no longer your friend`
                );
                break;
            case 'TrustLevel':
                notificationsSettingsStore.speak(
                    `${displayName} trust level is now ${noty.trustLevel}`
                );
                break;
            case 'DisplayName':
                notificationsSettingsStore.speak(
                    `${noty.previousDisplayName} changed their name to ${noty.displayName}`
                );
                break;
            case 'boop':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'groupChange':
                notificationsSettingsStore.speak(
                    `${displayName} ${noty.message}`
                );
                break;
            case 'group.announcement':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'group.informative':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'group.invite':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'group.joinRequest':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'group.transfer':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'group.queueReady':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'instance.closed':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'PortalSpawn':
                if (displayName) {
                    notificationsSettingsStore.speak(
                        `${displayName} has spawned a portal to ${displayLocation(
                            noty.instanceId,
                            noty.worldName,
                            noty.groupName
                        )}`
                    );
                } else {
                    notificationsSettingsStore.speak(
                        'User has spawned a portal'
                    );
                }
                break;
            case 'AvatarChange':
                notificationsSettingsStore.speak(
                    `${displayName} changed into avatar ${noty.name}`
                );
                break;
            case 'ChatBoxMessage':
                notificationsSettingsStore.speak(
                    `${displayName} said ${noty.text}`
                );
                break;
            case 'Event':
                notificationsSettingsStore.speak(noty.data);
                break;
            case 'External':
                notificationsSettingsStore.speak(noty.message);
                break;
            case 'VideoPlay':
                notificationsSettingsStore.speak(
                    `Now playing: ${noty.notyName}`
                );
                break;
            case 'BlockedOnPlayerJoined':
                notificationsSettingsStore.speak(
                    `Blocked user ${displayName} has joined`
                );
                break;
            case 'BlockedOnPlayerLeft':
                notificationsSettingsStore.speak(
                    `Blocked user ${displayName} has left`
                );
                break;
            case 'MutedOnPlayerJoined':
                notificationsSettingsStore.speak(
                    `Muted user ${displayName} has joined`
                );
                break;
            case 'MutedOnPlayerLeft':
                notificationsSettingsStore.speak(
                    `Muted user ${displayName} has left`
                );
                break;
            case 'Blocked':
                notificationsSettingsStore.speak(
                    `${displayName} has blocked you`
                );
                break;
            case 'Unblocked':
                notificationsSettingsStore.speak(
                    `${displayName} has unblocked you`
                );
                break;
            case 'Muted':
                notificationsSettingsStore.speak(
                    `${displayName} has muted you`
                );
                break;
            case 'Unmuted':
                notificationsSettingsStore.speak(
                    `${displayName} has unmuted you`
                );
                break;
        }
    }

    /**
     *
     * @param {object} noty
     * @returns
     */
    async function notySaveImage(noty) {
        const imageUrl = await notyGetImage(noty);
        let fileId = extractFileId(imageUrl);
        let fileVersion = extractFileVersion(imageUrl);
        let imageLocation = '';
        try {
            if (fileId && fileVersion) {
                imageLocation = await AppApi.GetImage(
                    imageUrl,
                    fileId,
                    fileVersion
                );
            } else if (imageUrl) {
                fileVersion = imageUrl.split('/').pop(); // 1416226261.thumbnail-500.png
                fileId = fileVersion.split('.').shift(); // 1416226261
                imageLocation = await AppApi.GetImage(
                    imageUrl,
                    fileId,
                    fileVersion
                );
            }
        } catch (err) {
            console.error(imageUrl, err);
        }
        return imageLocation;
    }

    function displayDesktopToast(noty, message, image) {
        switch (noty.type) {
            case 'OnPlayerJoined':
                desktopNotification(noty.displayName, 'has joined', image);
                break;
            case 'OnPlayerLeft':
                desktopNotification(noty.displayName, 'has left', image);
                break;
            case 'OnPlayerJoining':
                desktopNotification(noty.displayName, 'is joining', image);
                break;
            case 'GPS':
                desktopNotification(
                    noty.displayName,
                    `is in ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`,
                    image
                );
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`;
                }
                desktopNotification(
                    noty.displayName,
                    `has logged in${locationName}`,
                    image
                );
                break;
            case 'Offline':
                desktopNotification(noty.displayName, 'has logged out', image);
                break;
            case 'Status':
                desktopNotification(
                    noty.displayName,
                    `status is now ${noty.status} ${noty.statusDescription}`,
                    image
                );
                break;
            case 'invite':
                desktopNotification(
                    noty.senderUsername,
                    `has invited you to ${displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`,
                    image
                );
                break;
            case 'requestInvite':
                desktopNotification(
                    noty.senderUsername,
                    `has requested an invite${message}`,
                    image
                );
                break;
            case 'inviteResponse':
                desktopNotification(
                    noty.senderUsername,
                    `has responded to your invite${message}`,
                    image
                );
                break;
            case 'requestInviteResponse':
                desktopNotification(
                    noty.senderUsername,
                    `has responded to your invite request${message}`,
                    image
                );
                break;
            case 'friendRequest':
                desktopNotification(
                    noty.senderUsername,
                    'has sent you a friend request',
                    image
                );
                break;
            case 'Friend':
                desktopNotification(
                    noty.displayName,
                    'is now your friend',
                    image
                );
                break;
            case 'Unfriend':
                desktopNotification(
                    noty.displayName,
                    'is no longer your friend',
                    image
                );
                break;
            case 'TrustLevel':
                desktopNotification(
                    noty.displayName,
                    `trust level is now ${noty.trustLevel}`,
                    image
                );
                break;
            case 'DisplayName':
                desktopNotification(
                    noty.previousDisplayName,
                    `changed their name to ${noty.displayName}`,
                    image
                );
                break;
            case 'boop':
                desktopNotification(noty.senderUsername, noty.message, image);
                break;
            case 'groupChange':
                desktopNotification(noty.senderUsername, noty.message, image);
                break;
            case 'group.announcement':
                desktopNotification('Group Announcement', noty.message, image);
                break;
            case 'group.informative':
                desktopNotification('Group Informative', noty.message, image);
                break;
            case 'group.invite':
                desktopNotification('Group Invite', noty.message, image);
                break;
            case 'group.joinRequest':
                desktopNotification('Group Join Request', noty.message, image);
                break;
            case 'group.transfer':
                desktopNotification(
                    'Group Transfer Request',
                    noty.message,
                    image
                );
                break;
            case 'group.queueReady':
                desktopNotification(
                    'Instance Queue Ready',
                    noty.message,
                    image
                );
                break;
            case 'instance.closed':
                desktopNotification('Instance Closed', noty.message, image);
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    desktopNotification(
                        noty.displayName,
                        `has spawned a portal to ${displayLocation(
                            noty.instanceId,
                            noty.worldName,
                            noty.groupName
                        )}`,
                        image
                    );
                } else {
                    desktopNotification('', 'User has spawned a portal', image);
                }
                break;
            case 'AvatarChange':
                desktopNotification(
                    noty.displayName,
                    `changed into avatar ${noty.name}`,
                    image
                );
                break;
            case 'ChatBoxMessage':
                desktopNotification(
                    noty.displayName,
                    `said ${noty.text}`,
                    image
                );
                break;
            case 'Event':
                desktopNotification('Event', noty.data, image);
                break;
            case 'External':
                desktopNotification('External', noty.message, image);
                break;
            case 'VideoPlay':
                desktopNotification('Now playing', noty.notyName, image);
                break;
            case 'BlockedOnPlayerJoined':
                desktopNotification(
                    noty.displayName,
                    'blocked user has joined',
                    image
                );
                break;
            case 'BlockedOnPlayerLeft':
                desktopNotification(
                    noty.displayName,
                    'blocked user has left',
                    image
                );
                break;
            case 'MutedOnPlayerJoined':
                desktopNotification(
                    noty.displayName,
                    'muted user has joined',
                    image
                );
                break;
            case 'MutedOnPlayerLeft':
                desktopNotification(
                    noty.displayName,
                    'muted user has left',
                    image
                );
                break;
            case 'Blocked':
                desktopNotification(noty.displayName, 'has blocked you', image);
                break;
            case 'Unblocked':
                desktopNotification(
                    noty.displayName,
                    'has unblocked you',
                    image
                );
                break;
            case 'Muted':
                desktopNotification(noty.displayName, 'has muted you', image);
                break;
            case 'Unmuted':
                desktopNotification(noty.displayName, 'has unmuted you', image);
                break;
        }
    }

    /**
     *
     * @param {string} noty
     * @param {string} message
     * @param {string} imageFile
     */
    function displayOverlayNotification(noty, message, imageFile) {
        let image = '';
        if (imageFile) {
            image = `file:///${imageFile}`;
        }
        AppApi.ExecuteVrOverlayFunction(
            'playNoty',
            JSON.stringify({ noty, message, image })
        );
    }

    /**
     *
     * @param {any} noty
     * @param {string} message
     * @param {string} image
     */
    function displayXSNotification(noty, message, image) {
        const timeout = Math.floor(
            parseInt(notificationsSettingsStore.notificationTimeout, 10) / 1000
        );
        const opacity =
            parseFloat(advancedSettingsStore.notificationOpacity) / 100;
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'OnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'OnPlayerJoining':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is joining`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'GPS':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is in ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`;
                }
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has logged in${locationName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Offline':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has logged out`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Status':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} status is now ${noty.status} ${noty.statusDescription}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'invite':
                AppApi.XSNotification(
                    'VRCX',
                    `${
                        noty.senderUsername
                    } has invited you to ${displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'requestInvite':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has requested an invite${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'inviteResponse':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'requestInviteResponse':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite request${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'friendRequest':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has sent you a friend request`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Friend':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is now your friend`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unfriend':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is no longer your friend`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'TrustLevel':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} trust level is now ${noty.trustLevel}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'DisplayName':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.previousDisplayName} changed their name to ${noty.displayName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'boop':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'groupChange':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername}: ${noty.message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.announcement':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.informative':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.invite':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.joinRequest':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.transfer':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.queueReady':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'instance.closed':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    AppApi.XSNotification(
                        'VRCX',
                        `${
                            noty.displayName
                        } has spawned a portal to ${displayLocation(
                            noty.instanceId,
                            noty.worldName,
                            noty.groupName
                        )}`,
                        timeout,
                        opacity,
                        image
                    );
                } else {
                    AppApi.XSNotification(
                        'VRCX',
                        'User has spawned a portal',
                        timeout,
                        opacity,
                        image
                    );
                }
                break;
            case 'AvatarChange':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} changed into avatar ${noty.name}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'ChatBoxMessage':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} said ${noty.text}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Event':
                AppApi.XSNotification(
                    'VRCX',
                    noty.data,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'External':
                AppApi.XSNotification(
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'VideoPlay':
                AppApi.XSNotification(
                    'VRCX',
                    `Now playing: ${noty.notyName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'BlockedOnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `Blocked user ${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'BlockedOnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `Blocked user ${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'MutedOnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `Muted user ${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'MutedOnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `Muted user ${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Blocked':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has blocked you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unblocked':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has unblocked you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Muted':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has muted you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unmuted':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has unmuted you`,
                    timeout,
                    opacity,
                    image
                );
                break;
        }
    }

    function displayOvrtNotification(
        playOvrtHudNotifications,
        playOvrtWristNotifications,
        noty,
        message,
        image
    ) {
        const timeout = Math.floor(
            parseInt(notificationsSettingsStore.notificationTimeout, 10) / 1000
        );
        const opacity =
            parseFloat(advancedSettingsStore.notificationOpacity) / 100;
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'OnPlayerLeft':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'OnPlayerJoining':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} is joining`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'GPS':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} is in ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    )}`;
                }
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has logged in${locationName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Offline':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has logged out`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Status':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} status is now ${noty.status} ${noty.statusDescription}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'invite':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${
                        noty.senderUsername
                    } has invited you to ${displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'requestInvite':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.senderUsername} has requested an invite${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'inviteResponse':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'requestInviteResponse':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite request${message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'friendRequest':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.senderUsername} has sent you a friend request`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Friend':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} is now your friend`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unfriend':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} is no longer your friend`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'TrustLevel':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} trust level is now ${noty.trustLevel}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'DisplayName':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.previousDisplayName} changed their name to ${noty.displayName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'boop':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'groupChange':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.senderUsername}: ${noty.message}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.announcement':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.informative':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.invite':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.joinRequest':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.transfer':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'group.queueReady':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'instance.closed':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    AppApi.OVRTNotification(
                        playOvrtHudNotifications,
                        playOvrtWristNotifications,
                        'VRCX',
                        `${
                            noty.displayName
                        } has spawned a portal to ${displayLocation(
                            noty.instanceId,
                            noty.worldName,
                            noty.groupName
                        )}`,
                        timeout,
                        opacity,
                        image
                    );
                } else {
                    AppApi.OVRTNotification(
                        playOvrtHudNotifications,
                        playOvrtWristNotifications,
                        'VRCX',
                        'User has spawned a portal',
                        timeout,
                        opacity,
                        image
                    );
                }
                break;
            case 'AvatarChange':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} changed into avatar ${noty.name}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'ChatBoxMessage':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} said ${noty.text}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Event':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.data,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'External':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    noty.message,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'VideoPlay':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `Now playing: ${noty.notyName}`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'BlockedOnPlayerJoined':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `Blocked user ${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'BlockedOnPlayerLeft':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `Blocked user ${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'MutedOnPlayerJoined':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `Muted user ${noty.displayName} has joined`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'MutedOnPlayerLeft':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `Muted user ${noty.displayName} has left`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Blocked':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has blocked you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unblocked':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has unblocked you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Muted':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has muted you`,
                    timeout,
                    opacity,
                    image
                );
                break;
            case 'Unmuted':
                AppApi.OVRTNotification(
                    playOvrtHudNotifications,
                    playOvrtWristNotifications,
                    'VRCX',
                    `${noty.displayName} has unmuted you`,
                    timeout,
                    opacity,
                    image
                );
                break;
        }
    }

    /**
     *
     * @param {object} noty
     * @returns
     */
    function getUserIdFromNoty(noty) {
        let userId = '';
        if (noty.userId) {
            userId = noty.userId;
        } else if (noty.senderUserId) {
            userId = noty.senderUserId;
        } else if (noty.sourceUserId) {
            userId = noty.sourceUserId;
        } else if (noty.displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === noty.displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        return userId;
    }

    /**
     *
     * @param {object} noty
     * @returns
     */
    async function notyGetImage(noty) {
        let imageUrl = '';
        const userId = getUserIdFromNoty(noty);

        if (noty.thumbnailImageUrl) {
            imageUrl = noty.thumbnailImageUrl;
        } else if (noty.details && noty.details.imageUrl) {
            imageUrl = noty.details.imageUrl;
        } else if (noty.imageUrl) {
            imageUrl = noty.imageUrl;
        } else if (userId && !userId.startsWith('grp_')) {
            imageUrl = await userRequest
                .getCachedUser({
                    userId
                })
                .catch((err) => {
                    console.error(err);
                    return '';
                })
                .then((args) => {
                    if (!args.json) {
                        return '';
                    }
                    if (
                        appearanceSettingsStore.displayVRCPlusIconsAsAvatar &&
                        args.json.userIcon
                    ) {
                        return args.json.userIcon;
                    }
                    if (args.json.profilePicOverride) {
                        return args.json.profilePicOverride;
                    }
                    return args.json.currentAvatarThumbnailImageUrl;
                });
        }
        return imageUrl;
    }

    /**
     *
     * @param {string} displayName
     * @param {string} message
     * @param {string} image
     */
    function desktopNotification(displayName, message, image) {
        if (WINDOWS) {
            AppApi.DesktopNotification(displayName, message, image);
        } else {
            window.electron.desktopNotification(displayName, message, image);
        }
    }

    function queueGameLogNoty(noty) {
        let bias;
        // remove join/leave notifications when switching worlds
        if (
            noty.type === 'OnPlayerJoined'
            // noty.type === 'BlockedOnPlayerJoined' ||
            // noty.type === 'MutedOnPlayerJoined'
        ) {
            bias = locationStore.lastLocation.date + 30 * 1000; // 30 secs
            if (Date.parse(noty.created_at) <= bias) {
                return;
            }
        }
        if (
            noty.type === 'OnPlayerLeft' ||
            noty.type === 'BlockedOnPlayerLeft' ||
            noty.type === 'MutedOnPlayerLeft'
        ) {
            bias = locationStore.lastLocationDestinationTime + 5 * 1000; // 5 secs
            if (Date.parse(noty.created_at) <= bias) {
                return;
            }
        }
        if (
            noty.type === 'Notification' ||
            noty.type === 'LocationDestination'
            // skip unused entries
        ) {
            return;
        }
        if (noty.type === 'VideoPlay') {
            if (!noty.videoName) {
                // skip video without name
                return;
            }
            noty.notyName = noty.videoName;
            if (noty.displayName) {
                // add requester's name to noty
                noty.notyName = `${noty.videoName} (${noty.displayName})`;
            }
        }
        if (
            noty.type !== 'VideoPlay' &&
            noty.displayName === userStore.currentUser.displayName
        ) {
            // remove current user
            return;
        }
        noty.isFriend = false;
        noty.isFavorite = false;
        if (noty.userId) {
            noty.isFriend = friendStore.friends.has(noty.userId);
            noty.isFavorite = friendStore.localFavoriteFriends.has(noty.userId);
        } else if (noty.displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === noty.displayName) {
                    noty.isFriend = friendStore.friends.has(ref.id);
                    noty.isFavorite = friendStore.localFavoriteFriends.has(
                        ref.id
                    );
                    break;
                }
            }
        }
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Everyone' ||
                (notyFilter[noty.type] === 'Friends' && noty.isFriend) ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            playNoty(noty);
        }
    }

    function queueFeedNoty(noty) {
        if (noty.type === 'Avatar') {
            return;
        }
        // hide private worlds from feed
        if (
            wristOverlaySettingsStore.hidePrivateFromFeed &&
            noty.type === 'GPS' &&
            noty.location === 'private'
        ) {
            return;
        }
        noty.isFriend = friendStore.friends.has(noty.userId);
        noty.isFavorite = friendStore.localFavoriteFriends.has(noty.userId);
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'Everyone' ||
                (notyFilter[noty.type] === 'Friends' && noty.isFriend) ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            playNoty(noty);
        }
    }

    function queueFriendLogNoty(noty) {
        if (noty.type === 'FriendRequest') {
            return;
        }
        noty.isFriend = friendStore.friends.has(noty.userId);
        noty.isFavorite = friendStore.localFavoriteFriends.has(noty.userId);
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            playNoty(noty);
        }
    }

    function queueModerationNoty(noty) {
        noty.isFriend = false;
        noty.isFavorite = false;
        if (noty.userId) {
            noty.isFriend = friendStore.friends.has(noty.userId);
            noty.isFavorite = friendStore.localFavoriteFriends.has(noty.userId);
        }
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (notyFilter[noty.type] && notyFilter[noty.type] === 'On') {
            playNoty(noty);
        }
    }

    async function initNotifications() {
        state.notificationInitStatus = false;
        state.notificationTable.data = await database.getNotifications();
        refreshNotifications();
    }

    return {
        state,
        notificationInitStatus,
        notificationTable,
        unseenNotifications,
        isNotificationsLoading,

        initNotifications,
        expireNotification,
        refreshNotifications,
        queueNotificationNoty,
        playNoty,
        queueGameLogNoty,
        queueFeedNoty,
        queueFriendLogNoty,
        queueModerationNoty,
        handleNotificationAccept,
        handleNotificationSee,
        handlePipelineNotification,
        handleNotificationV2Update,
        handleNotificationHide,
        handleNotification,
        handleNotificationV2
    };
});
