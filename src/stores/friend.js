import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import {
    compareByCreatedAtAscending,
    createRateLimiter,
    executeWithBackoff,
    getFriendsSortFunction,
    getGroupName,
    getNameColour,
    getUserMemo,
    getWorldName,
    isRealInstance,
    migrateMemos
} from '../shared/utils';
import { friendRequest, userRequest } from '../api';
import { AppDebug } from '../service/appConfig';
import { database } from '../service/database';
import { reconnectWebSocket } from '../service/websocket';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAuthStore } from './auth';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useGeneralSettingsStore } from './settings/general';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';

import * as workerTimers from 'worker-timers';

export const useFriendStore = defineStore('Friend', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    const feedStore = useFeedStore();
    const uiStore = useUiStore();
    const groupStore = useGroupStore();
    const sharedFeedStore = useSharedFeedStore();
    const updateLoopStore = useUpdateLoopStore();
    const authStore = useAuthStore();
    const locationStore = useLocationStore();
    const favoriteStore = useFavoriteStore();
    const { t } = useI18n();

    const state = reactive({
        friendNumber: 0
    });

    let friendLog = new Map();

    const friends = reactive(new Map());

    const localFavoriteFriends = reactive(new Set());

    const isRefreshFriendsLoading = ref(false);
    const onlineFriendCount = ref(0);

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
        tableProps: {
            stripe: true,
            size: 'small',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 20,
        pageSizeLinked: true,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });

    const vipFriends = computed(() => {
        return Array.from(friends.values())
            .filter((f) => f.state === 'online' && f.isVIP)
            .sort(
                getFriendsSortFunction(
                    appearanceSettingsStore.sidebarSortMethods
                )
            );
    });

    const onlineFriends = computed(() => {
        return Array.from(friends.values())
            .filter((f) => f.state === 'online' && !f.isVIP)
            .sort(
                getFriendsSortFunction(
                    appearanceSettingsStore.sidebarSortMethods
                )
            );
    });

    const activeFriends = computed(() => {
        return Array.from(friends.values())
            .filter((f) => f.state === 'active')
            .sort(
                getFriendsSortFunction(
                    appearanceSettingsStore.sidebarSortMethods
                )
            );
    });

    const offlineFriends = computed(() => {
        return Array.from(friends.values())
            .filter((f) => f.state === 'offline' || !f.state)
            .sort(
                getFriendsSortFunction(
                    appearanceSettingsStore.sidebarSortMethods
                )
            );
    });

    const friendsInSameInstance = computed(() => {
        const friendsList = {};

        const allFriends = [...vipFriends.value, ...onlineFriends.value];
        allFriends.forEach((friend) => {
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
                sortedFriendsList.push(
                    group.sort(
                        getFriendsSortFunction(
                            appearanceSettingsStore.sidebarSortMethods
                        )
                    )
                );
            }
        }

        return sortedFriendsList.sort((a, b) => b.length - a.length);
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            friends.clear();
            state.friendNumber = 0;
            friendLog.clear();
            friendLogTable.value.data = [];
            groupStore.groupInstances = [];
            onlineFriendCount.value = 0;
            if (isLoggedIn) {
                initFriendsList();
            }
        },
        { flush: 'sync' }
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

    async function init() {
        const friendLogTableFiltersValue = JSON.parse(
            await configRepository.getString('VRCX_friendLogTableFilters', '[]')
        );
        friendLogTable.value.filters[0].value = friendLogTableFiltersValue;
    }

    init();

    function updateUserCurrentStatus(ref) {
        if (watchState.isFriendsLoaded) {
            refreshFriendsStatus(ref);
        }
        updateOnlineFriendCounter();

        if (appearanceSettingsStore.randomUserColours) {
            getNameColour(userStore.currentUser.id).then((colour) => {
                userStore.currentUser.$userColour = colour;
            });
        }
    }

    function handleFriendStatus(args) {
        const D = userStore.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        const { json } = args;
        D.isFriend = json.isFriend;
        D.incomingRequest = json.incomingRequest;
        D.outgoingRequest = json.outgoingRequest;
    }

    function handleFriendDelete(args) {
        const D = userStore.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.isFriend = false;
        deleteFriendship(args.params.userId);
        deleteFriend(args.params.userId);
    }

    function handleFriendAdd(args) {
        addFriendship(args.params.userId);
        addFriend(args.params.userId);
    }

    function userOnFriend(ref) {
        updateFriendship(ref);
        if (
            watchState.isFriendsLoaded &&
            ref.isFriend &&
            !friendLog.has(ref.id) &&
            ref.id !== userStore.currentUser.id
        ) {
            addFriendship(ref.id);
        }
    }

    /**
     *
     * @param {string} userId
     * @returns {*|string}
     */
    function getFriendRequest(userId) {
        const array = notificationStore.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' &&
                array[i].senderUserId === userId
            ) {
                return array[i].id;
            }
        }
        return '';
    }

    function updateLocalFavoriteFriends() {
        const favoriteStore = useFavoriteStore();
        localFavoriteFriends.clear();
        for (const ref of favoriteStore.cachedFavorites.values()) {
            if (
                ref.type === 'friend' &&
                (generalSettingsStore.localFavoriteFriendsGroups.includes(
                    ref.$groupKey
                ) ||
                    generalSettingsStore.localFavoriteFriendsGroups.length ===
                        0)
            ) {
                localFavoriteFriends.add(ref.favoriteId);
            }
        }
        updateSidebarFavorites();
    }

    function updateSidebarFavorites() {
        for (const ctx of friends.values()) {
            const isVIP = localFavoriteFriends.has(ctx.id);
            if (ctx.isVIP === isVIP) {
                continue;
            }
            ctx.isVIP = isVIP;
        }
    }

    const pendingOfflineDelay = 170000;

    /**
     * @param {string} id
     * @param {string?} stateInput
     */
    function updateFriend(id, stateInput = undefined) {
        const ctx = friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        const ref = userStore.cachedUsers.get(id);
        if (stateInput) {
            ctx.pendingState = stateInput;
            if (typeof ref !== 'undefined') {
                ctx.ref.state = stateInput;
            }
        }
        if (stateInput === 'online') {
            if (AppDebug.debugFriendState && ctx.pendingOffline) {
                const time = (Date.now() - ctx.pendingOfflineTime) / 1000;
                console.log(`${ctx.name} pendingOfflineCancelTime ${time}`);
            }
            ctx.pendingOffline = false;
            ctx.pendingOfflineTime = '';
        }
        const isVIP = localFavoriteFriends.has(id);
        let location = '';
        let $location_at = undefined;
        if (typeof ref !== 'undefined') {
            location = ref.location;
            $location_at = ref.$location_at;

            const currentState = stateInput || ctx.state;
            // wtf, fetch user if offline in an instance
            if (
                currentState !== 'online' &&
                isRealInstance(ref.location) &&
                ref.$lastFetch < Date.now() - 10000 // 10 seconds
            ) {
                console.log(
                    `Fetching offline friend in an instance ${ctx.name}`
                );
                userRequest.getUser({
                    userId: id
                });
            }
            // wtf, fetch user if online in an offline location
            if (
                currentState === 'online' &&
                ref.location === 'offline' &&
                ref.$lastFetch < Date.now() - 10000 // 10 seconds
            ) {
                console.log(
                    `Fetching online friend in an offline location ${ctx.name}`
                );
                userRequest.getUser({
                    userId: id
                });
            }
        }
        if (typeof stateInput === 'undefined' || ctx.state === stateInput) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (watchState.isFriendsLoaded) {
                        userRequest.getUser({
                            userId: id
                        });
                    }
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
            }
        } else if (
            ctx.state === 'online' &&
            (stateInput === 'active' || stateInput === 'offline')
        ) {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
            }
            if (!watchState.isFriendsLoaded) {
                updateFriendDelayedCheck(ctx, location, $location_at);
                return;
            }
            // prevent status flapping
            if (ctx.pendingOffline) {
                if (AppDebug.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineAlreadyWaiting');
                }
                return;
            }
            if (AppDebug.debugFriendState) {
                console.log(ctx.name, 'pendingOfflineBegin');
            }
            ctx.pendingOffline = true;
            ctx.pendingOfflineTime = Date.now();
            // wait 2minutes then check if user came back online
            workerTimers.setTimeout(
                () => {
                    if (!ctx.pendingOffline) {
                        if (AppDebug.debugFriendState) {
                            console.log(
                                ctx.name,
                                'pendingOfflineAlreadyCancelled'
                            );
                        }
                        return;
                    }
                    ctx.pendingOffline = false;
                    ctx.pendingOfflineTime = '';
                    if (ctx.pendingState === ctx.state) {
                        if (AppDebug.debugFriendState) {
                            console.log(
                                ctx.name,
                                'pendingOfflineCancelledStateMatched'
                            );
                        }
                        return;
                    }
                    if (AppDebug.debugFriendState) {
                        console.log(ctx.name, 'pendingOfflineEnd');
                    }
                    updateFriendDelayedCheck(ctx, location, $location_at);
                },
                pendingOfflineDelay + Math.floor(Math.random() * 10000)
            ); // plus ~10sec random delay
        } else {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
            }
            updateFriendDelayedCheck(ctx, location, $location_at);
        }
    }

    /**
     * @param {Object} ctx
     * @param {string} location
     * @param {number} $location_at
     */
    async function updateFriendDelayedCheck(ctx, location, $location_at) {
        let feed;
        let groupName;
        let worldName;
        const id = ctx.id;
        const newState = ctx.pendingState;
        if (AppDebug.debugFriendState) {
            console.log(
                `${ctx.name} updateFriendState ${ctx.state} -> ${newState}`
            );
            if (
                typeof ctx.ref !== 'undefined' &&
                location !== ctx.ref.location
            ) {
                console.log(
                    `${ctx.name} pendingOfflineLocation ${location} -> ${ctx.ref.location}`
                );
            }
        }
        if (!friends.has(id)) {
            console.log('Friend not found', id);
            return;
        }
        const isVIP = localFavoriteFriends.has(id);
        const ref = ctx.ref;
        if (ctx.state !== newState && typeof ctx.ref !== 'undefined') {
            if (
                (newState === 'offline' || newState === 'active') &&
                ctx.state === 'online'
            ) {
                ctx.ref.$online_for = '';
                ctx.ref.$offline_for = Date.now();
                ctx.ref.$active_for = '';
                if (newState === 'active') {
                    ctx.ref.$active_for = Date.now();
                }
                const ts = Date.now();
                const time = ts - $location_at;
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'Offline',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location,
                    worldName,
                    groupName,
                    time
                };
                feedStore.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            } else if (
                newState === 'online' &&
                (ctx.state === 'offline' || ctx.state === 'active')
            ) {
                ctx.ref.$previousLocation = '';
                ctx.ref.$travelingToTime = Date.now();
                ctx.ref.$location_at = Date.now();
                ctx.ref.$online_for = Date.now();
                ctx.ref.$offline_for = '';
                ctx.ref.$active_for = '';
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'Online',
                    userId: id,
                    displayName: ctx.name,
                    location,
                    worldName,
                    groupName,
                    time: ''
                };
                feedStore.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            }
            if (newState === 'active') {
                ctx.ref.$active_for = Date.now();
            }
        }
        if (ctx.state !== newState) {
            ctx.state = newState;
            updateOnlineFriendCounter();
        }
        if (ref?.displayName) {
            ctx.name = ref.displayName;
        }
        ctx.isVIP = isVIP;
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
    }

    /**
     *
     * @param ref
     */
    function refreshFriendsStatus(ref) {
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
        for (const friend of map) {
            const [id, state_input] = friend;
            if (friends.has(id)) {
                updateFriend(id, state_input);
            } else {
                addFriend(id, state_input);
            }
        }
        for (id of friends.keys()) {
            if (map.has(id) === false) {
                deleteFriend(id);
            }
        }
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
            pendingOfflineTime: '',
            pendingState: '',
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
     * @param {Object} args
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

        function getNextOffset() {
            if (stopFlag) return null;
            const cur = nextOffset;
            nextOffset += PAGE_SIZE;
            if (cur > MAX_OFFSET) return null;
            return cur;
        }

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
    async function refreshFriendsList() {
        // If we just got user less then 2 min before code call, don't call it again
        if (updateLoopStore.nextCurrentUserRefresh < 300) {
            await userStore.getCurrentUser();
        }
        await refreshFriends();
        reconnectWebSocket();
    }

    function updateOnlineFriendCounter() {
        const onlineFriendCounts =
            vipFriends.value.length + onlineFriends.value.length;
        if (onlineFriendCounts !== onlineFriendCount.value) {
            AppApi.ExecuteVrFeedFunction(
                'updateOnlineFriendCount',
                `${onlineFriendCounts}`
            );
            onlineFriendCount.value = onlineFriendCounts;
        }
    }

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

        const data = await database.getAllUserStats(userIds, displayNames);

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
        for (item of friendListMap.values()) {
            ref = friends.get(item.userId);
            if (ref?.ref) {
                ref.ref.$joinCount = item.joinCount;
                ref.ref.$lastSeen = item.lastSeen;
                ref.ref.$timeSpent = item.timeSpent;
            }
        }
    }

    async function getAllUserMutualCount() {
        const mutualCountMap = await database.getMutualCountForAllUsers();
        for (const [userId, mutualCount] of mutualCountMap.entries()) {
            const ref = friends.get(userId);
            if (ref?.ref) {
                ref.ref.$mutualCount = mutualCount;
            }
        }
    }

    /**
     *
     * @param {string} id
     */
    function addFriendship(id) {
        if (
            !watchState.isFriendsLoaded ||
            friendLog.has(id) ||
            id === userStore.currentUser.id
        ) {
            return;
        }
        const ref = userStore.cachedUsers.get(id);
        if (typeof ref === 'undefined') {
            // deleted account on friends list
            return;
        }
        friendRequest
            .getFriendStatus({
                userId: id,
                currentUserId: userStore.currentUser.id
            })
            .then((args) => {
                if (args.params.currentUserId !== userStore.currentUser.id) {
                    // safety check for delayed response
                    return;
                }
                handleFriendStatus(args);
                if (args.json.isFriend && !friendLog.has(id)) {
                    if (state.friendNumber === 0) {
                        state.friendNumber = friends.size;
                    }
                    ref.$friendNumber = ++state.friendNumber;
                    configRepository.setInt(
                        `VRCX_friendNumber_${userStore.currentUser.id}`,
                        state.friendNumber
                    );
                    addFriend(id, ref.state);
                    const friendLogHistory = {
                        created_at: new Date().toJSON(),
                        type: 'Friend',
                        userId: id,
                        displayName: ref.displayName,
                        friendNumber: ref.$friendNumber
                    };
                    friendLogTable.value.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    notificationStore.queueFriendLogNoty(friendLogHistory);
                    const friendLogCurrent = {
                        userId: id,
                        displayName: ref.displayName,
                        trustLevel: ref.$trustLevel,
                        friendNumber: ref.$friendNumber
                    };
                    friendLog.set(id, friendLogCurrent);
                    database.setFriendLogCurrent(friendLogCurrent);
                    uiStore.notifyMenu('friend-log');
                    deleteFriendRequest(id);
                    sharedFeedStore.updateSharedFeed(true);
                    userRequest
                        .getUser({
                            userId: id
                        })
                        .then(() => {
                            if (
                                userStore.userDialog.visible &&
                                id === userStore.userDialog.id
                            ) {
                                userStore.applyUserDialogLocation(true);
                            }
                        });
                }
            });
    }

    /**
     *
     * @param {string} userId
     */
    function deleteFriendRequest(userId) {
        const array = notificationStore.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' &&
                array[i].senderUserId === userId
            ) {
                array.splice(i, 1);
                return;
            }
        }
    }

    /**
     *
     * @param {string} id
     */
    function deleteFriendship(id) {
        const ctx = friendLog.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        friendRequest
            .getFriendStatus({
                userId: id,
                currentUserId: userStore.currentUser.id
            })
            .then((args) => {
                if (args.params.currentUserId !== userStore.currentUser.id) {
                    // safety check for delayed response
                    return;
                }
                handleFriendStatus(args);
                if (!args.json.isFriend && friendLog.has(id)) {
                    const friendLogHistory = {
                        created_at: new Date().toJSON(),
                        type: 'Unfriend',
                        userId: id,
                        displayName: ctx.displayName || id
                    };
                    friendLogTable.value.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    notificationStore.queueFriendLogNoty(friendLogHistory);
                    friendLog.delete(id);
                    database.deleteFriendLogCurrent(id);
                    favoriteStore.handleFavoriteDelete(id);
                    if (!appearanceSettingsStore.hideUnfriends) {
                        uiStore.notifyMenu('friend-log');
                    }
                    sharedFeedStore.updateSharedFeed(true);
                    deleteFriend(id);
                }
            });
    }

    /**
     *
     * @param {object} ref
     */
    function updateFriendships(ref) {
        let id;
        const set = new Set();
        for (id of ref.friends) {
            set.add(id);
            addFriendship(id);
        }
        for (id of friendLog.keys()) {
            if (id === userStore.currentUser.id) {
                friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
            } else if (!set.has(id)) {
                deleteFriendship(id);
            }
        }
    }

    /**
     *
     * @param {object} ref
     */
    function updateFriendship(ref) {
        const ctx = friendLog.get(ref.id);
        if (!watchState.isFriendsLoaded || typeof ctx === 'undefined') {
            return;
        }
        if (ctx.friendNumber) {
            ref.$friendNumber = ctx.friendNumber;
        }
        if (!ref.$friendNumber) {
            ref.$friendNumber = 0; // no null
        }
        if (ctx.displayName !== ref.displayName) {
            if (ctx.displayName) {
                const friendLogHistoryDisplayName = {
                    created_at: new Date().toJSON(),
                    type: 'DisplayName',
                    userId: ref.id,
                    displayName: ref.displayName,
                    previousDisplayName: ctx.displayName,
                    friendNumber: ref.$friendNumber
                };
                friendLogTable.value.data.push(friendLogHistoryDisplayName);
                database.addFriendLogHistory(friendLogHistoryDisplayName);
                notificationStore.queueFriendLogNoty(
                    friendLogHistoryDisplayName
                );
                const friendLogCurrent = {
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                friendLog.set(ref.id, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                ctx.displayName = ref.displayName;
                uiStore.notifyMenu('friend-log');
                sharedFeedStore.updateSharedFeed(true);
            }
        }
        if (
            ref.$trustLevel &&
            ctx.trustLevel &&
            ctx.trustLevel !== ref.$trustLevel
        ) {
            if (
                (ctx.trustLevel === 'Trusted User' &&
                    ref.$trustLevel === 'Veteran User') ||
                (ctx.trustLevel === 'Veteran User' &&
                    ref.$trustLevel === 'Trusted User')
            ) {
                const friendLogCurrent3 = {
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                friendLog.set(ref.id, friendLogCurrent3);
                database.setFriendLogCurrent(friendLogCurrent3);
                return;
            }
            const friendLogHistoryTrustLevel = {
                created_at: new Date().toJSON(),
                type: 'TrustLevel',
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                previousTrustLevel: ctx.trustLevel,
                friendNumber: ref.$friendNumber
            };
            friendLogTable.value.data.push(friendLogHistoryTrustLevel);
            database.addFriendLogHistory(friendLogHistoryTrustLevel);
            notificationStore.queueFriendLogNoty(friendLogHistoryTrustLevel);
            const friendLogCurrent2 = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            friendLog.set(ref.id, friendLogCurrent2);
            database.setFriendLogCurrent(friendLogCurrent2);
            uiStore.notifyMenu('friend-log');
            sharedFeedStore.updateSharedFeed(true);
        }
        ctx.trustLevel = ref.$trustLevel;
    }

    /**
     *
     * @param {object} currentUser
     * @returns {Promise<void>}
     */
    async function initFriendLog(currentUser) {
        refreshFriendsStatus(currentUser);
        const sqlValues = [];
        const friends = await refreshFriends();
        for (const friend of friends) {
            const ref = userStore.applyUser(friend);
            const row = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: 0
            };
            friendLog.set(friend.id, row);
            sqlValues.unshift(row);
        }
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
            updateFriendships(currentUser);
        }
    }

    async function initFriendLogHistoryTable() {
        friendLogTable.value.data = await database.getFriendLogHistory();
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
        }
    }

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
        for (let i = 0; i < friendOrder.length; i++) {
            const userId = friendOrder[i];
            state.friendNumber++;
            setFriendNumber(state.friendNumber, userId);
        }
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

    function confirmDeleteFriend(id) {
        ElMessageBox.confirm('Continue? Unfriend', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then(async () => {
                const args = await friendRequest.deleteFriend({
                    userId: id
                });
                handleFriendDelete(args);
            })
            .catch(() => {});
    }

    async function initFriendsList() {
        const userId = userStore.currentUser.id;
        isRefreshFriendsLoading.value = true;
        watchState.isFriendsLoaded = false;
        friendLog = new Map();
        initFriendLogHistoryTable();

        try {
            if (await configRepository.getBool(`friendLogInit_${userId}`)) {
                await getFriendLog(userStore.currentUser);
            } else {
                await initFriendLog(userStore.currentUser);
            }
        } catch (err) {
            if (!AppDebug.dontLogMeOut) {
                ElMessage({
                    message: t('message.friend.load_failed'),
                    type: 'error'
                });
                authStore.handleLogoutEvent();
                throw err;
            }
        }

        tryApplyFriendOrder(); // once again
        getAllUserStats(); // joinCount, lastSeen, timeSpent

        // remove old data from json file and migrate to SQLite (July 2021)
        if (await VRCXStorage.Get(`${userId}_friendLogUpdatedAt`)) {
            VRCXStorage.Remove(`${userId}_feedTable`);
            migrateMemos();
            migrateFriendLog(userId);
        }
    }

    return {
        state,

        friends,

        vipFriends,
        onlineFriends,
        activeFriends,
        offlineFriends,
        friendsInSameInstance,

        localFavoriteFriends,
        isRefreshFriendsLoading,
        onlineFriendCount,
        friendLog,
        friendLogTable,

        initFriendsList,
        updateLocalFavoriteFriends,
        updateSidebarFavorites,
        updateFriend,
        deleteFriend,
        refreshFriendsStatus,
        addFriend,
        refreshFriends,
        refreshFriendsList,
        updateOnlineFriendCounter,
        getAllUserStats,
        getAllUserMutualCount,
        initFriendLog,
        migrateFriendLog,
        getFriendLog,
        getFriendRequest,
        userOnFriend,
        confirmDeleteFriend,
        updateFriendships,
        updateUserCurrentStatus,
        handleFriendAdd,
        handleFriendDelete
    };
});
