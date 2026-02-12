/* eslint-disable  pretty-import/sort-import-groups */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

import en from '../../localization/en.json';

vi.mock('../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../views/Feed/columns.jsx', () => ({ columns: [] }));
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
vi.mock('../../plugin/interopApi', () => ({ initInteropApi: vi.fn() }));
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
        getString: vi.fn().mockResolvedValue(''),
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
vi.mock('../../service/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../service/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal();
    const i18n = actual.createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        legacy: false,
        missingWarn: false,
        fallbackWarn: false,
        messages: { en }
    });
    return {
        ...actual,
        useI18n: () => i18n.global
    };
});

const mockGetInstanceShortName = vi.fn();
vi.mock('../../api', () => ({
    instanceRequest: {
        getInstanceShortName: (...args) => mockGetInstanceShortName(...args),
        selfInvite: vi.fn().mockResolvedValue({})
    },
    miscRequest: {}
}));
vi.mock('vue-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    }
}));

import { useLaunchStore } from '../launch';

describe('useLaunchStore', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useLaunchStore();
        vi.clearAllMocks();
    });

    describe('showLaunchDialog', () => {
        test('sets dialog visible with tag and shortName', async () => {
            await store.showLaunchDialog(
                'wrld_123:456~friends(usr_abc)',
                'abc'
            );

            expect(store.launchDialogData.visible).toBe(true);
            expect(store.launchDialogData.tag).toBe(
                'wrld_123:456~friends(usr_abc)'
            );
            expect(store.launchDialogData.shortName).toBe('abc');
        });

        test('defaults shortName to null', async () => {
            await store.showLaunchDialog('wrld_123:456');

            expect(store.launchDialogData.shortName).toBeNull();
        });
    });

    describe('showLaunchOptions', () => {
        test('sets isLaunchOptionsDialogVisible to true', () => {
            expect(store.isLaunchOptionsDialogVisible).toBe(false);
            store.showLaunchOptions();
            expect(store.isLaunchOptionsDialogVisible).toBe(true);
        });
    });

    describe('getLaunchUrl', () => {
        test('uses provided shortName for non-public instance', async () => {
            const url = await store.getLaunchUrl(
                'wrld_123:456~friends(usr_abc)',
                'myShort'
            );
            expect(url).toBe(
                'vrchat://launch?ref=vrcx.app&id=wrld_123:456~friends(usr_abc)&shortName=myShort'
            );
            expect(mockGetInstanceShortName).not.toHaveBeenCalled();
        });

        test('fetches shortName from API when not provided', async () => {
            mockGetInstanceShortName.mockResolvedValue({
                json: { shortName: 'fetched123' }
            });

            const url = await store.getLaunchUrl(
                'wrld_123:456~friends(usr_abc)',
                ''
            );
            expect(url).toContain('shortName=fetched123');
            expect(mockGetInstanceShortName).toHaveBeenCalled();
        });

        test('uses secureName as fallback when shortName is empty', async () => {
            mockGetInstanceShortName.mockResolvedValue({
                json: { shortName: '', secureName: 'secure456' }
            });

            const url = await store.getLaunchUrl(
                'wrld_123:456~friends(usr_abc)',
                ''
            );
            expect(url).toContain('shortName=secure456');
        });

        test('omits shortName when API returns nothing', async () => {
            mockGetInstanceShortName.mockResolvedValue({ json: null });

            const url = await store.getLaunchUrl(
                'wrld_123:456~friends(usr_abc)',
                ''
            );
            expect(url).toBe(
                'vrchat://launch?ref=vrcx.app&id=wrld_123:456~friends(usr_abc)'
            );
            expect(url).not.toContain('shortName');
        });

        test('calls API for public instances without shortName', async () => {
            mockGetInstanceShortName.mockResolvedValue({ json: null });
            await store.getLaunchUrl('wrld_123:456', '');
            expect(mockGetInstanceShortName).toHaveBeenCalled();
        });
    });
});
