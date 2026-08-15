import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    asideInitiallyCollapsed: false,
    collapseAside: vi.fn(),
    expandAside: vi.fn(),
    replace: vi.fn(),
    setNavCollapsed: vi.fn(),
    setNavWidth: vi.fn(),
    setSideBarTabShow: null,
    watchState: { isLoggedIn: false }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ replace: (...a) => mocks.replace(...a) })
    };
});
vi.mock('../../../services/watchState', () => ({
    watchState: mocks.watchState
}));
vi.mock('../../../stores', () => ({
    useAppearanceSettingsStore: () => ({
        navWidth: ref(240),
        isNavCollapsed: ref(false),
        setNavCollapsed: (...a) => mocks.setNavCollapsed(...a),
        setNavWidth: (...a) => mocks.setNavWidth(...a)
    })
}));
vi.mock('../../../composables/useMainLayoutResizable', () => ({
    useMainLayoutResizable: () => {
        const isSideBarTabShow = ref(true);
        mocks.setSideBarTabShow = (show) => {
            isSideBarTabShow.value = show;
        };
        return {
            asideDefaultSize: 30,
            asideMinSize: 0,
            asideMaxPx: 480,
            mainDefaultSize: 70,
            handleLayout: vi.fn(),
            isAsideCollapsed: () => false,
            isAsideCollapsedStatic: false,
            isSideBarTabShow
        };
    }
}));
vi.mock('../../../components/ui/resizable', () => ({
    ResizablePanelGroup: { template: '<div><slot :layout="[]" /></div>' },
    ResizablePanel: {
        data: () => ({ isCollapsed: mocks.asideInitiallyCollapsed }),
        methods: {
            collapse() {
                this.isCollapsed = true;
                mocks.collapseAside();
            },
            expand() {
                this.isCollapsed = false;
                mocks.expandAside();
            }
        },
        template: '<div><slot /></div>'
    },
    ResizableHandle: { template: '<div />' }
}));
vi.mock('../../../components/ui/sidebar', () => ({
    SidebarProvider: { template: '<div><slot /></div>' },
    SidebarInset: { template: '<div><slot /></div>' }
}));
vi.mock('../../../components/nav-menu/NavMenu.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Sidebar/Sidebar.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/StatusBar.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/dialogs/MainDialogContainer.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/FullscreenImagePreview.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/dialogs/ChooseFavoriteGroupDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/dialogs/LaunchDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Settings/dialogs/LaunchOptionsDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Favorites/dialogs/FriendImportDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Favorites/dialogs/WorldImportDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Favorites/dialogs/AvatarImportDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock(
    '../../../components/dialogs/GroupDialog/GroupMemberModerationDialog.vue',
    () => ({ default: { template: '<div />' } })
);
vi.mock('../../../components/dialogs/InviteGroupDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Settings/dialogs/VRChatConfigDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Settings/dialogs/PrimaryPasswordDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/dialogs/SendBoopDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Tools/components/GlobalToolsDialogs.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../Settings/dialogs/ChangelogDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/onboarding/WhatsNewDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../components/onboarding/SpotlightDialog.vue', () => ({
    default: { template: '<div />' }
}));

import MainLayout from '../MainLayout.vue';

const mountLayout = () =>
    mount(MainLayout, {
        global: {
            stubs: {
                RouterView: { template: '<div />' },
                KeepAlive: { template: '<div><slot /></div>' }
            }
        }
    });

describe('MainLayout.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.asideInitiallyCollapsed = false;
        mocks.setSideBarTabShow = null;
        mocks.watchState.isLoggedIn = false;
    });

    it('redirects to login when not logged in', () => {
        mountLayout();
        expect(mocks.replace).toHaveBeenCalledWith({ name: 'login' });
    });

    it('keeps the friends sidebar collapsed after routes that hide it', async () => {
        mocks.watchState.isLoggedIn = true;
        mocks.asideInitiallyCollapsed = true;
        mountLayout();

        mocks.setSideBarTabShow(false);
        await nextTick();
        await nextTick();
        expect(mocks.collapseAside).toHaveBeenCalledTimes(1);

        mocks.setSideBarTabShow(true);
        await nextTick();
        await nextTick();
        expect(mocks.expandAside).not.toHaveBeenCalled();
    });

    it('restores the friends sidebar when it was open before a hidden route', async () => {
        mocks.watchState.isLoggedIn = true;
        mountLayout();

        mocks.setSideBarTabShow(false);
        await nextTick();
        await nextTick();
        expect(mocks.collapseAside).toHaveBeenCalledTimes(1);

        mocks.setSideBarTabShow(true);
        await nextTick();
        await nextTick();
        expect(mocks.expandAside).toHaveBeenCalledTimes(1);
    });
});
