import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';

// ─── Mocks (must be before any imports that use them) ────────────────

vi.mock('vue-i18n', () => {
    const { ref } = require('vue');
    return {
        useI18n: () => ({
            t: (key, params) =>
                params ? `${key}:${JSON.stringify(params)}` : key,
            locale: ref('en')
        }),
        createI18n: () => ({
            global: { t: (key) => key, locale: ref('en') },
            install: vi.fn()
        })
    };
});

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

import UserDialogAvatarsTab from '../UserDialogAvatarsTab.vue';
import { useUserStore } from '../../../../stores';

// ─── Helpers ─────────────────────────────────────────────────────────

const MOCK_AVATARS = [
    {
        id: 'avtr_1',
        name: 'Alpha',
        thumbnailImageUrl: 'https://img/1.png',
        releaseStatus: 'public',
        authorId: 'usr_me'
    },
    {
        id: 'avtr_2',
        name: 'Beta',
        thumbnailImageUrl: 'https://img/2.png',
        releaseStatus: 'private',
        authorId: 'usr_me'
    },
    {
        id: 'avtr_3',
        name: 'Gamma',
        thumbnailImageUrl: 'https://img/3.png',
        releaseStatus: 'public',
        authorId: 'usr_me'
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
            id: 'usr_me',
            ref: { id: 'usr_me' },
            avatars: [...MOCK_AVATARS],
            avatarSorting: 'name',
            avatarReleaseStatus: 'all',
            isAvatarsLoading: false,
            isWorldsLoading: false,
            ...overrides
        },
        currentUser: {
            id: 'usr_me',
            ...overrides.currentUser
        }
    });

    return mount(UserDialogAvatarsTab, {
        global: {
            plugins: [pinia],
            stubs: {
                RefreshCw: { template: '<svg class="refresh-icon" />' },
                DeprecationAlert: {
                    template: '<div class="deprecation-stub" />'
                }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('UserDialogAvatarsTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders avatar count', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('3');
        });

        test('renders all avatars when releaseStatus is "all"', () => {
            const wrapper = mountComponent();
            const items = wrapper.findAll('.cursor-pointer');
            expect(items).toHaveLength(3);
        });

        test('renders avatar names', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Alpha');
            expect(wrapper.text()).toContain('Beta');
            expect(wrapper.text()).toContain('Gamma');
        });

        test('renders avatar thumbnails', () => {
            const wrapper = mountComponent();
            const images = wrapper.findAll('img');
            expect(images).toHaveLength(3);
            expect(images[0].attributes('src')).toBe('https://img/1.png');
        });

        test('shows deprecation alert for current user', () => {
            const wrapper = mountComponent();
            expect(wrapper.find('.deprecation-stub').exists()).toBe(true);
        });

        test('hides deprecation alert for other users', () => {
            const wrapper = mountComponent({
                id: 'usr_other',
                ref: { id: 'usr_other' }
            });
            expect(wrapper.find('.deprecation-stub').exists()).toBe(false);
        });

        test('shows empty state when no avatars and not loading', () => {
            const wrapper = mountComponent({ avatars: [] });
            expect(wrapper.text()).toContain('0');
        });
    });

    describe('filtering by releaseStatus', () => {
        test('shows only public avatars when releaseStatus is "public"', () => {
            const wrapper = mountComponent({ avatarReleaseStatus: 'public' });
            expect(wrapper.text()).toContain('Alpha');
            expect(wrapper.text()).toContain('Gamma');
            expect(wrapper.text()).not.toContain('Beta');
        });

        test('shows only private avatars when releaseStatus is "private"', () => {
            const wrapper = mountComponent({ avatarReleaseStatus: 'private' });
            expect(wrapper.text()).toContain('Beta');
            expect(wrapper.text()).not.toContain('Alpha');
            expect(wrapper.text()).not.toContain('Gamma');
        });
    });

    describe('search', () => {
        test('renders search input for current user', () => {
            const wrapper = mountComponent();
            const input = wrapper.find('input');
            expect(input.exists()).toBe(true);
        });

        test('renders search input for other users too', () => {
            const wrapper = mountComponent({
                id: 'usr_other',
                ref: { id: 'usr_other' }
            });
            const input = wrapper.find('input');
            expect(input.exists()).toBe(true);
        });

        test('filters avatars by search query', async () => {
            const wrapper = mountComponent();
            const input = wrapper.find('input');
            await input.setValue('alpha');
            expect(wrapper.text()).toContain('Alpha');
            expect(wrapper.text()).not.toContain('Beta');
            expect(wrapper.text()).not.toContain('Gamma');
        });

        test('search is case-insensitive', async () => {
            const wrapper = mountComponent();
            const input = wrapper.find('input');
            await input.setValue('BETA');
            expect(wrapper.text()).toContain('Beta');
        });

        test('shows all avatars when search query is cleared', async () => {
            const wrapper = mountComponent();
            const input = wrapper.find('input');
            await input.setValue('alpha');
            await input.setValue('');
            expect(wrapper.text()).toContain('Alpha');
            expect(wrapper.text()).toContain('Beta');
            expect(wrapper.text()).toContain('Gamma');
        });
    });

    describe('loading state', () => {
        test('disables refresh button when loading', () => {
            const wrapper = mountComponent({ isAvatarsLoading: true });
            const button = wrapper.find('button');
            expect(button.attributes('disabled')).toBeDefined();
        });
    });
});
