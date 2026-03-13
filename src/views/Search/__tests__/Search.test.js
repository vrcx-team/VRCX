import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => {
    const { ref } = require('vue');
    return {
        randomUserColours: ref(false),
        avatarRemoteDatabaseProviderList: ref(['provider-a']),
        avatarRemoteDatabaseProvider: ref('provider-a'),
        isAvatarProviderDialogVisible: ref(false),
        avatarRemoteDatabase: ref(true),
        searchText: ref(''),
        searchUserResults: ref([]),
        cachedConfig: ref({ dynamicWorldRows: [] }),
        clearSearch: vi.fn(),
        setAvatarProvider: vi.fn(),
        showAvatarDialog: vi.fn(),
        showGroupDialog: vi.fn(),
        showUserDialog: vi.fn(),
        showWorldDialog: vi.fn(),
        toastWarning: vi.fn(),
        useSearchUserApi: null,
        useSearchAvatarApi: null,
        useSearchWorldApi: null,
        useSearchGroupApi: null
    };
});

mocks.useSearchUserApi = {
    searchUserParams: ref({ offset: 0 }),
    searchUserByBio: ref(false),
    searchUserSortByLastLoggedIn: ref(false),
    isSearchUserLoading: ref(false),
    searchUser: vi.fn(),
    handleMoreSearchUser: vi.fn(),
    clearUserSearch: vi.fn()
};

mocks.useSearchAvatarApi = {
    searchAvatarPageNum: ref(0),
    searchAvatarResults: ref([]),
    searchAvatarPage: ref([]),
    isSearchAvatarLoading: ref(false),
    searchAvatar: vi.fn(),
    moreSearchAvatar: vi.fn(),
    clearAvatarSearch: vi.fn()
};

mocks.useSearchWorldApi = {
    searchWorldLabs: ref(false),
    searchWorldParams: ref({ offset: 0 }),
    searchWorldCategoryIndex: ref(null),
    searchWorldResults: ref([]),
    isSearchWorldLoading: ref(false),
    searchWorld: vi.fn(),
    moreSearchWorld: vi.fn(),
    handleSearchWorldCategorySelect: vi.fn(),
    clearWorldSearch: vi.fn()
};

mocks.useSearchGroupApi = {
    searchGroupParams: ref({ offset: 0 }),
    searchGroupResults: ref([]),
    isSearchGroupLoading: ref(false),
    searchGroup: vi.fn(),
    moreSearchGroup: vi.fn(),
    clearGroupSearch: vi.fn()
};

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('vue-sonner', () => ({
    toast: {
        warning: (...args) => mocks.toastWarning(...args)
    }
}));

vi.mock('@vueuse/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useMagicKeys: () => ({}),
        whenever: () => vi.fn()
    };
});

vi.mock('../../../stores', () => ({
    useAppearanceSettingsStore: () => ({
        randomUserColours: mocks.randomUserColours
    }),
    useAvatarProviderStore: () => ({
        avatarRemoteDatabaseProviderList:
            mocks.avatarRemoteDatabaseProviderList,
        avatarRemoteDatabaseProvider: mocks.avatarRemoteDatabaseProvider,
        isAvatarProviderDialogVisible: mocks.isAvatarProviderDialogVisible,
        setAvatarProvider: (...args) => mocks.setAvatarProvider(...args)
    }),
    useAdvancedSettingsStore: () => ({
        avatarRemoteDatabase: mocks.avatarRemoteDatabase
    }),
    useSearchStore: () => ({
        searchText: mocks.searchText,
        searchUserResults: mocks.searchUserResults,
        clearSearch: (...args) => mocks.clearSearch(...args)
    }),
    useAuthStore: () => ({
        cachedConfig: mocks.cachedConfig
    })
}));

vi.mock('../composables/useSearchUser', () => ({
    useSearchUser: () => mocks.useSearchUserApi
}));

vi.mock('../composables/useSearchAvatar', () => ({
    useSearchAvatar: () => mocks.useSearchAvatarApi
}));

vi.mock('../composables/useSearchWorld', () => ({
    useSearchWorld: () => mocks.useSearchWorldApi
}));

vi.mock('../composables/useSearchGroup', () => ({
    useSearchGroup: () => mocks.useSearchGroupApi
}));

