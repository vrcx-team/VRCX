import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    randomUserColours: null,
    photonLoggingEnabled: null,
    chatboxUserBlacklist: null,
    lastLocation: null,
    currentInstanceLocation: null,
    currentInstanceWorld: null,
    currentInstanceUsersData: null,
    currentUser: null,
    saveChatboxUserBlacklist: vi.fn(),
    showUserDialog: vi.fn(),
    lookupUser: vi.fn(),
    showWorldDialog: vi.fn(),
    showFullscreenImageDialog: vi.fn(),
    getCurrentInstanceUserList: vi.fn(),
    tableSetOptions: vi.fn(),
    photonColumnToggleVisibility: vi.fn()
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../stores', () => ({
    useAppearanceSettingsStore: () => ({
        randomUserColours: mocks.randomUserColours
    }),
    usePhotonStore: () => ({
        photonLoggingEnabled: mocks.photonLoggingEnabled,
        chatboxUserBlacklist: mocks.chatboxUserBlacklist,
        saveChatboxUserBlacklist: (...args) =>
            mocks.saveChatboxUserBlacklist(...args),
        photonEventTable: ref({ data: [], pageSize: 10 }),
        photonEventTablePrevious: ref({ data: [], pageSize: 10 }),
        photonEventTableTypeFilter: ref([]),
        photonEventTableFilter: ref(''),
        photonEventIcon: ref(false),
        photonEventTableFilterChange: vi.fn(),
        showUserFromPhotonId: vi.fn()
    }),
    useUserStore: () => ({
        currentUser: mocks.currentUser
    }),
    useWorldStore: () => ({
        showWorldDialog: (...args) => mocks.showWorldDialog(...args)
    }),
    useLocationStore: () => ({
        lastLocation: mocks.lastLocation
    }),
    useInstanceStore: () => ({
        currentInstanceLocation: mocks.currentInstanceLocation,
        currentInstanceWorld: mocks.currentInstanceWorld,
        currentInstanceUsersData: mocks.currentInstanceUsersData,
        getCurrentInstanceUserList: (...args) =>
            mocks.getCurrentInstanceUserList(...args)
    }),
    useGalleryStore: () => ({
        showFullscreenImageDialog: (...args) =>
            mocks.showFullscreenImageDialog(...args)
    }),
    useSearchStore: () => ({
        stringComparer: { value: (a, b) => a.localeCompare(b) }
    }),
    useAvatarStore: () => ({
        showAvatarDialog: vi.fn()
    }),
    useGroupStore: () => ({
        showGroupDialog: vi.fn()
    }),
    useVrcxStore: () => ({
        ipcEnabled: ref(false)
    })
}));

vi.mock('../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args),
    lookupUser: (...args) => mocks.lookupUser(...args)
}));

vi.mock('../../../lib/table/useVrcxVueTable', () => ({
    useVrcxVueTable: () => ({
        table: {
            setOptions: (...args) => mocks.tableSetOptions(...args),
            getColumn: (id) =>
                id === 'photonId'
                    ? {
                          toggleVisibility: (...args) =>
                              mocks.photonColumnToggleVisibility(...args)
                      }
                    : null,
            getRowModel: () => ({ rows: mocks.currentInstanceUsersData.value })
        }
    })
}));

vi.mock('../columns.jsx', () => ({
    createColumns: () => [{ id: 'photonId' }]
}));

vi.mock('../../../shared/utils', () => ({
    commaNumber: (value) => String(value ?? ''),
    formatDateFilter: (value) => String(value ?? '')
}));

