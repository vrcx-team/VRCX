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

import GroupDialogPostsTab from '../GroupDialogPostsTab.vue';
import { useGroupStore } from '../../../../stores';

// ─── Helpers ─────────────────────────────────────────────────────────

const MOCK_POSTS = [
    {
        id: 'post_1',
        title: 'Welcome Post',
        text: 'Hello everyone!',
        imageUrl: 'https://img/post1.png',
        authorId: 'usr_author1',
        editorId: null,
        roleIds: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'post_2',
        title: 'Rules Update',
        text: 'Updated rules here.',
        imageUrl: null,
        authorId: 'usr_author2',
        editorId: 'usr_editor',
        roleIds: ['role_1'],
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
    },
    {
        id: 'post_3',
        title: 'Event Announcement',
        text: '',
        imageUrl: null,
        authorId: 'usr_author1',
        editorId: null,
        roleIds: [],
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z'
    }
];

/**
 * @param {object} overrides
 */
function mountComponent(overrides = {}) {
    const pinia = createTestingPinia({
        stubActions: false
    });

    const groupStore = useGroupStore(pinia);
    groupStore.$patch({
        groupDialog: {
            id: 'grp_1',
            visible: true,
            posts: [...MOCK_POSTS],
            postsFiltered: [...MOCK_POSTS],
            postsSearch: '',
            ref: {
                roles: [
                    { id: 'role_1', name: 'Admin' },
                    { id: 'role_2', name: 'Member' }
                ],
                permissions: []
            },
            ...overrides
        }
    });

    return mount(GroupDialogPostsTab, {
        global: {
            plugins: [pinia],
            stubs: {
                Eye: { template: '<svg class="eye-icon" />' },
                Pencil: { template: '<svg class="pencil-icon" />' },
                Trash2: { template: '<svg class="trash-icon" />' }
            }
        },
        props: {
            showGroupPostEditDialog: vi.fn(),
            confirmDeleteGroupPost: vi.fn()
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GroupDialogPostsTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders post count', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('3');
        });

        test('renders all post titles', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Welcome Post');
            expect(wrapper.text()).toContain('Rules Update');
            expect(wrapper.text()).toContain('Event Announcement');
        });

        test('renders post text', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Hello everyone!');
            expect(wrapper.text()).toContain('Updated rules here.');
        });

        test('renders dash for empty post text', () => {
            const wrapper = mountComponent({
                posts: [MOCK_POSTS[2]],
                postsFiltered: [MOCK_POSTS[2]]
            });
            const preElements = wrapper.findAll('pre');
            expect(preElements.some((pre) => pre.text() === '-')).toBe(true);
        });

        test('renders post image when imageUrl exists', () => {
            const wrapper = mountComponent();
            const images = wrapper.findAll('img');
            expect(
                images.some(
                    (img) => img.attributes('src') === 'https://img/post1.png'
                )
            ).toBe(true);
        });

        test('does not render image for posts without imageUrl', () => {
            const wrapper = mountComponent({
                posts: [MOCK_POSTS[1]],
                postsFiltered: [MOCK_POSTS[1]]
            });
            expect(wrapper.findAll('img')).toHaveLength(0);
        });

        test('renders search input', () => {
            const wrapper = mountComponent();
            expect(
                wrapper.findComponent({ name: 'InputGroupField' }).exists()
            ).toBe(true);
        });

        test('renders empty state when no posts', () => {
            const wrapper = mountComponent({ posts: [], postsFiltered: [] });
            expect(wrapper.text()).toContain('0');
        });
    });

    describe('filtered posts', () => {
        test('renders only filtered posts', () => {
            const wrapper = mountComponent({
                postsFiltered: [MOCK_POSTS[0]]
            });
            const postItems = wrapper.findAll('.cursor-default');
            // should only render 1 filtered post
            expect(postItems).toHaveLength(1);
            expect(wrapper.text()).toContain('Welcome Post');
        });
    });
});
