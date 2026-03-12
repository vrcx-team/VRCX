import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    routerPush: vi.fn(() => Promise.resolve()),
    directAccessPaste: vi.fn(),
    logout: vi.fn(),
    clearAllNotifications: vi.fn(),
    toggleThemeMode: vi.fn(),
    toggleNavCollapsed: vi.fn(),
    initThemeColor: vi.fn(() => Promise.resolve()),
    applyThemeColor: vi.fn(() => Promise.resolve()),
    openExternalLink: vi.fn(),
    getString: vi.fn(() => Promise.resolve(null)),
    setString: vi.fn(() => Promise.resolve()),
    showVRCXUpdateDialog: vi.fn(),
    showChangeLogDialog: vi.fn(),
    notifiedMenus: { value: [] },
    pendingVRCXUpdate: { value: false },
    pendingVRCXInstall: { value: false },
    appVersion: { value: 'VRCX 2026.01.01' },
    themeMode: { value: 'system' },
    tableDensity: { value: 'standard' },
    isDarkMode: { value: false },
    isNavCollapsed: { value: false },
    currentRoute: { value: { name: 'unknown', meta: {} } },
    dashboards: { value: [] },
    dashboardNavKeys: new Set(),
    loadDashboards: vi.fn(() => Promise.resolve()),
    getDashboardNavDefinitions: vi.fn(() => []),
    createDashboard: vi.fn(() => Promise.resolve({ id: 'dashboard-1' })),
    setEditingDashboardId: vi.fn()
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
        locale: { value: 'en' }
    })
}));

vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('../../../views/Feed/columns.jsx', () => ({
    columns: []
}));

vi.mock('../../../plugins/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: mocks.currentRoute,
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));

vi.mock('../../../plugins/interopApi', () => ({
    initInteropApi: vi.fn()
}));

vi.mock('../../../services/database', () => ({
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

vi.mock('../../../services/jsonStorage', () => ({
    default: vi.fn()
}));

vi.mock('../../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: (...args) => mocks.routerPush(...args),
        currentRoute: mocks.currentRoute
    })
}));

vi.mock('../../../stores', () => ({
    useVRCXUpdaterStore: () => ({
        pendingVRCXUpdate: mocks.pendingVRCXUpdate,
        pendingVRCXInstall: mocks.pendingVRCXInstall,
        appVersion: mocks.appVersion,
        showVRCXUpdateDialog: (...args) => mocks.showVRCXUpdateDialog(...args),
        showChangeLogDialog: (...args) => mocks.showChangeLogDialog(...args)
    }),
    useUiStore: () => ({
        notifiedMenus: mocks.notifiedMenus,
        clearAllNotifications: (...args) => mocks.clearAllNotifications(...args)
    }),
    useSearchStore: () => ({
        directAccessPaste: (...args) => mocks.directAccessPaste(...args)
    }),
    useAuthStore: () => ({
        logout: (...args) => mocks.logout(...args)
    }),
    useAppearanceSettingsStore: () => ({
        themeMode: mocks.themeMode,
        tableDensity: mocks.tableDensity,
        isDarkMode: mocks.isDarkMode,
        isNavCollapsed: mocks.isNavCollapsed,
        setThemeMode: vi.fn(),
        toggleThemeMode: (...args) => mocks.toggleThemeMode(...args),
        setTableDensity: vi.fn(),
        toggleNavCollapsed: (...args) => mocks.toggleNavCollapsed(...args)
    }),
    useDashboardStore: () => ({
        dashboards: mocks.dashboards,
        dashboardNavKeys: mocks.dashboardNavKeys,
        loadDashboards: (...args) => mocks.loadDashboards(...args),
        getDashboardNavDefinitions: (...args) =>
            mocks.getDashboardNavDefinitions(...args),
        createDashboard: (...args) => mocks.createDashboard(...args),
        setEditingDashboardId: (...args) => mocks.setEditingDashboardId(...args)
    }),
    useModalStore: () => ({
        confirm: vi.fn(() => Promise.resolve({ ok: false }))
    })
}));

vi.mock('../../../services/config', () => ({
    default: {
        getString: (...args) => mocks.getString(...args),
        setString: (...args) => mocks.setString(...args)
    }
}));

vi.mock('../../../shared/constants', () => ({
    DASHBOARD_NAV_KEY_PREFIX: 'dashboard-',
    THEME_CONFIG: {
        system: { name: 'System' },
        light: { name: 'Light' },
        dark: { name: 'Dark' }
    },
    links: {
        github: 'https://github.com/vrcx-team/VRCX'
    },
    navDefinitions: [
        {
            key: 'feed',
            routeName: 'feed',
            labelKey: 'nav_tooltip.feed',
            tooltip: 'nav_tooltip.feed',
            icon: 'ri-feed-line'
        },
        {
            key: 'direct-access',
            action: 'direct-access',
            labelKey: 'nav_tooltip.direct_access',
            tooltip: 'nav_tooltip.direct_access',
            icon: 'ri-door-open-line'
        }
    ]
}));

vi.mock('../navMenuUtils', () => ({
    getFirstNavRoute: () => 'feed',
    isEntryNotified: () => false,
    normalizeHiddenKeys: (keys) => keys || [],
    sanitizeLayout: (layout) => layout
}));

vi.mock('../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args)
}));

