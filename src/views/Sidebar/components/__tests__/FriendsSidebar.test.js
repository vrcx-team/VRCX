import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    friendStore: {
        allFavoriteOnlineFriends: { value: [] },
        allFavoriteFriendIds: { value: new Set() },
        onlineFriends: { value: [] },
        activeFriends: { value: [] },
        offlineFriends: { value: [] },
        friendsInSameInstance: { value: [] }
    },
    appearanceStore: {
        isSidebarGroupByInstance: { value: false },
        isHideFriendsInSameInstance: { value: false },
        isSameInstanceAboveFavorites: { value: false },
        isSidebarDivideByFriendGroup: { value: false },
        sidebarFavoriteGroups: { value: [] },
        sidebarFavoriteGroupOrder: { value: [] },
        sidebarSortMethods: { value: [] }
    },
    advancedStore: {
        gameLogDisabled: { value: false }
    },
    userStore: {
        showSendBoopDialog: vi.fn(),
        currentUser: {
            value: {
                id: 'usr_me',
                displayName: 'Me',
                $userColour: '#fff',
                statusDescription: 'Ready',
                status: 'active',
                statusHistory: [],
                isBoopingEnabled: true,
                $locationTag: 'wrld_me:123',
                $travelingToLocation: ''
            }
        }
    },
    launchStore: {
        showLaunchDialog: vi.fn()
    },
    favoriteStore: {
        favoriteFriendGroups: { value: [] },
        groupedByGroupKeyFavoriteFriends: { value: {} },
        localFriendFavorites: { value: {} }
    },
    locationStore: {
        lastLocation: {
            value: { location: 'wrld_home:123', friendList: new Map() }
        },
        lastLocationDestination: { value: '' }
    },
    gameStore: {
        isGameRunning: { value: true }
    },
    instanceStore: {
        cachedInstances: new Map()
    },
    configRepository: {
        getBool: vi.fn(),
        setBool: vi.fn(),
        getArray: vi.fn(),
        setArray: vi.fn()
    },
    notificationRequest: {
        sendRequestInvite: vi.fn().mockResolvedValue({}),
        sendInvite: vi.fn().mockResolvedValue({})
    },
    worldRequest: {},
    instanceRequest: {
        selfInvite: vi.fn().mockResolvedValue({})
    },
    userRequest: {
        saveCurrentUser: vi.fn().mockResolvedValue({})
    },
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    }
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('@tanstack/vue-virtual', () => ({
    useVirtualizer: (optionsRef) => ({
        value: {
            getVirtualItems: () => {
                const options = optionsRef.value;
                return Array.from({ length: options.count }, (_, index) => ({
                    index,
                    key: options.getItemKey?.(index) ?? index,
                    start: index * 52
                }));
            },
            getTotalSize: () => optionsRef.value.count * 52,
            measure: vi.fn(),
            measureElement: vi.fn()
        }
    })
}));

vi.mock('../../../../stores', () => ({
    useFriendStore: () => mocks.friendStore,
    useAppearanceSettingsStore: () => mocks.appearanceStore,
    useAdvancedSettingsStore: () => mocks.advancedStore,
    useFavoriteStore: () => mocks.favoriteStore,
    useGameStore: () => mocks.gameStore,
    useLaunchStore: () => mocks.launchStore,
    useLocationStore: () => mocks.locationStore,
    useInstanceStore: () => mocks.instanceStore,
    useUserStore: () => mocks.userStore
}));

vi.mock('../../../../coordinators/userCoordinator', () => ({
    showUserDialog: vi.fn()
}));

vi.mock('../../../../shared/utils', () => ({
    getFriendsSortFunction: () => (a, b) => a.id.localeCompare(b.id),
    isRealInstance: (location) =>
        typeof location === 'string' && location.startsWith('wrld_'),
    userImage: vi.fn(() => 'https://example.com/avatar.png'),
    userStatusClass: vi.fn(() => ''),
    parseLocation: vi.fn((location) => ({
        worldId: location?.split(':')[0] ?? '',
        instanceId: location?.split(':')[1] ?? '',
        tag: location ?? ''
    }))
}));

vi.mock('../../../../shared/utils/invite.js', () => ({
    checkCanInvite: vi.fn(() => true),
    checkCanInviteSelf: vi.fn(() => true)
}));

vi.mock('../../../../shared/utils/location.js', () => ({
    getFriendsLocations: vi.fn(() => 'wrld_same:1')
}));

vi.mock('../../../../services/config', () => ({
    default: mocks.configRepository
}));

