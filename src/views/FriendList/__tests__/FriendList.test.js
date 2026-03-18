import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    makeRef: (value) => ({ value, __v_isRef: true }),
    route: { path: '/friend-list' },
    routerPush: vi.fn(),
    friends: null,
    allFavoriteFriendIds: null,
    randomUserColours: null,
    stringComparer: null,
    friendsListSearch: null,
    getAllUserStats: vi.fn(),
    getAllUserMutualCount: vi.fn(),
    confirmDeleteFriend: vi.fn(),
    handleFriendDelete: vi.fn(),
    showUserDialog: vi.fn(),
    modalConfirm: vi.fn().mockResolvedValue({ ok: true }),
    modalAlert: vi.fn(),
    userGetUser: vi.fn().mockResolvedValue({}),
    friendDeleteFriend: vi.fn().mockResolvedValue({}),
    toastSuccess: vi.fn(),
    setOptions: vi.fn(),
    setPageIndex: vi.fn(),
    setSorting: vi.fn(),
    toggleBulkColumnVisibility: vi.fn(),
    pagination: null,
    sorting: null
}));

mocks.friends = mocks.makeRef(new Map());
mocks.allFavoriteFriendIds = mocks.makeRef(new Set());
mocks.randomUserColours = mocks.makeRef(false);
mocks.stringComparer = mocks.makeRef(null);
mocks.friendsListSearch = mocks.makeRef('');
mocks.pagination = mocks.makeRef({
    pageIndex: 3,
    pageSize: 10
});
mocks.sorting = mocks.makeRef([]);

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

vi.mock('vue-router', () => ({
    useRoute: () => mocks.route
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: (...args) => mocks.toastSuccess(...args)
    }
}));

vi.mock('../../../stores', () => ({
    useFriendStore: () => ({
        friends: mocks.friends,
        allFavoriteFriendIds: mocks.allFavoriteFriendIds,
        getAllUserStats: mocks.getAllUserStats,
        getAllUserMutualCount: mocks.getAllUserMutualCount
    }),
    useModalStore: () => ({
        confirm: (...args) => mocks.modalConfirm(...args),
        alert: (...args) => mocks.modalAlert(...args)
    }),
    useSearchStore: () => ({
        stringComparer: mocks.stringComparer,
        friendsListSearch: mocks.friendsListSearch
    }),
    useUserStore: () => ({}),
    useAppearanceSettingsStore: () => ({
        tablePageSizes: [10, 25, 50],
        tablePageSize: 25,
        randomUserColours: mocks.randomUserColours
    }),
    useVrcxStore: () => ({
        maxTableSize: 100
    })
}));

vi.mock('../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('../../../coordinators/friendRelationshipCoordinator', () => ({
    confirmDeleteFriend: (...args) => mocks.confirmDeleteFriend(...args),
    handleFriendDelete: (...args) => mocks.handleFriendDelete(...args)
}));

vi.mock('../../../plugins/router', () => ({
    router: {
        push: (...args) => mocks.routerPush(...args)
    }
}));

vi.mock('../../../api', () => ({
    userRequest: {
        getUser: (...args) => mocks.userGetUser(...args)
    },
    friendRequest: {
        deleteFriend: (...args) => mocks.friendDeleteFriend(...args)
    }
}));

vi.mock('../../../services/confusables', () => ({
    default: (value) => value,
    removeWhitespace: (value) => String(value ?? '').replace(/\s+/g, '')
}));

vi.mock('../../../shared/utils', () => ({
    localeIncludes: (source, query) =>
        String(source ?? '')
            .toLowerCase()
            .includes(String(query ?? '').toLowerCase())
}));

vi.mock('../../../lib/table/useVrcxVueTable', () => ({
    useVrcxVueTable: (options) => ({
        table: {
            setOptions: (...args) => mocks.setOptions(...args),
            setPageIndex: (...args) => mocks.setPageIndex(...args),
            setSorting: (...args) => mocks.setSorting(...args),
            getFilteredRowModel: () => ({ rows: options.data }),
            getColumn: (id) =>
                id === 'bulkSelect'
                    ? {
                          toggleVisibility: (...args) =>
                              mocks.toggleBulkColumnVisibility(...args)
                      }
                    : null
        },
        sorting: mocks.sorting,
        pagination: mocks.pagination
    })
}));

vi.mock('../columns.jsx', () => ({
    createColumns: () => [{ id: 'bulkSelect' }]
}));

vi.mock('@/components/ui/data-table', () => ({
    DataTableLayout: {
        props: ['totalItems', 'onPageSizeChange', 'onRowClick'],
        template:
            '<div data-testid="friend-list-layout">' +
            '<slot name="toolbar" />' +
            '<button data-testid="set-page-size" @click="onPageSizeChange?.(50)">set-page-size</button>' +
            '<button data-testid="trigger-row-click" @click="onRowClick?.({ original: { id: \'usr_row\' } })">row-click</button>' +
            '<span data-testid="total-items">{{ totalItems }}</span>' +
            '</div>'
    }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/input-group', () => ({
    InputGroupField: {
        props: ['modelValue'],
        emits: ['update:modelValue', 'change'],
        template:
            '<input data-testid="friend-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\')" />'
    }
}));

vi.mock('@/components/ui/progress', () => ({
    Progress: { template: '<div data-testid="progress" />' }
}));

