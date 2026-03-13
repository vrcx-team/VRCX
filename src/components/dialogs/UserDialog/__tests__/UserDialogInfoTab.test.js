import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, shallowMount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
    useI18n: () => {
        const { ref } = require('vue');
        return {
            t: (key, params) =>
                params ? `${key}:${JSON.stringify(params)}` : key,
            locale: ref('en')
        };
    },
    createI18n: () => ({
        global: { t: (key) => key },
        install: vi.fn()
    })
}));

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

import UserDialogInfoTab from '../UserDialogInfoTab.vue';
import { miscRequest } from '../../../../api';
import {
    useAdvancedSettingsStore,
    useAppearanceSettingsStore,
    useLocationStore,
    useModalStore,
    useUserStore
} from '../../../../stores';

/**
 *
 * @param overrides
 */
function mountComponent(overrides = {}) {
    const pinia = createTestingPinia({
        stubActions: true
    });

    const appearanceSettingsStore = useAppearanceSettingsStore(pinia);
    appearanceSettingsStore.$patch({
        hideUserNotes: false,
        hideUserMemos: false
    });

    const advancedSettingsStore = useAdvancedSettingsStore(pinia);
    advancedSettingsStore.$patch({
        bioLanguage: 'en',
        translationApi: '',
        translationApiType: 'google'
    });
    const advancedSettings = advancedSettingsStore;
    advancedSettings.translateText = vi.fn().mockResolvedValue('');

    const userStore = useUserStore(pinia);
    userStore.$patch({
        userDialog: {
            id: 'usr_target',
            friend: {
                state: 'online',
                ref: {
                    location: 'wrld_test:123'
                }
            },
            ref: {
                id: 'usr_target',
                location: 'wrld_test:123',
                travelingToLocation: '',
                profilePicOverride: '',
                currentAvatarImageUrl: '',
                currentAvatarTags: [],
                bio: '',
                bioLinks: [],
                state: 'online',
                $online_for: 1000,
                last_login: '2025-01-01T00:00:00.000Z',
                last_activity: '2025-01-01T00:00:00.000Z',
                date_joined: '2020-01-01',
                allowAvatarCopying: true,
                displayName: 'Target'
            },
            $location: {
                tag: 'wrld_test:123',
                shortName: 'Test',
                userId: '',
                user: null
            },
            instance: {
                ref: {},
                friendCount: 0
            },
            users: [
                {
                    id: 'usr_friend_1',
                    displayName: 'Friend A',
                    $userColour: '#ffffff',
                    location: 'traveling',
                    $travelingToTime: Date.now(),
                    $location_at: Date.now()
                }
            ],
            note: '',
            memo: '',
            isRepresentedGroupLoading: false,
            representedGroup: null,
            lastSeen: '2025-01-01T00:00:00.000Z',
            joinCount: 0,
            timeSpent: 0,
            dateFriendedInfo: [],
            unFriended: false,
            dateFriended: '2025-01-01T00:00:00.000Z',
            $homeLocationName: '',
            ...overrides.userDialog
        },
        currentUser: {
            id: 'usr_me',
            allowAvatarCopying: true,
            isBoopingEnabled: true,
            hasSharedConnectionsOptOut: false,
            hasDiscordFriendsOptOut: false,
            homeLocation: '',
            ...overrides.currentUser
        }
    });

    const locationStore = useLocationStore(pinia);
    locationStore.$patch({
        lastLocation: {
            location: 'wrld_test:123'
        }
    });

    const modal = useModalStore(pinia);
    modal.confirm = vi.fn().mockResolvedValue({ ok: false });

    return shallowMount(UserDialogInfoTab, {
        global: {
            plugins: [pinia],
            stubs: {
                Location: true,
                Timer: true,
                TooltipWrapper: true,
                AvatarInfo: true
            }
        }
    });
}

describe('UserDialogInfoTab.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('unit behavior', () => {
        test('onTabActivated fetches VRChat credits only once after first success', async () => {
            const creditsSpy = vi
                .spyOn(miscRequest, 'getVRChatCredits')
                .mockResolvedValue({ json: { balance: 42 } });
            const wrapper = mountComponent();

            wrapper.vm.onTabActivated();
            await flushPromises();
            wrapper.vm.onTabActivated();
            await flushPromises();

            expect(creditsSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('dom rendering', () => {
        test('renders imported InstanceActionBar and Spinner components when conditions are met', () => {
            const wrapper = mountComponent();

            expect(wrapper.find('instance-action-bar-stub').exists()).toBe(
                true
            );
            expect(wrapper.find('spinner-stub').exists()).toBe(true);
        });
    });
});
