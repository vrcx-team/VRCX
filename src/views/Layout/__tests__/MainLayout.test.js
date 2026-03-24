import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    replace: vi.fn(),
    setNavCollapsed: vi.fn(),
    setNavWidth: vi.fn()
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
    watchState: { isLoggedIn: false }
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
    useMainLayoutResizable: () => ({
        asideDefaultSize: 30,
        asideMinSize: 0,
        asideMaxPx: 480,
        mainDefaultSize: 70,
        handleLayout: vi.fn(),
        isAsideCollapsed: () => false,
        isAsideCollapsedStatic: false,
        isSideBarTabShow: ref(true)
    })
}));
vi.mock('../../../components/ui/resizable', () => ({
    ResizablePanelGroup: { template: '<div><slot :layout="[]" /></div>' },
    ResizablePanel: { template: '<div><slot /></div>' },
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
vi.mock('../../Settings/dialogs/ChangelogDialog.vue', () => ({
    default: { template: '<div />' }
}));

import MainLayout from '../MainLayout.vue';

describe('MainLayout.vue', () => {
    it('redirects to login when not logged in', () => {
        mount(MainLayout, {
            global: {
                stubs: {
                    RouterView: { template: '<div />' },
                    KeepAlive: { template: '<div><slot /></div>' }
                }
            }
        });
        expect(mocks.replace).toHaveBeenCalledWith({ name: 'login' });
    });
});
