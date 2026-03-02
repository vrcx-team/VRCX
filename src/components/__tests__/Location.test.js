import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import { getGroupName } from '../../shared/utils/group';
import { getWorldName } from '../../shared/utils/world';

import Location from '../Location.vue';
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

vi.mock('../../shared/utils/world', () => ({
    getWorldName: vi.fn().mockResolvedValue(''),
    isRpcWorld: vi.fn().mockReturnValue(false)
}));
vi.mock('../../shared/utils/group', () => ({
    getGroupName: vi.fn().mockResolvedValue(''),
    hasGroupPermission: vi.fn().mockReturnValue(false),
    hasGroupModerationPermission: vi.fn().mockReturnValue(false)
}));

const mockedGetWorldName = vi.mocked(getWorldName);
const mockedGetGroupName = vi.mocked(getGroupName);

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
        template: '<span><slot /></span>',
        props: [
            'content',
            'disabled',
            'delayDuration',
            'delay-duration',
            'side'
        ]
    },
    Spinner: { template: '<span class="spinner" />' },
    AlertTriangle: { template: '<span class="alert-triangle" />' }
};

function mountLocation(props = {}) {
    return mount(Location, {
        props,
        global: {
            plugins: [
                i18n,
                createTestingPinia({
                    stubActions: true,
                    initialState: {
                        Instance: {},
                        World: {},
                        Search: {},
                        AppearanceSettings: {
                            showInstanceIdInLocation: false
                        },
                        Group: {}
                    }
                })
            ],
            stubs
        }
    });
}

describe('Location.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('special location states', () => {
        test('shows translated text for offline location', () => {
            const wrapper = mountLocation({ location: 'offline' });
            expect(wrapper.text()).toContain('Offline');
        });

        test('shows translated text for private location', () => {
            const wrapper = mountLocation({ location: 'private' });
            expect(wrapper.text()).toContain('Private');
        });

        test('shows spinner and destination world when traveling', () => {
            const wrapper = mountLocation({
                location: 'traveling',
                traveling: 'wrld_12345:67890~region(us)'
            });
            expect(wrapper.find('.spinner').exists()).toBe(true);
            expect(wrapper.text()).toContain('wrld_12345');
        });

        test('shows dash placeholder when location is empty', () => {
            const wrapper = mountLocation({ location: '' });
            const placeholder = wrapper.find('.transparent');
            expect(placeholder.exists()).toBe(true);
        });
    });

    describe('hint display', () => {
        test('shows hint with access type for valid instance', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890',
                hint: 'My World'
            });
            expect(wrapper.text()).toContain('My World');
            expect(wrapper.text()).toContain('Public');
        });

        test('shows only hint text when no instanceId', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345',
                hint: 'Just World Name'
            });
            expect(wrapper.text()).toContain('Just World Name');
            expect(wrapper.text()).not.toContain('Public');
        });
    });

    describe('world ID display (no hint)', () => {
        test('shows worldId when no hint and no cached world', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890'
            });
            expect(wrapper.text()).toContain('wrld_12345');
        });

        test('updates text after getWorldName resolves', async () => {
            mockedGetWorldName.mockResolvedValueOnce('Amazing World');
            const wrapper = mountLocation({
                location: 'wrld_12345:67890'
            });
            expect(wrapper.text()).toContain('wrld_12345');
            await vi.waitFor(() => {
                expect(wrapper.text()).toContain('Amazing World');
            });
        });
    });

    describe('region flags', () => {
        test('shows region flag for real instances', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~region(eu)'
            });
            expect(wrapper.find('.flags.eu').exists()).toBe(true);
        });

        test('defaults to us region when no region specified', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890'
            });
            expect(wrapper.find('.flags.us').exists()).toBe(true);
        });

        test('does not show region for offline', () => {
            const wrapper = mountLocation({ location: 'offline' });
            expect(wrapper.find('.flags').exists()).toBe(false);
        });
    });

    describe('group name', () => {
        test('uses grouphint when provided', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~group(grp_abc)',
                grouphint: 'My Group'
            });
            expect(wrapper.text()).toContain('My Group');
        });

        test('calls getGroupName when no grouphint and has groupId', () => {
            mountLocation({
                location: 'wrld_12345:67890~group(grp_abc)'
            });
            expect(mockedGetGroupName).toHaveBeenCalled();
        });

        test('shows resolved group name after async fetch', async () => {
            mockedGetGroupName.mockResolvedValueOnce('Community Group');
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~group(grp_abc)'
            });
            await vi.waitFor(() => {
                expect(wrapper.text()).toContain('Community Group');
            });
        });
    });

    describe('strict and closed indicators', () => {
        test('shows lock icon for strict instances', async () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~strict'
            });
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.lucide-lock').exists()).toBe(true);
        });

        test('does not show lock for non-strict instances', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890'
            });
            expect(wrapper.find('.lucide-lock').exists()).toBe(false);
        });
    });

    describe('translateAccessType', () => {
        test('shows Public for public instances', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890',
                hint: 'Test'
            });
            expect(wrapper.text()).toContain('Public');
        });

        test('shows Invite for private instances', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~private(usr_123)',
                hint: 'Test'
            });
            expect(wrapper.text()).toContain('Invite');
        });

        test('shows Friends+ for hidden instances', () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890~hidden(usr_123)',
                hint: 'Test'
            });
            expect(wrapper.text()).toContain('Friends+');
        });

        test('shows Group prefix for groupPublic instances', () => {
            const wrapper = mountLocation({
                location:
                    'wrld_12345:67890~group(grp_123)~groupAccessType(public)',
                hint: 'Test'
            });
            const text = wrapper.text();
            expect(text).toContain('Group');
            expect(text).toContain('Public');
        });
    });

    describe('reactivity', () => {
        test('updates when location prop changes', async () => {
            const wrapper = mountLocation({ location: 'offline' });
            expect(wrapper.text()).toContain('Offline');
            await wrapper.setProps({ location: 'private' });
            expect(wrapper.text()).toContain('Private');
        });

        test('updates when hint prop changes', async () => {
            const wrapper = mountLocation({
                location: 'wrld_12345:67890',
                hint: 'First Name'
            });
            expect(wrapper.text()).toContain('First Name');
            await wrapper.setProps({ hint: 'Second Name' });
            expect(wrapper.text()).toContain('Second Name');
        });
    });
});