vi.mock('../../../../api', () => ({
    notificationRequest: mocks.notificationRequest,
    worldRequest: mocks.worldRequest,
    instanceRequest: mocks.instanceRequest,
    userRequest: mocks.userRequest
}));

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../components/ui/context-menu', () => ({
    ContextMenu: { template: '<div><slot /></div>' },
    ContextMenuTrigger: { template: '<div><slot /></div>' },
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuItem: {
        emits: ['click'],
        props: ['disabled'],
        template:
            '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
    },
    ContextMenuSeparator: { template: '<hr />' },
    ContextMenuShortcut: { template: '<span><slot /></span>' },
    ContextMenuSub: { template: '<div><slot /></div>' },
    ContextMenuSubContent: { template: '<div><slot /></div>' },
    ContextMenuSubTrigger: { template: '<div><slot /></div>' },
    ContextMenuCheckboxItem: {
        emits: ['click'],
        props: ['modelValue'],
        template: '<button @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('../../../../components/BackToTop.vue', () => ({
    default: { template: '<div data-testid="back-to-top" />' }
}));

vi.mock('../../../../components/Location.vue', () => ({
    default: {
        props: ['location', 'traveling', 'link'],
        template: '<span data-testid="location">{{ location }}</span>'
    }
}));

vi.mock('../FriendItem.vue', () => ({
    default: {
        props: ['friend'],
        template: '<div data-testid="friend-item">{{ friend.id }}</div>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    ChevronDown: { template: '<span data-testid="chevron" />' },
    Clock: { template: '<span data-testid="clock" />' },
    User: { template: '<i />' }
}));

vi.mock('../../../../composables/useRecentActions', () => ({
    isActionRecent: vi.fn(() => false),
    recordRecentAction: vi.fn()
}));

import FriendsSidebar from '../FriendsSidebar.vue';

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeFriend(id, location = 'wrld_online:1') {
    return {
        id,
        state: 'online',
        pendingOffline: false,
        ref: {
            location,
            $location: {
                tag: location
            }
        }
    };
}

describe('FriendsSidebar.vue', () => {
    beforeEach(() => {
        mocks.friendStore.allFavoriteOnlineFriends.value = [];
        mocks.friendStore.allFavoriteFriendIds.value = new Set();
        mocks.friendStore.onlineFriends.value = [];
        mocks.friendStore.activeFriends.value = [];
        mocks.friendStore.offlineFriends.value = [];
        mocks.friendStore.friendsInSameInstance.value = [];
        mocks.instanceStore.cachedInstances = new Map();

        mocks.appearanceStore.isSidebarGroupByInstance.value = false;
        mocks.appearanceStore.isHideFriendsInSameInstance.value = false;
        mocks.appearanceStore.isSidebarDivideByFriendGroup.value = false;
        mocks.appearanceStore.sidebarFavoriteGroups.value = [];
        mocks.appearanceStore.sidebarFavoriteGroupOrder.value = [];
        mocks.appearanceStore.sidebarSortMethods.value = [];

        mocks.configRepository.getBool.mockImplementation(
            (_key, defaultValue) => Promise.resolve(defaultValue ?? false)
        );
        mocks.configRepository.setBool.mockResolvedValue(undefined);
        mocks.configRepository.getArray.mockResolvedValue([]);
        mocks.configRepository.setArray.mockResolvedValue(undefined);
        vi.clearAllMocks();
    });

    test('renders online section and friend rows', async () => {
        mocks.friendStore.onlineFriends.value = [makeFriend('usr_online')];

        const wrapper = mount(FriendsSidebar);
        await flushPromises();
        await nextTick();

        expect(wrapper.text()).toContain('side_panel.online');
        expect(wrapper.findAll('[data-testid="friend-item"]').length).toBe(1);
        expect(wrapper.text()).toContain('usr_online');
    });

    test('clicking online header collapses online rows and persists state', async () => {
        mocks.friendStore.onlineFriends.value = [makeFriend('usr_online')];
        const wrapper = mount(FriendsSidebar);
        await flushPromises();
        await nextTick();

        const onlineHeader = wrapper
            .findAll('div.cursor-pointer')
            .find((node) => node.text().includes('side_panel.online'));
        expect(onlineHeader).toBeTruthy();

        await onlineHeader.trigger('click');
        await flushPromises();
        await nextTick();

        expect(wrapper.findAll('[data-testid="friend-item"]').length).toBe(0);
        expect(mocks.configRepository.setBool).toHaveBeenCalledWith(
            'VRCX_isFriendsGroupOnline',
            false
        );
    });

    test('renders same-instance section when grouping is enabled', async () => {
        mocks.appearanceStore.isSidebarGroupByInstance.value = true;
        mocks.friendStore.friendsInSameInstance.value = [
            [
                makeFriend('usr_a', 'wrld_same:1'),
                makeFriend('usr_b', 'wrld_same:1')
            ]
        ];

        const wrapper = mount(FriendsSidebar);
        await flushPromises();
        await nextTick();

        expect(wrapper.text()).toContain('side_panel.same_instance');
        expect(wrapper.findAll('[data-testid="friend-item"]').length).toBe(2);
        expect(wrapper.text()).toContain('(2)');
    });
});
