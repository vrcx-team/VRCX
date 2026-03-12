import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    openSearch: vi.fn(),
    markAllAsSeen: vi.fn(),
    refreshFriends: vi.fn(),
    hasUnseen: { value: true },
    centerOpen: { value: false }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('@vueuse/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useMagicKeys: () => ({}),
        whenever: vi.fn()
    };
});
vi.mock('../../../stores', () => ({
    useFriendStore: () => ({ friends: ref(new Map()), isRefreshFriendsLoading: ref(false), onlineFriendCount: ref(0) }),
    useGroupStore: () => ({ groupInstances: ref([]) }),
    useNotificationStore: () => ({ isNotificationCenterOpen: mocks.centerOpen, hasUnseenNotifications: mocks.hasUnseen, markAllAsSeen: (...a) => mocks.markAllAsSeen(...a) }),
    useAppearanceSettingsStore: () => ({ sidebarSortMethod1: ref(''), sidebarSortMethod2: ref(''), sidebarSortMethod3: ref(''), isSidebarGroupByInstance: ref(false), isHideFriendsInSameInstance: ref(false), isSidebarDivideByFriendGroup: ref(false), sidebarFavoriteGroups: ref([]), setSidebarSortMethod1: vi.fn(), setSidebarSortMethod2: vi.fn(), setSidebarSortMethod3: vi.fn(), setIsSidebarGroupByInstance: vi.fn(), setIsHideFriendsInSameInstance: vi.fn(), setIsSidebarDivideByFriendGroup: vi.fn(), setSidebarFavoriteGroups: vi.fn() }),
    useFavoriteStore: () => ({ favoriteFriendGroups: ref([]), localFriendFavoriteGroups: ref([]) })
}));
vi.mock('../../../stores/globalSearch', () => ({ useGlobalSearchStore: () => ({ open: (...a) => mocks.openSearch(...a) }) }));
vi.mock('../../../coordinators/friendSyncCoordinator', () => ({ runRefreshFriendsListFlow: (...a) => mocks.refreshFriends(...a) }));
vi.mock('../sidebarSettingsUtils', () => ({ normalizeFavoriteGroupsChange: (v) => v, resolveFavoriteGroups: (v) => v }));
vi.mock('@/components/ui/button', () => ({ Button: { emits: ['click'], template: '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('@/components/ui/context-menu', () => ({ ContextMenu: { template: '<div><slot /></div>' }, ContextMenuTrigger: { template: '<div><slot /></div>' }, ContextMenuContent: { template: '<div><slot /></div>' }, ContextMenuItem: { emits: ['click'], template: '<button data-testid="ctx" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('@/components/ui/popover', () => ({ Popover: { template: '<div><slot /></div>' }, PopoverTrigger: { template: '<div><slot /></div>' }, PopoverContent: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/select', () => ({ Select: { template: '<div><slot /></div>' }, SelectTrigger: { template: '<div><slot /></div>' }, SelectValue: { template: '<div><slot /></div>' }, SelectContent: { template: '<div><slot /></div>' }, SelectGroup: { template: '<div><slot /></div>' }, SelectItem: { template: '<div><slot /></div>' }, SelectSeparator: { template: '<hr />' } }));
vi.mock('@/components/ui/field', () => ({ Field: { template: '<div><slot /></div>' }, FieldLabel: { template: '<div><slot /></div>' }, FieldContent: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/tabs', () => ({ TabsUnderline: { template: '<div><slot name="friends" /><slot name="groups" /></div>' } }));
vi.mock('@/components/ui/switch', () => ({ Switch: { template: '<div />' } }));
vi.mock('@/components/ui/spinner', () => ({ Spinner: { template: '<div />' } }));
vi.mock('@/components/ui/tooltip', () => ({ TooltipWrapper: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/kbd', () => ({ Kbd: { template: '<kbd><slot /></kbd>' } }));
vi.mock('@/components/ui/separator', () => ({ Separator: { template: '<hr />' } }));
vi.mock('lucide-vue-next', () => ({
    Bell: { template: '<i />' },
    RefreshCw: { template: '<i />' },
    Search: { template: '<i />' },
    Settings: { template: '<i />' }
}));
vi.mock('../components/FriendsSidebar.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/GroupsSidebar.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/GroupOrderSheet.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/NotificationCenterSheet.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../../../components/GlobalSearchDialog.vue', () => ({ default: { template: '<div />' } }));

import Sidebar from '../Sidebar.vue';

describe('Sidebar.vue', () => {
    beforeEach(() => {
        mocks.openSearch.mockClear();
        mocks.markAllAsSeen.mockClear();
    });

    it('opens global search and marks notifications read', async () => {
        const wrapper = mount(Sidebar);
        const buttons = wrapper.findAll('button');
        for (const button of buttons) {
            await button.trigger('click');
            if (mocks.openSearch.mock.calls.length > 0) {
                break;
            }
        }
        await wrapper.get('[data-testid="ctx"]').trigger('click');

        expect(mocks.openSearch).toHaveBeenCalled();
        expect(mocks.markAllAsSeen).toHaveBeenCalled();
    });
});
