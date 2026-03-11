import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';

import FriendsLocationsCard from '../FriendsLocationsCard.vue';
import en from '../../../../localization/en.json';

vi.mock('../../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../../views/Feed/columns.jsx', () => ({
    columns: []
}));
vi.mock('../../../../plugins/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: ref({ path: '/', name: '', meta: {} }),
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} })
        }))
    };
});
vi.mock('../../../../plugins/interopApi', () => ({
    initInteropApi: vi.fn()
}));
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
        getString: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? '{}'),
        setString: vi.fn(),
        getBool: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? false),
        setBool: vi.fn(),
        getInt: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? 0),
        setInt: vi.fn(),
        getFloat: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? 0),
        setFloat: vi.fn(),
        getObject: vi.fn().mockReturnValue(null),
        setObject: vi.fn(),
        getArray: vi.fn().mockReturnValue([]),
        setArray: vi.fn(),
        remove: vi.fn()
    }
}));
vi.mock('../../../../services/jsonStorage', () => ({
    default: vi.fn()
}));
vi.mock('../../../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('../../../../shared/utils/world', () => ({
    getWorldName: vi.fn().mockResolvedValue(''),
    isRpcWorld: vi.fn().mockReturnValue(false)
}));
vi.mock('../../../../shared/utils/group', () => ({
    getGroupName: vi.fn().mockResolvedValue(''),
    hasGroupPermission: vi.fn().mockReturnValue(false),
    hasGroupModerationPermission: vi.fn().mockReturnValue(false)
}));

const {
    mockSendRequestInvite,
    mockSendInvite,
    mockSelfInvite,
    mockQueryFetch,
    mockShowUserDialog,
    mockCheckCanInvite,
    mockCheckCanInviteSelf,
    mockUserStatusClass,
    mockUserImage,
    mockToastSuccess,
    mockToastError,
    mockToastDismiss
} = vi.hoisted(() => ({
    mockSendRequestInvite: vi.fn().mockResolvedValue({}),
    mockSendInvite: vi.fn().mockResolvedValue({}),
    mockSelfInvite: vi.fn().mockResolvedValue({}),
    mockQueryFetch: vi.fn().mockResolvedValue({ ref: { name: 'Test World' } }),
    mockShowUserDialog: vi.fn(),
    mockCheckCanInvite: vi.fn().mockReturnValue(true),
    mockCheckCanInviteSelf: vi.fn().mockReturnValue(true),
    mockUserStatusClass: vi
        .fn()
        .mockReturnValue({ online: true, joinme: false, active: false }),
    mockUserImage: vi.fn().mockReturnValue('https://example.com/avatar.png'),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    mockToastDismiss: vi.fn()
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: (...args) => mockToastSuccess(...args),
        error: (...args) => mockToastError(...args),
        dismiss: (...args) => mockToastDismiss(...args)
    }
}));

vi.mock('../../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mockShowUserDialog(...args)
}));

vi.mock('../../../../composables/useInviteChecks', () => ({
    useInviteChecks: () => ({
        checkCanInvite: (...args) => mockCheckCanInvite(...args),
        checkCanInviteSelf: (...args) => mockCheckCanInviteSelf(...args)
    })
}));

vi.mock('../../../../composables/useUserDisplay', () => ({
    useUserDisplay: () => ({
        userImage: (...args) => mockUserImage(...args),
        userStatusClass: (...args) => mockUserStatusClass(...args)
    })
}));

vi.mock('../../../../api', () => {
    const p = (overrides = {}) =>
        new Proxy(overrides, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue({});
            }
        });
    return {
        request: p(),
        userRequest: p(),
        worldRequest: p(),
        instanceRequest: p({
            selfInvite: (...args) => mockSelfInvite(...args)
        }),
        friendRequest: p(),
        avatarRequest: p(),
        notificationRequest: p({
            sendRequestInvite: (...args) => mockSendRequestInvite(...args),
            sendInvite: (...args) => mockSendInvite(...args)
        }),
        playerModerationRequest: p(),
        avatarModerationRequest: p(),
        favoriteRequest: p(),
        vrcPlusIconRequest: p(),
        vrcPlusImageRequest: p(),
        inviteMessagesRequest: p(),
        miscRequest: p(),
        authRequest: p(),
        groupRequest: p(),
        inventoryRequest: p(),
        propRequest: p(),
        imageRequest: p(),
        queryRequest: p({
            fetch: (...args) => mockQueryFetch(...args)
        })
    };
});

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

