import { reactive, ref, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import dayjs from 'dayjs';

import {
    compareGameLogRows,
    createJoinLeaveEntry,
    createLocationEntry,
    createPortalSpawnEntry,
    createResourceLoadEntry,
    findUserByDisplayName,
    formatSeconds,
    gameLogSearchFilter,
    getGroupName,
    parseInventoryFromUrl,
    parseLocation,
    parsePrintFromUrl,
    replaceBioSymbols
} from '../../shared/utils';
import { AppDebug } from '../../service/appConfig';
import { createMediaParsers } from './mediaParsers';
import { database } from '../../service/database';
import { useAdvancedSettingsStore } from '../settings/advanced';
import { useFriendStore } from '../friend';
import { useGalleryStore } from '../gallery';
import { useGameStore } from '../game';
import { useGeneralSettingsStore } from '../settings/general';
import { useInstanceStore } from '../instance';
import { useLocationStore } from '../location';
import { runLastLocationResetFlow, runUpdateCurrentUserLocationFlow } from '../../coordinators/locationCoordinator';
import { useModalStore } from '../modal';
import { useNotificationStore } from '../notification';
import { usePhotonStore } from '../photon';
import { useSharedFeedStore } from '../sharedFeed';
import { useUiStore } from '../ui';
import { useUserStore } from '../user';
import { useVrStore } from '../vr';
import { useVrcxStore } from '../vrcx';
import { userRequest } from '../../api';
import { watchState } from '../../service/watchState';

import configRepository from '../../service/config';
import gameLogService from '../../service/gameLog.js';

import * as workerTimers from 'worker-timers';

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
    const generalSettingsStore = useGeneralSettingsStore();
    const galleryStore = useGalleryStore();
    const photonStore = usePhotonStore();
    const sharedFeedStore = useSharedFeedStore();
    const modalStore = useModalStore();

    const router = useRouter();
    const { t } = useI18n();

    const state = reactive({
        lastLocationAvatarList: new Map()
    });

    const gameLogTableData = shallowRef([]);
    const gameLogTable = ref({
        loading: false,
        search: '',
        filter: [],
        pageSize: 20,
        pageSizeLinked: true,
        vip: false
    });

    const nowPlaying = ref({
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
    });

    const lastVideoUrl = ref('');

    const lastResourceloadUrl = ref('');

    watch(
        () => watchState.isLoggedIn,
        () => {
            gameLogTableData.value = [];
        },
        { flush: 'sync' }
    );

    watch(
        router.currentRoute,
        (value) => {
            if (value.name === 'game-log') {
                initGameLogTable();
            } else {
                gameLogTableData.value = [];
            }
        },
        { immediate: true }
    );

    watch(
        () => watchState.isFavoritesLoaded,
        (isFavoritesLoaded) => {
            if (isFavoritesLoaded && gameLogTable.value.vip) {
                gameLogTableLookup(); // re-apply VIP filter after friends are loaded
            }
        }
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

    /**
     *
     */
    async function init() {
        gameLogTable.value.filter = JSON.parse(
            await configRepository.getString('VRCX_gameLogTableFilters', '[]')
        );
        gameLogTable.value.vip = await configRepository.getBool(
            'VRCX_gameLogTableVIPFilter',
            false
        );
    }

    init();

    /**
     *
     * @param entry
     */
    function insertGameLogSorted(entry) {
        const arr = gameLogTableData.value;
        if (arr.length === 0) {
            gameLogTableData.value = [entry];
            return;
        }
        if (compareGameLogRows(entry, arr[0]) < 0) {
            gameLogTableData.value = [entry, ...arr];
            return;
        }
        if (compareGameLogRows(entry, arr[arr.length - 1]) > 0) {
            gameLogTableData.value = [...arr, entry];
            return;
        }
        for (let i = 1; i < arr.length; i++) {
            if (compareGameLogRows(entry, arr[i]) < 0) {
                gameLogTableData.value = [
                    ...arr.slice(0, i),
                    entry,
                    ...arr.slice(i)
                ];
                return;
            }
        }
        gameLogTableData.value = [...arr, entry];
    }

    /**
     *
     */
    function clearNowPlaying() {
        nowPlaying.value = {
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

    function resetLastMediaUrls() {
        lastVideoUrl.value = '';
        lastResourceloadUrl.value = '';
    }

    /**
     *
     * @param data
     */
    function setNowPlaying(data) {
        const ctx = structuredClone(data);
        if (nowPlaying.value.url !== ctx.videoUrl) {
            if (!ctx.userId && ctx.displayName) {
                ctx.userId =
                    findUserByDisplayName(
                        userStore.cachedUsers,
                        ctx.displayName
                    )?.id ?? '';
            }
            notificationStore.queueGameLogNoty(ctx);
            addGameLog(ctx);
            database.addGamelogVideoPlayToDatabase(ctx);

            let displayName = '';
            if (ctx.displayName) {
                displayName = ` (${ctx.displayName})`;
            }
            const name = `${ctx.videoName}${displayName}`;
            nowPlaying.value = {
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
            nowPlaying.value = {
                ...nowPlaying.value,
                length: ctx.videoLength,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: '',
                thumbnailUrl: ctx.thumbnailUrl
            };
            if (ctx.updatedAt && ctx.videoPos) {
                nowPlaying.value.startTime =
                    Date.parse(ctx.updatedAt) / 1000 - ctx.videoPos;
            } else {
                nowPlaying.value.startTime =
                    Date.parse(ctx.created_at) / 1000 - ctx.videoPos;
            }
        }
        vrStore.updateVrNowPlaying();
        if (!nowPlaying.value.playing && ctx.videoLength > 0) {
            nowPlaying.value.playing = true;
            updateNowPlaying();
        }
    }

    const {
        addGameLogVideo,
        addGameLogPyPyDance,
        addGameLogVRDancing,
        addGameLogZuwaZuwaDance,
        addGameLogLSMedia,
        addGameLogPopcornPalace
    } = createMediaParsers({
        nowPlaying,
        setNowPlaying,
        clearNowPlaying,
        userStore,
        advancedSettingsStore
    });

    /**
     *
     */
    function updateNowPlaying() {
        const np = nowPlaying.value;
        if (!nowPlaying.value.playing) {
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

    /**
     *
     */
    async function tryLoadPlayerList() {
        // TODO: make this work again
        if (!gameStore.isGameRunning) {
            return;
        }
        console.log('Loading player list from game log...');
        let ctx;
        let i;
        const data = await database.getGamelogDatabase();
        if (data.length === 0) {
            return;
        }
        let length = 0;
        for (i = data.length - 1; i > -1; i--) {
            ctx = data[i];
            if (ctx.type === 'Location') {
                locationStore.setLastLocation({
                    date: Date.parse(ctx.created_at),
                    location: ctx.location,
                    name: ctx.worldName,
                    playerList: new Map(),
                    friendList: new Map()
                });
                length = i;
                break;
            }
        }
        if (length > 0) {
            for (i = length + 1; i < data.length; i++) {
                ctx = data[i];
                if (ctx.type === 'OnPlayerJoined') {
                    if (!ctx.userId) {
                        ctx.userId =
                            findUserByDisplayName(
                                userStore.cachedUsers,
                                ctx.displayName
                            )?.id ?? '';
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

            runUpdateCurrentUserLocationFlow();
            instanceStore.updateCurrentInstanceWorld();
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            userStore.applyUserDialogLocation();
            instanceStore.applyWorldDialogInstances();
            instanceStore.applyGroupDialogInstances();
        }
    }

    /**
     *
     * @param row
     */
    function gameLogIsFriend(row) {
        if (typeof row.isFriend !== 'undefined') {
            return row.isFriend;
        }
        if (!row.userId) {
            return false;
        }
        return friendStore.friends.has(row.userId);
    }

    /**
     *
     * @param row
     */
    function gameLogIsFavorite(row) {
        if (typeof row.isFavorite !== 'undefined') {
            return row.isFavorite;
        }
        if (!row.userId) {
            return false;
        }
        return friendStore.localFavoriteFriends.has(row.userId);
    }

    /**
     *
     */
    async function gameLogTableLookup() {
        await configRepository.setString(
            'VRCX_gameLogTableFilters',
            JSON.stringify(gameLogTable.value.filter)
        );
        await configRepository.setBool(
            'VRCX_gameLogTableVIPFilter',
            gameLogTable.value.vip
        );
        gameLogTable.value.loading = true;
        try {
            let vipList = [];
            if (gameLogTable.value.vip) {
                vipList = Array.from(friendStore.localFavoriteFriends.values());
            }
            const search = gameLogTable.value.search.trim();
            let rows = [];
            if (search) {
                rows = await database.searchGameLogDatabase(
                    search,
                    gameLogTable.value.filter,
                    vipList,
                    vrcxStore.searchLimit
                );
            } else {
                rows = await database.lookupGameLogDatabase(
                    gameLogTable.value.filter,
                    vipList
                );
            }

            for (const row of rows) {
                row.isFriend = gameLogIsFriend(row);
                row.isFavorite = gameLogIsFavorite(row);
            }
            gameLogTableData.value = rows;
        } finally {
            gameLogTable.value.loading = false;
        }
    }

    /**
     *
     * @param entry
     */
    function addGameLog(entry) {
        entry.isFriend = gameLogIsFriend(entry);
        entry.isFavorite = gameLogIsFavorite(entry);

        // If the VIP friend filter is enabled, logs from other friends will be ignored.
        if (
            gameLogTable.value.vip &&
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
            gameLogTable.value.filter.length > 0 &&
            !gameLogTable.value.filter.includes(entry.type)
        ) {
            return;
        }
        if (!gameLogSearch(entry)) {
            return;
        }
        insertGameLogSorted(entry);
        sweepGameLog();
        uiStore.notifyMenu('game-log');
    }

    /**
     *
     * @param input
     */
    async function addGamelogLocationToDatabase(input) {
        const groupName = await getGroupName(input.location);
        const entry = {
            ...input,
            groupName
        };
        database.addGamelogLocationToDatabase(entry);
    }

    /**
     *
     * @param row
     */
    function gameLogSearch(row) {
        return gameLogSearchFilter(row, gameLogTable.value.search);
    }

    /**
     *
     */
    function sweepGameLog() {
        const j = gameLogTableData.value.length;
        if (j > vrcxStore.maxTableSize + 50) {
            gameLogTableData.value = gameLogTableData.value.slice(0, -50);
        }
    }

    /**
     *
     * @param gameLog
     * @param location
     */
    function addGameLogEntry(gameLog, location) {
        let entry = undefined;
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        let userId = String(gameLog.userId || '');
        if (!userId && gameLog.displayName) {
            userId =
                findUserByDisplayName(
                    userStore.cachedUsers,
                    gameLog.displayName
                )?.id ?? '';
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
                    runLastLocationResetFlow(gameLog.dt);
                    locationStore.setLastLocationLocation('traveling');
                    locationStore.setLastLocationDestination(gameLog.location);
                    locationStore.setLastLocationDestinationTime(
                        Date.parse(gameLog.dt)
                    );
                    state.lastLocationAvatarList.clear();
                    instanceStore.removeQueuedInstance(gameLog.location);
                    runUpdateCurrentUserLocationFlow();
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
                    runLastLocationResetFlow(gameLog.dt);
                    clearNowPlaying();
                    locationStore.setLastLocation({
                        date: Date.parse(gameLog.dt),
                        location: gameLog.location,
                        name: worldName,
                        playerList: new Map(),
                        friendList: new Map()
                    });
                    instanceStore.removeQueuedInstance(gameLog.location);
                    runUpdateCurrentUserLocationFlow();
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
                entry = createLocationEntry(
                    gameLog.dt,
                    gameLog.location,
                    L.worldId,
                    worldName
                );
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
                } else if (
                    friendStore.friends.has(userId) &&
                    typeof ref !== 'undefined'
                ) {
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
                    if (AppDebug.debugGameLog || AppDebug.debugWebRequests) {
                        console.log('Fetching user from gameLog:', userId);
                    }
                    userRequest.getUser({ userId });
                }
                vrStore.updateVRLastLocation();
                instanceStore.getCurrentInstanceUserList();
                entry = createJoinLeaveEntry(
                    'OnPlayerJoined',
                    gameLog.dt,
                    gameLog.displayName,
                    location,
                    userId
                );
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'player-left':
                const ref1 = locationStore.lastLocation.playerList.get(userId);
                if (typeof ref1 === 'undefined') {
                    break;
                }
                const time = dayjs(gameLog.dt) - ref1.joinTime;
                locationStore.lastLocation.playerList.delete(userId);
                locationStore.lastLocation.friendList.delete(userId);
                state.lastLocationAvatarList.delete(gameLog.displayName);
                photonStore.photonLobbyAvatars.delete(userId);
                vrStore.updateVRLastLocation();
                instanceStore.getCurrentInstanceUserList();
                entry = createJoinLeaveEntry(
                    'OnPlayerLeft',
                    gameLog.dt,
                    gameLog.displayName,
                    location,
                    userId,
                    time
                );
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'portal-spawn':
                if (vrcxStore.ipcEnabled && gameStore.isGameRunning) {
                    break;
                }
                entry = createPortalSpawnEntry(gameLog.dt, location);
                database.addGamelogPortalSpawnToDatabase(entry);
                break;
            case 'video-play':
                gameLog.videoUrl = decodeURI(gameLog.videoUrl);
                if (lastVideoUrl.value === gameLog.videoUrl) {
                    break;
                }
                lastVideoUrl.value = gameLog.videoUrl;
                addGameLogVideo(gameLog, location, userId);
                break;
            case 'video-sync':
                const timestamp = gameLog.timestamp.replace(/,/g, '');
                if (nowPlaying.value.playing) {
                    nowPlaying.value.offset = parseInt(timestamp, 10);
                }
                break;
            case 'resource-load-string':
            case 'resource-load-image':
                if (
                    !generalSettingsStore.logResourceLoad ||
                    lastResourceloadUrl.value === gameLog.resourceUrl
                ) {
                    break;
                }
                lastResourceloadUrl.value = gameLog.resourceUrl;
                entry = createResourceLoadEntry(
                    gameLog.type,
                    gameLog.dt,
                    gameLog.resourceUrl,
                    location
                );
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
                if (AppDebug.debugWebRequests) {
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
                    const inv = parseInventoryFromUrl(gameLog.url);
                    if (inv) {
                        galleryStore.queueCheckInstanceInventory(
                            inv.inventoryId,
                            inv.userId
                        );
                    }
                }
                if (advancedSettingsStore.saveInstancePrints) {
                    const printId = parsePrintFromUrl(gameLog.url);
                    if (printId) {
                        galleryStore.queueSavePrintToFile(printId);
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
                    const foundUser = findUserByDisplayName(
                        userStore.cachedUsers,
                        gameLog.displayName
                    );
                    if (foundUser) {
                        photonStore.photonLobby.set(photonId, foundUser);
                        photonStore.photonLobbyCurrent.set(photonId, foundUser);
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
                gameStore.setIsGameNoVR(false);
                configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
                vrStore.updateOpenVR();
                break;
            case 'desktop-mode':
                gameStore.setIsGameNoVR(true);
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
            sharedFeedStore.addEntry(entry);
            notificationStore.queueGameLogNoty(entry);
            addGameLog(entry);
        }
    }

    /**
     *
     */
    async function getGameLogTable() {
        await database.initTables();
        const dateTill = await database.getLastDateGameLogDatabase();
        updateGameLog(dateTill);
    }

    /**
     *
     * @param dateTill
     */
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
    /**
     *
     * @param json
     */
    function addGameLogEvent(json) {
        const rawLogs = JSON.parse(json);
        const gameLog = gameLogService.parseRawGameLog(
            rawLogs[1],
            rawLogs[2],
            rawLogs.slice(3)
        );
        if (
            AppDebug.debugGameLog &&
            gameLog.type !== 'photon-id' &&
            gameLog.type !== 'api-request' &&
            gameLog.type !== 'udon-exception'
        ) {
            console.log('gameLog:', gameLog);
        }
        addGameLogEntry(gameLog, locationStore.lastLocation.location);
    }

    /**
     *
     */
    async function disableGameLogDialog() {
        if (gameStore.isGameRunning) {
            toast.error(t('message.gamelog.vrchat_must_be_closed'));
            return;
        }
        if (!advancedSettingsStore.gameLogDisabled) {
            modalStore
                .confirm({
                    description: t('confirm.disable_gamelog'),
                    title: t('confirm.title')
                })
                .then(({ ok }) => {
                    if (!ok) return;
                    advancedSettingsStore.setGameLogDisabled();
                })
                .catch(() => {});
        } else {
            advancedSettingsStore.setGameLogDisabled();
        }
    }

    /**
     *
     */
    async function initGameLogTable() {
        gameLogTable.value.loading = true;
        const rows = await database.lookupGameLogDatabase(
            gameLogTable.value.filter,
            []
        );
        for (const row of rows) {
            row.isFriend = gameLogIsFriend(row);
            row.isFavorite = gameLogIsFavorite(row);
        }
        gameLogTableData.value = rows;
        gameLogTable.value.loading = false;
    }

    return {
        state,

        nowPlaying,
        gameLogTable,
        gameLogTableData,
        lastVideoUrl,
        lastResourceloadUrl,

        clearNowPlaying,
        resetLastMediaUrls,
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
