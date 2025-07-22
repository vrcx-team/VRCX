import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import * as workerTimers from 'worker-timers';
import { userRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import gameLogService from '../service/gamelog.js';
import { watchState } from '../service/watchState';
import {
    convertYoutubeTime,
    formatSeconds,
    getGroupName,
    isRpcWorld,
    parseLocation,
    replaceBioSymbols
} from '../shared/utils';
import { useFriendStore } from './friend';
import { useGalleryStore } from './gallery';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useVrcxStore } from './vrcx';

export const useGameLogStore = defineStore('GameLog', () => {
    const notificationStore = useNotificationStore();
    const vrStore = useVrStore();
    const locationStore = useLocationStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const vrcxStore = useVrcxStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const gameStore = useGameStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const galleryStore = useGalleryStore();
    const photonStore = usePhotonStore();
    const sharedFeedStore = useSharedFeedStore();
    const state = reactive({
        nowPlaying: {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            offset: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false,
            thumbnailUrl: ''
        },
        gameLogTable: {
            data: [],
            loading: false,
            search: '',
            filter: [],
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
            },
            vip: false
        },
        gameLogSessionTable: [],
        lastVideoUrl: '',
        lastResourceloadUrl: '',
        lastLocationAvatarList: new Map()
    });

    async function init() {
        state.gameLogTable.filter = JSON.parse(
            await configRepository.getString('VRCX_gameLogTableFilters', '[]')
        );
        // gameLog loads before favorites
        // await configRepository.getBool(
        //     'VRCX_gameLogTableVIPFilter',
        //     false
        // );
    }

    init();

    const gameLogTable = computed({
        get: () => state.gameLogTable,
        set: (value) => {
            state.gameLogTable = value;
        }
    });

    const gameLogSessionTable = computed({
        get: () => state.gameLogSessionTable,
        set: (value) => {
            state.gameLogSessionTable = value;
        }
    });

    const nowPlaying = computed({
        get: () => state.nowPlaying,
        set: (value) => {
            state.nowPlaying = value;
        }
    });

    const lastVideoUrl = computed({
        get: () => state.lastVideoUrl,
        set: (value) => {
            state.lastVideoUrl = value;
        }
    });

    const lastResourceloadUrl = computed({
        get: () => state.lastResourceloadUrl,
        set: (value) => {
            state.lastResourceloadUrl = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.gameLogTable.data = [];
            state.gameLogSessionTable = [];
            if (isLoggedIn) {
                initGameLogTable();
            }
        },
        { flush: 'sync' }
    );

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                tryLoadPlayerList();
            }
        },
        { flush: 'sync' }
    );

    function clearNowPlaying() {
        state.nowPlaying = {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            offset: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false,
            thumbnailUrl: ''
        };
        vrStore.updateVrNowPlaying();
    }

    function setNowPlaying(ctx) {
        if (state.nowPlaying.url !== ctx.videoUrl) {
            if (!ctx.userId && ctx.displayName) {
                for (const ref of userStore.cachedUsers.values()) {
                    if (ref.displayName === ctx.displayName) {
                        ctx.userId = ref.id;
                        break;
                    }
                }
            }
            notificationStore.queueGameLogNoty(ctx);
            addGameLog(ctx);
            database.addGamelogVideoPlayToDatabase(ctx);

            let displayName = '';
            if (ctx.displayName) {
                displayName = ` (${ctx.displayName})`;
            }
            const name = `${ctx.videoName}${displayName}`;
            state.nowPlaying = {
                url: ctx.videoUrl,
                name,
                length: ctx.videoLength,
                startTime: Date.parse(ctx.created_at) / 1000,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: '',
                playing: false,
                thumbnailUrl: ctx.thumbnailUrl
            };
        } else {
            state.nowPlaying = {
                ...state.nowPlaying,
                length: ctx.videoLength,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: '',
                thumbnailUrl: ctx.thumbnailUrl
            };
            if (ctx.updatedAt && ctx.videoPos) {
                state.nowPlaying.startTime =
                    Date.parse(ctx.updatedAt) / 1000 - ctx.videoPos;
            } else {
                state.nowPlaying.startTime =
                    Date.parse(ctx.created_at) / 1000 - ctx.videoPos;
            }
        }
        vrStore.updateVrNowPlaying();
        if (!state.nowPlaying.playing && ctx.videoLength > 0) {
            state.nowPlaying.playing = true;
            updateNowPlaying();
        }
    }

    function updateNowPlaying() {
        const np = state.nowPlaying;
        if (!state.nowPlaying.playing) {
            return;
        }

        const now = Date.now() / 1000;
        np.elapsed = Math.round((now - np.startTime) * 10) / 10;
        if (np.elapsed >= np.length) {
            clearNowPlaying();
            return;
        }
        np.remainingText = formatSeconds(np.length - np.elapsed);
        np.percentage = Math.round(((np.elapsed * 100) / np.length) * 10) / 10;
        vrStore.updateVrNowPlaying();
        workerTimers.setTimeout(() => updateNowPlaying(), 1000);
    }

    function tryLoadPlayerList() {
        if (!gameStore.isGameRunning) {
            return;
        }
        console.log('Loading player list from game log...');
        let ctx;
        let i;
        const data = state.gameLogSessionTable;
        if (data.length === 0) {
            return;
        }
        let length = 0;
        for (i = data.length - 1; i > -1; i--) {
            ctx = data[i];
            if (ctx.type === 'Location') {
                locationStore.lastLocation = {
                    date: Date.parse(ctx.created_at),
                    location: ctx.location,
                    name: ctx.worldName,
                    playerList: new Map(),
                    friendList: new Map()
                };
                length = i;
                break;
            }
        }
        if (length > 0) {
            for (i = length + 1; i < data.length; i++) {
                ctx = data[i];
                if (ctx.type === 'OnPlayerJoined') {
                    if (!ctx.userId) {
                        for (let ref of userStore.cachedUsers.values()) {
                            if (ref.displayName === ctx.displayName) {
                                ctx.userId = ref.id;
                                break;
                            }
                        }
                    }
                    const userMap = {
                        displayName: ctx.displayName,
                        userId: ctx.userId,
                        joinTime: Date.parse(ctx.created_at),
                        lastAvatar: ''
                    };
                    locationStore.lastLocation.playerList.set(
                        ctx.userId,
                        userMap
                    );
                    if (friendStore.friends.has(ctx.userId)) {
                        locationStore.lastLocation.friendList.set(
                            ctx.userId,
                            userMap
                        );
                    }
                }
                if (ctx.type === 'OnPlayerLeft') {
                    locationStore.lastLocation.playerList.delete(ctx.userId);
                    locationStore.lastLocation.friendList.delete(ctx.userId);
                }
            }
            locationStore.lastLocation.playerList.forEach((ref1) => {
                if (
                    ref1.userId &&
                    typeof ref1.userId === 'string' &&
                    !userStore.cachedUsers.has(ref1.userId)
                ) {
                    userRequest.getUser({ userId: ref1.userId });
                }
            });

            locationStore.updateCurrentUserLocation();
            instanceStore.updateCurrentInstanceWorld();
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            userStore.applyUserDialogLocation();
            instanceStore.applyWorldDialogInstances();
            instanceStore.applyGroupDialogInstances();
        }
    }

    function gameLogIsFriend(row) {
        if (typeof row.isFriend !== 'undefined') {
            return row.isFriend;
        }
        if (!row.userId) {
            return false;
        }
        row.isFriend = friendStore.friends.has(row.userId);
        return row.isFriend;
    }

    function gameLogIsFavorite(row) {
        if (typeof row.isFavorite !== 'undefined') {
            return row.isFavorite;
        }
        if (!row.userId) {
            return false;
        }
        row.isFavorite = friendStore.localFavoriteFriends.has(row.userId);
        return row.isFavorite;
    }

    async function gameLogTableLookup() {
        await configRepository.setString(
            'VRCX_gameLogTableFilters',
            JSON.stringify(state.gameLogTable.filter)
        );
        await configRepository.setBool(
            'VRCX_gameLogTableVIPFilter',
            state.gameLogTable.vip
        );
        state.gameLogTable.loading = true;
        let vipList = [];
        if (state.gameLogTable.vip) {
            vipList = Array.from(friendStore.localFavoriteFriends.values());
        }
        state.gameLogTable.data = await database.lookupGameLogDatabase(
            state.gameLogTable.search,
            state.gameLogTable.filter,
            vipList
        );
        state.gameLogTable.loading = false;
    }

    function addGameLog(entry) {
        state.gameLogSessionTable.push(entry);
        sharedFeedStore.updateSharedFeed(false);
        if (entry.type === 'VideoPlay') {
            // event time can be before last gameLog entry
            sharedFeedStore.updateSharedFeed(true);
        }

        // If the VIP friend filter is enabled, logs from other friends will be ignored.
        if (
            state.gameLogTable.vip &&
            !friendStore.localFavoriteFriends.has(entry.userId) &&
            (entry.type === 'OnPlayerJoined' ||
                entry.type === 'OnPlayerLeft' ||
                entry.type === 'VideoPlay' ||
                entry.type === 'PortalSpawn' ||
                entry.type === 'External')
        ) {
            return;
        }
        if (
            entry.type === 'LocationDestination' ||
            entry.type === 'AvatarChange' ||
            entry.type === 'ChatBoxMessage' ||
            (entry.userId === userStore.currentUser.id &&
                (entry.type === 'OnPlayerJoined' ||
                    entry.type === 'OnPlayerLeft'))
        ) {
            return;
        }
        if (
            state.gameLogTable.filter.length > 0 &&
            !state.gameLogTable.filter.includes(entry.type)
        ) {
            return;
        }
        if (!gameLogSearch(entry)) {
            return;
        }
        state.gameLogTable.data.push(entry);
        sweepGameLog();
        uiStore.notifyMenu('gameLog');
    }

    async function addGamelogLocationToDatabase(input) {
        const groupName = await getGroupName(input.location);
        const entry = {
            ...input,
            groupName
        };
        database.addGamelogLocationToDatabase(entry);
    }

    function gameLogSearch(row) {
        const value = state.gameLogTable.search.toUpperCase();
        if (!value) {
            return true;
        }
        if (
            (value.startsWith('wrld_') || value.startsWith('grp_')) &&
            String(row.location).toUpperCase().includes(value)
        ) {
            return true;
        }
        switch (row.type) {
            case 'Location':
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'OnPlayerJoined':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'OnPlayerLeft':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'PortalSpawn':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Event':
                if (String(row.data).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'External':
                if (String(row.message).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'VideoPlay':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.videoName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.videoUrl).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'StringLoad':
            case 'ImageLoad':
                if (String(row.resourceUrl).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
        }
        return true;
    }

    function sweepGameLog() {
        const { data } = state.gameLogTable;
        const j = data.length;
        if (j > vrcxStore.maxTableSize) {
            data.splice(0, j - vrcxStore.maxTableSize);
        }

        const date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
        const limit = date.toJSON();
        let i = 0;
        const k = state.gameLogSessionTable.length;
        while (i < k && state.gameLogSessionTable[i].created_at < limit) {
            ++i;
        }
        if (i === k) {
            state.gameLogSessionTable = [];
        } else if (i) {
            state.gameLogSessionTable.splice(0, i);
        }
    }

    function addGameLogEntry(gameLog, location) {
        let entry = undefined;
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        let userId = String(gameLog.userId || '');
        if (!userId && gameLog.displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === gameLog.displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        switch (gameLog.type) {
            case 'location-destination':
                if (gameStore.isGameRunning) {
                    // needs to be added before OnPlayerLeft entries from LocationReset
                    addGameLog({
                        created_at: gameLog.dt,
                        type: 'LocationDestination',
                        location: gameLog.location
                    });
                    locationStore.lastLocationReset(gameLog.dt);
                    locationStore.lastLocation.location = 'traveling';
                    locationStore.lastLocationDestination = gameLog.location;
                    locationStore.lastLocationDestinationTime = Date.parse(
                        gameLog.dt
                    );
                    state.lastLocationAvatarList.clear();
                    instanceStore.removeQueuedInstance(gameLog.location);
                    locationStore.updateCurrentUserLocation();
                    clearNowPlaying();
                    instanceStore.updateCurrentInstanceWorld();
                    userStore.applyUserDialogLocation();
                    instanceStore.applyWorldDialogInstances();
                    instanceStore.applyGroupDialogInstances();
                }
                break;
            case 'location':
                instanceStore.addInstanceJoinHistory(
                    locationStore.lastLocation.location,
                    gameLog.dt
                );
                const worldName = replaceBioSymbols(gameLog.worldName);
                if (gameStore.isGameRunning) {
                    locationStore.lastLocationReset(gameLog.dt);
                    clearNowPlaying();
                    locationStore.lastLocation = {
                        date: Date.parse(gameLog.dt),
                        location: gameLog.location,
                        name: worldName,
                        playerList: new Map(),
                        friendList: new Map()
                    };
                    instanceStore.removeQueuedInstance(gameLog.location);
                    locationStore.updateCurrentUserLocation();
                    vrStore.updateVRLastLocation();
                    instanceStore.updateCurrentInstanceWorld();
                    userStore.applyUserDialogLocation();
                    instanceStore.applyWorldDialogInstances();
                    instanceStore.applyGroupDialogInstances();
                }
                instanceStore.addInstanceJoinHistory(
                    gameLog.location,
                    gameLog.dt
                );
                const L = parseLocation(gameLog.location);
                entry = {
                    created_at: gameLog.dt,
                    type: 'Location',
                    location: gameLog.location,
                    worldId: L.worldId,
                    worldName,
                    groupName: '',
                    time: 0
                };
                getGroupName(gameLog.location).then((groupName) => {
                    entry.groupName = groupName;
                });
                addGamelogLocationToDatabase(entry);
                break;
            case 'player-joined':
                const joinTime = Date.parse(gameLog.dt);
                const userMap = {
                    displayName: gameLog.displayName,
                    userId,
                    joinTime,
                    lastAvatar: ''
                };
                locationStore.lastLocation.playerList.set(userId, userMap);
                const ref = userStore.cachedUsers.get(userId);
                if (!userId) {
                    console.error('Missing userId:', gameLog.displayName);
                } else if (userId === userStore.currentUser.id) {
                    // skip
                } else if (friendStore.friends.has(userId)) {
                    locationStore.lastLocation.friendList.set(userId, userMap);
                    if (
                        ref.location !== locationStore.lastLocation.location &&
                        ref.travelingToLocation !==
                            locationStore.lastLocation.location
                    ) {
                        // fix $location_at with private
                        ref.$location_at = joinTime;
                    }
                } else if (typeof ref !== 'undefined') {
                    // set $location_at to join time if user isn't a friend
                    ref.$location_at = joinTime;
                } else {
                    if (AppGlobal.debugGameLog || AppGlobal.debugWebRequests) {
                        console.log('Fetching user from gameLog:', userId);
                    }
                    userRequest.getUser({ userId });
                }
                vrStore.updateVRLastLocation();
                instanceStore.getCurrentInstanceUserList();
                entry = {
                    created_at: gameLog.dt,
                    type: 'OnPlayerJoined',
                    displayName: gameLog.displayName,
                    location,
                    userId,
                    time: 0
                };
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'player-left':
                const ref1 = locationStore.lastLocation.playerList.get(userId);
                if (typeof ref1 === 'undefined') {
                    break;
                }
                const friendRef = friendStore.friends.get(userId);
                if (typeof friendRef?.ref !== 'undefined') {
                    friendRef.ref.$joinCount++;
                    friendRef.ref.$lastSeen = new Date().toJSON();
                    friendRef.ref.$timeSpent +=
                        dayjs(gameLog.dt) - ref1.joinTime;
                    if (
                        appearanceSettingsStore.sidebarSortMethods.includes(
                            'Sort by Last Seen'
                        )
                    ) {
                        friendStore.sortVIPFriends = true;
                        friendStore.sortOnlineFriends = true;
                    }
                }
                const time = dayjs(gameLog.dt) - ref1.joinTime;
                locationStore.lastLocation.playerList.delete(userId);
                locationStore.lastLocation.friendList.delete(userId);
                state.lastLocationAvatarList.delete(gameLog.displayName);
                photonStore.photonLobbyAvatars.delete(userId);
                vrStore.updateVRLastLocation();
                instanceStore.getCurrentInstanceUserList();
                entry = {
                    created_at: gameLog.dt,
                    type: 'OnPlayerLeft',
                    displayName: gameLog.displayName,
                    location,
                    userId,
                    time
                };
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'portal-spawn':
                if (vrcxStore.ipcEnabled && gameStore.isGameRunning) {
                    break;
                }
                entry = {
                    created_at: gameLog.dt,
                    type: 'PortalSpawn',
                    location,
                    displayName: '',
                    userId: '',
                    instanceId: '',
                    worldName: ''
                };
                database.addGamelogPortalSpawnToDatabase(entry);
                break;
            case 'video-play':
                gameLog.videoUrl = decodeURI(gameLog.videoUrl);
                if (state.lastVideoUrl === gameLog.videoUrl) {
                    break;
                }
                state.lastVideoUrl = gameLog.videoUrl;
                addGameLogVideo(gameLog, location, userId);
                break;
            case 'video-sync':
                const timestamp = gameLog.timestamp.replace(/,/g, '');
                if (state.nowPlaying.playing) {
                    state.nowPlaying.offset = parseInt(timestamp, 10);
                }
                break;
            case 'resource-load-string':
            case 'resource-load-image':
                if (
                    !generalSettingsStore.logResourceLoad ||
                    state.lastResourceloadUrl === gameLog.resourceUrl
                ) {
                    break;
                }
                state.lastResourceloadUrl = gameLog.resourceUrl;
                entry = {
                    created_at: gameLog.dt,
                    type:
                        gameLog.type === 'resource-load-string'
                            ? 'StringLoad'
                            : 'ImageLoad',
                    resourceUrl: gameLog.resourceUrl,
                    location
                };
                database.addGamelogResourceLoadToDatabase(entry);
                break;
            case 'screenshot':
                // entry = {
                //     created_at: gameLog.dt,
                //     type: 'Event',
                //     data: `Screenshot Processed: ${gameLog.screenshotPath.replace(
                //         /^.*[\\/]/,
                //         ''
                //     )}`
                // };
                // database.addGamelogEventToDatabase(entry);

                vrcxStore.processScreenshot(gameLog.screenshotPath);
                break;
            case 'api-request':
                if (AppGlobal.debugWebRequests) {
                    console.log('API Request:', gameLog.url);
                }
                // const userId = '';
                // try {
                //     const url = new URL(gameLog.url);
                //     const urlParams = new URLSearchParams(gameLog.url);
                //     if (url.pathname.substring(0, 13) === '/api/1/users/') {
                //         const pathArray = url.pathname.split('/');
                //         userId = pathArray[4];
                //     } else if (urlParams.has('userId')) {
                //         userId = urlParams.get('userId');
                //     }
                // } catch (err) {
                //     console.error(err);
                // }
                // if (!userId) {
                //     break;
                // }

                if (advancedSettingsStore.saveInstanceEmoji) {
                    try {
                        // https://api.vrchat.cloud/api/1/user/usr_032383a7-748c-4fb2-94e4-bcb928e5de6b/inventory/inv_75781d65-92fe-4a80-a1ff-27ee6e843b08
                        const url = new URL(gameLog.url);
                        if (
                            url.pathname.substring(0, 12) === '/api/1/user/' &&
                            url.pathname.includes('/inventory/inv_')
                        ) {
                            const pathArray = url.pathname.split('/');
                            const userId = pathArray[4];
                            const inventoryId = pathArray[6];
                            if (userId && inventoryId.length === 40) {
                                galleryStore.queueCheckInstanceInventory(
                                    inventoryId,
                                    userId
                                );
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
                if (advancedSettingsStore.saveInstancePrints) {
                    try {
                        let printId = '';
                        const url1 = new URL(gameLog.url);
                        if (
                            url1.pathname.substring(0, 14) === '/api/1/prints/'
                        ) {
                            const pathArray = url1.pathname.split('/');
                            printId = pathArray[4];
                        }
                        if (printId && printId.length === 41) {
                            galleryStore.queueSavePrintToFile(printId);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
                break;
            case 'avatar-change':
                if (!gameStore.isGameRunning) {
                    break;
                }
                let avatarName = state.lastLocationAvatarList.get(
                    gameLog.displayName
                );
                if (
                    photonStore.photonLoggingEnabled ||
                    avatarName === gameLog.avatarName
                ) {
                    break;
                }
                if (!avatarName) {
                    avatarName = gameLog.avatarName;
                    state.lastLocationAvatarList.set(
                        gameLog.displayName,
                        avatarName
                    );
                    break;
                }
                avatarName = gameLog.avatarName;
                state.lastLocationAvatarList.set(
                    gameLog.displayName,
                    avatarName
                );
                entry = {
                    created_at: gameLog.dt,
                    type: 'AvatarChange',
                    userId,
                    name: avatarName,
                    displayName: gameLog.displayName
                };
                break;
            case 'vrcx':
                // VideoPlay(PyPyDance) "https://jd.pypy.moe/api/v1/videos/jr1NX4Jo8GE.mp4",0.1001,239.606,"0905 : [J-POP] 【まなこ】金曜日のおはよう 踊ってみた (vernities)"
                const type = gameLog.data.substr(0, gameLog.data.indexOf(' '));
                if (type === 'VideoPlay(PyPyDance)') {
                    addGameLogPyPyDance(gameLog, location);
                } else if (type === 'VideoPlay(VRDancing)') {
                    addGameLogVRDancing(gameLog, location);
                } else if (type === 'VideoPlay(ZuwaZuwaDance)') {
                    addGameLogZuwaZuwaDance(gameLog, location);
                } else if (type === 'LSMedia') {
                    addGameLogLSMedia(gameLog, location);
                } else if (type === 'VideoPlay(PopcornPalace)') {
                    addGameLogPopcornPalace(gameLog, location);
                }
                break;
            case 'photon-id':
                if (!gameStore.isGameRunning || !watchState.isFriendsLoaded) {
                    break;
                }
                const photonId = parseInt(gameLog.photonId, 10);
                const ref2 = photonStore.photonLobby.get(photonId);
                if (typeof ref2 === 'undefined') {
                    for (const ctx of userStore.cachedUsers.values()) {
                        if (ctx.displayName === gameLog.displayName) {
                            photonStore.photonLobby.set(photonId, ctx);
                            photonStore.photonLobbyCurrent.set(photonId, ctx);
                            break;
                        }
                    }
                    const ctx1 = {
                        displayName: gameLog.displayName
                    };
                    photonStore.photonLobby.set(photonId, ctx1);
                    photonStore.photonLobbyCurrent.set(photonId, ctx1);
                    instanceStore.getCurrentInstanceUserList();
                }
                break;
            case 'notification':
                // entry = {
                //     created_at: gameLog.dt,
                //     type: 'Notification',
                //     data: gameLog.json
                // };
                break;
            case 'event':
                entry = {
                    created_at: gameLog.dt,
                    type: 'Event',
                    data: gameLog.event
                };
                database.addGamelogEventToDatabase(entry);
                break;
            case 'vrc-quit':
                if (!gameStore.isGameRunning) {
                    break;
                }
                if (advancedSettingsStore.vrcQuitFix) {
                    const bias = Date.parse(gameLog.dt) + 3000;
                    if (bias < Date.now()) {
                        console.log('QuitFix: Bias too low, not killing VRC');
                        break;
                    }
                    AppApi.QuitGame().then((processCount) => {
                        if (processCount > 1) {
                            console.log(
                                'QuitFix: More than 1 process running, not killing VRC'
                            );
                        } else if (processCount === 1) {
                            console.log('QuitFix: Killed VRC');
                        } else {
                            console.log(
                                'QuitFix: Nothing to kill, no VRC process running'
                            );
                        }
                    });
                }
                break;
            case 'openvr-init':
                gameStore.isGameNoVR = false;
                configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
                vrStore.updateOpenVR();
                break;
            case 'desktop-mode':
                gameStore.isGameNoVR = true;
                configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
                vrStore.updateOpenVR();
                break;
            case 'udon-exception':
                if (generalSettingsStore.udonExceptionLogging) {
                    console.log('UdonException', gameLog.data);
                }
                // entry = {
                //     created_at: gameLog.dt,
                //     type: 'Event',
                //     data: gameLog.data
                // };
                // database.addGamelogEventToDatabase(entry);
                break;
            case 'sticker-spawn':
                if (!advancedSettingsStore.saveInstanceStickers) {
                    break;
                }

                galleryStore.trySaveStickerToFile(
                    gameLog.displayName,
                    gameLog.userId,
                    gameLog.inventoryId
                );
                break;
        }
        if (typeof entry !== 'undefined') {
            // add tag colour
            if (entry.userId) {
                const tagRef = userStore.customUserTags.get(entry.userId);
                if (typeof tagRef !== 'undefined') {
                    entry.tagColour = tagRef.colour;
                }
            }
            notificationStore.queueGameLogNoty(entry);
            addGameLog(entry);
        }
    }

    async function addGameLogVideo(gameLog, location, userId) {
        let url;
        const videoUrl = gameLog.videoUrl;
        let youtubeVideoId = '';
        let videoId = '';
        let videoName = '';
        let videoLength = 0;
        let displayName = '';
        let videoPos = 8; // video loading delay
        if (typeof gameLog.displayName !== 'undefined') {
            displayName = gameLog.displayName;
        }
        if (typeof gameLog.videoPos !== 'undefined') {
            videoPos = gameLog.videoPos;
        }
        if (!isRpcWorld(location) || gameLog.videoId === 'YouTube') {
            // skip PyPyDance and VRDancing videos
            try {
                url = new URL(videoUrl);
                if (
                    url.origin === 'https://t-ne.x0.to' ||
                    url.origin === 'https://nextnex.com' ||
                    url.origin === 'https://r.0cm.org'
                ) {
                    url = new URL(url.searchParams.get('url'));
                }
                if (videoUrl.startsWith('https://u2b.cx/')) {
                    url = new URL(videoUrl.substring(15));
                }
                const id1 = url.pathname;
                const id2 = url.searchParams.get('v');
                if (id1 && id1.length === 12) {
                    // https://youtu.be/
                    youtubeVideoId = id1.substring(1, 12);
                }
                if (id1 && id1.length === 19) {
                    // https://www.youtube.com/shorts/
                    youtubeVideoId = id1.substring(8, 19);
                }
                if (id2 && id2.length === 11) {
                    // https://www.youtube.com/watch?v=
                    // https://music.youtube.com/watch?v=
                    youtubeVideoId = id2;
                }
                if (advancedSettingsStore.youTubeApi && youtubeVideoId) {
                    const data =
                        await advancedSettingsStore.lookupYouTubeVideo(
                            youtubeVideoId
                        );
                    if (data || data.pageInfo.totalResults !== 0) {
                        videoId = 'YouTube';
                        videoName = data.items[0].snippet.title;
                        videoLength = convertYoutubeTime(
                            data.items[0].contentDetails.duration
                        );
                    }
                }
            } catch {
                console.error(`Invalid URL: ${url}`);
            }
            const entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry);
        }
    }

    function addGameLogPyPyDance(gameLog, location) {
        const data =
            /VideoPlay\(PyPyDance\) "(.+?)",([\d.]+),([\d.]+),"(.*)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        const videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        const title = data[4];
        const bracketArray = title.split('(');
        const text1 = bracketArray.pop();
        let displayName = text1.slice(0, -1);
        let text2 = bracketArray.join('(');
        let videoId = '';
        if (text2 === 'Custom URL') {
            videoId = 'YouTube';
        } else {
            videoId = text2.substr(0, text2.indexOf(':') - 1);
            text2 = text2.substr(text2.indexOf(':') + 2);
        }
        const videoName = text2.slice(0, -1);
        if (displayName === 'Random') {
            displayName = '';
        }
        if (videoUrl === state.nowPlaying.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogVRDancing(gameLog, location) {
        const data =
            /VideoPlay\(VRDancing\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        let videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        let videoId = data[4];
        const displayName = data[5];
        let videoName = data[6];
        if (videoId === '-1') {
            videoId = 'YouTube';
        }
        const videoNameIndex = videoName.indexOf(']</b> ');
        if (videoNameIndex !== -1) {
            videoName = videoName.substring(videoNameIndex + 6);
        }
        if (videoPos === videoLength) {
            // ummm okay
            videoPos = 0;
        }
        if (videoUrl === state.nowPlaying.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            for (let ref of userStore.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogZuwaZuwaDance(gameLog, location) {
        const data =
            /VideoPlay\(ZuwaZuwaDance\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                gameLog.data
            );
        if (!data) {
            console.error('failed to parse', gameLog.data);
            return;
        }
        const videoUrl = data[1];
        const videoPos = Number(data[2]);
        const videoLength = Number(data[3]);
        let videoId = data[4];
        let displayName = data[5];
        const videoName = data[6];
        if (displayName === 'Random') {
            displayName = '';
        }
        if (videoId === '9999') {
            videoId = 'YouTube';
        }
        if (videoUrl === state.nowPlaying.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if (videoId === 'YouTube') {
            const entry1 = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            addGameLogVideo(entry1, location, userId);
        } else {
            const entry2 = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            setNowPlaying(entry2);
        }
    }

    function addGameLogLSMedia(gameLog, location) {
        // [VRCX] LSMedia 0,4268.981,Natsumi-sama,,
        // [VRCX] LSMedia 0,6298.292,Natsumi-sama,The Outfit (2022), 1080p
        const data = /LSMedia ([\d.]+),([\d.]+),(.+?),(.+?),(?=[^,]*$)/g.exec(
            gameLog.data
        );
        if (!data) {
            return;
        }
        const videoPos = Number(data[1]);
        const videoLength = Number(data[2]);
        const displayName = data[3];
        const videoName = replaceBioSymbols(data[4]);
        const videoUrl = videoName;
        const videoId = 'LSMedia';
        if (videoUrl === state.nowPlaying.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        const entry1 = {
            created_at: gameLog.dt,
            type: 'VideoPlay',
            videoUrl,
            videoId,
            videoName,
            videoLength,
            location,
            displayName,
            userId,
            videoPos
        };
        setNowPlaying(entry1);
    }

    function addGameLogPopcornPalace(gameLog, location) {
        // [VRCX] VideoPlay(PopcornPalace) {"videoName": "How to Train Your Dragon - 2025-06-06", "videoPos": 37.28777, "videoLength": 11474.05, "thumbnailUrl": "", "displayName": "miner28_3", "isPaused": false, "is3D": false, "looping": false}
        let data = gameLog.data;
        if (!data) {
            return;
        }
        try {
            const j = data.indexOf('{');
            data = JSON.parse(data.substring(j));
        } catch (err) {
            console.error('Failed to parse PopcornPalace data:', err);
            return;
        }

        const videoPos = Number(data.videoPos);
        const videoLength = Number(data.videoLength);
        const displayName = data.displayName || '';
        const videoName = data.videoName || '';
        const videoUrl = videoName;
        const videoId = 'PopcornPalace';
        const thumbnailUrl = data.thumbnailUrl || '';
        if (!videoName) {
            clearNowPlaying();
            return;
        }
        if (videoUrl === state.nowPlaying.url) {
            const entry = {
                updatedAt: gameLog.dt,
                videoUrl,
                videoLength,
                videoPos,
                thumbnailUrl
            };
            setNowPlaying(entry);
            return;
        }
        let userId = '';
        if (displayName) {
            for (const ref of userStore.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        const entry1 = {
            created_at: gameLog.dt,
            type: 'VideoPlay',
            videoUrl,
            videoId,
            videoName,
            videoLength,
            location,
            displayName,
            userId,
            videoPos,
            thumbnailUrl
        };
        setNowPlaying(entry1);
    }

    async function getGameLogTable() {
        await database.initTables();
        state.gameLogSessionTable = await database.getGamelogDatabase();
        const dateTill = await database.getLastDateGameLogDatabase();
        updateGameLog(dateTill);
    }

    async function updateGameLog(dateTill) {
        await gameLogService.setDateTill(dateTill);
        await new Promise((resolve) => {
            workerTimers.setTimeout(resolve, 10000);
        });
        let location = '';
        for (const gameLog of await gameLogService.getAll()) {
            if (gameLog.type === 'location') {
                location = gameLog.location;
            }
            addGameLogEntry(gameLog, location);
        }
    }

    // use in C#
    function addGameLogEvent(json) {
        const rawLogs = JSON.parse(json);
        const gameLog = gameLogService.parseRawGameLog(
            rawLogs[1],
            rawLogs[2],
            rawLogs.slice(3)
        );
        if (
            AppGlobal.debugGameLog &&
            gameLog.type !== 'photon-id' &&
            gameLog.type !== 'api-request' &&
            gameLog.type !== 'udon-exception'
        ) {
            console.log('gameLog:', gameLog);
        }
        addGameLogEntry(gameLog, locationStore.lastLocation.location);
    }

    async function disableGameLogDialog() {
        if (gameStore.isGameRunning) {
            $app.$message({
                message:
                    'VRChat needs to be closed before this option can be changed',
                type: 'error'
            });
            return;
        }
        if (!advancedSettingsStore.gameLogDisabled) {
            $app.$confirm('Continue? Disable GameLog', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: async (action) => {
                    if (action === 'confirm') {
                        advancedSettingsStore.setGameLogDisabled();
                    }
                }
            });
        } else {
            advancedSettingsStore.setGameLogDisabled();
        }
    }

    async function initGameLogTable() {
        state.gameLogTable.data = await database.lookupGameLogDatabase(
            state.gameLogTable.search,
            state.gameLogTable.filter
        );
    }

    return {
        state,
        nowPlaying,
        gameLogTable,
        gameLogSessionTable,
        lastVideoUrl,
        lastResourceloadUrl,
        initGameLogTable,
        clearNowPlaying,
        tryLoadPlayerList,
        gameLogIsFriend,
        gameLogIsFavorite,
        gameLogTableLookup,
        addGameLog,
        addGamelogLocationToDatabase,
        getGameLogTable,
        addGameLogEvent,
        disableGameLogDialog
    };
});