// Stub all complex UI components — render slots transparently
const stubs = {
    ContextMenu: { template: '<div data-testid="context-menu"><slot /></div>' },
    ContextMenuTrigger: {
        template: '<div data-testid="context-menu-trigger"><slot /></div>',
        props: ['as-child']
    },
    ContextMenuContent: {
        template: '<div data-testid="context-menu-content"><slot /></div>'
    },
    ContextMenuItem: {
        template:
            '<button data-testid="context-menu-item" :data-disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        props: ['disabled'],
        emits: ['click']
    },
    ContextMenuSeparator: {
        template: '<hr data-testid="context-menu-separator" />'
    },
    Card: {
        template:
            '<div data-testid="card" v-bind="$attrs" @click="$emit(\'click\')"><slot /></div>',
        props: ['class', 'style'],
        emits: ['click']
    },
    Avatar: { template: '<div><slot /></div>', props: ['class', 'style'] },
    AvatarImage: { template: '<img />', props: ['src'] },
    AvatarFallback: { template: '<span><slot /></span>' },
    Location: {
        template: '<span class="location-stub" />',
        props: ['location', 'traveling', 'link', 'class']
    },
    Pencil: { template: '<span class="pencil-icon" />', props: ['class'] },
    TooltipWrapper: {
        template: '<span><slot /></span>',
        props: ['content', 'disabled', 'delayDuration', 'side']
    }
};

/**
 *
 * @param overrides
 */
function makeFriend(overrides = {}) {
    return {
        id: 'usr_test123',
        name: 'TestUser',
        state: 'online',
        status: 'active',
        ref: {
            location: 'wrld_12345:67890~region(us)',
            travelingToLocation: '',
            statusDescription: 'Hello World',
            status: 'active'
        },
        pendingOffline: false,
        worldName: 'Test World',
        ...overrides
    };
}

/**
 *
 * @param props
 * @param storeState
 */
function mountCard(props = {}, storeState = {}) {
    const friend = props.friend ?? makeFriend();
    return mount(FriendsLocationsCard, {
        props: { friend, ...props },
        global: {
            plugins: [
                i18n,
                createTestingPinia({
                    stubActions: true,
                    initialState: {
                        Game: {
                            isGameRunning: storeState.isGameRunning ?? false
                        },
                        Location: {
                            lastLocation: storeState.lastLocation ?? {
                                location: 'wrld_abc:123~region(us)'
                            },
                            lastLocationDestination:
                                storeState.lastLocationDestination ?? ''
                        },
                        User: {
                            currentUser: storeState.currentUser ?? {
                                isBoopingEnabled: true
                            }
                        },
                        Launch: {},
                        Instance: {},
                        World: {},
                        Search: {},
                        AppearanceSettings: { showInstanceIdInLocation: false },
                        Group: {}
                    }
                })
            ],
            stubs
        }
    });
}

/**
 *
 * @param wrapper
 */
function getMenuItems(wrapper) {
    return wrapper.findAll('[data-testid="context-menu-item"]');
}

/**
 *
 * @param wrapper
 */
function getMenuItemTexts(wrapper) {
    return getMenuItems(wrapper).map((item) => item.text().trim());
}

/**
 *
 * @param wrapper
 * @param text
 */
function getMenuItemByText(wrapper, text) {
    return getMenuItems(wrapper).find((item) => item.text().trim() === text);
}

