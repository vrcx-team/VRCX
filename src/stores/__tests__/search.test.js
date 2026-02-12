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
        getString: vi.fn().mockResolvedValue('{}'),
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

const mockShowUserDialog = vi.fn();
const mockShowAvatarDialog = vi.fn();
const mockShowGroupDialog = vi.fn();
const mockShowWorldDialog = vi.fn();
const mockGetInstanceFromShortName = vi.fn();
const mockGroupStrictsearch = vi.fn();

vi.mock('../user', () => ({
    useUserStore: () => ({
        showUserDialog: mockShowUserDialog,
        cachedUsers: new Map(),
        showUserDialogHistory: new Set(),
        currentUser: ref({ id: 'usr_me', homeLocation: '' }),
        lookupUser: vi.fn(),
        applyUser: vi.fn()
    })
}));
vi.mock('../avatar', () => ({
    useAvatarStore: () => ({
        showAvatarDialog: mockShowAvatarDialog
    })
}));
vi.mock('../group', () => ({
    useGroupStore: () => ({
        showGroupDialog: mockShowGroupDialog
    })
}));
vi.mock('../world', () => ({
    useWorldStore: () => ({
        showWorldDialog: mockShowWorldDialog
    })
}));
vi.mock('../friend', () => ({
    useFriendStore: () => ({
        friends: new Map()
    })
}));
vi.mock('../modal', () => ({
    useModalStore: () => ({
        prompt: vi.fn().mockResolvedValue({ ok: false, value: '' })
    })
}));
vi.mock('../settings/appearance', () => ({
    useAppearanceSettingsStore: () => ({
        appLanguage: 'en'
    })
}));

function makeApiMock() {
    return {
        instanceRequest: {
            getInstanceFromShortName: (...args) =>
                mockGetInstanceFromShortName(...args)
        },
        userRequest: {
            getUsers: vi.fn().mockResolvedValue({ json: [] })
        },
        groupRequest: {
            groupStrictsearch: (...args) => mockGroupStrictsearch(...args)
        },
        miscRequest: {}
    };
}
vi.mock('../../api', () => makeApiMock());
vi.mock('../../api/', () => makeApiMock());

vi.mock('vue-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        dismiss: vi.fn()
    }
}));

import { useSearchStore } from '../search';

