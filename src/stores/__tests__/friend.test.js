import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { reactive, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    userStore: null,
    favoriteStore: null
}));

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({
            currentRoute: ref({ name: 'feed', params: {} })
        })
    };
});

vi.mock('../../plugins/i18n', () => ({
    i18n: { global: { t: (key) => key } }
}));

vi.mock('../../coordinators/memoCoordinator', () => ({
    getUserMemo: vi.fn()
}));

vi.mock('../../api', () => ({
    friendRequest: {},
    userRequest: {}
}));

vi.mock('../../coordinators/friendSyncCoordinator', () => ({
    runInitFriendsListFlow: vi.fn()
}));

vi.mock('../../coordinators/friendPresenceCoordinator', () => ({
    runPendingOfflineTickFlow: vi.fn(),
    runUpdateFriendFlow: vi.fn()
}));

vi.mock('../../coordinators/friendRelationshipCoordinator', () => ({
    updateFriendship: vi.fn(),
    runUpdateFriendshipsFlow: vi.fn()
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    applyUser: vi.fn()
}));

vi.mock('../../services/database', () => ({
    database: {
        getFriendLogHistory: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../services/config', () => ({
    default: {
        getInt: vi.fn(),
        setInt: vi.fn(),
        getString: vi.fn().mockResolvedValue('[]')
    }
}));

vi.mock('worker-timers', () => ({
    setInterval: vi.fn(),
    clearInterval: vi.fn()
}));

vi.mock('../settings/appearance', () => ({
    useAppearanceSettingsStore: () =>
        reactive({
            sidebarSortMethods: []
        })
}));

vi.mock('../settings/general', () => ({
    useGeneralSettingsStore: () =>
        reactive({
            localFavoriteFriendsGroups: []
        })
}));

vi.mock('../favorite', () => ({
    useFavoriteStore: () => mocks.favoriteStore
}));

vi.mock('../group', () => ({
    useGroupStore: () =>
        reactive({
            clearGroupInstances: vi.fn()
        })
}));

vi.mock('../location', () => ({
    useLocationStore: () => reactive({ lastLocation: { friendList: new Map() } })
}));

vi.mock('../dashboard', () => ({
    useDashboardStore: () => ({
        dashboards: [],
        getDashboard: vi.fn()
    })
}));

vi.mock('../user', () => ({
    useUserStore: () => mocks.userStore
}));

import { useFriendStore } from '../friend';
import { useSearchIndexStore } from '../searchIndex';
import { watchState } from '../../services/watchState';

describe('useFriendStore.addFriend', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        watchState.isFriendsLoaded = false;
        watchState.isLoggedIn = true;
        mocks.userStore = reactive({
            cachedUsers: new Map()
        });
        mocks.favoriteStore = reactive({
            cachedFavorites: new Map(),
            localFriendFavorites: {},
            favoriteAvatars: [],
            favoriteWorlds: [],
            localAvatarFavorites: {},
            localWorldFavorites: {}
        });
    });

    test('sets ctx.name from cached user displayName so Quick Search indexes the friend', () => {
        mocks.userStore.cachedUsers.set('usr_new', {
            id: 'usr_new',
            displayName: 'NewFriend',
            currentAvatarThumbnailImageUrl: 'https://example.com/avatar.png'
        });

        const friendStore = useFriendStore();
        const searchIndexStore = useSearchIndexStore();

        friendStore.addFriend('usr_new', 'online');

        const ctx = friendStore.friends.get('usr_new');
        expect(ctx).toBeDefined();
        expect(ctx.name).toBe('NewFriend');

        searchIndexStore.syncFriend(ctx);
        expect(searchIndexStore.getSnapshot().friends).toEqual([
            {
                id: 'usr_new',
                name: 'NewFriend',
                memo: '',
                note: '',
                imageUrl: 'https://example.com/avatar.png'
            }
        ]);
    });

    test('preserves friendLog displayName when cached user has empty displayName', () => {
        mocks.userStore.cachedUsers.set('usr_existing', {
            id: 'usr_existing',
            displayName: ''
        });

        const friendStore = useFriendStore();
        friendStore.friendLog.set('usr_existing', {
            userId: 'usr_existing',
            displayName: 'LoggedName'
        });

        friendStore.addFriend('usr_existing', 'offline');

        const ctx = friendStore.friends.get('usr_existing');
        expect(ctx).toBeDefined();
        expect(ctx.name).toBe('LoggedName');
    });
});