vi.mock('../../../coordinators/avatarCoordinator', () => ({
    showAvatarDialog: (...args) => mocks.showAvatarDialog(...args)
}));

vi.mock('../../../coordinators/groupCoordinator', () => ({
    showGroupDialog: (...args) => mocks.showGroupDialog(...args)
}));

vi.mock('../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('../../../coordinators/worldCoordinator', () => ({
    showWorldDialog: (...args) => mocks.showWorldDialog(...args)
}));

vi.mock('../../../shared/utils', () => ({
    convertFileUrlToImageUrl: (url) => url,
    languageClass: (lang) => `lang-${lang}`,
    userImage: () => 'https://example.com/u.png'
}));

vi.mock('@/components/ui/tabs', () => ({
    Tabs: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<div data-testid="tabs">' +
            '<button data-testid="set-tab-user" @click="$emit(\'update:modelValue\', \'user\')" />' +
            '<button data-testid="set-tab-avatar" @click="$emit(\'update:modelValue\', \'avatar\')" />' +
            '<button data-testid="set-tab-group" @click="$emit(\'update:modelValue\', \'group\')" />' +
            '<slot />' +
            '</div>'
    },
    TabsList: { template: '<div><slot /></div>' },
    TabsTrigger: {
        props: ['value'],
        template: '<button :data-value="value"><slot /></button>'
    },
    TabsContent: {
        props: ['value'],
        template:
            '<section :data-testid="`content-${value}`"><slot /></section>'
    }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<input type="checkbox" data-testid="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
    }
}));

vi.mock('@/components/ui/input-group', () => ({
    InputGroupField: {
        props: ['modelValue', 'placeholder'],
        emits: ['input', 'keyup.enter'],
        template:
            '<input data-testid="search-input" :value="modelValue" :placeholder="placeholder" @input="$emit(\'input\', $event.target.value)" @keyup.enter="$emit(\'keyup.enter\')" />'
    }
}));

vi.mock('@/components/ui/select', () => ({
    Select: { template: '<div><slot /></div>' },
    SelectContent: { template: '<div><slot /></div>' },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectItem: { template: '<div><slot /></div>' },
    SelectTrigger: { template: '<div><slot /></div>' },
    SelectValue: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/item', () => ({
    Item: {
        emits: ['click'],
        template:
            '<article class="item" @click="$emit(\'click\')"><slot /></article>'
    },
    ItemGroup: { template: '<div><slot /></div>' },
    ItemHeader: { template: '<div><slot /></div>' },
    ItemMedia: { template: '<div><slot /></div>' },
    ItemContent: { template: '<div><slot /></div>' },
    ItemTitle: { template: '<div><slot /></div>' },
    ItemDescription: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/avatar', () => ({
    Avatar: { template: '<div><slot /></div>' },
    AvatarImage: { template: '<img />' },
    AvatarFallback: { template: '<span><slot /></span>' }
}));

vi.mock('@/components/ui/data-table', () => ({
    DataTableEmpty: { template: '<div data-testid="empty">empty</div>' }
}));

