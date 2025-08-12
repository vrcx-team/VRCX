import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { instanceRequest, userRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import { photonEventType } from '../shared/constants';
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
import { useI18n } from 'vue-i18n-bridge';

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
        photonLoggingEnabled: false,
        photonEventOverlay: false,
        photonEventOverlayFilter: 'Everyone',
        photonEventTableTypeOverlayFilter: [],
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
        timeoutHudOverlay: false,
        timeoutHudOverlayFilter: 'Everyone',
        photonEventCount: 0,
        photonEventIcon: false,
        photonLobbyTimeoutThreshold: 6000,
        photonOverlayMessageTimeout: 6000,
        photonEventTableTypeFilter: [],
        photonEventTable: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },
        photonEventTablePrevious: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },
        chatboxUserBlacklist: new Map(),
        photonEventTableFilter: '',
        photonLobby: new Map(),
        //
        moderationEventQueue: new Map(),
        moderationAgainstTable: [],

        photonLobbyMaster: 0,
        photonLobbyCurrentUser: 0,
        photonLobbyUserData: new Map(),
        photonLobbyCurrent: new Map(),
        photonLobbyAvatars: new Map(),
        photonLobbyLastModeration: new Map(),
        photonLobbyWatcherLoop: false,
        photonLobbyTimeout: [],
        photonLobbyJointime: new Map(),
        photonLobbyActivePortals: new Map(),
        photonEvent7List: new Map(),
        photonLastEvent7List: 0,
        photonLastChatBoxMsg: new Map()
    });

    const photonLobby = computed({
        get: () => state.photonLobby,
        set: (value) => {
            state.photonLobby = value;
        }
    });

    const photonLobbyMaster = computed({
        get: () => state.photonLobbyMaster,
        set: (value) => {
            state.photonLobbyMaster = value;
        }
    });

    const photonLobbyCurrentUser = computed({
        get: () => state.photonLobbyCurrentUser,
        set: (value) => {
            state.photonLobbyCurrentUser = value;
        }
    });

    const photonLobbyUserData = computed({
        get: () => state.photonLobbyUserData,
        set: (value) => {
            state.photonLobbyUserData = value;
        }
    });

    const photonLobbyCurrent = computed({
        get: () => state.photonLobbyCurrent,
        set: (value) => {
            state.photonLobbyCurrent = value;
        }
    });

    const photonLobbyAvatars = computed({
        get: () => state.photonLobbyAvatars,
        set: (value) => {
            state.photonLobbyAvatars = value;
        }
    });

    const photonLobbyLastModeration = computed({
        get: () => state.photonLobbyLastModeration,
        set: (value) => {
            state.photonLobbyLastModeration = value;
        }
    });

    const photonLobbyTimeout = computed({
        get: () => state.photonLobbyTimeout,
        set: (value) => {
            state.photonLobbyTimeout = value;
        }
    });

    const photonLobbyJointime = computed({
        get: () => state.photonLobbyJointime,
        set: (value) => {
            state.photonLobbyJointime = value;
        }
    });

    const photonLobbyActivePortals = computed({
        get: () => state.photonLobbyActivePortals,
        set: (value) => {
            state.photonLobbyActivePortals = value;
        }
    });

    const photonEvent7List = computed({
        get: () => state.photonEvent7List,
        set: (value) => {
            state.photonEvent7List = value;
        }
    });

    const photonLastEvent7List = computed({
        get: () => state.photonLastEvent7List,
        set: (value) => {
            state.photonLastEvent7List = value;
        }
    });

    const photonLastChatBoxMsg = computed({
        get: () => state.photonLastChatBoxMsg,
        set: (value) => {
            state.photonLastChatBoxMsg = value;
        }
    });

    const moderationEventQueue = computed({
        get: () => state.moderationEventQueue,
        set: (value) => {
            state.moderationEventQueue = value;
        }
    });

    async function initPhotonStates() {
        const [
            photonEventOverlay,
            photonEventOverlayFilter,
            photonEventTableTypeOverlayFilter,
            timeoutHudOverlay,
            timeoutHudOverlayFilter,
            photonLobbyTimeoutThreshold,
            photonOverlayMessageTimeout,
            photonEventTableTypeFilter,
            chatboxUserBlacklist
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

        state.photonEventOverlay = photonEventOverlay;
        state.photonEventOverlayFilter = photonEventOverlayFilter;
        state.photonEventTableTypeOverlayFilter = JSON.parse(
            photonEventTableTypeOverlayFilter
        );
        state.timeoutHudOverlay = timeoutHudOverlay;
        state.timeoutHudOverlayFilter = timeoutHudOverlayFilter;
        state.photonLobbyTimeoutThreshold = photonLobbyTimeoutThreshold;
        state.photonOverlayMessageTimeout = Number(photonOverlayMessageTimeout);
        state.photonEventTableTypeFilter = JSON.parse(
            photonEventTableTypeFilter
        );

        state.photonEventTable.filters[1].value =
            state.photonEventTableTypeFilter;
        state.photonEventTablePrevious.filters[1].value =
            state.photonEventTableTypeFilter;

        state.chatboxUserBlacklist = new Map(
            Object.entries(JSON.parse(chatboxUserBlacklist || '{}'))
        );
    }

    initPhotonStates();

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);
    const photonEventOverlay = computed(() => state.photonEventOverlay);
    const photonEventOverlayFilter = computed(
        () => state.photonEventOverlayFilter
    );
    const photonEventTableTypeOverlayFilter = computed(
        () => state.photonEventTableTypeOverlayFilter
    );
    const timeoutHudOverlay = computed(() => state.timeoutHudOverlay);
    const timeoutHudOverlayFilter = computed(
        () => state.timeoutHudOverlayFilter
    );
    const photonEventIcon = computed({
        get: () => state.photonEventIcon,
        set: (value) => {
            state.photonEventIcon = value;
        }
    });
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
    const photonEventTableTypeFilter = computed({
        get: () => state.photonEventTableTypeFilter,
        set: (value) => {
            state.photonEventTableTypeFilter = value;
        }
    });

    const photonEventTable = computed({
        get: () => state.photonEventTable,
        set: (value) => {
            state.photonEventTable = value;
        }
    });

    const photonEventTablePrevious = computed({
        get: () => state.photonEventTablePrevious,
        set: (value) => {
            state.photonEventTablePrevious = value;
        }
    });
    const chatboxUserBlacklist = computed({
        get: () => state.chatboxUserBlacklist,
        set: (value) => {
            state.chatboxUserBlacklist = value;
        }
    });

    const photonEventTableFilter = computed({
        get: () => state.photonEventTableFilter,
        set: (value) => {
            state.photonEventTableFilter = value;
        }
    });

    const moderationAgainstTable = computed({
        get: () => state.moderationAgainstTable,
        set: (value) => {
            state.moderationAgainstTable = value;
        }
    });

    function setPhotonLoggingEnabled() {
        state.photonLoggingEnabled = !state.photonLoggingEnabled;
        configRepository.setBool('VRCX_photonLoggingEnabled', true);
    }
    function setPhotonEventOverlay() {
        state.photonEventOverlay = !state.photonEventOverlay;
        configRepository.setBool(
            'VRCX_PhotonEventOverlay',
            state.photonEventOverlay
        );
    }

    function setPhotonEventOverlayFilter(value) {
        state.photonEventOverlayFilter = value;
        configRepository.setString(
            'VRCX_PhotonEventOverlayFilter',
            state.photonEventOverlayFilter
        );
    }
    function setPhotonEventTableTypeOverlayFilter(value) {
        state.photonEventTableTypeOverlayFilter = value;
        configRepository.setString(
            'VRCX_photonEventTypeOverlayFilter',
            JSON.stringify(state.photonEventTableTypeOverlayFilter)
        );
    }
    function setTimeoutHudOverlay(value) {
        state.timeoutHudOverlay = !state.timeoutHudOverlay;
        configRepository.setBool('VRCX_TimeoutHudOverlay', value);
        if (!state.timeoutHudOverlay) {
            AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
        }
    }
    function setTimeoutHudOverlayFilter(value) {
        state.timeoutHudOverlayFilter = value;
        configRepository.setString(
            'VRCX_TimeoutHudOverlayFilter',
            state.timeoutHudOverlayFilter
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
        state.photonEventIcon = true;
        workerTimers.setTimeout(() => (state.photonEventIcon = false), 150);
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
                    state.photonLobbyCurrentUser = data.Parameters[254];
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
                        const lobbyJointime = state.photonLobbyJointime.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        state.photonLobbyJointime.set(id, {
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
                state.photonEvent7List = new Map();
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
            JSON.stringify(Object.fromEntries(state.chatboxUserBlacklist))
        );
    }

    async function photonEventTableFilterChange() {
        state.photonEventTable.filters[0].value = state.photonEventTableFilter;
        state.photonEventTable.filters[1].value =
            state.photonEventTableTypeFilter;

        state.photonEventTablePrevious.filters[0].value =
            state.photonEventTableFilter;
        state.photonEventTablePrevious.filters[1].value =
            state.photonEventTableTypeFilter;

        await configRepository.setString(
            'VRCX_photonEventTypeFilter',
            JSON.stringify(state.photonEventTableTypeFilter)
        );
        // await configRepository.setString(
        //     'VRCX_photonEventTypeOverlayFilter',
        //     JSON.stringify(this.photonEventTableTypeOverlayFilter)
        // );
    }

    function showUserFromPhotonId(photonId) {
        if (photonId) {
            const ref = state.photonLobby.get(photonId);
            if (typeof ref !== 'undefined') {
                if (typeof ref.id !== 'undefined') {
                    userStore.showUserDialog(ref.id);
                } else if (typeof ref.displayName !== 'undefined') {
                    userStore.lookupUser(ref);
                }
            } else {
                $app.$message({
                    message: 'No user info available',
                    type: 'error'
                });
            }
        }
    }

    function promptPhotonOverlayMessageTimeout() {
        $app.$prompt(
            t('prompt.overlay_message_timeout.description'),
            t('prompt.overlay_message_timeout.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.overlay_message_timeout.ok'),
                cancelButtonText: t('prompt.overlay_message_timeout.cancel'),
                inputValue: state.photonOverlayMessageTimeout / 1000,
                inputPattern: /\d+$/,
                inputErrorMessage: t(
                    'prompt.overlay_message_timeout.input_error'
                ),
                callback: async (action, instance) => {
                    if (
                        action === 'confirm' &&
                        instance.inputValue &&
                        !isNaN(instance.inputValue)
                    ) {
                        state.photonOverlayMessageTimeout = Math.trunc(
                            Number(instance.inputValue) * 1000
                        );
                        vrStore.updateVRConfigVars();
                    }
                }
            }
        );
    }

    function promptPhotonLobbyTimeoutThreshold() {
        $app.$prompt(
            t('prompt.photon_lobby_timeout.description'),
            t('prompt.photon_lobby_timeout.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.photon_lobby_timeout.ok'),
                cancelButtonText: t('prompt.photon_lobby_timeout.cancel'),
                inputValue: state.photonLobbyTimeoutThreshold / 1000,
                inputPattern: /\d+$/,
                inputErrorMessage: t('prompt.photon_lobby_timeout.input_error'),
                callback: async (action, instance) => {
                    if (
                        action === 'confirm' &&
                        instance.inputValue &&
                        !isNaN(instance.inputValue)
                    ) {
                        state.photonLobbyTimeoutThreshold = Math.trunc(
                            Number(instance.inputValue) * 1000
                        );
                    }
                }
            }
        );
    }

    function startLobbyWatcherLoop() {
        if (!state.photonLobbyWatcherLoop) {
            state.photonLobbyWatcherLoop = true;
            photonLobbyWatcher();
        }
    }

    function photonLobbyWatcherLoopStop() {
        state.photonLobbyWatcherLoop = false;
        state.photonLobbyTimeout = [];
        AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
    }

    function photonLobbyWatcher() {
        if (!state.photonLobbyWatcherLoop) {
            return;
        }
        if (state.photonLobbyCurrent.size === 0) {
            photonLobbyWatcherLoopStop();
            return;
        }
        const dtNow = Date.now();
        const bias2 = state.photonLastEvent7List + 1.5 * 1000;
        if (dtNow > bias2 || locationStore.lastLocation.playerList.size <= 1) {
            if (state.photonLobbyTimeout.length > 0) {
                AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
            }
            state.photonLobbyTimeout = [];
            workerTimers.setTimeout(() => photonLobbyWatcher(), 500);
            return;
        }
        const hudTimeout = [];
        state.photonEvent7List.forEach((dt, id) => {
            const timeSinceLastEvent = dtNow - Date.parse(dt);
            if (
                timeSinceLastEvent > state.photonLobbyTimeoutThreshold &&
                id !== state.photonLobbyCurrentUser
            ) {
                if (state.photonLobbyJointime.has(id)) {
                    var { joinTime } = state.photonLobbyJointime.get(id);
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
        if (state.photonLobbyTimeout.length > 0 || hudTimeout.length > 0) {
            hudTimeout.sort(function (a, b) {
                if (a.rawTime > b.rawTime) {
                    return 1;
                }
                if (a.rawTime < b.rawTime) {
                    return -1;
                }
                return 0;
            });
            if (state.timeoutHudOverlay) {
                if (
                    state.timeoutHudOverlayFilter === 'VIP' ||
                    state.timeoutHudOverlayFilter === 'Friends'
                ) {
                    var filteredHudTimeout = [];
                    hudTimeout.forEach((item) => {
                        if (
                            state.timeoutHudOverlayFilter === 'VIP' &&
                            favoriteStore.cachedFavoritesByObjectId.has(
                                item.userId
                            )
                        ) {
                            filteredHudTimeout.push(item);
                        } else if (
                            state.timeoutHudOverlayFilter === 'Friends' &&
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
            state.photonLobbyTimeout = hudTimeout;
            instanceStore.getCurrentInstanceUserList();
        }
        workerTimers.setTimeout(() => photonLobbyWatcher(), 500);
    }

    function addEntryPhotonEvent(input) {
        let isMaster = false;
        if (input.photonId === state.photonLobbyMaster) {
            isMaster = true;
        }
        const joinTimeRef = state.photonLobbyJointime.get(input.photonId);
        const isModerator = joinTimeRef?.canModerateInstance;
        const photonUserRef = state.photonLobby.get(input.photonId);
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
        state.photonEventTable.data.unshift(feed);
        if (
            state.photonEventTableTypeOverlayFilter.length > 0 &&
            !state.photonEventTableTypeOverlayFilter.includes(feed.type)
        ) {
            return;
        }
        if (state.photonEventOverlay) {
            if (
                state.photonEventOverlayFilter === 'VIP' ||
                state.photonEventOverlayFilter === 'Friends'
            ) {
                if (
                    feed.userId &&
                    ((state.photonEventOverlayFilter === 'VIP' && isFavorite) ||
                        (state.photonEventOverlayFilter === 'Friends' &&
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
            const ref = state.photonLobby.get(photonId);
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
            const ref = state.photonLobby.get(photonId);
            if (typeof ref !== 'undefined' && typeof ref.id !== 'undefined') {
                userId = ref.id;
            }
        }
        return userId;
    }

    function getPhotonIdFromDisplayName(displayName) {
        let photonId = '';
        if (displayName) {
            state.photonLobby.forEach((ref, id) => {
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
            state.photonLobby.forEach((ref, id) => {
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
                        var lobbyJointime = state.photonLobbyJointime.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        state.photonLobbyJointime.set(id, {
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
                    var lobbyJointime = state.photonLobbyJointime.get(id);
                    if (typeof lobbyJointime !== 'undefined') {
                        hasInstantiated = lobbyJointime.hasInstantiated;
                    }
                    state.photonLobbyJointime.set(id, {
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
                var lobbyJointime = state.photonLobbyJointime.get(id);
                state.photonLobbyJointime.set(id, {
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
                if (state.photonLobbyCurrentUser === data.Parameters[254]) {
                    // fix current user
                    hasInstantiated = true;
                }
                var ref = state.photonLobbyCurrent.get(data.Parameters[254]);
                if (typeof ref !== 'undefined') {
                    // fix for join event firing twice
                    // fix instantiation happening out of order before join event
                    hasInstantiated = ref.hasInstantiated;
                }
                state.photonLobbyJointime.set(data.Parameters[254], {
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
                state.photonLobbyCurrent.delete(photonId);
                state.photonLobbyLastModeration.delete(photonId);
                state.photonLobbyJointime.delete(photonId);
                state.photonEvent7List.delete(photonId);
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
                        var ref = state.photonLobby.get(photonId);
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
                            state.moderationEventQueue.set(photonId, {
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
                            const ref1 = state.photonLobby.get(photonId3);
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
                                state.moderationEventQueue.set(photonId3, {
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
                if (!state.photonLobby.has(data.Parameters[254])) {
                    state.photonLobby.set(data.Parameters[254]);
                }
                if (!state.photonLobbyCurrent.has(data.Parameters[254])) {
                    state.photonLobbyCurrent.set(data.Parameters[254]);
                }
                var lobbyJointime = state.photonLobbyJointime.get(
                    data.Parameters[254]
                );
                if (typeof lobbyJointime !== 'undefined') {
                    state.photonLobbyJointime.set(data.Parameters[254], {
                        ...lobbyJointime,
                        hasInstantiated: true
                    });
                } else {
                    state.photonLobbyJointime.set(data.Parameters[254], {
                        joinTime: Date.parse(gameLogDate),
                        hasInstantiated: true
                    });
                }
                break;
            case 43:
                // Chatbox Message
                var photonId = data.Parameters[254];
                var text = data.Parameters[245];
                if (state.photonLobbyCurrentUser === photonId) {
                    return;
                }
                const lastMsg = state.photonLastChatBoxMsg.get(photonId);
                if (lastMsg === text) {
                    return;
                }
                state.photonLastChatBoxMsg.set(photonId, text);
                var userId = getUserIdFromPhotonId(photonId);
                if (
                    state.chatboxUserBlacklist.has(userId) ||
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
                    state.photonLobbyActivePortals.set(portalId, {
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
                    state.photonLobbyActivePortals.set(portalId, {
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
                    var ref = state.photonLobbyActivePortals.get(portalId);
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
                    state.photonLobbyActivePortals.delete(portalId);
                } else if (data.Parameters[245][0] === 23) {
                    var portalId = data.Parameters[245][1];
                    var playerCount = data.Parameters[245][3];
                    var ref = state.photonLobbyActivePortals.get(portalId);
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
                if (photonId === state.photonLobbyCurrentUser) {
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
        if (AppGlobal.debugPhotonLogging) {
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
            if (AppGlobal.debugPhotonLogging) {
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
            if (!state.photonLobby.has(id)) {
                state.photonLobby.set(id);
            }
            if (!state.photonLobbyCurrent.has(id)) {
                state.photonLobbyCurrent.set(id);
            }
        });
        for (var id of state.photonLobbyCurrent.keys()) {
            if (!lobbyIds.includes(id)) {
                state.photonLobbyCurrent.delete(id);
                state.photonEvent7List.delete(id);
            }
        }
    }

    function setPhotonLobbyMaster(photonId, gameLogDate) {
        if (state.photonLobbyMaster !== photonId) {
            if (state.photonLobbyMaster !== 0) {
                addEntryPhotonEvent({
                    photonId,
                    text: `Photon Master Migrate`,
                    type: 'MasterMigrate',
                    created_at: gameLogDate
                });
            }
            state.photonLobbyMaster = photonId;
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
        state.photonLobby.set(photonId, photonUser);
        state.photonLobbyCurrent.set(photonId, photonUser);
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
            state.photonLobby.set(photonId, ref);
            state.photonLobbyCurrent.set(photonId, ref);
            // check moderation queue
            if (state.moderationEventQueue.has(photonId)) {
                var { block, mute, gameLogDate } =
                    state.moderationEventQueue.get(photonId);
                state.moderationEventQueue.delete(photonId);
                photonModerationUpdate(ref, photonId, block, mute, gameLogDate);
            }
        }
    }

    function photonLobbyUserDataUpdate(photonId, photonUser, gameLogDate) {
        const ref = state.photonLobbyUserData.get(photonId);
        if (
            typeof ref !== 'undefined' &&
            photonId !== state.photonLobbyCurrentUser &&
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
        state.photonLobbyUserData.set(photonId, photonUser);
    }

    function photonUserJoin(photonId, user, gameLogDate) {
        if (photonId === state.photonLobbyCurrentUser) {
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
        if (!state.photonLobbyCurrent.has(photonId)) {
            return;
        }
        let text = 'has left';
        const lastEvent = state.photonEvent7List.get(parseInt(photonId, 10));
        if (typeof lastEvent !== 'undefined') {
            const timeSinceLastEvent = Date.now() - Date.parse(lastEvent);
            if (timeSinceLastEvent > 10 * 1000) {
                // 10 seconds
                text = `has timed out after ${timeToText(timeSinceLastEvent)}`;
            }
        }
        state.photonLobbyActivePortals.forEach((portal) => {
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
            const lastType = state.photonLobbyLastModeration.get(photonId);
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
                    state.photonLobbyLastModeration.set(photonId, type);
                    return;
                }
            }
            state.photonLobbyLastModeration.set(photonId, type);
            state.moderationAgainstTable.forEach((item) => {
                if (item.userId === ref.id && item.type === type) {
                    removeFromArray(state.moderationAgainstTable, item);
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
                state.moderationAgainstTable.push(entry);
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
        const oldAvatarId = state.photonLobbyAvatars.get(user.id);
        if (
            oldAvatarId &&
            oldAvatarId !== avatar.id &&
            photonId !== state.photonLobbyCurrentUser
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
        state.photonLobbyAvatars.set(user.id, avatar.id);
    }

    async function parsePhotonGroupChange(
        photonId,
        user,
        groupId,
        gameLogDate
    ) {
        if (
            typeof user === 'undefined' ||
            !state.photonLobbyJointime.has(photonId)
        ) {
            return;
        }
        let { groupOnNameplate } = state.photonLobbyJointime.get(photonId);
        if (
            typeof groupOnNameplate !== 'undefined' &&
            groupOnNameplate !== groupId &&
            photonId !== state.photonLobbyCurrentUser
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