describe('FriendsLocationsCard.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCheckCanInvite.mockReturnValue(true);
        mockCheckCanInviteSelf.mockReturnValue(true);
        mockUserStatusClass.mockReturnValue({
            online: true,
            joinme: false,
            active: false
        });
    });

    describe('basic rendering', () => {
        test('renders friend name', () => {
            const wrapper = mountCard();
            expect(wrapper.text()).toContain('TestUser');
        });

        test('renders status description', () => {
            const wrapper = mountCard();
            expect(wrapper.text()).toContain('Hello World');
        });

        test('renders avatar fallback from first letter of name', () => {
            const wrapper = mountCard({
                friend: makeFriend({ name: 'Alice' })
            });
            expect(wrapper.text()).toContain('A');
        });

        test('shows ? as avatar fallback when name is empty', () => {
            const wrapper = mountCard({
                friend: makeFriend({ name: undefined })
            });
            expect(wrapper.text()).toContain('?');
        });

        test('hides location when displayInstanceInfo is false', () => {
            const wrapper = mountCard({ displayInstanceInfo: false });
            expect(wrapper.find('.location-stub').exists()).toBe(false);
        });

        test('shows location when displayInstanceInfo is true', () => {
            const wrapper = mountCard({ displayInstanceInfo: true });
            expect(wrapper.find('.location-stub').exists()).toBe(true);
        });
    });

    describe('context menu visibility', () => {
        test('shows Request Invite for online friends', () => {
            const wrapper = mountCard({
                friend: makeFriend({ state: 'online' })
            });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).toContain('Request Invite');
        });

        test('hides Request Invite for non-online friends', () => {
            const wrapper = mountCard({
                friend: makeFriend({ state: 'active' })
            });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).not.toContain('Request Invite');
        });

        test('shows Invite when game is running', () => {
            const wrapper = mountCard({}, { isGameRunning: true });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).toContain('Invite');
        });

        test('hides Invite when game is not running', () => {
            const wrapper = mountCard({}, { isGameRunning: false });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).not.toContain('Invite');
        });

        test('always shows Send Boop', () => {
            const wrapper = mountCard(
                { friend: makeFriend({ state: 'active' }) },
                { isGameRunning: false }
            );
            const texts = getMenuItemTexts(wrapper);
            expect(texts).toContain('Send Boop');
        });

        test('shows Launch/Invite and Invite Yourself for online friends with real location', () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'wrld_12345:67890~region(us)' }
                })
            });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).toContain('Launch/Invite');
            expect(texts).toContain('Invite Yourself');
        });

        test('hides Launch/Invite and Invite Yourself for friends without real location', () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'private' }
                })
            });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).not.toContain('Launch/Invite');
            expect(texts).not.toContain('Invite Yourself');
        });

        test('hides Launch/Invite and Invite Yourself for non-online friends', () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'active',
                    ref: { location: 'wrld_12345:67890~region(us)' }
                })
            });
            const texts = getMenuItemTexts(wrapper);
            expect(texts).not.toContain('Launch/Invite');
            expect(texts).not.toContain('Invite Yourself');
        });

        test('shows separator when friend is online with real location', () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'wrld_12345:67890~region(us)' }
                })
            });
            expect(
                wrapper.find('[data-testid="context-menu-separator"]').exists()
            ).toBe(true);
        });

        test('hides separator when friend has no real location', () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'private' }
                })
            });
            expect(
                wrapper.find('[data-testid="context-menu-separator"]').exists()
            ).toBe(false);
        });

        test('shows Invite but disabled when cannot invite to my location', () => {
            mockCheckCanInvite.mockReturnValue(false);
            const wrapper = mountCard({}, { isGameRunning: true });
            const inviteItem = getMenuItemByText(wrapper, 'Invite');
            expect(inviteItem?.attributes('data-disabled')).toBe('true');
        });

        test('shows Launch/Invite but disabled when cannot join friend instance', () => {
            mockCheckCanInviteSelf.mockReturnValue(false);
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'wrld_12345:67890~region(us)' }
                })
            });
            const launchInviteItem = getMenuItemByText(wrapper, 'Launch/Invite');
            const inviteYourselfItem = getMenuItemByText(wrapper, 'Invite Yourself');
            expect(launchInviteItem?.attributes('data-disabled')).toBe('true');
            expect(inviteYourselfItem?.attributes('data-disabled')).toBe('true');
        });
    });

    describe('context menu disabled states', () => {
        test('Send Boop is disabled when booping is not enabled', () => {
            const wrapper = mountCard(
                {},
                { currentUser: { isBoopingEnabled: false } }
            );
            const boopItem = getMenuItems(wrapper).find(
                (item) => item.text().trim() === 'Send Boop'
            );
            expect(boopItem?.attributes('data-disabled')).toBe('true');
        });

        test('Send Boop is enabled when booping is enabled', () => {
            const wrapper = mountCard(
                {},
                { currentUser: { isBoopingEnabled: true } }
            );
            const boopItem = getMenuItems(wrapper).find(
                (item) => item.text().trim() === 'Send Boop'
            );
            expect(boopItem?.attributes('data-disabled')).toBe('false');
        });
    });

    describe('context menu actions', () => {
        test('friendRequestInvite calls sendRequestInvite API', async () => {
            const wrapper = mountCard({
                friend: makeFriend({ state: 'online' })
            });
            const requestInviteItem = getMenuItemByText(wrapper, 'Request Invite');
            await requestInviteItem.trigger('click');
            expect(mockSendRequestInvite).toHaveBeenCalledWith(
                { platform: 'standalonewindows' },
                'usr_test123'
            );
        });

        test('friendInvite resolves traveling location and calls sendInvite API', async () => {
            const wrapper = mountCard(
                {},
                {
                    isGameRunning: true,
                    lastLocation: { location: 'traveling' },
                    lastLocationDestination: 'wrld_dest:inst~region(us)'
                }
            );
            const inviteItem = getMenuItemByText(wrapper, 'Invite');
            await inviteItem.trigger('click');
            await flushPromises();
            expect(mockQueryFetch).toHaveBeenCalledWith('world.location', {
                worldId: 'wrld_dest'
            });
            expect(mockSendInvite).toHaveBeenCalledTimes(1);
            const [payload, userId] = mockSendInvite.mock.calls[0];
            expect(payload.instanceId).toBe(payload.worldId);
            expect(payload.worldName).toBe('Test World');
            expect(userId).toBe('usr_test123');
        });

        test('friendInviteSelf calls selfInvite API', async () => {
            const wrapper = mountCard({
                friend: makeFriend({
                    state: 'online',
                    ref: { location: 'wrld_12345:67890~region(us)' }
                })
            });
            const selfInviteItem = getMenuItemByText(wrapper, 'Invite Yourself');
            await selfInviteItem.trigger('click');
            expect(mockSelfInvite).toHaveBeenCalledWith({
                instanceId: '67890~region(us)',
                worldId: 'wrld_12345'
            });
        });

        test('clicking card opens user dialog', async () => {
            const wrapper = mountCard();
            await wrapper.find('[data-testid="card"]').trigger('click');
            expect(mockShowUserDialog).toHaveBeenCalledWith('usr_test123');
        });
    });

    describe('status dot classes', () => {
        test('shows join status class when user status indicates join me', () => {
            mockUserStatusClass.mockReturnValue({
                joinme: true,
                online: false,
                active: false
            });
            const wrapper = mountCard();
            expect(wrapper.find('.friend-card__status-dot').classes()).toContain(
                'friend-card__status-dot--join'
            );
        });

        test('shows active busy status class when active + busy', () => {
            mockUserStatusClass.mockReturnValue({
                joinme: false,
                online: false,
                active: true
            });
            const wrapper = mountCard({
                friend: makeFriend({ status: 'busy' })
            });
            expect(wrapper.find('.friend-card__status-dot').classes()).toContain(
                'friend-card__status-dot--active-busy'
            );
        });
    });
});
