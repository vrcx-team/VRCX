import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import * as workerTimers from 'worker-timers';
import { friendRequest, userRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import { reconnectWebSocket } from '../service/websocket';
import { watchState } from '../service/watchState';
import {
    compareByCreatedAtAscending,
    getFriendsSortFunction,
    getGroupName,
    getNameColour,
    getUserMemo,
    getWorldName,
    migrateMemos,
    removeFromArray,
    isRealInstance
} from '../shared/utils';
import { useAuthStore } from './auth';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useGroupStore } from './group';
import { useNotificationStore } from './notification';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useI18n } from 'vue-i18n-bridge';

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
    const { t } = useI18n();

    const state = reactive({
        friends: new Map(),
        onlineFriends_: [],
        vipFriends_: [],
        activeFriends_: [],
        offlineFriends_: [],
        sortOnlineFriends: false,
        sortVIPFriends: false,
        sortActiveFriends: false,
        sortOfflineFriends: false,
        localFavoriteFriends: new Set(),
        isRefreshFriendsLoading: false,
        onlineFriendCount: 0,
        friendLog: new Map(),
        friendLogTable: {
            data: [],
            filters: [
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
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
        friendNumber: 0
    });

    async function init() {
        const friendLogTableFiltersValue = JSON.parse(
            await configRepository.getString('VRCX_friendLogTableFilters', '[]')
        );
        state.friendLogTable.filters[0].value = friendLogTableFiltersValue;
    }

    init();

    const friends = state.friends;

    // friends_(array) may not have change records in pinia because does not use action
    const onlineFriends_ = computed({
        get() {
            return state.onlineFriends_;
        },
        set(value) {
            state.onlineFriends_ = value;
        }
    });
    const vipFriends_ = computed({
        get() {
            return state.vipFriends_;
        },
        set(value) {
            state.vipFriends_ = value;
        }
    });
    const activeFriends_ = computed({
        get() {
            return state.activeFriends_;
        },
        set(value) {
            state.activeFriends_ = value;
        }
    });
    const offlineFriends_ = computed({
        get() {
            return state.offlineFriends_;
        },
        set(value) {
            state.offlineFriends_ = value;
        }
    });
    const sortOnlineFriends = computed({
        get() {
            return state.sortOnlineFriends;
        },
        set(value) {
            state.sortOnlineFriends = value;
        }
    });
    const sortVIPFriends = computed({
        get() {
            return state.sortVIPFriends;
        },
        set(value) {
            state.sortVIPFriends = value;
        }
    });
    const sortActiveFriends = computed({
        get() {
            return state.sortActiveFriends;
        },
        set(value) {
            state.sortActiveFriends = value;
        }
    });
    const sortOfflineFriends = computed({
        get() {
            return state.sortOfflineFriends;
        },
        set(value) {
            state.sortOfflineFriends = value;
        }
    });
    const localFavoriteFriends = state.localFavoriteFriends;

    // VIP friends
    const vipFriends = computed(() => {
        if (!state.sortVIPFriends) {
            return state.vipFriends_;
        }
        state.sortVIPFriends = false;

        state.vipFriends_.sort(
            getFriendsSortFunction(appearanceSettingsStore.sidebarSortMethods)
        );
        return state.vipFriends_;
    });

    // Online friends
    const onlineFriends = computed(() => {
        if (!state.sortOnlineFriends) {
            return state.onlineFriends_;
        }
        state.sortOnlineFriends = false;

        state.onlineFriends_.sort(
            getFriendsSortFunction(appearanceSettingsStore.sidebarSortMethods)
        );

        return state.onlineFriends_;
    });

    // Active friends
    const activeFriends = computed(() => {
        if (!state.sortActiveFriends) {
            return state.activeFriends_;
        }
        state.sortActiveFriends = false;

        state.activeFriends_.sort(
            getFriendsSortFunction(appearanceSettingsStore.sidebarSortMethods)
        );

        return state.activeFriends_;
    });

    // Offline friends
    const offlineFriends = computed(() => {
        if (!state.sortOfflineFriends) {
            return state.offlineFriends_;
        }
        state.sortOfflineFriends = false;

        state.offlineFriends_.sort(
            getFriendsSortFunction(appearanceSettingsStore.sidebarSortMethods)
        );

        return state.offlineFriends_;
    });

    const isRefreshFriendsLoading = computed({
        get() {
            return state.isRefreshFriendsLoading;
        },
        set(value) {
            state.isRefreshFriendsLoading = value;
        }
    });
    const onlineFriendCount = computed({
        get() {
            return state.onlineFriendCount;
        },
        set(value) {
            state.onlineFriendCount = value;
        }
    });

    const friendLog = computed({
        get() {
            return state.friendLog;
        },
        set(value) {
            state.friendLog = value;
        }
    });

    const friendLogTable = computed({
        get() {
            return state.friendLogTable;
        },
        set(value) {
            state.friendLogTable = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.friends.clear();
            state.friendNumber = 0;
            state.friendLog.clear();
            state.friendLogTable.data = [];
            groupStore.groupInstances = [];
            state.vipFriends_ = [];
            state.onlineFriends_ = [];
            state.activeFriends_ = [];
            state.offlineFriends_ = [];
            state.sortVIPFriends = false;
            state.sortOnlineFriends = false;
            state.sortActiveFriends = false;
            state.sortOfflineFriends = false;
            state.onlineFriendCount = 0;
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
                updateOnlineFriendCoutner();
            }
        },
        { flush: 'sync' }
    );

    function updateUserCurrentStatus(ref) {
        if (watchState.isFriendsLoaded) {
            refreshFriendsStatus(ref);
        }
        updateOnlineFriendCoutner();

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
            !state.friendLog.has(ref.id) &&
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
        const { cachedFavorites } = favoriteStore;
        state.localFavoriteFriends.clear();
        for (const ref of cachedFavorites.values()) {
            if (
                !ref.$isDeleted &&
                ref.type === 'friend' &&
                (generalSettingsStore.localFavoriteFriendsGroups.includes(
                    ref.$groupKey
                ) ||
                    generalSettingsStore.localFavoriteFriendsGroups.length ===
                        0)
            ) {
                state.localFavoriteFriends.add(ref.favoriteId);
            }
        }
        updateSidebarFriendsList();
    }

    function updateSidebarFriendsList() {
        for (const ctx of state.friends.values()) {
            const isVIP = state.localFavoriteFriends.has(ctx.id);
            if (ctx.isVIP === isVIP) {
                continue;
            }
            ctx.isVIP = isVIP;
            if (ctx.state !== 'online') {
                continue;
            }
            if (ctx.isVIP) {
                removeFromArray(state.onlineFriends_, ctx);
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                removeFromArray(state.vipFriends_, ctx);
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        }
    }

    const pendingOfflineDelay = 180000;

    /**
     * @param {string} id
     * @param {string?} stateInput
     */
    function updateFriend(id, stateInput = undefined) {
        const ctx = state.friends.get(id);
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
            if (AppGlobal.debugFriendState && ctx.pendingOffline) {
                const time = (Date.now() - ctx.pendingOfflineTime) / 1000;
                console.log(`${ctx.name} pendingOfflineCancelTime ${time}`);
            }
            ctx.pendingOffline = false;
            ctx.pendingOfflineTime = '';
        }
        const isVIP = state.localFavoriteFriends.has(id);
        let location = '';
        let $location_at = undefined;
        if (typeof ref !== 'undefined') {
            location = ref.location;
            $location_at = ref.$location_at;

            // wtf, fetch user if offline in an instance
            if (
                ctx.state !== 'online' &&
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
                ctx.state === 'online' &&
                ref.location === 'offline' &&
                ref.$lastFetch < Date.now() - 10000 // 10 seconds
            ) {
                console.log(
                    `Fetching online friend in an offline location ${ctx.name}`
                );
                userRequest.getUser({
                    userId: id
                });
                return;
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
                    if (ctx.isVIP) {
                        state.sortVIPFriends = true;
                    } else {
                        state.sortOnlineFriends = true;
                    }
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        removeFromArray(state.onlineFriends_, ctx);
                        state.vipFriends_.push(ctx);
                        state.sortVIPFriends = true;
                    } else {
                        removeFromArray(state.vipFriends_, ctx);
                        state.onlineFriends_.push(ctx);
                        state.sortOnlineFriends = true;
                    }
                }
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        state.sortVIPFriends = true;
                    } else {
                        state.sortOnlineFriends = true;
                    }
                } else if (ctx.state === 'active') {
                    state.sortActiveFriends = true;
                } else {
                    state.sortOfflineFriends = true;
                }
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
                if (AppGlobal.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineAlreadyWaiting');
                }
                return;
            }
            if (AppGlobal.debugFriendState) {
                console.log(ctx.name, 'pendingOfflineBegin');
            }
            ctx.pendingOffline = true;
            ctx.pendingOfflineTime = Date.now();
            // wait 2minutes then check if user came back online
            workerTimers.setTimeout(() => {
                if (!ctx.pendingOffline) {
                    if (AppGlobal.debugFriendState) {
                        console.log(ctx.name, 'pendingOfflineAlreadyCancelled');
                    }
                    return;
                }
                ctx.pendingOffline = false;
                ctx.pendingOfflineTime = '';
                if (ctx.pendingState === ctx.state) {
                    if (AppGlobal.debugFriendState) {
                        console.log(
                            ctx.name,
                            'pendingOfflineCancelledStateMatched'
                        );
                    }
                    return;
                }
                if (AppGlobal.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineEnd');
                }
                updateFriendDelayedCheck(ctx, location, $location_at);
            }, pendingOfflineDelay);
        } else {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
                // wtf, try fetch user if online in offline location
                if (
                    stateInput === 'online' &&
                    ref.$lastFetch < Date.now() - 10000 // 10 seconds
                ) {
                    console.log(
                        `Fetching friend coming online in offline location ${ctx.name}`
                    );
                    userRequest.getUser({
                        userId: id
                    });
                    return;
                }
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
        if (AppGlobal.debugFriendState) {
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
        if (!state.friends.has(id)) {
            console.log('Friend not found', id);
            return;
        }
        const isVIP = state.localFavoriteFriends.has(id);
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
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(state.vipFriends_, ctx);
            } else {
                removeFromArray(state.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            removeFromArray(state.activeFriends_, ctx);
        } else {
            removeFromArray(state.offlineFriends_, ctx);
        }
        if (newState === 'online') {
            if (isVIP) {
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        } else if (newState === 'active') {
            state.activeFriends_.push(ctx);
            state.sortActiveFriends = true;
        } else {
            state.offlineFriends_.push(ctx);
            state.sortOfflineFriends = true;
        }
        if (ctx.state !== newState) {
            ctx.state = newState;
            updateOnlineFriendCoutner();
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
        const ctx = state.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        state.friends.delete(id);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(state.vipFriends_, ctx);
            } else {
                removeFromArray(state.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            removeFromArray(state.activeFriends_, ctx);
        } else {
            removeFromArray(state.offlineFriends_, ctx);
        }
    }

    /**
     * aka: `$app.refreshFriends`
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
            if (state.friends.has(id)) {
                updateFriend(id, state_input);
            } else {
                addFriend(id, state_input);
            }
        }
        for (id of state.friends.keys()) {
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
        if (state.friends.has(id)) {
            return;
        }
        const ref = userStore.cachedUsers.get(id);
        const isVIP = state.localFavoriteFriends.has(id);
        let name = '';
        const friend = state.friendLog.get(id);
        if (friend) {
            name = friend.displayName;
        }
        const ctx = {
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
        };
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
            const friendLogRef = state.friendLog.get(id);
            if (friendLogRef?.displayName) {
                ctx.name = friendLogRef.displayName;
            }
        } else {
            ctx.name = ref.name;
        }
        state.friends.set(id, ctx);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        } else if (ctx.state === 'active') {
            state.activeFriends_.push(ctx);
            state.sortActiveFriends = true;
        } else {
            state.offlineFriends_.push(ctx);
            state.sortOfflineFriends = true;
        }
    }

    /**
     *
     * @returns {Promise<*[]>}
     */
    async function refreshFriends() {
        state.isRefreshFriendsLoading = true;
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

            state.isRefreshFriendsLoading = false;
            return friends;
        } catch (err) {
            state.isRefreshFriendsLoading = false;
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

        const stamps = [];
        async function throttle() {
            const now = Date.now();
            while (stamps.length && now - stamps[0] > 60_000) stamps.shift();
            if (stamps.length >= RATE_PER_MINUTE) {
                const wait = 60_000 - (now - stamps[0]);
                await new Promise((r) => setTimeout(r, wait));
            }
            stamps.push(Date.now());
        }

        async function fetchPage(offset, retries = MAX_RETRY) {
            try {
                const { json } = await friendRequest.getFriends({
                    ...args,
                    n: PAGE_SIZE,
                    offset
                });
                return Array.isArray(json) ? json : [];
            } catch (err) {
                const is429 =
                    err.status === 429 || (err.message || '').includes('429');
                if (is429 && retries > 0) {
                    await new Promise((r) =>
                        setTimeout(
                            r,
                            RETRY_BASE_DELAY * Math.pow(2, MAX_RETRY - retries)
                        )
                    );
                    return fetchPage(offset, retries - 1);
                }
                throw err;
            }
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

                await throttle();

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
     * @param {Array} friends
     * @returns {Promise<*>}
     */
    async function refetchBrokenFriends(friends) {
        // attempt to fix broken data from bulk friend fetch
        for (let i = 0; i < friends.length; i++) {
            const friend = friends[i];
            try {
                // we don't update friend state here, it's not reliable
                let state_input = 'offline';
                if (friend.platform === 'web') {
                    state_input = 'active';
                } else if (friend.platform) {
                    state_input = 'online';
                }
                const ref = state.friends.get(friend.id);
                if (ref?.state !== state_input) {
                    if (AppGlobal.debugFriendState) {
                        console.log(
                            `Refetching friend state it does not match ${friend.displayName} from ${ref?.state} to ${state_input}`,
                            friend
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                } else if (friend.location === 'traveling') {
                    if (AppGlobal.debugFriendState) {
                        console.log(
                            'Refetching traveling friend',
                            friend.displayName
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                }
            } catch (err) {
                console.error(err);
            }
        }
        return friends;
    }

    /**
     * @param {Array} friends
     * @returns {Promise<*>}
     */
    async function refreshRemainingFriends(friends) {
        for (const userId of userStore.currentUser.friends) {
            if (!friends.some((x) => x.id === userId)) {
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

    /**
     * @param {string} userId
     */
    function updateFriendGPS(userId) {
        const ctx = state.friends.get(userId);
        if (ctx.isVIP) {
            state.sortVIPFriends = true;
        } else {
            state.sortOnlineFriends = true;
        }
    }

    function updateOnlineFriendCoutner() {
        const onlineFriendCount =
            vipFriends.value.length + onlineFriends.value.length;
        if (onlineFriendCount !== state.onlineFriendCount) {
            AppApi.ExecuteVrFeedFunction(
                'updateOnlineFriendCount',
                `${onlineFriendCount}`
            );
            state.onlineFriendCount = onlineFriendCount;
        }
    }

    async function getAllUserStats() {
        let ref;
        let item;
        const userIds = [];
        const displayNames = [];
        for (const ctx of state.friends.values()) {
            userIds.push(ctx.id);
            if (ctx.ref?.displayName) {
                displayNames.push(ctx.ref.displayName);
            }
        }

        const data = await database.getAllUserStats(userIds, displayNames);
        const friendListMap = new Map();
        for (item of data) {
            if (!item.userId) {
                // find userId from previous data with matching displayName
                for (ref of data) {
                    if (ref.displayName === item.displayName && ref.userId) {
                        item.userId = ref.userId;
                    }
                }
                // if still no userId, find userId from friends list
                if (!item.userId) {
                    for (ref of state.friends.values()) {
                        if (
                            ref?.ref?.id &&
                            ref.ref.displayName === item.displayName
                        ) {
                            item.userId = ref.id;
                        }
                    }
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
            ref = state.friends.get(item.userId);
            if (ref?.ref) {
                ref.ref.$joinCount = item.joinCount;
                ref.ref.$lastSeen = item.lastSeen;
                ref.ref.$timeSpent = item.timeSpent;
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
            state.friendLog.has(id) ||
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
                if (args.json.isFriend && !state.friendLog.has(id)) {
                    if (state.friendNumber === 0) {
                        state.friendNumber = state.friends.size;
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
                    state.friendLogTable.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    notificationStore.queueFriendLogNoty(friendLogHistory);
                    const friendLogCurrent = {
                        userId: id,
                        displayName: ref.displayName,
                        trustLevel: ref.$trustLevel,
                        friendNumber: ref.$friendNumber
                    };
                    state.friendLog.set(id, friendLogCurrent);
                    database.setFriendLogCurrent(friendLogCurrent);
                    uiStore.notifyMenu('friendLog');
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
        const ctx = state.friendLog.get(id);
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
                if (!args.json.isFriend && state.friendLog.has(id)) {
                    const friendLogHistory = {
                        created_at: new Date().toJSON(),
                        type: 'Unfriend',
                        userId: id,
                        displayName: ctx.displayName || id
                    };
                    state.friendLogTable.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    notificationStore.queueFriendLogNoty(friendLogHistory);
                    state.friendLog.delete(id);
                    database.deleteFriendLogCurrent(id);
                    if (!appearanceSettingsStore.hideUnfriends) {
                        uiStore.notifyMenu('friendLog');
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
        for (id of state.friendLog.keys()) {
            if (id === userStore.currentUser.id) {
                state.friendLog.delete(id);
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
        const ctx = state.friendLog.get(ref.id);
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
                state.friendLogTable.data.push(friendLogHistoryDisplayName);
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
                state.friendLog.set(ref.id, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                ctx.displayName = ref.displayName;
                uiStore.notifyMenu('friendLog');
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
                state.friendLog.set(ref.id, friendLogCurrent3);
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
            state.friendLogTable.data.push(friendLogHistoryTrustLevel);
            database.addFriendLogHistory(friendLogHistoryTrustLevel);
            notificationStore.queueFriendLogNoty(friendLogHistoryTrustLevel);
            const friendLogCurrent2 = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            state.friendLog.set(ref.id, friendLogCurrent2);
            database.setFriendLogCurrent(friendLogCurrent2);
            uiStore.notifyMenu('friendLog');
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
            state.friendLog.set(friend.id, row);
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
        state.friendLogTable.data = await VRCXStorage.GetArray(
            `${userId}_friendLogTable`
        );
        database.addFriendLogHistoryArray(state.friendLogTable.data);
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
            state.friendLog.set(friend.userId, friend);
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
        state.friendLogTable.data = await database.getFriendLogHistory();
    }

    /**
     * @returns void
     * @param {number} friendNumber
     * @param {string} userId
     */
    function setFriendNumber(friendNumber, userId) {
        const ref = state.friendLog.get(userId);
        if (!ref) {
            return;
        }
        ref.friendNumber = friendNumber;
        state.friendLog.set(ref.userId, ref);
        database.setFriendLogCurrent(ref);
        const friendRef = state.friends.get(userId);
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
        for (const ref of state.friendLog.values()) {
            ref.friendNumber = 0;
        }

        const friendOrder = userStore.currentUser.friends;
        for (let i = 0; i < friendOrder.length; i++) {
            const userId = friendOrder[i];
            state.friendNumber++;
            setFriendNumber(state.friendNumber, userId);
        }
        if (state.friendNumber === 0) {
            state.friendNumber = state.friends.size;
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
        for (const ref of state.friendLog.values()) {
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
        state.friendNumber = state.friends.size + 1;
        const friendLogTable = getFriendLogFriendOrder();
        for (let i = friendLogTable.length - 1; i > -1; i--) {
            const friendLog = friendLogTable[i];
            const ref = state.friendLog.get(friendLog.id);
            if (!ref) {
                continue;
            }
            if (ref.friendNumber) {
                break;
            }
            ref.friendNumber = --state.friendNumber;
            state.friendLog.set(ref.userId, ref);
            database.setFriendLogCurrent(ref);
            const friendRef = state.friends.get(friendLog.id);
            if (friendRef?.ref) {
                friendRef.ref.$friendNumber = ref.friendNumber;
            }
        }
        state.friendNumber = state.friends.size;
        console.log('Applied friend order from friendLog');
    }

    function getFriendLogFriendOrder() {
        const friendLogTable = [];
        for (let i = 0; i < state.friendLogTable.data.length; i++) {
            const ref = state.friendLogTable.data[i];
            if (ref.type !== 'Friend') {
                continue;
            }
            if (friendLogTable.findIndex((x) => x.id === ref.userId) !== -1) {
                // console.log(
                //     'ignoring duplicate friend',
                //     ref.displayName,
                //     ref.created_at
                // );
                continue;
            }
            friendLogTable.push({
                id: ref.userId,
                displayName: ref.displayName,
                created_at: ref.created_at
            });
        }
        friendLogTable.sort(compareByCreatedAtAscending);
        return friendLogTable;
    }

    function parseFriendOrderBackup(friendLogTable, created_at, backupUserIds) {
        let i;
        const backupTable = [];
        for (i = 0; i < backupUserIds.length; i++) {
            const userId = backupUserIds[i];
            const ctx = state.friends.get(userId);
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
            const ctx = state.friends.get(userId);
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
            state.friendLog.set(userId, friendLogCurrent);
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
        for (const friendLog of friendLogTable) {
            const ref = state.friendLog.get(friendLog.id);
            if (!ref || ref.friendNumber) {
                continue;
            }
            ref.friendNumber = ++state.friendNumber;
            state.friendLog.set(ref.userId, ref);
            database.setFriendLogCurrent(ref);
            const friendRef = state.friends.get(friendLog.id);
            if (friendRef?.ref) {
                friendRef.ref.$friendNumber = ref.friendNumber;
            }
        }
    }

    function confirmDeleteFriend(id) {
        $app.$confirm('Continue? Unfriend', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: async (action) => {
                if (action === 'confirm') {
                    const args = await friendRequest.deleteFriend({
                        userId: id
                    });
                    handleFriendDelete(args);
                }
            }
        });
    }

    async function saveSidebarSortOrder() {
        state.sortVIPFriends = true;
        state.sortOnlineFriends = true;
        state.sortActiveFriends = true;
        state.sortOfflineFriends = true;
    }

    async function initFriendsList() {
        const userId = userStore.currentUser.id;
        state.isRefreshFriendsLoading = true;
        watchState.isFriendsLoaded = false;
        state.friendLog = new Map();
        initFriendLogHistoryTable();

        try {
            if (await configRepository.getBool(`friendLogInit_${userId}`)) {
                await getFriendLog(userStore.currentUser);
            } else {
                await initFriendLog(userStore.currentUser);
            }
        } catch (err) {
            if (!AppGlobal.dontLogMeOut) {
                $app.$message({
                    message: t('message.friend.load_failed'),
                    type: 'error'
                });
                authStore.handleLogoutEvent();
                throw err;
            }
        }

        tryApplyFriendOrder(); // once again
        getAllUserStats(); // joinCount, lastSeen, timeSpent
        state.sortVIPFriends = true;
        state.sortOnlineFriends = true;
        state.sortActiveFriends = true;
        state.sortOfflineFriends = true;

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
        onlineFriends_,
        vipFriends_,
        activeFriends_,
        offlineFriends_,

        vipFriends,
        onlineFriends,
        activeFriends,
        offlineFriends,

        sortOnlineFriends,
        sortVIPFriends,
        sortActiveFriends,
        sortOfflineFriends,

        localFavoriteFriends,
        isRefreshFriendsLoading,
        onlineFriendCount,
        friendLog,
        friendLogTable,

        initFriendsList,
        updateLocalFavoriteFriends,
        updateSidebarFriendsList,
        updateFriend,
        deleteFriend,
        refreshFriendsStatus,
        addFriend,
        refreshFriends,
        refreshFriendsList,
        updateOnlineFriendCoutner,
        updateFriendGPS,
        getAllUserStats,
        initFriendLog,
        migrateFriendLog,
        getFriendLog,
        getFriendRequest,
        userOnFriend,
        confirmDeleteFriend,
        saveSidebarSortOrder,
        updateFriendships,
        updateUserCurrentStatus,
        handleFriendAdd,
        handleFriendDelete
    };
});