vi.mock('@/components/ui/data-table', () => ({
    DataTableLayout: {
        props: ['onRowClick'],
        template:
            '<div>' +
            '<button data-testid="row-click-with-id" @click="onRowClick?.({ original: { ref: { id: \'usr_1\', displayName: \'Alice\' } } })">row-id</button>' +
            '<button data-testid="row-click-without-id" @click="onRowClick?.({ original: { ref: { displayName: \'Bob\' } } })">row-no-id</button>' +
            '</div>'
    }
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: { template: '<span><slot /></span>' }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/LocationWorld.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('../../../components/Timer.vue', () => ({
    default: { template: '<span />' }
}));

vi.mock('../dialogs/ChatboxBlacklistDialog.vue', () => ({
    default: {
        props: ['chatboxBlacklistDialog'],
        emits: ['delete-chatbox-user-blacklist'],
        template:
            '<div data-testid="chatbox-dialog" :data-visible="String(chatboxBlacklistDialog.visible)">' +
            '<button data-testid="emit-delete-chatbox" @click="$emit(\'delete-chatbox-user-blacklist\', \'usr_blocked\')">delete</button>' +
            '</div>'
    }
}));

vi.mock('lucide-vue-next', async (importOriginal) => {
    const actual = await importOriginal();
    const stubs = {};
    for (const key of Object.keys(actual)) {
        stubs[key] = { template: '<span />' };
    }
    return stubs;
});

import PlayerList from '../PlayerList.vue';

describe('PlayerList.vue', () => {
    beforeEach(() => {
        mocks.randomUserColours = ref(false);
        mocks.photonLoggingEnabled = ref(false);
        mocks.chatboxUserBlacklist = ref(
            new Map([['usr_blocked', 'Blocked User']])
        );
        mocks.lastLocation = ref({
            playerList: new Set(),
            friendList: new Set(),
            date: null
        });
        mocks.currentInstanceLocation = ref({});
        mocks.currentInstanceWorld = ref({
            ref: {
                id: '',
                thumbnailImageUrl: '',
                imageUrl: '',
                name: '',
                authorId: '',
                authorName: '',
                releaseStatus: 'public',
                description: ''
            },
            fileAnalysis: {},
            isPC: false,
            isQuest: false,
            isIos: false
        });
        mocks.currentInstanceUsersData = ref([]);
        mocks.currentUser = ref({
            id: 'usr_me',
            $homeLocation: null
        });

        mocks.saveChatboxUserBlacklist.mockReset();
        mocks.showUserDialog.mockReset();
        mocks.lookupUser.mockReset();
        mocks.showWorldDialog.mockReset();
        mocks.showFullscreenImageDialog.mockReset();
        mocks.getCurrentInstanceUserList.mockReset();
        mocks.tableSetOptions.mockReset();
        mocks.photonColumnToggleVisibility.mockReset();

        mocks.saveChatboxUserBlacklist.mockResolvedValue(undefined);
    });

    test('loads current instance user list on mount and wires table options', () => {
        mount(PlayerList, {
            global: {
                stubs: {
                    TooltipWrapper: { template: '<div><slot /></div>' },
                    LocationWorld: { template: '<div />' }
                }
            }
        });

        expect(mocks.getCurrentInstanceUserList).toHaveBeenCalledTimes(1);
        expect(mocks.tableSetOptions).toHaveBeenCalledTimes(1);
        expect(mocks.photonColumnToggleVisibility).toHaveBeenCalledWith(false);
    });

    test('row click opens user dialog when id exists, otherwise lookups user', async () => {
        const wrapper = mount(PlayerList, {
            global: {
                stubs: {
                    TooltipWrapper: { template: '<div><slot /></div>' },
                    LocationWorld: { template: '<div />' }
                }
            }
        });

        await wrapper.get('[data-testid="row-click-with-id"]').trigger('click');
        await wrapper
            .get('[data-testid="row-click-without-id"]')
            .trigger('click');

        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_1');
        expect(mocks.lookupUser).toHaveBeenCalledWith({ displayName: 'Bob' });
    });

    test('toggles photonId column visibility when photon logging changes', async () => {
        mount(PlayerList, {
            global: {
                stubs: {
                    TooltipWrapper: { template: '<div><slot /></div>' },
                    LocationWorld: { template: '<div />' }
                }
            }
        });
        mocks.photonColumnToggleVisibility.mockClear();

        mocks.photonLoggingEnabled.value = true;
        await nextTick();

        expect(mocks.photonColumnToggleVisibility).toHaveBeenCalledWith(true);
    });

    test('opens chatbox blacklist dialog from photon event table', async () => {
        const wrapper = mount(PlayerList, {
            global: {
                stubs: {
                    TooltipWrapper: { template: '<div><slot /></div>' },
                    LocationWorld: { template: '<div />' }
                }
            }
        });

        expect(
            wrapper
                .get('[data-testid="chatbox-dialog"]')
                .attributes('data-visible')
        ).toBe('false');
        wrapper.vm.showChatboxBlacklistDialog();
        await nextTick();

        expect(
            wrapper
                .get('[data-testid="chatbox-dialog"]')
                .attributes('data-visible')
        ).toBe('true');
    });

    test('deletes chatbox blacklist user and refreshes list', async () => {
        const wrapper = mount(PlayerList, {
            global: {
                stubs: {
                    TooltipWrapper: { template: '<div><slot /></div>' },
                    LocationWorld: { template: '<div />' }
                }
            }
        });

        await wrapper
            .get('[data-testid="emit-delete-chatbox"]')
            .trigger('click');

        expect(mocks.chatboxUserBlacklist.value.has('usr_blocked')).toBe(false);
        expect(mocks.saveChatboxUserBlacklist).toHaveBeenCalledTimes(1);
        expect(mocks.getCurrentInstanceUserList).toHaveBeenCalledTimes(2);
    });
});
