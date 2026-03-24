import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const { mockDownloadAndSaveJson } = vi.hoisted(() => ({
    mockDownloadAndSaveJson: vi.fn()
}));
vi.mock('../../../shared/utils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        downloadAndSaveJson: mockDownloadAndSaveJson
    };
});

vi.mock('vue-json-pretty', () => ({
    default: {
        name: 'VueJsonPretty',
        template: '<div class="vjp-stub" />',
        props: ['data', 'deep', 'theme', 'showIcon']
    }
}));

vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
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
vi.mock('../../../plugins/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../../services/database', () => ({
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
vi.mock('../../../services/config', () => ({
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
vi.mock('../../../services/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));

import DialogJsonTab from '../DialogJsonTab.vue';

import en from '../../../localization/en.json';

import { createI18n } from 'vue-i18n';

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

/**
 *
 * @param props
 * @param storeOverrides
 */
function mountComponent(props = {}, storeOverrides = {}) {
    const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
            AppearanceSettings: {
                isDarkMode: false,
                ...storeOverrides
            }
        }
    });

    return mount(DialogJsonTab, {
        props: {
            dialogId: 'usr_test123',
            dialogRef: { id: 'usr_test123', displayName: 'Test' },
            treeData: { id: 'usr_test123', name: 'TestData' },
            treeDataKey: 'usr_test123',
            ...props
        },
        global: {
            plugins: [i18n, pinia],
            stubs: {
                RefreshCw: { template: '<svg class="refresh-icon" />' },
                Download: { template: '<svg class="download-icon" />' }
            }
        }
    });
}

describe('DialogJsonTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders refresh and download buttons', () => {
            const wrapper = mountComponent();
            const buttons = wrapper.findAll('button');
            expect(buttons).toHaveLength(2);
        });

        test('renders vue-json-pretty with treeData', () => {
            const wrapper = mountComponent();
            const jsonPretty = wrapper.findComponent({ name: 'VueJsonPretty' });
            expect(jsonPretty.exists()).toBe(true);
            expect(jsonPretty.props('data')).toEqual({
                id: 'usr_test123',
                name: 'TestData'
            });
            expect(jsonPretty.props('deep')).toBe(2);
        });

        test('uses light theme by default', () => {
            const wrapper = mountComponent();
            const jsonPretty = wrapper.findComponent({ name: 'VueJsonPretty' });
            expect(jsonPretty.props('theme')).toBe('light');
        });

        test('uses dark theme when isDarkMode is true', () => {
            const wrapper = mountComponent({}, { isDarkMode: true });
            const jsonPretty = wrapper.findComponent({ name: 'VueJsonPretty' });
            expect(jsonPretty.props('theme')).toBe('dark');
        });
    });

    describe('fileAnalysis', () => {
        test('does not render extra json-pretty when fileAnalysis is null', () => {
            const wrapper = mountComponent({ fileAnalysis: null });
            const jsonComponents = wrapper.findAllComponents({
                name: 'VueJsonPretty'
            });
            expect(jsonComponents).toHaveLength(1);
        });

        test('does not render extra json-pretty when fileAnalysis is empty object', () => {
            const wrapper = mountComponent({ fileAnalysis: {} });
            const jsonComponents = wrapper.findAllComponents({
                name: 'VueJsonPretty'
            });
            expect(jsonComponents).toHaveLength(1);
        });

        test('renders extra json-pretty when fileAnalysis has data', () => {
            const wrapper = mountComponent({
                fileAnalysis: { size: 1024, format: 'vrca' }
            });
            const jsonComponents = wrapper.findAllComponents({
                name: 'VueJsonPretty'
            });
            expect(jsonComponents).toHaveLength(2);
            expect(jsonComponents[1].props('data')).toEqual({
                size: 1024,
                format: 'vrca'
            });
        });
    });

    describe('interactions', () => {
        test('emits refresh when refresh button is clicked', async () => {
            const wrapper = mountComponent();
            const buttons = wrapper.findAll('button');
            // First button is refresh
            await buttons[0].trigger('click');
            expect(wrapper.emitted('refresh')).toHaveLength(1);
        });

        test('calls downloadAndSaveJson with dialogId and dialogRef when download button is clicked', async () => {
            const dialogRef = { id: 'usr_test123', displayName: 'Test' };
            const wrapper = mountComponent({
                dialogId: 'usr_test123',
                dialogRef
            });
            const buttons = wrapper.findAll('button');
            // Second button is download
            await buttons[1].trigger('click');
            expect(mockDownloadAndSaveJson).toHaveBeenCalledWith(
                'usr_test123',
                dialogRef
            );
        });
    });
});
