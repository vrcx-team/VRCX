import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import AvatarInfo from '../AvatarInfo.vue';
import en from '../../localization/en.json';

vi.mock('../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../views/Feed/columns.jsx', () => ({
    columns: []
}));
vi.mock('../../plugin/router', () => ({
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
vi.mock('../../plugin/interopApi', () => ({
    initInteropApi: vi.fn()
}));
vi.mock('../../service/database', () => ({
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
vi.mock('../../service/config', () => ({
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
vi.mock('../../service/jsonStorage', () => ({
    default: vi.fn()
}));
vi.mock('../../service/watchState', () => ({
    watchState: { isLoggedIn: false }
}));

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

const stubs = {
    TooltipWrapper: {
        template:
            '<span class="tooltip"><slot /><slot name="content" /></span>',
        props: ['content']
    }
};

function mountAvatarInfo(props = {}, storeOverrides = {}) {
    const pinia = createTestingPinia({
        stubActions: true,
        initialState: {
            Avatar: {},
            ...storeOverrides
        }
    });
    return mount(AvatarInfo, {
        props,
        global: {
            plugins: [i18n, pinia],
            stubs
        }
    });
}

describe('AvatarInfo.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('avatar name display', () => {
        test('shows hintavatarname when hintownerid is provided', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                hintownerid: 'usr_owner_123',
                hintavatarname: 'Cool Avatar'
            });
            expect(wrapper.text()).toContain('Cool Avatar');
        });

        test('shows empty when no imageurl', () => {
            const wrapper = mountAvatarInfo({});
            expect(wrapper.text().trim()).toBe('Unknown Avatar');
        });

        test('does not show hintavatarname if it is not a string', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                hintownerid: 'usr_owner_123',
                hintavatarname: { notAString: true }
            });
            // avatarName stays empty since hintavatarname is not a string
            expect(wrapper.text()).not.toContain('notAString');
        });
    });

    describe('avatar type (own vs public)', () => {
        test('shows lock icon when owner matches userid (own avatar)', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                userid: 'usr_owner_123',
                hintownerid: 'usr_owner_123',
                hintavatarname: 'My Avatar'
            });
            expect(wrapper.find('.lucide-lock').exists()).toBe(true);
        });

        test('does not show lock when owner differs from userid (public)', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                userid: 'usr_viewer_456',
                hintownerid: 'usr_owner_123',
                hintavatarname: 'Someone Avatar'
            });
            expect(wrapper.find('.lucide-lock').exists()).toBe(false);
        });

        test('does not show lock when userid is undefined', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                hintownerid: 'usr_owner_123',
                hintavatarname: 'Avatar'
            });
            expect(wrapper.find('.lucide-lock').exists()).toBe(false);
        });
    });

    describe('avatar tags', () => {
        test('displays tags with content_ prefix stripped', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                hintownerid: 'usr_123',
                hintavatarname: 'Test',
                avatartags: [
                    'content_horror',
                    'content_gore',
                    'content_adult_language'
                ]
            });
            expect(wrapper.text()).toContain('horror');
            expect(wrapper.text()).toContain('gore');
            expect(wrapper.text()).toContain('adult_language');
            expect(wrapper.text()).not.toContain('content_horror');
        });

        test('does not show tags section when avatartags is empty', () => {
            const wrapper = mountAvatarInfo({
                imageurl: 'https://example.com/avatar.png',
                hintownerid: 'usr_123',
                hintavatarname: 'Test'
            });
            expect(wrapper.find('.tooltip').exists()).toBe(false);
        });
    });

    describe('click behavior', () => {
        test('does not call showAvatarAuthorDialog when no imageurl', async () => {
            const wrapper = mountAvatarInfo({});
            await wrapper.trigger('click');
            const { useAvatarStore } = await import('../../stores');
            const avatarStore = useAvatarStore();
            expect(avatarStore.showAvatarAuthorDialog).not.toHaveBeenCalled();
        });
    });
});
