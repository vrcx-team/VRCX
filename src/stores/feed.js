import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app } from '../app';
import { t } from '../plugin';
import configRepository from '../service/config';
import { database } from '../service/database';
import { API } from '../service/eventBus';
import { initWebsocket } from '../service/websocket';
import { getAllUserMemos, getNameColour, migrateMemos } from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useGameLogStore } from './gameLog';
import { useGroupStore } from './group';
import { useNotificationStore } from './notification';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useVrcxStore } from './vrcx';
import { useAuthStore } from './auth';
import { useFavoriteStore } from './favorite';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useGalleryStore } from './gallery';
import { useInstanceStore } from './instance';
import { useModerationStore } from './moderation';

export const useFeedStore = defineStore('Feed', () => {
    const friendStore = useFriendStore();
    const notificationStore = useNotificationStore();
    const UiStore = useUiStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const gameStore = useGameStore();
    const vrStore = useVrStore();
    const avatarStore = useAvatarStore();
    const gameLogStore = useGameLogStore();
    const userStore = useUserStore();
    const vrcxStore = useVrcxStore();
    const sharedFeedStore = useSharedFeedStore();
    const groupStore = useGroupStore();
    const favoritesStore = useFavoriteStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const galleryStore = useGalleryStore();
    const instanceStore = useInstanceStore();
    const moderationStore = useModerationStore();

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

    API.$on('LOGIN', async function (args) {
        // early loading indicator
        friendStore.isRefreshFriendsLoading = true;
        state.feedTable.loading = true;

        friendStore.friendLog = new Map();
        state.feedTable.data = [];
        state.feedSessionTable = [];
        friendStore.friendLogInitStatus = false;
        notificationStore.notificationInitStatus = false;
        await database.initUserTables(args.json.id);
        UiStore.menuActiveIndex = 'feed';

        const command = await AppApi.GetLaunchCommand();
        if (command) {
            vrcxStore.eventLaunchCommand(command);
        }
        favoritesStore.refreshFavorites();
        favoritesStore.getLocalWorldFavorites();
        favoritesStore.getLocalAvatarFavorites(); // TODO: why did this have a 100ms delay? (test)
        groupStore.updateInGameGroupOrder();
        if (advancedSettingsStore.autoDeleteOldPrints) {
            galleryStore.tryDeleteOldPrints();
        }
        instanceStore.getInstanceJoinHistory();
        moderationStore.refreshPlayerModerations();

        gameLogStore.gameLogTable.data = await database.lookupGameLogDatabase(
            gameLogStore.gameLogTable.search,
            gameLogStore.gameLogTable.filter
        );
        state.feedSessionTable = await database.getFeedDatabase();
        await feedTableLookup();
        notificationStore.notificationTable.data =
            await database.getNotifications();
        notificationStore.refreshNotifications();
        groupStore.loadCurrentUserGroups(
            args.json.id,
            args.json?.presence?.groups
        );
        try {
            if (
                await configRepository.getBool(`friendLogInit_${args.json.id}`)
            ) {
                await friendStore.getFriendLog(args.ref);
            } else {
                await friendStore.initFriendLog(args.ref);
            }
        } catch (err) {
            if (!API.dontLogMeOut) {
                $app.$message({
                    message: t('message.friend.load_failed'),
                    type: 'error'
                });
                useAuthStore().handleLogoutEvent();
                throw err;
            }
        }
        await avatarStore.getAvatarHistory();
        await getAllUserMemos();
        userStore.initUserNotes();
        if (appearanceSettingsStore.randomUserColours) {
            getNameColour(userStore.currentUser.id).then((colour) => {
                userStore.currentUser.$userColour = colour;
            });
            await appearanceSettingsStore.userColourInit();
        }
        await friendStore.getAllUserStats();
        friendStore.sortVIPFriends = true;
        friendStore.sortOnlineFriends = true;
        friendStore.sortActiveFriends = true;
        friendStore.sortOfflineFriends = true;
        initWebsocket();
        sharedFeedStore.updateSharedFeed(true);
        if (gameStore.isGameRunning) {
            gameLogStore.loadPlayerList();
        }
        vrStore.vrInit();
        // remove old data from json file and migrate to SQLite
        if (await VRCXStorage.Get(`${args.json.id}_friendLogUpdatedAt`)) {
            VRCXStorage.Remove(`${args.json.id}_feedTable`);
            migrateMemos();
            friendStore.migrateFriendLog(args.json.id);
        }
        await AppApi.IPCAnnounceStart();
    });

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

    return { state, feedTable, feedSessionTable, feedTableLookup, addFeed };
});
