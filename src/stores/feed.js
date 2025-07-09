import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import configRepository from '../service/config';
import { database } from '../service/database';
import { watchState } from '../service/watchState';
import { useFriendStore } from './friend';
import { useNotificationStore } from './notification';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useVrcxStore } from './vrcx';

export const useFeedStore = defineStore('Feed', () => {
    const friendStore = useFriendStore();
    const notificationStore = useNotificationStore();
    const UiStore = useUiStore();
    const vrcxStore = useVrcxStore();
    const sharedFeedStore = useSharedFeedStore();

    const state = reactive({
        feedTable: {
            data: [],
            search: '',
            vip: false,
            loading: false,
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
            }
        },
        feedSessionTable: []
    });

    async function init() {
        state.feedTable.filter = JSON.parse(
            await configRepository.getString('VRCX_feedTableFilters', '[]')
        );
        state.feedTable.vip = await configRepository.getBool(
            'VRCX_feedTableVIPFilter',
            false
        );
    }

    init();

    const feedTable = computed({
        get: () => state.feedTable,
        set: (value) => {
            state.feedTable = value;
        }
    });

    const feedSessionTable = computed({
        get: () => state.feedSessionTable,
        set: (value) => {
            state.feedSessionTable = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.feedTable.data = [];
            state.feedSessionTable = [];
            if (isLoggedIn) {
                initFeedTable();
            }
        },
        { flush: 'sync' }
    );

    function feedSearch(row) {
        const value = state.feedTable.search.toUpperCase();
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
            case 'GPS':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Online':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Offline':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Status':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.status).toUpperCase().includes(value)) {
                    return true;
                }
                if (
                    String(row.statusDescription).toUpperCase().includes(value)
                ) {
                    return true;
                }
                return false;
            case 'Avatar':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.avatarName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Bio':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.bio).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.previousBio).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
        }
        return true;
    }

    async function feedTableLookup() {
        await configRepository.setString(
            'VRCX_feedTableFilters',
            JSON.stringify(state.feedTable.filter)
        );
        await configRepository.setBool(
            'VRCX_feedTableVIPFilter',
            state.feedTable.vip
        );
        state.feedTable.loading = true;
        let vipList = [];
        if (state.feedTable.vip) {
            vipList = Array.from(friendStore.localFavoriteFriends.values());
        }
        state.feedTable.data = await database.lookupFeedDatabase(
            state.feedTable.search,
            state.feedTable.filter,
            vipList
        );
        state.feedTable.loading = false;
    }

    function addFeed(feed) {
        notificationStore.queueFeedNoty(feed);
        state.feedSessionTable.push(feed);
        sharedFeedStore.updateSharedFeed(false);
        if (
            state.feedTable.filter.length > 0 &&
            !state.feedTable.filter.includes(feed.type)
        ) {
            return;
        }
        if (
            state.feedTable.vip &&
            !friendStore.localFavoriteFriends.has(feed.userId)
        ) {
            return;
        }
        if (!feedSearch(feed)) {
            return;
        }
        state.feedTable.data.push(feed);
        sweepFeed();
        UiStore.notifyMenu('feed');
    }

    function sweepFeed() {
        let limit;
        const { data } = state.feedTable;
        const j = data.length;
        if (j > vrcxStore.maxTableSize) {
            data.splice(0, j - vrcxStore.maxTableSize);
        }

        const date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
        limit = date.toJSON();
        let i = 0;
        const k = state.feedSessionTable.length;
        while (i < k && state.feedSessionTable[i].created_at < limit) {
            ++i;
        }
        if (i === k) {
            state.feedSessionTable = [];
        } else if (i) {
            state.feedSessionTable.splice(0, i);
        }
    }

    async function initFeedTable() {
        state.feedTable.loading = true;

        feedTableLookup();
        state.feedSessionTable = await database.getFeedDatabase();
    }

    return {
        state,
        feedTable,
        feedSessionTable,
        initFeedTable,
        feedTableLookup,
        addFeed
    };
});