vi.mock('@/shared/utils/base/ui', () => ({
    useThemeColor: () => ({
        themeColors: {
            value: [{ key: 'blue', label: 'Blue', swatch: '#00f' }]
        },
        currentThemeColor: { value: 'blue' },
        isApplyingThemeColor: { value: false },
        applyThemeColor: (...args) => mocks.applyThemeColor(...args),
        initThemeColor: (...args) => mocks.initThemeColor(...args)
    })
}));

vi.mock('@/components/ui/sidebar', () => ({
    Sidebar: { template: '<div><slot /></div>' },
    SidebarHeader: { template: '<div><slot /></div>' },
    SidebarContent: { template: '<div><slot /></div>' },
    SidebarFooter: { template: '<div><slot /></div>' },
    SidebarGroup: { template: '<div><slot /></div>' },
    SidebarGroupContent: { template: '<div><slot /></div>' },
    SidebarMenu: { template: '<div><slot /></div>' },
    SidebarMenuItem: { template: '<div><slot /></div>' },
    SidebarMenuSub: { template: '<div><slot /></div>' },
    SidebarMenuSubItem: { template: '<div><slot /></div>' },
    SidebarMenuButton: {
        emits: ['click'],
        template:
            '<button data-testid="menu-btn" @click="$emit(\'click\', $event)"><slot /></button>'
    },
    SidebarMenuSubButton: {
        emits: ['click'],
        template:
            '<button data-testid="submenu-btn" @click="$emit(\'click\', $event)"><slot /></button>'
    }
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuItem: {
        emits: ['click', 'select'],
        template:
            '<button data-testid="dd-item" @click="$emit(\'click\')" @mousedown="$emit(\'select\', $event)"><slot /></button>'
    },
    DropdownMenuSeparator: { template: '<hr />' },
    DropdownMenuLabel: { template: '<div><slot /></div>' },
    DropdownMenuSub: { template: '<div><slot /></div>' },
    DropdownMenuSubTrigger: { template: '<div><slot /></div>' },
    DropdownMenuSubContent: { template: '<div><slot /></div>' },
    DropdownMenuCheckboxItem: {
        emits: ['select'],
        template:
            '<button data-testid="dd-check" @click="$emit(\'select\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/context-menu', () => ({
    ContextMenu: { template: '<div><slot /></div>' },
    ContextMenuTrigger: { template: '<div><slot /></div>' },
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="ctx-item" @click="$emit(\'click\')"><slot /></button>'
    },
    ContextMenuSeparator: { template: '<hr />' }
}));

vi.mock('@/components/ui/collapsible', () => ({
    Collapsible: { template: '<div><slot :open="true" /></div>' },
    CollapsibleTrigger: { template: '<div><slot /></div>' },
    CollapsibleContent: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/kbd', () => ({
    Kbd: { template: '<kbd><slot /></kbd>' }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<span><slot /></span>' }
}));

vi.mock('lucide-vue-next', () => ({
    ChevronRight: { template: '<i />' },
    Heart: { template: '<i />' },
    Plus: { template: '<i />' }
}));

import NavMenu from '../NavMenu.vue';

function mountComponent() {
    return mount(NavMenu, {
        global: {
            stubs: {
                CustomNavDialog: {
                    template: '<div data-testid="custom-nav-dialog" />'
                }
            }
        }
    });
}

describe('NavMenu.vue', () => {
    beforeEach(() => {
        mocks.routerPush.mockClear();
        mocks.directAccessPaste.mockClear();
        mocks.logout.mockClear();
        mocks.clearAllNotifications.mockClear();
        mocks.toggleThemeMode.mockClear();
        mocks.toggleNavCollapsed.mockClear();
        mocks.initThemeColor.mockClear();
        mocks.applyThemeColor.mockClear();
        mocks.openExternalLink.mockClear();
        mocks.getString.mockClear();
        mocks.setString.mockClear();
        mocks.loadDashboards.mockClear();
        mocks.getDashboardNavDefinitions.mockClear();
        mocks.currentRoute.value = { name: 'unknown', meta: {} };
    });

    it('initializes theme and navigates to first route on mount', async () => {
        mountComponent();

        await vi.waitFor(() => {
            expect(mocks.initThemeColor).toHaveBeenCalled();
            expect(mocks.loadDashboards).toHaveBeenCalled();
            expect(mocks.getString).toHaveBeenCalledWith(
                'VRCX_customNavMenuLayoutList'
            );
        });

        await vi.waitFor(() => {
            expect(mocks.routerPush).toHaveBeenCalledWith({ name: 'feed' });
        });
    });

    it('runs direct access action when direct-access menu is clicked', async () => {
        const wrapper = mountComponent();
        await vi.waitFor(() => {
            const target = wrapper
                .findAll('[data-testid="menu-btn"]')
                .find((node) =>
                    node.text().includes('nav_tooltip.direct_access')
                );
            expect(target).toBeTruthy();
        });

        const target = wrapper
            .findAll('[data-testid="menu-btn"]')
            .find((node) => node.text().includes('nav_tooltip.direct_access'));
        await target.trigger('click');

        expect(mocks.directAccessPaste).toHaveBeenCalledTimes(1);
    });

    it('toggles theme when toggle-theme button is clicked', async () => {
        const wrapper = mountComponent();
        await Promise.resolve();
        await Promise.resolve();

        const target = wrapper
            .findAll('[data-testid="menu-btn"]')
            .find((node) => node.text().includes('nav_tooltip.toggle_theme'));
        expect(target).toBeTruthy();

        await target.trigger('click');

        expect(mocks.toggleThemeMode).toHaveBeenCalledTimes(1);
    });
});
