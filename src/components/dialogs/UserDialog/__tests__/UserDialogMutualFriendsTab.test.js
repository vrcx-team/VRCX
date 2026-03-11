import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';

// ─── Mocks ───────────────────────────────────────────────────────────

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
        locale: require('vue').ref('en')
    }),
    createI18n: () => ({
        global: { t: (key) => key , locale: require('vue').ref('en') },
        install: vi.fn()
    })
}));

vi.mock('../../../../plugins/router', () => {
    const { ref } = require('vue');
    return {
        router: {
            beforeEach: vi.fn(),
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} }),
            isReady: vi.fn().mockResolvedValue(true)
        },
        initRouter: vi.fn()
    };
});
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    const { ref } = require('vue');
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} })
        }))
    };
});
vi.mock('../../../../plugins/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(null);
            }
        }
    )
}));
vi.mock('../../../../services/config', () => ({
    default: {
        init: vi.fn(),
        getString: vi.fn().mockImplementation((_k, d) => d ?? '{}'),
        setString: vi.fn(),
        getBool: vi.fn().mockImplementation((_k, d) => d ?? false),
        setBool: vi.fn(),
        getInt: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setInt: vi.fn(),
        getFloat: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setFloat: vi.fn(),
        getObject: vi.fn().mockReturnValue(null),
        setObject: vi.fn(),
        getArray: vi.fn().mockReturnValue([]),
        setArray: vi.fn(),
        remove: vi.fn()
    }
}));
vi.mock('../../../../services/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('../../../../services/request', () => ({
    request: vi.fn().mockResolvedValue({ json: {} }),
    processBulk: vi.fn(),
    buildRequestInit: vi.fn(),
    parseResponse: vi.fn(),
    shouldIgnoreError: vi.fn(),
    $throw: vi.fn(),
    failedGetRequests: new Map()
}));

import * as userCoordinatorModule from '../../../../coordinators/userCoordinator';
vi.mock('../../../../coordinators/userCoordinator', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, showUserDialog: vi.fn() };
});

import UserDialogMutualFriendsTab from '../UserDialogMutualFriendsTab.vue';
import { useUserStore } from '../../../../stores';
import { userDialogMutualFriendSortingOptions } from '../../../../shared/constants';

// ─── Helpers ─────────────────────────────────────────────────────────

const MOCK_MUTUAL_FRIENDS = [
    {
        id: 'usr_1',
        displayName: 'Charlie',
        $userColour: '#ff0000',
        currentAvatarThumbnailImageUrl: 'https://img/charlie.png'
    },
    {
        id: 'usr_2',
        displayName: 'Alice',
        $userColour: '#00ff00',
        currentAvatarThumbnailImageUrl: 'https://img/alice.png'
    },
    {
        id: 'usr_3',
        displayName: 'Bob',
        $userColour: '#0000ff',
        currentAvatarThumbnailImageUrl: 'https://img/bob.png'
    }
];

/**
 *
 * @param overrides
 */
function mountComponent(overrides = {}) {
    const pinia = createTestingPinia({
        stubActions: false
    });

    const userStore = useUserStore(pinia);
    userStore.$patch({
        userDialog: {
            id: 'usr_target',
            ref: { id: 'usr_target' },
            mutualFriends: [...MOCK_MUTUAL_FRIENDS],
            mutualFriendSorting:
                userDialogMutualFriendSortingOptions.alphabetical,
            isMutualFriendsLoading: false,
            ...overrides
        },
        currentUser: {
            id: 'usr_me',
            hasSharedConnectionsOptOut: false,
            ...overrides.currentUser
        }
    });

    return mount(UserDialogMutualFriendsTab, {
        global: {
            plugins: [pinia],
            stubs: {
                RefreshCw: { template: '<svg class="refresh-icon" />' }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('UserDialogMutualFriendsTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders mutual friend count', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('3');
        });

        test('renders all mutual friends', () => {
            const wrapper = mountComponent();
            const items = wrapper.findAll('li');
            expect(items).toHaveLength(3);
        });

        test('renders friend display names', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Charlie');
            expect(wrapper.text()).toContain('Alice');
            expect(wrapper.text()).toContain('Bob');
        });

        test('renders friend avatar images', () => {
            const wrapper = mountComponent();
            const images = wrapper.findAll('img');
            expect(images).toHaveLength(3);
        });

        test('applies user colour to display name', () => {
            const wrapper = mountComponent();
            const nameSpan = wrapper.find('span[style*="color"]');
            expect(nameSpan.exists()).toBe(true);
        });

        test('renders empty list when no mutual friends', () => {
            const wrapper = mountComponent({ mutualFriends: [] });
            const items = wrapper.findAll('li');
            expect(items).toHaveLength(0);
            expect(wrapper.text()).toContain('0');
        });
    });

    describe('loading state', () => {
        test('disables refresh button when loading', () => {
            const wrapper = mountComponent({ isMutualFriendsLoading: true });
            const button = wrapper.find('button');
            expect(button.attributes('disabled')).toBeDefined();
        });

        test('refresh button is enabled when not loading', () => {
            const wrapper = mountComponent({ isMutualFriendsLoading: false });
            const button = wrapper.find('button');
            expect(button.attributes('disabled')).toBeUndefined();
        });
    });

    describe('click interactions', () => {
        test('calls showUserDialog when a friend is clicked', async () => {
            const pinia = createTestingPinia({ stubActions: false });
            const userStore = useUserStore(pinia);
            userStore.$patch({
                userDialog: {
                    id: 'usr_target',
                    ref: { id: 'usr_target' },
                    mutualFriends: [...MOCK_MUTUAL_FRIENDS],
                    mutualFriendSorting:
                        userDialogMutualFriendSortingOptions.alphabetical,
                    isMutualFriendsLoading: false
                },
                currentUser: { id: 'usr_me' }
            });
            const showUserDialogSpy = vi
                .spyOn(userCoordinatorModule, 'showUserDialog')
                .mockImplementation(() => {});

            const wrapper = mount(UserDialogMutualFriendsTab, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        RefreshCw: { template: '<svg class="refresh-icon" />' }
                    }
                }
            });

            const firstItem = wrapper.findAll('li')[0];
            await firstItem.trigger('click');
            expect(showUserDialogSpy).toHaveBeenCalledWith('usr_1');
        });
    });
});
