import { reactive, ref, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

import {
    compareGameLogRows,
    findUserByDisplayName,
    formatSeconds,
    gameLogSearchFilter,
    getGroupName
} from '../../shared/utils';
import { createMediaParsers } from './mediaParsers';
import { database } from '../../services/database';
import { tryLoadPlayerList } from '../../coordinators/gameLogCoordinator';
import { useAdvancedSettingsStore } from '../settings/advanced';
import { useFriendStore } from '../friend';
import { useNotificationStore } from '../notification';
import { useUiStore } from '../ui';
import { useUserStore } from '../user';
import { useVrStore } from '../vr';
import { useVrcxStore } from '../vrcx';
import { watchState } from '../../services/watchState';

import configRepository from '../../services/config';

import * as workerTimers from 'worker-timers';

export const useGameLogStore = defineStore('GameLog', () => {
    const notificationStore = useNotificationStore();
    const vrStore = useVrStore();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const vrcxStore = useVrcxStore();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const router = useRouter();

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

    // Latest entry ref for GameLog Widget to watch
    const latestGameLogEntry = ref(null);

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

    /**
     *
     */
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
                        ctx.displayName,
                        userStore.cachedUserIdsByDisplayName
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

        // Update ref for GameLog Widget (independent data stream)
        latestGameLogEntry.value = entry;

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

    /**
     * @param {string} value
     */
    function setLastVideoUrl(value) {
        lastVideoUrl.value = value;
    }

    /**
     * @param {string} value
     */
    function setLastResourceloadUrl(value) {
        lastResourceloadUrl.value = value;
    }

    return {
        state,

        nowPlaying,
        gameLogTable,
        gameLogTableData,
        lastVideoUrl,
        lastResourceloadUrl,
        latestGameLogEntry,

        clearNowPlaying,
        resetLastMediaUrls,
        gameLogIsFriend,
        gameLogIsFavorite,
        gameLogTableLookup,
        addGameLog,
        addGamelogLocationToDatabase,

        // Media parsers (used by coordinator)
        addGameLogVideo,
        addGameLogPyPyDance,
        addGameLogVRDancing,
        addGameLogZuwaZuwaDance,
        addGameLogLSMedia,
        addGameLogPopcornPalace,
        setLastVideoUrl,
        setLastResourceloadUrl
    };
});
