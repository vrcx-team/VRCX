import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

import en from '../../localization/en.json';

vi.mock('../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../plugins/router', () => ({
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
vi.mock('../../plugins/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../services/database', () => ({
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
vi.mock('../../services/config', () => ({
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
vi.mock('../../services/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../services/watchState', () => ({
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

import { useUiStore } from '../ui';

describe('useUiStore - notification methods', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useUiStore();
        store.notifiedMenus = [];
    });

    describe('notifyMenu', () => {
        test('adds a menu key to notifiedMenus', () => {
            store.notifyMenu('feed');
            expect(store.notifiedMenus).toContain('feed');
        });

        test('does not add duplicate keys', () => {
            store.notifyMenu('feed');
            store.notifyMenu('feed');
            expect(
                store.notifiedMenus.filter((k) => k === 'feed')
            ).toHaveLength(1);
        });

        test('adds multiple different keys', () => {
            store.notifyMenu('feed');
            store.notifyMenu('notification');
            store.notifyMenu('friend-log');
            expect(store.notifiedMenus).toEqual([
                'feed',
                'notification',
                'friend-log'
            ]);
        });
    });

    describe('removeNotify', () => {
        test('removes a specific menu key', () => {
            store.notifiedMenus = ['feed', 'notification', 'friend-log'];
            store.removeNotify('notification');
            expect(store.notifiedMenus).toEqual(['feed', 'friend-log']);
        });

        test('does nothing when key is not present', () => {
            store.notifiedMenus = ['feed'];
            store.removeNotify('notification');
            expect(store.notifiedMenus).toEqual(['feed']);
        });
    });

    describe('clearAllNotifications', () => {
        test('clears all notified menus', () => {
            store.notifiedMenus = ['feed', 'notification', 'friend-log'];
            store.clearAllNotifications();
            expect(store.notifiedMenus).toEqual([]);
        });

        test('works when already empty', () => {
            store.notifiedMenus = [];
            store.clearAllNotifications();
            expect(store.notifiedMenus).toEqual([]);
        });

        test('menus can be re-added after clearing', () => {
            store.notifiedMenus = ['feed', 'notification'];
            store.clearAllNotifications();
            expect(store.notifiedMenus).toEqual([]);

            store.notifyMenu('friend-log');
            expect(store.notifiedMenus).toEqual(['friend-log']);
        });
    });
});
