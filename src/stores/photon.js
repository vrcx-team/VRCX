import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import {
    checkVRChatCache,
    displayLocation,
    getGroupName,
    getWorldName,
    parseLocation,
    removeFromArray,
    replaceBioSymbols,
    timeToText
} from '../shared/utils';
import { instanceRequest, userRequest } from '../api';
import { AppDebug } from '../service/appConfig';
import { database } from '../service/database';
import { photonEventType } from '../shared/constants/photon';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGameLogStore } from './gameLog';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useSharedFeedStore } from './sharedFeed';
import { useUserStore } from './user';
import { useVrStore } from './vr';

import configRepository from '../service/config';

import * as workerTimers from 'worker-timers';

export const usePhotonStore = defineStore('Photon', () => {
    const vrStore = useVrStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const gameLogStore = useGameLogStore();
    const notificationStore = useNotificationStore();
    const locationStore = useLocationStore();
    const sharedFeedStore = useSharedFeedStore();
    const avatarStore = useAvatarStore();
    const favoriteStore = useFavoriteStore();
    const { t } = useI18n();

    const state = reactive({
        photonEventTableTypeFilterList: [
            'Event',
            'OnPlayerJoined',
            'OnPlayerLeft',
            'ChangeAvatar',
            'ChangeStatus',
            'ChangeGroup',
            'PortalSpawn',
            'DeletedPortal',
            'ChatBoxMessage',
            'Moderation',
            'Camera',
            'SpawnEmoji',
            'MasterMigrate'
        ],
        photonEventCount: 0,
        photonLobbyTimeoutThreshold: 6000,
        photonOverlayMessageTimeout: 6000,
        //
        photonLobbyWatcherLoop: false
    });

    const photonLobby = ref(new Map());
    const photonLobbyMaster = ref(0);
    const photonLobbyCurrentUser = ref(0);
    const photonLobbyUserData = ref(new Map());
    const photonLobbyCurrent = ref(new Map());
    const photonLobbyAvatars = ref(new Map());
    const photonLobbyLastModeration = ref(new Map());
    const photonLobbyTimeout = ref([]);
    const photonLobbyJointime = ref(new Map());
    const photonLobbyActivePortals = ref(new Map());
    const photonEvent7List = ref(new Map());
    const photonLastEvent7List = ref(0);
    const photonLastChatBoxMsg = ref(new Map());
    const moderationEventQueue = ref(new Map());
    const photonLoggingEnabled = ref(false);
    const photonEventOverlay = ref(false);
    const photonEventOverlayFilter = ref('Everyone');
    const photonEventTableTypeOverlayFilter = ref([]);
    const timeoutHudOverlay = ref(false);
    const timeoutHudOverlayFilter = ref('Everyone');
    const photonEventIcon = ref(false);
    const photonEventTable = ref({
        data: [],
        filters: [
            {
                prop: ['displayName', 'text'],
                value: ''
            },
            {
                prop: 'type',
                value: []
            }
        ],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [5, 10, 15, 25, 50]
        }
    });
    const photonEventTablePrevious = ref({
        data: [],
        filters: [
            {
                prop: ['displayName', 'text'],
                value: ''
            },
            {
                prop: 'type',
                value: []
            }
        ],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [5, 10, 15, 25, 50]
        }
    });
    const chatboxUserBlacklist = ref(new Map());
    const photonEventTableFilter = ref('');
    const moderationAgainstTable = ref([]);
    const photonEventTableTypeFilter = ref([]);

    async function initPhotonStates() {
        const [
            photonEventOverlayConfig,
            photonEventOverlayFilterConfig,
            photonEventTableTypeOverlayFilterConfig,
            timeoutHudOverlayConfig,
            timeoutHudOverlayFilterConfig,
            photonLobbyTimeoutThresholdConfig,
            photonOverlayMessageTimeoutConfig,
            photonEventTableTypeFilterConfig,
            chatboxUserBlacklistConfig
        ] = await Promise.all([
            configRepository.getBool('VRCX_PhotonEventOverlay', false),
            configRepository.getString(
                'VRCX_PhotonEventOverlayFilter',
                'Everyone'
            ),
            configRepository.getString(
                'VRCX_photonEventTypeOverlayFilter',
                '[]'
            ),
            configRepository.getBool('VRCX_TimeoutHudOverlay', false),
            configRepository.getString(
                'VRCX_TimeoutHudOverlayFilter',
                'Everyone'
            ),
            configRepository.getInt('VRCX_photonLobbyTimeoutThreshold', 6000),
            configRepository.getString(
                'VRCX_photonOverlayMessageTimeout',
                (6000).toString()
            ),
            configRepository.getString('VRCX_photonEventTypeFilter', '[]'),
            configRepository.getString('VRCX_chatboxUserBlacklist')
        ]);

        photonEventOverlay.value = photonEventOverlayConfig;
        photonEventOverlayFilter.value = photonEventOverlayFilterConfig;
        photonEventTableTypeOverlayFilter.value = JSON.parse(
            photonEventTableTypeOverlayFilterConfig
        );
        timeoutHudOverlay.value = timeoutHudOverlayConfig;
        timeoutHudOverlayFilter.value = timeoutHudOverlayFilterConfig;
        photonLobbyTimeoutThreshold.value = photonLobbyTimeoutThresholdConfig;
        photonOverlayMessageTimeout.value = Number(
            photonOverlayMessageTimeoutConfig
        );
        photonEventTableTypeFilter.value = JSON.parse(
            photonEventTableTypeFilterConfig
        );

        photonEventTable.value.filters[1].value =
            photonEventTableTypeFilter.value;
        photonEventTablePrevious.value.filters[1].value =
            photonEventTableTypeFilter.value;

        chatboxUserBlacklist.value = new Map(
            Object.entries(JSON.parse(chatboxUserBlacklistConfig || '{}'))
        );
    }

    initPhotonStates();

    const photonLobbyTimeoutThreshold = computed({
        get: () => state.photonLobbyTimeoutThreshold,
        set: (value) => {
            state.photonLobbyTimeoutThreshold = value;
            configRepository.setString(
                'VRCX_photonLobbyTimeoutThreshold',
                value.toString()
            );
        }
    });
    const photonOverlayMessageTimeout = computed({
        get: () => state.photonOverlayMessageTimeout,
        set: (value) => {
            state.photonOverlayMessageTimeout = value;
            configRepository.setString(
                'VRCX_photonOverlayMessageTimeout',
                value.toString()
            );
        }
    });

    function setPhotonLoggingEnabled() {
        photonLoggingEnabled.value = !photonLoggingEnabled.value;
        configRepository.setBool('VRCX_photonLoggingEnabled', true);
    }
    function setPhotonEventOverlay() {
        photonEventOverlay.value = !photonEventOverlay.value;
        configRepository.setBool(
            'VRCX_PhotonEventOverlay',
            photonEventOverlay.value
        );
    }

    function setPhotonEventOverlayFilter(value) {
        photonEventOverlayFilter.value = value;
        configRepository.setString(
            'VRCX_PhotonEventOverlayFilter',
            photonEventOverlayFilter.value
        );
    }
    function setPhotonEventTableTypeOverlayFilter(value) {
        photonEventTableTypeOverlayFilter.value = value;
        configRepository.setString(
            'VRCX_photonEventTypeOverlayFilter',
            JSON.stringify(photonEventTableTypeOverlayFilter.value)
        );
    }
    function setTimeoutHudOverlay(value) {
        timeoutHudOverlay.value = !timeoutHudOverlay.value;
        configRepository.setBool('VRCX_TimeoutHudOverlay', value);
        if (!timeoutHudOverlay.value) {
            AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
        }
    }
    function setTimeoutHudOverlayFilter(value) {
        timeoutHudOverlayFilter.value = value;
        configRepository.setString(
            'VRCX_TimeoutHudOverlayFilter',
            timeoutHudOverlayFilter.value
        );
    }

    function getDisplayName(userId) {
        if (userId) {
            const ref = userStore.cachedUsers.get(userId);
            if (ref.displayName) {
                return ref.displayName;
            }
        }
        return '';
    }
    function photonEventPulse() {
        state.photonEventCount++;
        photonEventIcon.value = true;
        workerTimers.setTimeout(() => (photonEventIcon.value = false), 150);
    }

    async function saveEventOverlay(configKey = '') {
        if (configKey === 'VRCX_PhotonEventOverlay') {
            setPhotonEventOverlay();
        } else if (configKey === 'VRCX_TimeoutHudOverlay') {
            setTimeoutHudOverlay();
        }
        vrStore.updateOpenVR();
        vrStore.updateVRConfigVars();
    }

    function parseOperationResponse(data, dateTime) {
        switch (data.OperationCode) {
            case 226:
                if (
                    typeof data.Parameters[248] !== 'undefined' &&
                    typeof data.Parameters[248][248] !== 'undefined'
                ) {
                    setPhotonLobbyMaster(data.Parameters[248][248]);
                }
                if (typeof data.Parameters[254] !== 'undefined') {
                    photonLobbyCurrentUser.value = data.Parameters[254];
                }
                if (typeof data.Parameters[249] !== 'undefined') {
                    for (const i in data.Parameters[249]) {
                        const id = parseInt(i, 10);
                        const user = data.Parameters[249][i];
                        parsePhotonUser(id, user.user, dateTime);
                        parsePhotonAvatarChange(
                            id,
                            user.user,
                            user.avatarDict,
                            dateTime
                        );
                        parsePhotonGroupChange(
                            id,
                            user.user,
                            user.groupOnNameplate,
                            dateTime
                        );
                        parsePhotonAvatar(user.avatarDict);
                        parsePhotonAvatar(user.favatarDict);
                        let hasInstantiated = false;
                        const lobbyJointime = photonLobbyJointime.value.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        photonLobbyJointime.value.set(id, {
                            joinTime: Date.parse(dateTime),
                            hasInstantiated,
                            inVRMode: user.inVRMode,
                            avatarEyeHeight: user.avatarEyeHeight,
                            canModerateInstance: user.canModerateInstance,
                            groupOnNameplate: user.groupOnNameplate,
                            showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                            showSocialRank: user.showSocialRank,
                            useImpostorAsFallback: user.useImpostorAsFallback,
                            platform: user.platform
                        });
                    }
                }
                if (typeof data.Parameters[252] !== 'undefined') {
                    parsePhotonLobbyIds(data.Parameters[252]);
                }
                photonEvent7List.value = new Map();
                break;
        }
    }

    function checkChatboxBlacklist(msg) {
        for (let i = 0; i < this.chatboxBlacklist.length; ++i) {
            if (msg.includes(this.chatboxBlacklist[i])) {
                return true;
            }
        }
        return false;
    }

    async function saveChatboxUserBlacklist() {
        await configRepository.setString(
            'VRCX_chatboxUserBlacklist',
            JSON.stringify(Object.fromEntries(chatboxUserBlacklist.value))
        );
    }

    async function photonEventTableFilterChange() {
        photonEventTable.value.filters[0].value = photonEventTableFilter.value;
        photonEventTable.value.filters[1].value =
            photonEventTableTypeFilter.value;

        photonEventTablePrevious.value.filters[0].value =
            photonEventTableFilter.value;
        photonEventTablePrevious.value.filters[1].value =
            photonEventTableTypeFilter.value;

        await configRepository.setString(
            'VRCX_photonEventTypeFilter',
            JSON.stringify(photonEventTableTypeFilter.value)
        );
        // await configRepository.setString(
        //     'VRCX_photonEventTypeOverlayFilter',
        //     JSON.stringify(this.photonEventTableTypeOverlayFilter)
        // );
    }

    function showUserFromPhotonId(photonId) {
        if (photonId) {
            const ref = photonLobby.value.get(photonId);
            if (typeof ref !== 'undefined') {
                if (typeof ref.id !== 'undefined') {
                    userStore.showUserDialog(ref.id);
                } else if (typeof ref.displayName !== 'undefined') {
                    userStore.lookupUser(ref);
                }
            } else {
                ElMessage({
                    message: 'No user info available',
                    type: 'error'
                });
            }
        }
    }

    function promptPhotonOverlayMessageTimeout() {
        ElMessageBox.prompt(
            t('prompt.overlay_message_timeout.description'),
            t('prompt.overlay_message_timeout.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.overlay_message_timeout.ok'),
                cancelButtonText: t('prompt.overlay_message_timeout.cancel'),
                inputValue: (
                    state.photonOverlayMessageTimeout / 1000
                ).toString(),
                inputPattern: /\d+$/,
                inputErrorMessage: t(
                    'prompt.overlay_message_timeout.input_error'
                )
            }
        )
            .then(({ value, action }) => {
                if (action === 'confirm' && value && !isNaN(Number(value))) {
                    state.photonOverlayMessageTimeout = Math.trunc(
                        Number(value) * 1000
                    );
                    vrStore.updateVRConfigVars();
                }
            })
            .catch(() => {});
    }

    function promptPhotonLobbyTimeoutThreshold() {
        ElMessageBox.prompt(
            t('prompt.photon_lobby_timeout.description'),
            t('prompt.photon_lobby_timeout.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.photon_lobby_timeout.ok'),
                cancelButtonText: t('prompt.photon_lobby_timeout.cancel'),
                inputValue: (
                    state.photonLobbyTimeoutThreshold / 1000
                ).toString(),
                inputPattern: /\d+$/,
                inputErrorMessage: t('prompt.photon_lobby_timeout.input_error')
            }
        )
            .then(({ value, action }) => {
                if (action === 'confirm' && value && !isNaN(Number(value))) {
                    state.photonLobbyTimeoutThreshold = Math.trunc(
                        Number(value) * 1000
                    );
                }
            })
            .catch(() => {});
    }

    function startLobbyWatcherLoop() {
        if (!state.photonLobbyWatcherLoop) {
            state.photonLobbyWatcherLoop = true;
            photonLobbyWatcher();
        }
    }

    function photonLobbyWatcherLoopStop() {
        state.photonLobbyWatcherLoop = false;
        photonLobbyTimeout.value = [];
        AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
    }

    function photonLobbyWatcher() {
        if (!state.photonLobbyWatcherLoop) {
            return;
        }
        if (photonLobbyCurrent.value.size === 0) {
            photonLobbyWatcherLoopStop();
            return;
        }
        const dtNow = Date.now();
        const bias2 = photonLastEvent7List.value + 1.5 * 1000;
        if (dtNow > bias2 || locationStore.lastLocation.playerList.size <= 1) {
            if (photonLobbyTimeout.value.length > 0) {
                AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
            }
            photonLobbyTimeout.value = [];
            workerTimers.setTimeout(() => photonLobbyWatcher(), 500);
            return;
        }
        const hudTimeout = [];
        photonEvent7List.value.forEach((dt, id) => {
            const timeSinceLastEvent = dtNow - Date.parse(dt);
            if (
                timeSinceLastEvent > state.photonLobbyTimeoutThreshold &&
                id !== photonLobbyCurrentUser.value
            ) {
                if (photonLobbyJointime.value.has(id)) {
                    var { joinTime } = photonLobbyJointime.value.get(id);
                }
                if (!joinTime) {
                    console.log(`${id} missing join time`);
                }
                if (joinTime && joinTime + 70000 < dtNow) {
                    // wait 70secs for user to load in
                    hudTimeout.unshift({
                        userId: getUserIdFromPhotonId(id),
                        displayName: getDisplayNameFromPhotonId(id),
                        time: Math.round(timeSinceLastEvent / 1000),
                        rawTime: timeSinceLastEvent
                    });
                }
            }
        });
        if (photonLobbyTimeout.value.length > 0 || hudTimeout.length > 0) {
            hudTimeout.sort(function (a, b) {
                if (a.rawTime > b.rawTime) {
                    return 1;
                }
                if (a.rawTime < b.rawTime) {
                    return -1;
                }
                return 0;
            });
            if (timeoutHudOverlay.value) {
                if (
                    timeoutHudOverlayFilter.value === 'VIP' ||
                    timeoutHudOverlayFilter.value === 'Friends'
                ) {
                    var filteredHudTimeout = [];
                    hudTimeout.forEach((item) => {
                        if (
                            timeoutHudOverlayFilter.value === 'VIP' &&
                            favoriteStore.cachedFavoritesByObjectId.has(
                                item.userId
                            )
                        ) {
                            filteredHudTimeout.push(item);
                        } else if (
                            timeoutHudOverlayFilter.value === 'Friends' &&
                            friendStore.friends.has(item.userId)
                        ) {
                            filteredHudTimeout.push(item);
                        }
                    });
                } else {
                    var filteredHudTimeout = hudTimeout;
                }
                AppApi.ExecuteVrOverlayFunction(
                    'updateHudTimeout',
                    JSON.stringify(filteredHudTimeout)
                );
            }
            photonLobbyTimeout.value = hudTimeout;
            instanceStore.getCurrentInstanceUserList();
        }
        workerTimers.setTimeout(() => photonLobbyWatcher(), 500);
    }

    function addEntryPhotonEvent(input) {
        let isMaster = false;
        if (input.photonId === photonLobbyMaster.value) {
            isMaster = true;
        }
        const joinTimeRef = photonLobbyJointime.value.get(input.photonId);
        const isModerator = joinTimeRef?.canModerateInstance;
        const photonUserRef = photonLobby.value.get(input.photonId);
        let displayName = '';
        let userId = '';
        let isFriend = false;
        if (typeof photonUserRef !== 'undefined') {
            displayName = photonUserRef.displayName;
            userId = photonUserRef.id;
            isFriend = photonUserRef.isFriend;
        }
        const isFavorite = friendStore.localFavoriteFriends.has(userId);
        let colour = '';
        const tagRef = userStore.customUserTags.get(userId);
        if (typeof tagRef !== 'undefined') {
            colour = tagRef.colour;
        }
        const feed = {
            displayName,
            userId,
            isFavorite,
            isFriend,
            isMaster,
            isModerator,
            colour,
            ...input
        };
        photonEventTable.value.data.unshift(feed);
        if (
            photonEventTableTypeOverlayFilter.value.length > 0 &&
            !photonEventTableTypeOverlayFilter.value.includes(feed.type)
        ) {
            return;
        }
        if (photonEventOverlay.value) {
            if (
                photonEventOverlayFilter.value === 'VIP' ||
                photonEventOverlayFilter.value === 'Friends'
            ) {
                if (
                    feed.userId &&
                    ((photonEventOverlayFilter.value === 'VIP' && isFavorite) ||
                        (photonEventOverlayFilter.value === 'Friends' &&
                            isFriend))
                ) {
                    AppApi.ExecuteVrOverlayFunction(
                        'addEntryHudFeed',
                        JSON.stringify(feed)
                    );
                }
            } else {
                AppApi.ExecuteVrOverlayFunction(
                    'addEntryHudFeed',
                    JSON.stringify(feed)
                );
            }
        }
    }

    function getDisplayNameFromPhotonId(photonId) {
        let displayName = '';
        if (photonId) {
            const ref = photonLobby.value.get(photonId);
            displayName = `ID:${photonId}`;
            if (
                typeof ref !== 'undefined' &&
                typeof ref.displayName !== 'undefined'
            ) {
                displayName = ref.displayName;
            }
        }
        return displayName;
    }

    function getUserIdFromPhotonId(photonId) {
        let userId = '';
        if (photonId) {
            const ref = photonLobby.value.get(photonId);
            if (typeof ref !== 'undefined' && typeof ref.id !== 'undefined') {
                userId = ref.id;
            }
        }
        return userId;
    }

    function getPhotonIdFromDisplayName(displayName) {
        let photonId = '';
        if (displayName) {
            photonLobby.value.forEach((ref, id) => {
                if (
                    typeof ref !== 'undefined' &&
                    ref.displayName === displayName
                ) {
                    photonId = id;
                }
            });
        }
        return photonId;
    }

    function getPhotonIdFromUserId(userId) {
        let photonId = '';
        if (userId) {
            photonLobby.value.forEach((ref, id) => {
                if (typeof ref !== 'undefined' && ref.id === userId) {
                    photonId = id;
                }
            });
        }
        return photonId;
    }

    // function sortPhotonId(a, b, field) {
    //     const id1 = getPhotonIdFromDisplayName(a[field]);
    //     const id2 = getPhotonIdFromDisplayName(b[field]);
    //     if (id1 < id2) {
    //         return 1;
    //     }
    //     if (id1 > id2) {
    //         return -1;
    //     }
    //     return 0;
    // }

    function parsePhotonEvent(data, gameLogDate) {
        switch (data.Code) {
            case 253:
                // SetUserProperties
                if (data.Parameters[253] === -1) {
                    for (let i in data.Parameters[251]) {
                        var id = parseInt(i, 10);
                        var user = data.Parameters[251][i];
                        parsePhotonUser(id, user.user, gameLogDate);
                        parsePhotonAvatarChange(
                            id,
                            user.user,
                            user.avatarDict,
                            gameLogDate
                        );
                        parsePhotonGroupChange(
                            id,
                            user.user,
                            user.groupOnNameplate,
                            gameLogDate
                        );
                        parsePhotonAvatar(user.avatarDict);
                        parsePhotonAvatar(user.favatarDict);
                        var hasInstantiated = false;
                        var lobbyJointime = photonLobbyJointime.value.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        photonLobbyJointime.value.set(id, {
                            joinTime: Date.parse(gameLogDate),
                            hasInstantiated,
                            inVRMode: user.inVRMode,
                            avatarEyeHeight: user.avatarEyeHeight,
                            canModerateInstance: user.canModerateInstance,
                            groupOnNameplate: user.groupOnNameplate,
                            showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                            showSocialRank: user.showSocialRank,
                            useImpostorAsFallback: user.useImpostorAsFallback,
                            platform: user.platform
                        });
                        photonUserJoin(id, user, gameLogDate);
                    }
                } else {
                    console.log('oldSetUserProps', data);
                    var id = parseInt(data.Parameters[253], 10);
                    var user = data.Parameters[251];
                    parsePhotonUser(id, user.user, gameLogDate);
                    parsePhotonAvatarChange(
                        id,
                        user.user,
                        user.avatarDict,
                        gameLogDate
                    );
                    parsePhotonGroupChange(
                        id,
                        user.user,
                        user.groupOnNameplate,
                        gameLogDate
                    );
                    parsePhotonAvatar(user.avatarDict);
                    parsePhotonAvatar(user.favatarDict);
                    var hasInstantiated = false;
                    var lobbyJointime = photonLobbyJointime.value.get(id);
                    if (typeof lobbyJointime !== 'undefined') {
                        hasInstantiated = lobbyJointime.hasInstantiated;
                    }
                    photonLobbyJointime.value.set(id, {
                        joinTime: Date.parse(gameLogDate),
                        hasInstantiated,
                        inVRMode: user.inVRMode,
                        avatarEyeHeight: user.avatarEyeHeight,
                        canModerateInstance: user.canModerateInstance,
                        groupOnNameplate: user.groupOnNameplate,
                        showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                        showSocialRank: user.showSocialRank,
                        useImpostorAsFallback: user.useImpostorAsFallback,
                        platform: user.platform
                    });
                    photonUserJoin(id, user, gameLogDate);
                }
                break;
            case 42:
                // SetUserProperties
                var id = parseInt(data.Parameters[254], 10);
                var user = data.Parameters[245];
                parsePhotonUser(id, user.user, gameLogDate);
                parsePhotonAvatarChange(
                    id,
                    user.user,
                    user.avatarDict,
                    gameLogDate
                );
                parsePhotonGroupChange(
                    id,
                    user.user,
                    user.groupOnNameplate,
                    gameLogDate
                );
                parsePhotonAvatar(user.avatarDict);
                parsePhotonAvatar(user.favatarDict);
                var lobbyJointime = photonLobbyJointime.value.get(id);
                photonLobbyJointime.value.set(id, {
                    hasInstantiated: true,
                    ...lobbyJointime,
                    inVRMode: user.inVRMode,
                    avatarEyeHeight: user.avatarEyeHeight,
                    canModerateInstance: user.canModerateInstance,
                    groupOnNameplate: user.groupOnNameplate,
                    showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                    showSocialRank: user.showSocialRank,
                    useImpostorAsFallback: user.useImpostorAsFallback,
                    platform: user.platform
                });
                break;
            case 255:
                // Join
                if (typeof data.Parameters[249] !== 'undefined') {
                    parsePhotonUser(
                        data.Parameters[254],
                        data.Parameters[249].user,
                        gameLogDate
                    );
                    parsePhotonAvatarChange(
                        data.Parameters[254],
                        data.Parameters[249].user,
                        data.Parameters[249].avatarDict,
                        gameLogDate
                    );
                    parsePhotonGroupChange(
                        data.Parameters[254],
                        data.Parameters[249].user,
                        data.Parameters[249].groupOnNameplate,
                        gameLogDate
                    );
                    parsePhotonAvatar(data.Parameters[249].avatarDict);
                    parsePhotonAvatar(data.Parameters[249].favatarDict);
                }
                parsePhotonLobbyIds(data.Parameters[252]);
                var hasInstantiated = false;
                if (photonLobbyCurrentUser.value === data.Parameters[254]) {
                    // fix current user
                    hasInstantiated = true;
                }
                var ref = photonLobbyCurrent.value.get(data.Parameters[254]);
                if (typeof ref !== 'undefined') {
                    // fix for join event firing twice
                    // fix instantiation happening out of order before join event
                    hasInstantiated = ref.hasInstantiated;
                }
                photonLobbyJointime.value.set(data.Parameters[254], {
                    joinTime: Date.parse(gameLogDate),
                    hasInstantiated,
                    inVRMode: data.Parameters[249].inVRMode,
                    avatarEyeHeight: data.Parameters[249].avatarEyeHeight,
                    canModerateInstance:
                        data.Parameters[249].canModerateInstance,
                    groupOnNameplate: data.Parameters[249].groupOnNameplate,
                    showGroupBadgeToOthers:
                        data.Parameters[249].showGroupBadgeToOthers,
                    showSocialRank: data.Parameters[249].showSocialRank,
                    useImpostorAsFallback:
                        data.Parameters[249].useImpostorAsFallback,
                    platform: data.Parameters[249].platform
                });
                photonUserJoin(
                    data.Parameters[254],
                    data.Parameters[249],
                    gameLogDate
                );
                startLobbyWatcherLoop();
                break;
            case 254:
                // Leave
                var photonId = data.Parameters[254];
                photonUserLeave(photonId, gameLogDate);
                photonLobbyCurrent.value.delete(photonId);
                photonLobbyLastModeration.value.delete(photonId);
                photonLobbyJointime.value.delete(photonId);
                photonEvent7List.value.delete(photonId);
                parsePhotonLobbyIds(data.Parameters[252]);
                if (typeof data.Parameters[203] !== 'undefined') {
                    setPhotonLobbyMaster(data.Parameters[203], gameLogDate);
                }
                break;
            case 4:
                // Sync
                setPhotonLobbyMaster(data.Parameters[254], gameLogDate);
                break;
            case 33:
                // Moderation
                if (data.Parameters[245]['0'] === 21) {
                    if (data.Parameters[245]['1']) {
                        var photonId = data.Parameters[245]['1'];
                        const block = data.Parameters[245]['10'];
                        const mute = data.Parameters[245]['11'];
                        var ref = photonLobby.value.get(photonId);
                        if (
                            typeof ref !== 'undefined' &&
                            typeof ref.id !== 'undefined'
                        ) {
                            photonModerationUpdate(
                                ref,
                                photonId,
                                block,
                                mute,
                                gameLogDate
                            );
                        } else {
                            moderationEventQueue.value.set(photonId, {
                                block,
                                mute,
                                gameLogDate
                            });
                        }
                    } else {
                        const blockArray = data.Parameters[245]['10'];
                        const muteArray = data.Parameters[245]['11'];
                        const idList = new Map();
                        blockArray.forEach((photonId1) => {
                            if (muteArray.includes(photonId1)) {
                                idList.set(photonId1, {
                                    isMute: true,
                                    isBlock: true
                                });
                            } else {
                                idList.set(photonId1, {
                                    isMute: false,
                                    isBlock: true
                                });
                            }
                        });
                        muteArray.forEach((photonId2) => {
                            if (!idList.has(photonId2)) {
                                idList.set(photonId2, {
                                    isMute: true,
                                    isBlock: false
                                });
                            }
                        });
                        idList.forEach(({ isMute, isBlock }, photonId3) => {
                            const ref1 = photonLobby.value.get(photonId3);
                            if (
                                typeof ref1 !== 'undefined' &&
                                typeof ref1.id !== 'undefined'
                            ) {
                                photonModerationUpdate(
                                    ref1,
                                    photonId3,
                                    isBlock,
                                    isMute,
                                    gameLogDate
                                );
                            } else {
                                moderationEventQueue.value.set(photonId3, {
                                    block: isBlock,
                                    mute: isMute,
                                    gameLogDate
                                });
                            }
                        });
                    }
                } else if (
                    data.Parameters[245]['0'] === 13 ||
                    data.Parameters[245]['0'] === 25
                ) {
                    let msg = data.Parameters[245]['2'];
                    if (
                        typeof msg === 'string' &&
                        typeof data.Parameters[245]['14'] === 'object'
                    ) {
                        for (let prop in data.Parameters[245]['14']) {
                            const value = data.Parameters[245]['14'][prop];
                            msg = msg.replace(`{{${prop}}}`, value);
                        }
                    }
                    addEntryPhotonEvent({
                        photonId,
                        text: msg,
                        type: 'Moderation',
                        color: 'yellow',
                        created_at: gameLogDate
                    });
                }
                break;
            case 202:
                // Instantiate
                if (!photonLobby.value.has(data.Parameters[254])) {
                    photonLobby.value.set(data.Parameters[254]);
                }
                if (!photonLobbyCurrent.value.has(data.Parameters[254])) {
                    photonLobbyCurrent.value.set(data.Parameters[254]);
                }
                var lobbyJointime = photonLobbyJointime.value.get(
                    data.Parameters[254]
                );
                if (typeof lobbyJointime !== 'undefined') {
                    photonLobbyJointime.value.set(data.Parameters[254], {
                        ...lobbyJointime,
                        hasInstantiated: true
                    });
                } else {
                    photonLobbyJointime.value.set(data.Parameters[254], {
                        joinTime: Date.parse(gameLogDate),
                        hasInstantiated: true
                    });
                }
                break;
            case 43:
                // Chatbox Message
                var photonId = data.Parameters[254];
                var text = data.Parameters[245];
                if (photonLobbyCurrentUser.value === photonId) {
                    return;
                }
                const lastMsg = photonLastChatBoxMsg.value.get(photonId);
                if (lastMsg === text) {
                    return;
                }
                photonLastChatBoxMsg.value.set(photonId, text);
                var userId = getUserIdFromPhotonId(photonId);
                if (
                    chatboxUserBlacklist.value.has(userId) ||
                    checkChatboxBlacklist(text)
                ) {
                    return;
                }
                addEntryPhotonEvent({
                    photonId,
                    text,
                    type: 'ChatBoxMessage',
                    created_at: gameLogDate
                });
                const entry = {
                    userId,
                    displayName: getDisplayNameFromPhotonId(photonId),
                    created_at: gameLogDate,
                    type: 'ChatBoxMessage',
                    text
                };
                notificationStore.queueGameLogNoty(entry);
                gameLogStore.addGameLog(entry);
                break;
            case 70:
                // Portal Spawn
                if (data.Parameters[245][0] === 20) {
                    var portalId = data.Parameters[245][1];
                    var userId = data.Parameters[245][2];
                    var shortName = data.Parameters[245][5];
                    var worldName = data.Parameters[245][8].name;
                    addPhotonPortalSpawn(
                        gameLogDate,
                        userId,
                        shortName,
                        worldName
                    );
                    photonLobbyActivePortals.value.set(portalId, {
                        userId,
                        shortName,
                        worldName,
                        created_at: Date.parse(gameLogDate),
                        playerCount: 0,
                        pendingLeave: 0
                    });
                } else if (data.Parameters[245][0] === 21) {
                    var portalId = data.Parameters[245][1];
                    var userId = data.Parameters[245][2];
                    var playerCount = data.Parameters[245][3];
                    var shortName = data.Parameters[245][5];
                    var worldName = '';
                    addPhotonPortalSpawn(
                        gameLogDate,
                        userId,
                        shortName,
                        worldName
                    );
                    photonLobbyActivePortals.value.set(portalId, {
                        userId,
                        shortName,
                        worldName,
                        created_at: Date.parse(gameLogDate),
                        playerCount: 0,
                        pendingLeave: 0
                    });
                } else if (data.Parameters[245][0] === 22) {
                    var portalId = data.Parameters[245][1];
                    var text = 'DeletedPortal';
                    var ref = photonLobbyActivePortals.value.get(portalId);
                    if (typeof ref !== 'undefined') {
                        var worldName = ref.worldName;
                        var playerCount = ref.playerCount;
                        const time = timeToText(
                            Date.parse(gameLogDate) - ref.created_at
                        );
                        text = `DeletedPortal after ${time} with ${playerCount} players to "${worldName}"`;
                    }
                    addEntryPhotonEvent({
                        text,
                        type: 'DeletedPortal',
                        created_at: gameLogDate
                    });
                    photonLobbyActivePortals.value.delete(portalId);
                } else if (data.Parameters[245][0] === 23) {
                    var portalId = data.Parameters[245][1];
                    var playerCount = data.Parameters[245][3];
                    var ref = photonLobbyActivePortals.value.get(portalId);
                    if (typeof ref !== 'undefined') {
                        ref.pendingLeave++;
                        ref.playerCount = playerCount;
                    }
                } else if (data.Parameters[245][0] === 24) {
                    addEntryPhotonEvent({
                        text: 'PortalError failed to create portal',
                        type: 'DeletedPortal',
                        created_at: gameLogDate
                    });
                }
                break;
            case 71:
                // Spawn Emoji
                var photonId = data.Parameters[254];
                if (photonId === photonLobbyCurrentUser.value) {
                    return;
                }
                const type = data.Parameters[245][0];
                let emojiName = '';
                let imageUrl = '';
                if (type === 0) {
                    const emojiId = data.Parameters[245][2];
                    emojiName = photonEmojis[emojiId];
                } else if (type === 1) {
                    emojiName = 'Custom';
                    var fileId = data.Parameters[245][1];
                    imageUrl = `https://api.vrchat.cloud/api/1/file/${fileId}/1/`;
                }
                addEntryPhotonEvent({
                    photonId,
                    text: emojiName,
                    type: 'SpawnEmoji',
                    created_at: gameLogDate,
                    imageUrl,
                    fileId
                });
                break;
        }
    }

    function parseVRCEvent(json) {
        // VRC Event
        const datetime = json.dt;
        const eventData = json.VRCEventData;
        const senderId = eventData.Sender;
        if (AppDebug.debugPhotonLogging) {
            console.log('VrcEvent:', json);
        }
        if (eventData.EventName === '_SendOnSpawn') {
            return;
        } else if (eventData.EventType > 34) {
            const entry = {
                created_at: datetime,
                type: 'Event',
                data: `${getDisplayNameFromPhotonId(
                    senderId
                )} called non existent RPC ${eventData.EventType}`
            };
            addPhotonEventToGameLog(entry);
            return;
        }
        if (eventData.EventType === 14) {
            let type = 'Event';
            if (eventData.EventName === 'ChangeVisibility') {
                if (eventData.Data[0] === true) {
                    var text = 'EnableCamera';
                } else if (eventData.Data[0] === false) {
                    var text = 'DisableCamera';
                }
                type = 'Camera';
            } else if (eventData.EventName === 'PhotoCapture') {
                var text = 'PhotoCapture';
                type = 'Camera';
            } else if (eventData.EventName === 'TimerBloop') {
                var text = 'TimerBloop';
                type = 'Camera';
            } else if (eventData.EventName === 'ReloadAvatarNetworkedRPC') {
                var text = 'AvatarReset';
            } else if (eventData.EventName === 'ReleaseBones') {
                var text = 'ResetPhysBones';
            } else if (eventData.EventName === 'SpawnEmojiRPC') {
                // var text = this.oldPhotonEmojis[eventData.Data];
                type = 'SpawnEmoji';
            } else {
                let eventVrc = '';
                if (eventData.Data && eventData.Data.length > 0) {
                    eventVrc = ` ${JSON.stringify(eventData.Data).replace(
                        /"([^(")"]+)":/g,
                        '$1:'
                    )}`;
                }
                var text = `${eventData.EventName}${eventVrc}`;
            }
            addEntryPhotonEvent({
                photonId: senderId,
                text,
                type,
                created_at: datetime
            });
        } else {
            let eventName = '';
            if (eventData.EventName) {
                eventName = ` ${JSON.stringify(eventData.EventName).replace(
                    /"([^(")"]+)":/g,
                    '$1:'
                )}`;
            }
            if (AppDebug.debugPhotonLogging) {
                const displayName = getDisplayNameFromPhotonId(senderId);
                const feed = `RPC ${displayName} ${
                    photonEventType[eventData.EventType]
                }${eventName}`;
                console.log('VrcRpc:', feed);
            }
        }
    }

    // async function parsePhotonPortalSpawn(
    //     created_at,
    //     instanceId,
    //     ref,
    //     portalType,
    //     shortName,
    //     photonId
    // ) {
    //     let worldName = shortName;
    //     if (instanceId) {
    //         worldName = await getWorldName(instanceId);
    //     }
    //     addEntryPhotonEvent({
    //         photonId,
    //         text: `${portalType} PortalSpawn to ${worldName}`,
    //         type: 'PortalSpawn',
    //         shortName,
    //         location: instanceId,
    //         worldName,
    //         created_at
    //     });
    //     addPhotonEventToGameLog({
    //         created_at,
    //         type: 'PortalSpawn',
    //         displayName: ref.displayName,
    //         location: locationStore.lastLocation.location,
    //         userId: ref.id,
    //         instanceId,
    //         worldName
    //     });
    // }

    async function addPhotonPortalSpawn(
        gameLogDate,
        userId,
        shortName,
        worldName
    ) {
        const instance = await instanceRequest.getInstanceFromShortName({
            shortName
        });
        const location = instance.json.location;
        const L = parseLocation(location);
        let groupName = '';
        if (L.groupId) {
            groupName = await getGroupName(L.groupId);
        }
        if (!worldName) {
            worldName = await getWorldName(location);
        }
        // var newShortName = instance.json.shortName;
        // var portalType = 'Secure';
        // if (shortName === newShortName) {
        //     portalType = 'Unlocked';
        // }
        const _displayLocation = displayLocation(
            location,
            worldName,
            groupName
        );
        addEntryPhotonEvent({
            photonId: getPhotonIdFromUserId(userId),
            text: `PortalSpawn to ${_displayLocation}`,
            type: 'PortalSpawn',
            shortName,
            location,
            worldName,
            groupName,
            created_at: gameLogDate
        });
        addPhotonEventToGameLog({
            created_at: gameLogDate,
            type: 'PortalSpawn',
            displayName: getDisplayName(userId),
            location: locationStore.lastLocation.location,
            userId,
            instanceId: location,
            worldName,
            groupName
        });
    }

    function addPhotonEventToGameLog(entry) {
        notificationStore.queueGameLogNoty(entry);
        gameLogStore.addGameLog(entry);
        if (entry.type === 'PortalSpawn') {
            database.addGamelogPortalSpawnToDatabase(entry);
        } else if (entry.type === 'Event') {
            database.addGamelogEventToDatabase(entry);
        }
    }

    function parsePhotonLobbyIds(lobbyIds) {
        lobbyIds.forEach((id) => {
            if (!photonLobby.value.has(id)) {
                photonLobby.value.set(id);
            }
            if (!photonLobbyCurrent.value.has(id)) {
                photonLobbyCurrent.value.set(id);
            }
        });
        for (var id of photonLobbyCurrent.value.keys()) {
            if (!lobbyIds.includes(id)) {
                photonLobbyCurrent.value.delete(id);
                photonEvent7List.value.delete(id);
            }
        }
    }

    function setPhotonLobbyMaster(photonId, gameLogDate) {
        if (photonLobbyMaster.value !== photonId) {
            if (photonLobbyMaster.value !== 0) {
                addEntryPhotonEvent({
                    photonId,
                    text: `Photon Master Migrate`,
                    type: 'MasterMigrate',
                    created_at: gameLogDate
                });
            }
            photonLobbyMaster.value = photonId;
        }
    }

    async function parsePhotonUser(photonId, user, gameLogDate) {
        if (typeof user === 'undefined') {
            console.error('PhotonUser: user is undefined', photonId);
            return;
        }
        let tags = [];
        if (typeof user.tags !== 'undefined') {
            tags = user.tags;
        }
        let ref = userStore.cachedUsers.get(user.id);
        const photonUser = {
            id: user.id,
            displayName: user.displayName,
            developerType: user.developerType,
            profilePicOverride: user.profilePicOverride,
            currentAvatarImageUrl: user.currentAvatarImageUrl,
            currentAvatarThumbnailImageUrl: user.currentAvatarThumbnailImageUrl,
            userIcon: user.userIcon,
            last_platform: user.last_platform,
            allowAvatarCopying: user.allowAvatarCopying,
            status: user.status,
            statusDescription: user.statusDescription,
            bio: user.bio,
            tags
        };
        photonLobby.value.set(photonId, photonUser);
        photonLobbyCurrent.value.set(photonId, photonUser);
        photonLobbyUserDataUpdate(photonId, photonUser, gameLogDate);

        const bias = Date.parse(gameLogDate) + 60 * 1000; // 1min
        if (bias > Date.now()) {
            if (typeof ref === 'undefined' || typeof ref.id === 'undefined') {
                try {
                    const args = await userRequest.getUser({
                        userId: user.id
                    });
                    ref = args.ref;
                } catch (err) {
                    console.error(err);
                    ref = photonUser;
                }
            } else if (
                !ref.isFriend &&
                locationStore.lastLocation.playerList.has(user.id)
            ) {
                let { joinTime } = locationStore.lastLocation.playerList.get(
                    user.id
                );
                if (!joinTime) {
                    joinTime = Date.parse(gameLogDate);
                }
                ref.$location_at = joinTime;
                ref.$online_for = joinTime;
            }
            if (
                typeof ref.id !== 'undefined' &&
                ref.currentAvatarImageUrl !== user.currentAvatarImageUrl
            ) {
                userStore.applyUser({
                    ...ref,
                    currentAvatarImageUrl: user.currentAvatarImageUrl,
                    currentAvatarThumbnailImageUrl:
                        user.currentAvatarThumbnailImageUrl
                });
            }
        }
        if (typeof ref !== 'undefined' && typeof ref.id !== 'undefined') {
            photonLobby.value.set(photonId, ref);
            photonLobbyCurrent.value.set(photonId, ref);
            // check moderation queue
            if (moderationEventQueue.value.has(photonId)) {
                var { block, mute, gameLogDate } =
                    moderationEventQueue.value.get(photonId);
                moderationEventQueue.value.delete(photonId);
                photonModerationUpdate(ref, photonId, block, mute, gameLogDate);
            }
        }
    }

    function photonLobbyUserDataUpdate(photonId, photonUser, gameLogDate) {
        const ref = photonLobbyUserData.value.get(photonId);
        if (
            typeof ref !== 'undefined' &&
            photonId !== photonLobbyCurrentUser.value &&
            (photonUser.status !== ref.status ||
                photonUser.statusDescription !== ref.statusDescription)
        ) {
            addEntryPhotonEvent({
                photonId,
                type: 'ChangeStatus',
                status: photonUser.status,
                previousStatus: ref.status,
                statusDescription: replaceBioSymbols(
                    photonUser.statusDescription
                ),
                previousStatusDescription: replaceBioSymbols(
                    ref.statusDescription
                ),
                created_at: Date.parse(gameLogDate)
            });
        }
        photonLobbyUserData.value.set(photonId, photonUser);
    }

    function photonUserJoin(photonId, user, gameLogDate) {
        if (photonId === photonLobbyCurrentUser.value) {
            return;
        }
        const avatar = user.avatarDict;
        avatar.name = replaceBioSymbols(avatar.name);
        avatar.description = replaceBioSymbols(avatar.description);
        let platform = '';
        if (user.last_platform === 'android') {
            platform = 'Android';
        } else if (user.last_platform === 'ios') {
            platform = 'iOS';
        } else if (user.inVRMode) {
            platform = 'VR';
        } else {
            platform = 'Desktop';
        }
        photonUserSusieCheck(photonId, user, gameLogDate);
        checkVRChatCache(avatar).then((cacheInfo) => {
            let inCache = false;
            if (cacheInfo.Item1 > 0) {
                inCache = true;
            }
            addEntryPhotonEvent({
                photonId,
                text: 'has joined',
                type: 'OnPlayerJoined',
                created_at: gameLogDate,
                avatar,
                inCache,
                platform
            });
        });
    }

    function photonUserSusieCheck(photonId, user, gameLogDate) {
        let text = '';
        if (typeof user.modTag !== 'undefined') {
            text = `Moderator has joined ${user.modTag}`;
        } else if (user.isInvisible) {
            text = 'User joined invisible';
        }
        if (text) {
            addEntryPhotonEvent({
                photonId,
                text,
                type: 'Event',
                color: 'yellow',
                created_at: gameLogDate
            });
            const entry = {
                created_at: new Date().toJSON(),
                type: 'Event',
                data: `${text} - ${getDisplayNameFromPhotonId(
                    photonId
                )} (${getUserIdFromPhotonId(photonId)})`
            };
            notificationStore.queueGameLogNoty(entry);
            gameLogStore.addGameLog(entry);
            database.addGamelogEventToDatabase(entry);
        }
    }

    function photonUserLeave(photonId, gameLogDate) {
        if (!photonLobbyCurrent.value.has(photonId)) {
            return;
        }
        let text = 'has left';
        const lastEvent = photonEvent7List.value.get(parseInt(photonId, 10));
        if (typeof lastEvent !== 'undefined') {
            const timeSinceLastEvent = Date.now() - Date.parse(lastEvent);
            if (timeSinceLastEvent > 10 * 1000) {
                // 10 seconds
                text = `has timed out after ${timeToText(timeSinceLastEvent)}`;
            }
        }
        photonLobbyActivePortals.value.forEach((portal) => {
            if (portal.pendingLeave > 0) {
                text = `has left through portal to "${portal.worldName}"`;
                portal.pendingLeave--;
            }
        });
        addEntryPhotonEvent({
            photonId,
            text,
            type: 'OnPlayerLeft',
            created_at: gameLogDate
        });
    }

    function photonModerationUpdate(ref, photonId, block, mute, gameLogDate) {
        database.getModeration(ref.id).then((row) => {
            const lastType = photonLobbyLastModeration.value.get(photonId);
            let type = '';
            let text = '';
            if (block) {
                type = 'Blocked';
                text = 'Blocked';
            } else if (mute) {
                type = 'Muted';
                text = 'Muted';
            }
            if (row.userId) {
                if (!block && row.block) {
                    type = 'Unblocked';
                    text = 'Unblocked';
                } else if (!mute && row.mute) {
                    type = 'Unmuted';
                    text = 'Unmuted';
                }
                if (block === row.block && mute === row.mute) {
                    // no change
                    if (type && type !== lastType) {
                        addEntryPhotonEvent({
                            photonId,
                            text: `Moderation ${text}`,
                            type: 'Moderation',
                            color: 'yellow',
                            created_at: gameLogDate
                        });
                    }
                    photonLobbyLastModeration.value.set(photonId, type);
                    return;
                }
            }
            photonLobbyLastModeration.value.set(photonId, type);
            moderationAgainstTable.value.forEach((item) => {
                if (item.userId === ref.id && item.type === type) {
                    removeFromArray(moderationAgainstTable.value, item);
                }
            });
            if (type) {
                addEntryPhotonEvent({
                    photonId,
                    text: `Moderation ${text}`,
                    type: 'Moderation',
                    color: 'yellow',
                    created_at: gameLogDate
                });
                const noty = {
                    created_at: new Date().toJSON(),
                    userId: ref.id,
                    displayName: ref.displayName,
                    type
                };
                notificationStore.queueModerationNoty(noty);
                const entry = {
                    created_at: gameLogDate,
                    userId: ref.id,
                    displayName: ref.displayName,
                    type
                };
                moderationAgainstTable.value.push(entry);
            }
            if (block || mute || block !== row.block || mute !== row.mute) {
                sharedFeedStore.updateSharedFeed(true);
            }
            if (block || mute) {
                database.setModeration({
                    userId: ref.id,
                    updatedAt: gameLogDate,
                    displayName: ref.displayName,
                    block,
                    mute
                });
            } else if (row.block || row.mute) {
                database.deleteModeration(ref.id);
            }
        });
    }

    function parsePhotonAvatarChange(photonId, user, avatar, gameLogDate) {
        if (typeof avatar === 'undefined') {
            return;
        }
        if (typeof user === 'undefined') {
            console.error('PhotonAvatarChange: user is undefined', photonId);
            return;
        }
        const oldAvatarId = photonLobbyAvatars.value.get(user.id);
        if (
            oldAvatarId &&
            oldAvatarId !== avatar.id &&
            photonId !== photonLobbyCurrentUser.value
        ) {
            avatar.name = replaceBioSymbols(avatar.name);
            avatar.description = replaceBioSymbols(avatar.description);
            checkVRChatCache(avatar).then((cacheInfo) => {
                let inCache = false;
                if (cacheInfo.Item1 > 0) {
                    inCache = true;
                }
                const entry = {
                    created_at: new Date().toJSON(),
                    type: 'AvatarChange',
                    userId: user.id,
                    displayName: user.displayName,
                    name: avatar.name,
                    description: avatar.description,
                    avatarId: avatar.id,
                    authorId: avatar.authorId,
                    releaseStatus: avatar.releaseStatus,
                    imageUrl: avatar.imageUrl,
                    thumbnailImageUrl: avatar.thumbnailImageUrl
                };
                notificationStore.queueGameLogNoty(entry);
                gameLogStore.addGameLog(entry);
                addEntryPhotonEvent({
                    photonId,
                    displayName: user.displayName,
                    userId: user.id,
                    text: `ChangeAvatar ${avatar.name}`,
                    type: 'ChangeAvatar',
                    created_at: gameLogDate,
                    avatar,
                    inCache
                });
            });
        }
        photonLobbyAvatars.value.set(user.id, avatar.id);
    }

    async function parsePhotonGroupChange(
        photonId,
        user,
        groupId,
        gameLogDate
    ) {
        if (
            typeof user === 'undefined' ||
            !photonLobbyJointime.value.has(photonId)
        ) {
            return;
        }
        let { groupOnNameplate } = photonLobbyJointime.value.get(photonId);
        if (
            typeof groupOnNameplate !== 'undefined' &&
            groupOnNameplate !== groupId &&
            photonId !== photonLobbyCurrentUser.value
        ) {
            const groupName = await getGroupName(groupId);
            const previousGroupName = await getGroupName(groupOnNameplate);
            addEntryPhotonEvent({
                photonId,
                displayName: user.displayName,
                userId: user.id,
                text: `ChangeGroup ${groupName}`,
                type: 'ChangeGroup',
                created_at: gameLogDate,
                groupId,
                groupName,
                previousGroupId: groupOnNameplate,
                previousGroupName
            });
        }
    }

    function parsePhotonAvatar(avatar) {
        if (typeof avatar === 'undefined' || typeof avatar.id === 'undefined') {
            console.error('PhotonAvatar: avatar is undefined');
            return;
        }
        let tags = [];
        let unityPackages = [];
        if (typeof avatar.tags !== 'undefined') {
            tags = avatar.tags;
        }
        if (typeof avatar.unityPackages !== 'undefined') {
            unityPackages = avatar.unityPackages;
        }
        if (!avatar.assetUrl && unityPackages.length > 0) {
            for (const unityPackage of unityPackages) {
                if (
                    unityPackage.variant &&
                    unityPackage.variant !== 'standard' &&
                    unityPackage.variant !== 'security'
                ) {
                    continue;
                }
                if (unityPackage.platform === 'standalonewindows') {
                    avatar.assetUrl = unityPackage.assetUrl;
                }
            }
        }
        avatarStore.applyAvatar({
            id: avatar.id,
            authorId: avatar.authorId,
            authorName: avatar.authorName,
            updated_at: avatar.updated_at,
            description: avatar.description,
            imageUrl: avatar.imageUrl,
            thumbnailImageUrl: avatar.thumbnailImageUrl,
            name: avatar.name,
            releaseStatus: avatar.releaseStatus,
            version: avatar.version,
            tags,
            unityPackages
        });
    }

    return {
        state,

        photonLoggingEnabled,
        photonEventOverlay,
        photonEventOverlayFilter,
        photonEventTableTypeOverlayFilter,
        timeoutHudOverlay,
        timeoutHudOverlayFilter,
        photonEventIcon,
        photonLobbyTimeoutThreshold,
        photonOverlayMessageTimeout,
        photonEventTableTypeFilter,
        photonEventTable,
        photonEventTablePrevious,
        chatboxUserBlacklist,
        photonEventTableFilter,
        photonLobby,
        photonLobbyMaster,
        photonLobbyCurrentUser,
        photonLobbyUserData,
        photonLobbyCurrent,
        photonLobbyAvatars,
        photonLobbyLastModeration,
        photonLobbyTimeout,
        photonLobbyJointime,
        photonLobbyActivePortals,
        photonEvent7List,
        photonLastEvent7List,
        photonLastChatBoxMsg,
        moderationEventQueue,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay,
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlay,
        setTimeoutHudOverlayFilter,
        getDisplayName,
        photonEventPulse,
        parseOperationResponse,
        saveEventOverlay,
        checkChatboxBlacklist,
        saveChatboxUserBlacklist,
        photonEventTableFilterChange,
        showUserFromPhotonId,
        promptPhotonOverlayMessageTimeout,
        promptPhotonLobbyTimeoutThreshold,
        photonLobbyWatcherLoopStop,
        parsePhotonEvent,
        parseVRCEvent,
        moderationAgainstTable
    };
});
