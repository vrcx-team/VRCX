import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { database } from '../service/database';
import { useFriendStore } from './friend';
import { useNotificationStore } from './notification';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useVrcxStore } from './vrcx';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';

export const useFeedStore = defineStore('Feed', () => {
    const friendStore = useFriendStore();
    const notificationStore = useNotificationStore();
    const UiStore = useUiStore();
    const vrcxStore = useVrcxStore();
    const sharedFeedStore = useSharedFeedStore();

    const feedTable = ref({
        data: [],
        search: '',
        vip: false,
        loading: false,
        filter: [],
        tableProps: {
            stripe: true,
            size: 'small',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 15,
        pageSizeLinked: true,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });

    const feedSessionTable = ref([]);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            feedTable.value.data = [];
            feedSessionTable.value = [];
            if (isLoggedIn) {
                initFeedTable();
            }
        },
        { flush: 'sync' }
    );

    watch(
        () => watchState.isFavoritesLoaded,
        (isFavoritesLoaded) => {
            if (isFavoritesLoaded && feedTable.value.vip) {
                feedTableLookup(); // re-apply VIP filter after friends are loaded
            }
        }
    );

    async function init() {
        feedTable.value.filter = JSON.parse(
            await configRepository.getString('VRCX_feedTableFilters', '[]')
        );
        feedTable.value.vip = await configRepository.getBool(
            'VRCX_feedTableVIPFilter',
            false
        );
    }

    init();

    function feedSearch(row) {
        const value = feedTable.value.search.toUpperCase();
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
            JSON.stringify(feedTable.value.filter)
        );
        await configRepository.setBool(
            'VRCX_feedTableVIPFilter',
            feedTable.value.vip
        );
        feedTable.value.loading = true;
        let vipList = [];
        if (feedTable.value.vip) {
            vipList = Array.from(friendStore.localFavoriteFriends.values());
        }
        feedTable.value.data = await database.lookupFeedDatabase(
            feedTable.value.search,
            feedTable.value.filter,
            vipList
        );
        feedTable.value.loading = false;
    }

    function addFeed(feed) {
        notificationStore.queueFeedNoty(feed);
        feedSessionTable.value.push(feed);
        sharedFeedStore.updateSharedFeed(false);
        if (
            feedTable.value.filter.length > 0 &&
            !feedTable.value.filter.includes(feed.type)
        ) {
            return;
        }
        if (
            feedTable.value.vip &&
            !friendStore.localFavoriteFriends.has(feed.userId)
        ) {
            return;
        }
        if (!feedSearch(feed)) {
            return;
        }
        feedTable.value.data.push(feed);
        sweepFeed();
        UiStore.notifyMenu('feed');
    }

    function sweepFeed() {
        let limit;
        const { data } = feedTable.value;
        const j = data.length;
        if (j > vrcxStore.maxTableSize) {
            data.splice(0, j - vrcxStore.maxTableSize);
        }

        const date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
        limit = date.toJSON();
        let i = 0;
        const k = feedSessionTable.value.length;
        while (i < k && feedSessionTable.value[i].created_at < limit) {
            ++i;
        }
        if (i === k) {
            feedSessionTable.value = [];
        } else if (i) {
            feedSessionTable.value.splice(0, i);
        }
    }

    async function initFeedTable() {
        feedTable.value.loading = true;

        feedTableLookup();
        feedSessionTable.value = await database.getFeedDatabase();
    }

    return {
        feedTable,
        feedSessionTable,
        initFeedTable,
        feedTableLookup,
        addFeed
    };
});