vi.mock('@/components/ui/spinner', () => ({
    Spinner: { template: '<i data-testid="spinner" />' }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

vi.mock('lucide-vue-next', () => ({
    Settings: { template: '<i />' },
    Trash2: { template: '<i />' },
    User: { template: '<i />' },
    Users: { template: '<i />' }
}));

import SearchView from '../Search.vue';

function mountSearch() {
    return mount(SearchView, {
        global: {
            stubs: {
                TooltipWrapper: { template: '<div><slot /></div>' },
                AvatarProviderDialog: {
                    template: '<div data-testid="avatar-provider-dialog" />'
                },
                SearchPagination: {
                    props: ['show', 'prevDisabled', 'nextDisabled'],
                    emits: ['prev', 'next'],
                    template: '<div data-testid="pagination" />'
                }
            }
        }
    });
}

describe('Search.vue', () => {
    beforeEach(() => {
        mocks.searchText.value = '';
        mocks.searchUserResults.value = [];
        mocks.randomUserColours.value = false;

        mocks.useSearchUserApi.searchUserParams.value = { offset: 0 };
        mocks.useSearchUserApi.searchUserByBio.value = false;
        mocks.useSearchUserApi.searchUserSortByLastLoggedIn.value = false;
        mocks.useSearchUserApi.isSearchUserLoading.value = false;

        mocks.useSearchAvatarApi.searchAvatarPageNum.value = 0;
        mocks.useSearchAvatarApi.searchAvatarResults.value = [];
        mocks.useSearchAvatarApi.searchAvatarPage.value = [];
        mocks.useSearchAvatarApi.isSearchAvatarLoading.value = false;

        mocks.useSearchWorldApi.searchWorldParams.value = { offset: 0 };
        mocks.useSearchWorldApi.searchWorldResults.value = [];
        mocks.useSearchWorldApi.isSearchWorldLoading.value = false;

        mocks.useSearchGroupApi.searchGroupParams.value = { offset: 0 };
        mocks.useSearchGroupApi.searchGroupResults.value = [];
        mocks.useSearchGroupApi.isSearchGroupLoading.value = false;

        mocks.clearSearch.mockReset();
        mocks.toastWarning.mockReset();
        mocks.showUserDialog.mockReset();
        mocks.showGroupDialog.mockReset();

        mocks.useSearchUserApi.searchUser.mockReset();
        mocks.useSearchUserApi.clearUserSearch.mockReset();
        mocks.useSearchAvatarApi.searchAvatar.mockReset();
        mocks.useSearchAvatarApi.clearAvatarSearch.mockReset();
        mocks.useSearchWorldApi.searchWorld.mockReset();
        mocks.useSearchWorldApi.clearWorldSearch.mockReset();
        mocks.useSearchGroupApi.searchGroup.mockReset();
        mocks.useSearchGroupApi.clearGroupSearch.mockReset();
    });

    it('clears all tab searches from toolbar clear button', async () => {
        const wrapper = mountSearch();

        await wrapper.get('button.ml-2').trigger('click');

        expect(mocks.useSearchUserApi.clearUserSearch).toHaveBeenCalledTimes(1);
        expect(mocks.useSearchWorldApi.clearWorldSearch).toHaveBeenCalledTimes(
            1
        );
        expect(
            mocks.useSearchAvatarApi.clearAvatarSearch
        ).toHaveBeenCalledTimes(1);
        expect(mocks.useSearchGroupApi.clearGroupSearch).toHaveBeenCalledTimes(
            1
        );
        expect(mocks.clearSearch).toHaveBeenCalledTimes(1);
    });

    it('runs user search on Enter when active tab is user', async () => {
        const wrapper = mountSearch();

        await wrapper
            .get('[data-testid="search-input"]')
            .trigger('keyup.enter');

        expect(mocks.useSearchUserApi.searchUser).toHaveBeenCalledTimes(1);
        expect(mocks.useSearchAvatarApi.searchAvatar).not.toHaveBeenCalled();
    });

    it('shows avatar minimum length warning and skips avatar search', async () => {
        const wrapper = mountSearch();
        mocks.searchText.value = 'ab';

        await wrapper.get('[data-testid="set-tab-avatar"]').trigger('click');
        await wrapper
            .get('[data-testid="search-input"]')
            .trigger('keyup.enter');

        expect(mocks.toastWarning).toHaveBeenCalledWith(
            'view.search.avatar.min_chars_warning'
        );
        expect(mocks.useSearchAvatarApi.searchAvatar).not.toHaveBeenCalled();
    });

    it('opens user dialog when clicking a user item', async () => {
        mocks.searchUserResults.value = [
            {
                id: 'usr_1',
                displayName: 'Alice',
                bio: 'Hi',
                $trustLevel: 'Known User',
                $trustClass: 'text-green',
                $userColour: '#fff',
                $languages: []
            }
        ];

        const wrapper = mountSearch();

        await wrapper.find('.item').trigger('click');

        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_1');
    });

    it('opens group dialog when clicking a group item', async () => {
        mocks.useSearchGroupApi.searchGroupResults.value = [
            {
                id: 'grp_1',
                iconUrl: 'https://example.com/group.png',
                name: 'Group One',
                memberCount: 12,
                shortCode: 'AB',
                discriminator: '1234',
                description: 'desc'
            }
        ];

        const wrapper = mountSearch();

        await wrapper.get('[data-testid="set-tab-group"]').trigger('click');
        const items = wrapper.findAll('.item');
        await items[items.length - 1].trigger('click');

        expect(mocks.showGroupDialog).toHaveBeenCalledWith('grp_1');
    });
});