describe('useSearchStore', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useSearchStore();
        vi.clearAllMocks();
    });

    describe('directAccessParse', () => {
        test('returns false for empty input', () => {
            expect(store.directAccessParse('')).toBe(false);
            expect(store.directAccessParse(null)).toBe(false);
            expect(store.directAccessParse(undefined)).toBe(false);
        });

        test('opens user dialog for usr_ prefix', () => {
            store.directAccessParse('usr_abc123');
            expect(mockShowUserDialog).toHaveBeenCalledWith('usr_abc123');
        });

        test('opens user dialog for 10-char alphanumeric ID', () => {
            store.directAccessParse('Ab3dEf7h9J');
            expect(mockShowUserDialog).toHaveBeenCalledWith('Ab3dEf7h9J');
        });

        test('opens avatar dialog for avtr_ prefix', () => {
            store.directAccessParse('avtr_abc123');
            expect(mockShowAvatarDialog).toHaveBeenCalledWith('avtr_abc123');
        });

        test('opens avatar dialog for b_ prefix', () => {
            store.directAccessParse('b_something');
            expect(mockShowAvatarDialog).toHaveBeenCalledWith('b_something');
        });

        test('opens group dialog for grp_ prefix', () => {
            store.directAccessParse('grp_abc123');
            expect(mockShowGroupDialog).toHaveBeenCalledWith('grp_abc123');
        });

        test('parses vrchat.com user URL', () => {
            store.directAccessParse('https://vrchat.com/home/user/usr_abc123');
            expect(mockShowUserDialog).toHaveBeenCalledWith('usr_abc123');
        });

        test('parses vrchat.com avatar URL', () => {
            store.directAccessParse(
                'https://vrchat.com/home/avatar/avtr_abc123'
            );
            expect(mockShowAvatarDialog).toHaveBeenCalledWith('avtr_abc123');
        });

        test('parses vrchat.com group URL', () => {
            store.directAccessParse(
                'https://vrchat.com/home/group/grp_abc123'
            );
            expect(mockShowGroupDialog).toHaveBeenCalledWith('grp_abc123');
        });

        test('parses vrc.group short URL', () => {
            mockGroupStrictsearch.mockResolvedValue({ json: [] });
            store.directAccessParse('https://vrc.group/ABC.1234');
            expect(mockGroupStrictsearch).toHaveBeenCalledWith({
                query: 'ABC.1234'
            });
        });

        test('parses group short code (e.g. ABCD.1234)', () => {
            mockGroupStrictsearch.mockResolvedValue({ json: [] });
            store.directAccessParse('ABCD.1234');
            expect(mockGroupStrictsearch).toHaveBeenCalledWith({
                query: 'ABCD.1234'
            });
        });

        test('returns false for unrecognized input', () => {
            expect(store.directAccessParse('hello world')).toBe(false);
        });

        test('returns false for short vrchat URL with insufficient path segments', () => {
            expect(
                store.directAccessParse('https://vrchat.com/home')
            ).toBe(false);
        });
    });

    describe('directAccessWorld', () => {
        test('returns false for unrecognized input', () => {
            expect(store.directAccessWorld('hello')).toBe(false);
        });

        test('opens world dialog for wrld_ prefix', () => {
            store.directAccessWorld('wrld_abc123:12345~friends');
            expect(mockShowWorldDialog).toHaveBeenCalledWith(
                'wrld_abc123:12345~friends'
            );
        });

        test('opens world dialog for wld_ prefix', () => {
            store.directAccessWorld('wld_abc');
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wld_abc');
        });

        test('opens world dialog for o_ prefix', () => {
            store.directAccessWorld('o_test123');
            expect(mockShowWorldDialog).toHaveBeenCalledWith('o_test123');
        });

        test('handles wrld_ with &instanceId= by internally rewriting to URL', () => {
            store.directAccessWorld('wrld_abc&instanceId=123');
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wrld_abc:123');
        });

        test('resolves 8-char shortName via API', async () => {
            mockGetInstanceFromShortName.mockResolvedValue({
                json: { location: 'wrld_abc:123', shortName: 'AbCdEfGh' }
            });
            await store.directAccessWorld('AbCdEfGh');
            expect(mockGetInstanceFromShortName).toHaveBeenCalledWith({
                shortName: 'AbCdEfGh'
            });
            expect(mockShowWorldDialog).toHaveBeenCalledWith(
                'wrld_abc:123',
                'AbCdEfGh'
            );
        });

        test('resolves vrch.at short URL via API', async () => {
            mockGetInstanceFromShortName.mockResolvedValue({
                json: { location: 'wrld_abc:123', shortName: 'XyZ12345' }
            });
            await store.directAccessWorld('https://vrch.at/XyZ12345');
            expect(mockGetInstanceFromShortName).toHaveBeenCalledWith({
                shortName: 'XyZ12345'
            });
            expect(mockShowWorldDialog).toHaveBeenCalledWith(
                'wrld_abc:123',
                'XyZ12345'
            );
        });

        test('parses vrchat.com/home/world/ URL', () => {
            store.directAccessWorld(
                'https://vrchat.com/home/world/wrld_abc123'
            );
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wrld_abc123');
        });

        test('parses launch URL with worldId only', () => {
            store.directAccessWorld(
                'https://vrchat.com/home/launch?worldId=wrld_abc'
            );
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wrld_abc');
        });

        test('parses launch URL with worldId and instanceId', () => {
            store.directAccessWorld(
                'https://vrchat.com/home/launch?worldId=wrld_abc&instanceId=123'
            );
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wrld_abc:123');
        });

        test('parses launch URL with shortName via API', async () => {
            mockGetInstanceFromShortName.mockResolvedValue({
                json: {
                    location: 'wrld_abc:123',
                    shortName: 'myShort1'
                }
            });
            await store.directAccessWorld(
                'https://vrchat.com/home/launch?worldId=wrld_abc&instanceId=123&shortName=myShort1'
            );
            expect(mockGetInstanceFromShortName).toHaveBeenCalledWith({
                shortName: 'myShort1'
            });
            expect(mockShowWorldDialog).toHaveBeenCalledWith(
                'wrld_abc:123',
                'myShort1'
            );
        });

        test('handles /home/ relative path by prepending https://vrchat.com', () => {
            store.directAccessWorld('/home/world/wrld_relpath');
            expect(mockShowWorldDialog).toHaveBeenCalledWith('wrld_relpath');
        });
    });
});
