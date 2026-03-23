import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

import { i18n } from '../plugins/i18n';
import {
    compareByCreatedAtAscending,
    createRateLimiter,
    executeWithBackoff,
    getFriendsSortFunction,
    isRealInstance
} from '../shared/utils';
import { getUserMemo } from '../coordinators/memoCoordinator';
import { friendRequest, userRequest } from '../api';
import { runInitFriendsListFlow } from '../coordinators/friendSyncCoordinator';
import {
    runPendingOfflineTickFlow,
    runUpdateFriendFlow
} from '../coordinators/friendPresenceCoordinator';
import { syncFriendSearchIndex } from '../coordinators/searchIndexCoordinator';
import {
    updateFriendship,
    runUpdateFriendshipsFlow
} from '../coordinators/friendRelationshipCoordinator';
import { applyUser } from '../coordinators/userCoordinator';
import { AppDebug } from '../services/appConfig';
import { database } from '../services/database';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useFavoriteStore } from './favorite';
import { useGeneralSettingsStore } from './settings/general';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useUserStore } from './user';
import { watchState } from '../services/watchState';

import configRepository from '../services/config';

import * as workerTimers from 'worker-timers';

export const useFriendStore = defineStore('Friend', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const userStore = useUserStore();
    const groupStore = useGroupStore();
    const locationStore = useLocationStore();

    const router = useRouter();
    const t = i18n.global.t;

    const state = reactive({
        friendNumber: 0
    });

    const friendLog = new Map();

    const friends = reactive(new Map());

    const localFavoriteFriends = reactive(new Set());
    const sortedFriends = shallowRef([]);
    let sortedFriendsBatchDepth = 0;
    let pendingSortedFriendsRebuild = false;
    let allUserStatsRequestId = 0;
    let allUserMutualCountRequestId = 0;

    const derivedDebugCounters = reactive({
        allFavoriteFriendIds: 0,
        allFavoriteOnlineFriends: 0,
        vipFriends: 0,
        onlineFriends: 0,
        activeFriends: 0,
        offlineFriends: 0,
        friendsInSameInstance: 0
    });

    /**
     * Tracks recomputes for the hottest friend-derived lists.
     * Guarded by AppDebug.debugFriendState so normal behavior stays unchanged.
     * @param {keyof typeof derivedDebugCounters} name
     * @param {number} resultSize
     */
    function trackDerivedDebug(name, resultSize) {
        derivedDebugCounters[name] += 1;
        if (!AppDebug.debugFriendState) {
            return;
        }
        console.log('[friendStore derived]', {
            name,
            count: derivedDebugCounters[name],
            resultSize,
            friendCount: friends.size,
            sortMethods: appearanceSettingsStore.sidebarSortMethods
        });
    }

    /**
     *
     */
    function resetDerivedDebugCounters() {
        for (const key in derivedDebugCounters) {
            derivedDebugCounters[key] = 0;
        }
        if (AppDebug.debugFriendState) {
            console.log('[friendStore derived] counters reset');
        }
    }

    /**
     *
     * @returns {Record<string, number>}
     */
    function getDerivedDebugCounters() {
        const snapshot = { ...derivedDebugCounters };
        if (AppDebug.debugFriendState) {
            console.log('[friendStore derived] counters snapshot', snapshot);
        }
        return snapshot;
    }

    const allFavoriteFriendIds = computed(() => {
        const favoriteStore = useFavoriteStore();
        const set = new Set();
        for (const ref of favoriteStore.cachedFavorites.values()) {
            if (ref.type === 'friend') {
                set.add(ref.favoriteId);
            }
        }
        for (const groupName in favoriteStore.localFriendFavorites) {
            const userIds = favoriteStore.localFriendFavorites[groupName];
            if (userIds) {
                for (const id of userIds) {
                    set.add(id);
                }
            }
        }
        trackDerivedDebug('allFavoriteFriendIds', set.size);
        return set;
    });

    /**
     *
     * @returns {(a: object, b: object) => number}
     */
    function getSortedFriendsComparator() {
        return getFriendsSortFunction(appearanceSettingsStore.sidebarSortMethods);
    }

    /**
     *
     * @param {string} id
     * @returns {number}
     */
    function findSortedFriendIndex(id) {
        return sortedFriends.value.findIndex((friend) => friend.id === id);
    }

    /**
     *
     */
    function rebuildSortedFriends() {
        sortedFriends.value = Array.from(friends.values()).sort(
            getSortedFriendsComparator()
        );
        pendingSortedFriendsRebuild = false;
    }

    /**
     *
     */
    function beginSortedFriendsBatch() {
        sortedFriendsBatchDepth += 1;
    }

    /**
     *
     */
    function endSortedFriendsBatch() {
        if (sortedFriendsBatchDepth === 0) {
            return;
        }
        sortedFriendsBatchDepth -= 1;
        if (sortedFriendsBatchDepth === 0 && pendingSortedFriendsRebuild) {
            rebuildSortedFriends();
        }
    }

    /**
     *
     * @template T
     * @param {() => T} fn
     * @returns {T}
     */
    function runInSortedFriendsBatch(fn) {
        beginSortedFriendsBatch();
        try {
            return fn();
        } finally {
            endSortedFriendsBatch();
        }
    }

    /**
     *
     * @param {string} id
     */
    function removeSortedFriend(id) {
        if (sortedFriendsBatchDepth > 0) {
            pendingSortedFriendsRebuild = true;
            return;
        }
        const index = findSortedFriendIndex(id);
        if (index === -1) {
            return;
        }
        const next = sortedFriends.value.slice();
        next.splice(index, 1);
        sortedFriends.value = next;
    }

    /**
     *
     * @param {object | string} input
     */
    function reindexSortedFriend(input) {
        const ctx =
            typeof input === 'string' ? friends.get(input) : input;
        if (!ctx) {
            return;
        }
        if (sortedFriendsBatchDepth > 0) {
            pendingSortedFriendsRebuild = true;
            return;
        }
        const compare = getSortedFriendsComparator();
        const next = sortedFriends.value.slice();
        const existingIndex = next.findIndex((friend) => friend.id === ctx.id);
        if (existingIndex !== -1) {
            next.splice(existingIndex, 1);
        }
        let low = 0;
        let high = next.length;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (compare(next[mid], ctx) <= 0) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        next.splice(low, 0, ctx);
        sortedFriends.value = next;
    }

    const allFavoriteOnlineFriends = computed(() => {
        const favoriteIds = allFavoriteFriendIds.value;
        const result = sortedFriends.value.filter(
            (f) => f.state === 'online' && favoriteIds.has(f.id)
        );
        trackDerivedDebug('allFavoriteOnlineFriends', result.length);
        return result;
    });

    const isRefreshFriendsLoading = ref(false);
    const onlineFriendCount = ref(0);

    const pendingOfflineDelay = 170000;
    let pendingOfflineWorker = null;
    const pendingOfflineMap = new Map();

    const friendLogTable = ref({
        data: [],
        filters: [
            {
                prop: 'type',
                value: []
            },
            {
                prop: 'displayName',
                value: ''
            },
            {
                prop: 'type',
                value: false,
                filterFn: (row, filter) =>
                    !(filter.value && row.type === 'Unfriend')
            }
        ],
        pageSizeLinked: true,
        loading: false
    });

    watch(
        router.currentRoute,
        (value) => {
            if (value.name === 'friend-log') {
                initFriendLogHistoryTable();
            } else {
                friendLogTable.value.data = [];
            }
        },
        { immediate: true }
    );

    const vipFriends = computed(() => {
        const result = sortedFriends.value.filter(
            (f) => f.state === 'online' && f.isVIP
        );
        trackDerivedDebug('vipFriends', result.length);
        return result;
    });

    const onlineFriends = computed(() => {
        const result = sortedFriends.value.filter(
            (f) => f.state === 'online' && !f.isVIP
        );
        trackDerivedDebug('onlineFriends', result.length);
        return result;
    });

    const activeFriends = computed(() => {
        const result = sortedFriends.value.filter((f) => f.state === 'active');
        trackDerivedDebug('activeFriends', result.length);
        return result;
    });

    const offlineFriends = computed(() => {
        const result = sortedFriends.value.filter(
            (f) => f.state === 'offline' || !f.state
        );
        trackDerivedDebug('offlineFriends', result.length);
        return result;
    });

    const friendsInSameInstance = computed(() => {
        const friendsList = {};

        sortedFriends.value.forEach((friend) => {
            if (friend.state !== 'online') {
                return;
            }
            if (!friend.ref?.$location) {
                return;
            }

            let locationTag = friend.ref.$location.tag;
            if (
                !friend.ref.$location.isRealInstance &&
                locationStore.lastLocation.friendList.has(friend.id)
            ) {
                locationTag = locationStore.lastLocation.location;
            }
            const isReal = isRealInstance(locationTag);
            if (!isReal) {
                return;
            }

            if (!friendsList[locationTag]) {
                friendsList[locationTag] = [];
            }
            friendsList[locationTag].push(friend);
        });

        const sortedFriendsList = [];
        for (const group of Object.values(friendsList)) {
            if (group.length > 1) {
                // Group order already matches the globally sorted online list.
                sortedFriendsList.push(group);
            }
        }

        const result = sortedFriendsList.sort((a, b) => b.length - a.length);
        trackDerivedDebug('friendsInSameInstance', result.length);
        return result;
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            friends.clear();
            sortedFriends.value = [];
            pendingSortedFriendsRebuild = false;
            state.friendNumber = 0;
            friendLog.clear();
            friendLogTable.value.data = [];
            groupStore.clearGroupInstances();
            onlineFriendCount.value = 0;
            pendingOfflineMap.clear();
            if (isLoggedIn) {
                runInitFriendsListFlow(i18n.global.t);
                pendingOfflineWorkerFunction();
            } else {
                if (pendingOfflineWorker !== null) {
                    workerTimers.clearInterval(pendingOfflineWorker);
                    pendingOfflineWorker = null;
                }
            }
        },
        { flush: 'sync' }
    );

    watch(
        () => appearanceSettingsStore.sidebarSortMethods,
        () => {
            rebuildSortedFriends();
        },
        { deep: true }
    );

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                updateOnlineFriendCounter();
            }
        },
        { flush: 'sync' }
    );

    /**
     *
     */
    async function init() {
        const friendLogTableFiltersValue = JSON.parse(
            await configRepository.getString('VRCX_friendLogTableFilters', '[]')
        );
        friendLogTable.value.filters[0].value = friendLogTableFiltersValue;
    }

    init();

    /**
     *
     */
    function updateLocalFavoriteFriends() {
        const favoriteStore = useFavoriteStore();
        localFavoriteFriends.clear();
        const groups = generalSettingsStore.localFavoriteFriendsGroups;
        const hasRemoteGroupFilter = groups.some(
            (key) => !key.startsWith('local:')
        );
        // Remote favorites: filter by selected remote groups
        for (const ref of favoriteStore.cachedFavorites.values()) {
            if (
                ref.type === 'friend' &&
                (!hasRemoteGroupFilter || groups.includes(ref.$groupKey))
            ) {
                localFavoriteFriends.add(ref.favoriteId);
            }
        }
        // Local favorites: always include all
        for (const groupName in favoriteStore.localFriendFavorites) {
            const userIds = favoriteStore.localFriendFavorites[groupName];
            if (userIds) {
                for (let i = 0; i < userIds.length; ++i) {
                    localFavoriteFriends.add(userIds[i]);
                }
            }
        }
        updateSidebarFavorites();
    }

    /**
     *
     */
    function updateSidebarFavorites() {
        runInSortedFriendsBatch(() => {
            for (const ctx of friends.values()) {
                const isVIP = localFavoriteFriends.has(ctx.id);
                if (ctx.isVIP === isVIP) {
                    continue;
                }
                ctx.isVIP = isVIP;
                reindexSortedFriend(ctx);
            }
        });
    }

    /**
     *
     */
    async function pendingOfflineWorkerFunction() {
        pendingOfflineWorker = workerTimers.setInterval(() => {
            runPendingOfflineTickFlow();
        }, 1000);
    }

    /**
     * @param {string} id
     */
    function deleteFriend(id) {
        const ctx = friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        friends.delete(id);
        removeSortedFriend(id);
    }

    /**
     *
     * @param ref
     */
    function refreshFriendsStatus(ref) {
        return runInSortedFriendsBatch(() => {
            let id;
            const map = new Map();
            for (id of ref.friends) {
                map.set(id, 'offline');
            }
            for (id of ref.offlineFriends) {
                map.set(id, 'offline');
            }
            for (id of ref.activeFriends) {
                map.set(id, 'active');
            }
            for (id of ref.onlineFriends) {
                map.set(id, 'online');
            }
            const added = [];
            const removed = [];
            for (const friend of map) {
                const [id, state_input] = friend;
                if (friends.has(id)) {
                    runUpdateFriendFlow(id, state_input);
                } else {
                    addFriend(id, state_input);
                    added.push(id);
                }
            }
            for (id of friends.keys()) {
                if (map.has(id) === false) {
                    deleteFriend(id);
                    removed.push(id);
                }
            }
            return { added, removed };
        });
    }

    /**
     * @param {string} id
     * @param {string?} state_input
     */
    function addFriend(id, state_input = undefined) {
        if (friends.has(id)) {
            return;
        }
        const ref = userStore.cachedUsers.get(id);
        const isVIP = localFavoriteFriends.has(id);
        let name = '';
        const friend = friendLog.get(id);
        if (friend) {
            name = friend.displayName;
        }
        const ctx = reactive({
            id,
            state: state_input || 'offline',
            isVIP,
            ref,
            name,
            memo: '',
            pendingOffline: false,
            $nickName: ''
        });
        if (watchState.isFriendsLoaded) {
            getUserMemo(id).then((memo) => {
                if (memo.userId === id) {
                    ctx.memo = memo.memo;
                    ctx.$nickName = '';
                    if (memo.memo) {
                        const array = memo.memo.split('\n');
                        ctx.$nickName = array[0];
                    }
                    syncFriendSearchIndex(ctx);
                }
            });
        }
        if (typeof ref === 'undefined') {
            const friendLogRef = friendLog.get(id);
            if (friendLogRef?.displayName) {
                ctx.name = friendLogRef.displayName;
            }
        } else {
            ctx.name = ref.name;
        }
        friends.set(id, ctx);
        watchState.isLoggedIn = true
        // Startup fill flow:
        //
        // login
        // -> runInitFriendsListFlow()
        // -> initFriendLog() / getFriendLog()
        // -> refreshFriendsStatus(currentUser)
        // -> addFriend(...)
        // -> friends.set(id, ctx)
        // -> reindexSortedFriend(ctx)
        //
        // During batch init, reindexSortedFriend() only marks the list dirty.
        // When the batch ends:
        // -> rebuildSortedFriends()
        // -> sortedFriends = sorted(Array.from(friends.values()))
        //
        // After full friend payloads arrive:
        // -> applyUser(friend)
        // -> update ctx.ref / ctx.name
        // -> reindexSortedFriend(ctx)
        // -> batch end
        // -> rebuildSortedFriends()
        reindexSortedFriend(ctx);
    }

    /**
     *
     * @returns {Promise<*[]>}
     */
    async function refreshFriends() {
        isRefreshFriendsLoading.value = true;
        try {
            const onlineFriends = await bulkRefreshFriends({
                offline: false
            });
            const offlineFriends = await bulkRefreshFriends({
                offline: true
            });
            var friends = onlineFriends.concat(offlineFriends);
            friends = await refetchBrokenFriends(friends);
            if (!watchState.isFriendsLoaded) {
                friends = await refreshRemainingFriends(friends);
            }

            isRefreshFriendsLoading.value = false;
            return friends;
        } catch (err) {
            isRefreshFriendsLoading.value = false;
            throw err;
        }
    }

    /**
     * @param {object} args
     * @returns {Promise<*[]>}
     */
    async function bulkRefreshFriends(args) {
        // API offset limit *was* 5000
        // it is now 7500
        const MAX_OFFSET = 7500;
        const PAGE_SIZE = 50;
        const CONCURRENCY = 5;
        const RATE_PER_MINUTE = 60;
        const MAX_RETRY = 5;
        const RETRY_BASE_DELAY = 1000;

        const rateLimiter = createRateLimiter({
            limitPerInterval: RATE_PER_MINUTE,
            intervalMs: 60_000
        });

        /**
         *
         * @param offset
         */
        async function fetchPage(offset) {
            const result = await executeWithBackoff(
                async () => {
                    const { json } = await friendRequest.getFriends({
                        ...args,
                        n: PAGE_SIZE,
                        offset
                    });
                    return Array.isArray(json) ? json : [];
                },
                {
                    maxRetries: MAX_RETRY,
                    baseDelay: RETRY_BASE_DELAY,
                    shouldRetry: (err) =>
                        err?.status === 429 ||
                        (err?.message || '').includes('429')
                }
            );
            return result;
        }

        let nextOffset = 0;
        let stopFlag = false;
        const friends = [];

        /**
         *
         */
        function getNextOffset() {
            if (stopFlag) return null;
            const cur = nextOffset;
            nextOffset += PAGE_SIZE;
            if (cur > MAX_OFFSET) return null;
            return cur;
        }

        /**
         *
         */
        async function worker() {
            while (true) {
                const offset = getNextOffset();
                if (offset === null) break;

                await rateLimiter.wait();

                const page = await fetchPage(offset);
                if (page.length === 0) {
                    stopFlag = true;
                    break;
                }
                friends.push(...page);
            }
        }

        await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

        return friends;
    }

    /**
     * @param {Array} friendsArray
     * @returns {Promise<*>}
     */
    async function refetchBrokenFriends(friendsArray) {
        // attempt to fix broken data from bulk friend fetch
        for (let i = 0; i < friendsArray.length; i++) {
            const friend = friendsArray[i];
            try {
                // we don't update friend state here, it's not reliable
                let state_input = 'offline';
                if (friend.platform === 'web') {
                    state_input = 'active';
                } else if (friend.platform) {
                    state_input = 'online';
                }
                const ref = friends.get(friend.id);
                if (ref?.state !== state_input) {
                    if (AppDebug.debugFriendState) {
                        console.log(
                            `Refetching friend state it does not match ${friend.displayName} from ${ref?.state} to ${state_input}`,
                            friend
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friendsArray[i] = args.json;
                } else if (friend.location === 'traveling') {
                    if (AppDebug.debugFriendState) {
                        console.log(
                            'Refetching traveling friend',
                            friend.displayName
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friendsArray[i] = args.json;
                }
            } catch (err) {
                console.error(err);
            }
        }
        return friendsArray;
    }

    /**
     * @param {Array} friends
     * @returns {Promise<*>}
     */
    async function refreshRemainingFriends(friends) {
        const friendsSet = new Set(friends.map((x) => x.id));
        for (const userId of userStore.currentUser.friends) {
            if (!friendsSet.has(userId)) {
                try {
                    if (!watchState.isLoggedIn) {
                        console.error(`User isn't logged in`);
                        return friends;
                    }
                    console.log('Fetching remaining friend', userId);
                    const args = await userRequest.getUser({ userId });
                    friends.push(args.json);
                } catch (err) {
                    console.error(err);
                }
            }
        }
        return friends;
    }

    /**
     * @returns {Promise<void>}
     */
    /**
     *
     * @param forceUpdate
     */
    function updateOnlineFriendCounter(forceUpdate = false) {
        const onlineFriendCounts =
            vipFriends.value.length + onlineFriends.value.length;
        if (onlineFriendCounts !== onlineFriendCount.value || forceUpdate) {
            AppApi.ExecuteVrOverlayFunction(
                'updateOnlineFriendCount',
                `${onlineFriendCounts}`
            );
            onlineFriendCount.value = onlineFriendCounts;
        }
    }

    /**
     *
     */
    async function getAllUserStats() {
        let ref;
        let item;
        const userIds = [];
        const displayNames = [];
        for (const ctx of friends.values()) {
            userIds.push(ctx.id);
            if (ctx.ref?.displayName) {
                displayNames.push(ctx.ref.displayName);
            }
        }
        if (!userIds.length) {
            return;
        }

        const requestId = ++allUserStatsRequestId;

        const data = await database.getAllUserStats(userIds, displayNames);
        if (requestId !== allUserStatsRequestId) {
            return;
        }

        const dataByDisplayName = new Map();
        const friendsByDisplayName = new Map();

        for (const ref of data) {
            if (ref.displayName && ref.userId) {
                dataByDisplayName.set(ref.displayName, ref.userId);
            }
        }

        for (const ref of friends.values()) {
            if (ref?.ref?.id && ref.ref.displayName) {
                friendsByDisplayName.set(ref.ref.displayName, ref.id);
            }
        }

        const friendListMap = new Map();
        for (item of data) {
            if (!item.userId) {
                // find userId from previous data with matching displayName
                item.userId = dataByDisplayName.get(item.displayName);

                // if still no userId, find userId from friends list
                if (!item.userId) {
                    item.userId = friendsByDisplayName.get(item.displayName);
                }

                // if still no userId, skip
                if (!item.userId) {
                    continue;
                }
            }

            const friend = friendListMap.get(item.userId);
            if (!friend) {
                friendListMap.set(item.userId, item);
                continue;
            }
            if (Date.parse(item.lastSeen) > Date.parse(friend.lastSeen)) {
                friend.lastSeen = item.lastSeen;
            }
            friend.timeSpent += item.timeSpent;
            friend.joinCount += item.joinCount;
            friend.displayName = item.displayName;
            friendListMap.set(item.userId, friend);
        }
        runInSortedFriendsBatch(() => {
            for (item of friendListMap.values()) {
                ref = friends.get(item.userId);
                if (ref?.ref) {
                    ref.ref.$joinCount = item.joinCount;
                    ref.ref.$lastSeen = item.lastSeen;
                    ref.ref.$timeSpent = item.timeSpent;
                    reindexSortedFriend(ref);
                }
            }
        });
    }

    /**
     *
     */
    async function getAllUserMutualCount() {
        if (!friends.size) {
            return;
        }
        const requestId = ++allUserMutualCountRequestId;
        const mutualCountMap = await database.getMutualCountForAllUsers();
        if (requestId !== allUserMutualCountRequestId) {
            return;
        }
        runInSortedFriendsBatch(() => {
            for (const [userId, mutualCount] of mutualCountMap.entries()) {
                const ref = friends.get(userId);
                if (ref?.ref) {
                    ref.ref.$mutualCount = mutualCount;
                    reindexSortedFriend(ref);
                }
            }
        });
    }

    /**
     *
     * @param {string} id
     */

    /**
     *
     * @param {object} ref
     */

    /**
     *
     * @param {object} currentUser
     * @returns {Promise<void>}
     */
    async function initFriendLog(currentUser) {
        refreshFriendsStatus(currentUser);
        const sqlValues = [];
        const friends = await refreshFriends();
        runInSortedFriendsBatch(() => {
            for (const friend of friends) {
                const ref = applyUser(friend);
                const row = {
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: 0
                };
                friendLog.set(friend.id, row);
                sqlValues.unshift(row);
            }
        });
        database.setFriendLogCurrentArray(sqlValues);
        await configRepository.setBool(`friendLogInit_${currentUser.id}`, true);
        watchState.isFriendsLoaded = true;
    }

    /**
     *
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async function migrateFriendLog(userId) {
        VRCXStorage.Remove(`${userId}_friendLogUpdatedAt`);
        VRCXStorage.Remove(`${userId}_friendLog`);
        friendLogTable.value.data = await VRCXStorage.GetArray(
            `${userId}_friendLogTable`
        );
        database.addFriendLogHistoryArray(friendLogTable.value.data);
        VRCXStorage.Remove(`${userId}_friendLogTable`);
        await configRepository.setBool(`friendLogInit_${userId}`, true);
    }

    /**
     *
     * @param {object} currentUser
     * @returns {Promise<void>}
     */
    async function getFriendLog(currentUser) {
        let friend;
        state.friendNumber = await configRepository.getInt(
            `VRCX_friendNumber_${currentUser.id}`,
            0
        );
        const maxFriendLogNumber = await database.getMaxFriendLogNumber();
        if (state.friendNumber < maxFriendLogNumber) {
            state.friendNumber = maxFriendLogNumber;
        }

        const friendLogCurrentArray = await database.getFriendLogCurrent();
        for (friend of friendLogCurrentArray) {
            friendLog.set(friend.userId, friend);
        }
        refreshFriendsStatus(currentUser);

        await refreshFriends();
        watchState.isFriendsLoaded = true;

        // check for friend/name/rank change AFTER isFriendsLoaded is set
        for (friend of friendLogCurrentArray) {
            const ref = userStore.cachedUsers.get(friend.userId);
            if (typeof ref !== 'undefined') {
                updateFriendship(ref);
            }
        }
        if (typeof currentUser.friends !== 'undefined') {
            runUpdateFriendshipsFlow(currentUser);
        }
    }

    /**
     *
     */
    async function initFriendLogHistoryTable() {
        friendLogTable.value.loading = true;
        friendLogTable.value.data = await database.getFriendLogHistory();
        friendLogTable.value.loading = false;
    }

    /**
     * @returns void
     * @param {number} friendNumber
     * @param {string} userId
     */
    function setFriendNumber(friendNumber, userId) {
        const ref = friendLog.get(userId);
        if (!ref) {
            return;
        }
        ref.friendNumber = friendNumber;
        friendLog.set(ref.userId, ref);
        database.setFriendLogCurrent(ref);
        const friendRef = friends.get(userId);
        if (friendRef?.ref) {
            friendRef.ref.$friendNumber = friendNumber;
            reindexSortedFriend(friendRef);
        }
    }

    /**
     *
     */
    async function tryApplyFriendOrder() {
        const lastUpdate = await configRepository.getString(
            `VRCX_lastStoreTime_${userStore.currentUser.id}`
        );
        if (lastUpdate === '-5') {
            // this means we're done
            return;
        }

        // reset friendNumber and friendLog
        state.friendNumber = 0;
        for (const ref of friendLog.values()) {
            ref.friendNumber = 0;
        }

        const friendOrder = userStore.currentUser.friends;
        runInSortedFriendsBatch(() => {
            for (let i = 0; i < friendOrder.length; i++) {
                const userId = friendOrder[i];
                state.friendNumber++;
                setFriendNumber(state.friendNumber, userId);
            }
        });
        if (state.friendNumber === 0) {
            state.friendNumber = friends.size;
        }
        console.log('Applied friend order from API', state.friendNumber);
        await configRepository.setInt(
            `VRCX_friendNumber_${userStore.currentUser.id}`,
            state.friendNumber
        );
        await configRepository.setString(
            `VRCX_lastStoreTime_${userStore.currentUser.id}`,
            '-5'
        );
    }

    /**
     * @deprecated We might need this again one day
     */
    async function tryRestoreFriendNumber() {
        const lastUpdate = await configRepository.getString(
            `VRCX_lastStoreTime_${userStore.currentUser.id}`
        );
        if (lastUpdate === '-4') {
            // this means the backup was already applied
            return;
        }
        var status = false;
        state.friendNumber = 0;
        for (const ref of friendLog.values()) {
            ref.friendNumber = 0;
        }
        try {
            if (lastUpdate) {
                // backup ready to try apply
                status = await restoreFriendNumber();
            }
            // needs to be in reverse because we don't know the starting number
            applyFriendLogFriendOrderInReverse();
        } catch (err) {
            console.error(err);
        }
        // if (status) {
        //     this.$message({
        //         message: 'Friend order restored from backup',
        //         type: 'success',
        //         duration: 0,
        //         showClose: true
        //     });
        // } else if (this.friendLogTable.data.length > 0) {
        //     this.$message({
        //         message:
        //             'No backup found, friend order partially restored from friendLog',
        //         type: 'success',
        //         duration: 0,
        //         showClose: true
        //     });
        // }
        await configRepository.setString(
            `VRCX_lastStoreTime_${userStore.currentUser.id}`,
            '-4'
        );
    }

    /**
     *
     */
    async function restoreFriendNumber() {
        let message;
        let storedData = null;
        try {
            const data = await configRepository.getString(
                `VRCX_friendOrder_${userStore.currentUser.id}`
            );
            if (data) {
                storedData = JSON.parse(data);
            }
        } catch (err) {
            console.error(err);
        }
        if (!storedData || storedData.length === 0) {
            message = 'whomp whomp, no friend order backup found';
            console.error(message);
            return false;
        }

        const friendLogTable = getFriendLogFriendOrder();

        // for storedData
        const machList = [];
        for (let i = 0; i < Object.keys(storedData).length; i++) {
            const key = Object.keys(storedData)[i];
            const value = storedData[key];
            const item = parseFriendOrderBackup(friendLogTable, key, value);
            machList.push(item);
        }
        machList.sort((a, b) => b.matches - a.matches);
        console.log(
            `friendLog: ${friendLogTable.length} friendOrderBackups:`,
            machList
        );

        const bestBackup = machList[0];
        if (!bestBackup?.isValid) {
            message = 'whomp whomp, no valid backup found';
            console.error(message);
            return false;
        }

        applyFriendOrderBackup(bestBackup.table);
        applyFriendLogFriendOrder();
        await configRepository.setInt(
            `VRCX_friendNumber_${userStore.currentUser.id}`,
            state.friendNumber
        );
        return true;
    }

    /**
     *
     */
    function applyFriendLogFriendOrderInReverse() {
        state.friendNumber = friends.size + 1;
        const friendLogTable = getFriendLogFriendOrder();
        for (let i = friendLogTable.length - 1; i > -1; i--) {
            const friendLogEntry = friendLogTable[i];
            const ref = friendLog.get(friendLogEntry.id);
            if (!ref) {
                continue;
            }
            if (ref.friendNumber) {
                break;
            }
            ref.friendNumber = --state.friendNumber;
            friendLog.set(ref.userId, ref);
            database.setFriendLogCurrent(ref);
            const friendRef = friends.get(friendLogEntry.id);
            if (friendRef?.ref) {
                friendRef.ref.$friendNumber = ref.friendNumber;
            }
        }
        state.friendNumber = friends.size;
        console.log('Applied friend order from friendLog');
    }

    /**
     *
     */
    function getFriendLogFriendOrder() {
        const result = [];
        for (let i = 0; i < friendLogTable.value.data.length; i++) {
            const ref = friendLogTable.value.data[i];
            if (ref.type !== 'Friend') {
                continue;
            }
            if (result.findIndex((x) => x.id === ref.userId) !== -1) {
                // console.log(
                //     'ignoring duplicate friend',
                //     ref.displayName,
                //     ref.created_at
                // );
                continue;
            }
            result.push({
                id: ref.userId,
                displayName: ref.displayName,
                created_at: ref.created_at
            });
        }
        result.sort(compareByCreatedAtAscending);
        return result;
    }

    /**
     *
     * @param friendLogTable
     * @param created_at
     * @param backupUserIds
     */
    function parseFriendOrderBackup(friendLogTable, created_at, backupUserIds) {
        let i;
        const backupTable = [];
        for (i = 0; i < backupUserIds.length; i++) {
            const userId = backupUserIds[i];
            const ctx = friends.get(userId);
            if (ctx) {
                backupTable.push({
                    id: ctx.id,
                    displayName: ctx.name
                });
            }
        }

        // var compareTable = [];
        // compare 2 tables, find max amount of id's in same order
        let maxMatches = 0;
        let currentMatches = 0;
        let backupIndex = 0;
        for (i = 0; i < friendLogTable.length; i++) {
            var isMatch = false;
            const ref = friendLogTable[i];
            if (backupIndex <= 0) {
                backupIndex = backupTable.findIndex((x) => x.id === ref.id);
                if (backupIndex !== -1) {
                    currentMatches = 1;
                }
            } else if (backupTable[backupIndex].id === ref.id) {
                currentMatches++;
                isMatch = true;
            } else {
                backupIndex = backupTable.findIndex((x) => x.id === ref.id);
                if (backupIndex !== -1) {
                    currentMatches = 1;
                }
            }
            if (backupIndex === backupTable.length - 1) {
                backupIndex = 0;
            } else {
                backupIndex++;
            }
            if (currentMatches > maxMatches) {
                maxMatches = currentMatches;
            }
            // compareTable.push({
            //     id: ref.id,
            //     displayName: ref.displayName,
            //     match: isMatch
            // });
        }

        const lerp = (a, b, alpha) => {
            return a + alpha * (b - a);
        };
        return {
            matches: parseFloat(`${maxMatches}.${created_at}`),
            table: backupUserIds,
            isValid: maxMatches > lerp(4, 10, backupTable.length / 1000) // pls no collisions
        };
    }

    /**
     *
     * @param userIdOrder
     */
    function applyFriendOrderBackup(userIdOrder) {
        for (let i = 0; i < userIdOrder.length; i++) {
            const userId = userIdOrder[i];
            const ctx = friends.get(userId);
            const ref = ctx?.ref;
            if (!ref || ref.$friendNumber) {
                continue;
            }
            const friendLogCurrent = {
                userId,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: i + 1
            };
            friendLog.set(userId, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            state.friendNumber = i + 1;
        }
    }

    /**
     *
     */
    function applyFriendLogFriendOrder() {
        const friendLogTable = getFriendLogFriendOrder();
        if (state.friendNumber === 0) {
            console.log('No backup applied, applying friend log in reverse');
            // this means no FriendOrderBackup was applied
            // will need to apply in reverse order instead
            return;
        }
        for (const friendLogEntry of friendLogTable) {
            const ref = friendLog.get(friendLogEntry.id);
            if (!ref || ref.friendNumber) {
                continue;
            }
            ref.friendNumber = ++state.friendNumber;
            friendLog.set(ref.userId, ref);
            database.setFriendLogCurrent(ref);
            const friendRef = friends.get(friendLogEntry.id);
            if (friendRef?.ref) {
                friendRef.ref.$friendNumber = ref.friendNumber;
            }
        }
    }

    /**
     *
     * @param id
     */

    /**
     * Clears all entries in friendLog.
     * Uses .clear() instead of reassignment to keep the same Map reference,
     * so that coordinators reading friendStore.friendLog stay in sync.
     */
    function resetFriendLog() {
        friendLog.clear();
    }

    /**
     * @param {boolean} value
     */
    function setIsRefreshFriendsLoading(value) {
        isRefreshFriendsLoading.value = value;
    }

    return {
        state,

        friends,

        vipFriends,
        onlineFriends,
        activeFriends,
        offlineFriends,
        friendsInSameInstance,

        allFavoriteFriendIds,
        allFavoriteOnlineFriends,
        localFavoriteFriends,
        isRefreshFriendsLoading,
        onlineFriendCount,
        friendLog,
        friendLogTable,
        pendingOfflineMap,
        pendingOfflineDelay,

        updateLocalFavoriteFriends,
        updateSidebarFavorites,
        deleteFriend,
        refreshFriendsStatus,
        addFriend,
        refreshFriends,
        updateOnlineFriendCounter,
        getAllUserStats,
        getAllUserMutualCount,
        initFriendLog,
        migrateFriendLog,
        getFriendLog,
        tryApplyFriendOrder,
        resetFriendLog,
        reindexSortedFriend,
        resetDerivedDebugCounters,
        getDerivedDebugCounters,
        initFriendLogHistoryTable,
        setIsRefreshFriendsLoading
    };
});