vi.mock('@/components/ui/select', () => ({
    Select: {
        emits: ['update:modelValue'],
        template:
            '<div data-testid="select">' +
            '<button data-testid="apply-memo-filter" @click="$emit(\'update:modelValue\', [\'Memo\'])">memo</button>' +
            '<slot />' +
            '</div>'
    },
    SelectContent: { template: '<div><slot /></div>' },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectItem: { template: '<div><slot /></div>' },
    SelectTrigger: { template: '<div><slot /></div>' },
    SelectValue: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: {
        props: ['open'],
        emits: ['update:open'],
        template: '<div><slot /></div>'
    },
    DialogContent: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/switch', () => ({
    Switch: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="bulk-switch" @click="$emit(\'update:modelValue\', !modelValue)">switch</button>'
    }
}));

vi.mock('@/components/ui/toggle', () => ({
    Toggle: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="vip-toggle" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>'
    }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

vi.mock('lucide-vue-next', () => ({
    Star: { template: '<span />' }
}));

import FriendList from '../FriendList.vue';

function makeFriendCtx({ id, displayName, memo = '', dateJoined = null }) {
    return {
        id,
        memo,
        ref: {
            id,
            displayName,
            statusDescription: '',
            note: '',
            bio: '',
            $trustLevel: 'trusted',
            date_joined: dateJoined
        }
    };
}

function clickButtonByText(wrapper, text) {
    const button = wrapper
        .findAll('button')
        .find((node) => node.text().trim() === text);
    if (!button) {
        throw new Error(`Cannot find button with text: ${text}`);
    }
    return button.trigger('click');
}

async function flushAsync() {
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();
}

describe('FriendList.vue', () => {
    beforeEach(() => {
        mocks.route.path = '/friend-list';
        mocks.friends.value = new Map();
        mocks.allFavoriteFriendIds.value = new Set();
        mocks.friendsListSearch.value = '';
        mocks.pagination.value = { pageIndex: 3, pageSize: 10 };
        mocks.sorting.value = [];

        mocks.routerPush.mockReset();
        mocks.getAllUserStats.mockReset();
        mocks.getAllUserMutualCount.mockReset();
        mocks.showUserDialog.mockReset();
        mocks.modalConfirm.mockClear();
        mocks.modalAlert.mockReset();
        mocks.userGetUser.mockReset();
        mocks.friendDeleteFriend.mockReset();
        mocks.toastSuccess.mockReset();
        mocks.setOptions.mockReset();
        mocks.setPageIndex.mockReset();
        mocks.setSorting.mockReset();
        mocks.toggleBulkColumnVisibility.mockReset();
    });

    test('filters friend list by search text and VIP toggle', async () => {
        mocks.friends.value = new Map([
            ['usr_1', makeFriendCtx({ id: 'usr_1', displayName: 'Alice' })],
            ['usr_2', makeFriendCtx({ id: 'usr_2', displayName: 'Bob' })]
        ]);
        mocks.allFavoriteFriendIds.value = new Set(['usr_1']);
        mocks.friendsListSearch.value = 'alice';

        const wrapper = mount(FriendList);
        await flushAsync();
        expect(mocks.getAllUserStats).toHaveBeenCalledTimes(1);
        expect(mocks.getAllUserMutualCount).toHaveBeenCalledTimes(1);

        wrapper.vm.friendsListSearchFilterVIP = true;
        wrapper.vm.friendsListSearchChange();
        await nextTick();

        expect(
            wrapper.vm.friendsListDisplayData.map((item) => item.id)
        ).toEqual(['usr_1']);
        expect(mocks.getAllUserStats).toHaveBeenCalledTimes(1);
        expect(mocks.getAllUserMutualCount).toHaveBeenCalledTimes(1);
    });

    test('opens charts tab from toolbar button', async () => {
        const wrapper = mount(FriendList);

        await clickButtonByText(
            wrapper,
            'view.friend_list.load_mutual_friends'
        );

        expect(mocks.routerPush).toHaveBeenCalledWith({ name: 'charts' });
    });

    test('loads missing user profiles and shows completion toast', async () => {
        mocks.friends.value = new Map([
            [
                'usr_1',
                makeFriendCtx({
                    id: 'usr_1',
                    displayName: 'Alice',
                    dateJoined: null
                })
            ],
            [
                'usr_2',
                makeFriendCtx({
                    id: 'usr_2',
                    displayName: 'Bob',
                    dateJoined: '2020-01-01'
                })
            ]
        ]);
        const wrapper = mount(FriendList);
        await flushAsync();

        await clickButtonByText(wrapper, 'view.friend_list.load');
        await flushAsync();

        expect(mocks.userGetUser).toHaveBeenCalledTimes(1);
        expect(mocks.userGetUser).toHaveBeenCalledWith({ userId: 'usr_1' });
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
            'view.friend_list.load_complete'
        );
    });

    test('select row emits lookup-user for id-less value and opens user dialog for id', () => {
        const wrapper = mount(FriendList);

        wrapper.vm.selectFriendsListRow({ displayName: 'Unknown' });
        wrapper.vm.selectFriendsListRow({ id: 'usr_99', displayName: 'Known' });

        expect(wrapper.emitted('lookup-user')?.[0]?.[0]).toEqual({
            displayName: 'Unknown'
        });
        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_99');
    });

    test('toggles bulk mode column visibility and resets page size', async () => {
        const wrapper = mount(FriendList);
        mocks.toggleBulkColumnVisibility.mockReset();

        await wrapper.get('[data-testid="bulk-switch"]').trigger('click');
        await nextTick();
        expect(mocks.toggleBulkColumnVisibility).toHaveBeenCalledWith(true);

        await wrapper.get('[data-testid="set-page-size"]').trigger('click');
        expect(mocks.pagination.value).toEqual({
            pageIndex: 0,
            pageSize: 50
        });
    });
});
