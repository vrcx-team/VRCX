import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';

// ─── Mocks ───────────────────────────────────────────────────────────

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
vi.mock('../../../../services/request', () => ({
    request: vi.fn().mockResolvedValue({ json: {} }),
    processBulk: vi.fn(),
    buildRequestInit: vi.fn(),
    parseResponse: vi.fn(),
    shouldIgnoreError: vi.fn(),
    $throw: vi.fn(),
    failedGetRequests: new Map()
}));

import * as worldCoordinatorModule from '../../../../coordinators/worldCoordinator';
vi.mock('../../../../coordinators/worldCoordinator', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, showWorldDialog: vi.fn() };
});

import UserDialogWorldsTab from '../UserDialogWorldsTab.vue';
import { useUserStore } from '../../../../stores';
import {
    userDialogWorldSortingOptions,
    userDialogWorldOrderOptions
} from '../../../../shared/constants';

// ─── Helpers ─────────────────────────────────────────────────────────

const MOCK_WORLDS = [
    {
        id: 'wrld_1',
        name: 'Sunset Valley',
        thumbnailImageUrl: 'https://img/world1.png',
        occupants: 12,
        authorId: 'usr_me'
    },
    {
        id: 'wrld_2',
        name: 'Midnight Club',
        thumbnailImageUrl: 'https://img/world2.png',
        occupants: 5,
        authorId: 'usr_me'
    },
    {
        id: 'wrld_3',
        name: 'Cozy Cottage',
        thumbnailImageUrl: 'https://img/world3.png',
        occupants: 0,
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
            worlds: [...MOCK_WORLDS],
            worldSorting: userDialogWorldSortingOptions.name,
            worldOrder: userDialogWorldOrderOptions.descending,
            isWorldsLoading: false,
            ...overrides
        },
        currentUser: {
            id: 'usr_me',
            ...overrides.currentUser
        }
    });

    return mount(UserDialogWorldsTab, {
        global: {
            plugins: [pinia],
            stubs: {
                RefreshCw: { template: '<svg class="refresh-icon" />' }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('UserDialogWorldsTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders world count', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('3');
        });

        test('renders all worlds', () => {
            const wrapper = mountComponent();
            const items = wrapper.findAll('.cursor-pointer');
            expect(items).toHaveLength(3);
        });

        test('renders world names', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Sunset Valley');
            expect(wrapper.text()).toContain('Midnight Club');
            expect(wrapper.text()).toContain('Cozy Cottage');
        });

        test('renders world thumbnail images', () => {
            const wrapper = mountComponent();
            const images = wrapper.findAll('img');
            expect(images).toHaveLength(3);
            expect(images[0].attributes('src')).toBe('https://img/world1.png');
        });

        test('renders occupant count for worlds with occupants', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('12');
            expect(wrapper.text()).toContain('5');
        });

        test('does not render occupant count for worlds with zero occupants', () => {
            const wrapper = mountComponent({
                worlds: [
                    {
                        id: 'wrld_3',
                        name: 'Empty',
                        thumbnailImageUrl: '',
                        occupants: 0
                    }
                ]
            });
            // The (0) should NOT be rendered because v-if="world.occupants" is falsy for 0
            const items = wrapper.findAll('.cursor-pointer');
            expect(items).toHaveLength(1);
            expect(wrapper.text()).not.toContain('(0)');
        });

        test('renders empty state when no worlds and not loading', () => {
            const wrapper = mountComponent({ worlds: [] });
            expect(wrapper.text()).toContain('0');
        });
    });

    describe('loading state', () => {
        test('disables refresh button when loading', () => {
            const wrapper = mountComponent({ isWorldsLoading: true });
            const button = wrapper.find('button');
            expect(button.attributes('disabled')).toBeDefined();
        });

        test('refresh button is enabled when not loading', () => {
            const wrapper = mountComponent({ isWorldsLoading: false });
            const button = wrapper.find('button');
            expect(button.attributes('disabled')).toBeUndefined();
        });
    });

    describe('click interactions', () => {
        test('calls showWorldDialog when a world is clicked', async () => {
            const pinia = createTestingPinia({ stubActions: false });
            const userStore = useUserStore(pinia);
            const showWorldDialogSpy = vi
                .spyOn(worldCoordinatorModule, 'showWorldDialog')
                .mockImplementation(() => {});

            userStore.$patch({
                userDialog: {
                    id: 'usr_me',
                    ref: { id: 'usr_me' },
                    worlds: [...MOCK_WORLDS],
                    worldSorting: userDialogWorldSortingOptions.name,
                    worldOrder: userDialogWorldOrderOptions.descending,
                    isWorldsLoading: false
                },
                currentUser: { id: 'usr_me' }
            });

            const wrapper = mount(UserDialogWorldsTab, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        RefreshCw: { template: '<svg class="refresh-icon" />' }
                    }
                }
            });

            const firstItem = wrapper.findAll('.cursor-pointer')[0];
            await firstItem.trigger('click');
            expect(showWorldDialogSpy).toHaveBeenCalledWith('wrld_1');
        });
    });
});
