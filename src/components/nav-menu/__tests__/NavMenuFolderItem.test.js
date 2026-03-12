import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('lucide-vue-next', () => ({
    ChevronRight: { template: '<i />' }
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarMenuItem: { template: '<div><slot /></div>' },
    SidebarMenuButton: { template: '<button data-testid="folder-btn"><slot /></button>' },
    SidebarMenuSub: { template: '<div><slot /></div>' },
    SidebarMenuSubItem: { template: '<div><slot /></div>' },
    SidebarMenuSubButton: {
        emits: ['click'],
        template: '<button data-testid="submenu-btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/collapsible', () => ({
    Collapsible: { template: '<div><slot :open="true" /></div>' },
    CollapsibleTrigger: { template: '<div><slot /></div>' },
    CollapsibleContent: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/context-menu', () => ({
    ContextMenu: { template: '<div><slot /></div>' },
    ContextMenuTrigger: { template: '<div><slot /></div>' },
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuItem: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
    ContextMenuSeparator: { template: '<div />' }
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: {
        emits: ['update:open'],
        template: '<div><button data-testid="dropdown-open" @click="$emit(\'update:open\', true)" /><slot /></div>'
    },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuItem: { emits: ['select'], template: '<button @click="$emit(\'select\', $event)"><slot /></button>' }
}));

import NavMenuFolderItem from '../NavMenuFolderItem.vue';

const folderItem = {
    index: 'group-1',
    icon: 'ri-folder-line',
    title: 'Folder',
    titleIsCustom: true,
    children: [{ index: 'feed', label: 'nav_tooltip.feed', icon: 'ri-rss-line', titleIsCustom: false }]
};

describe('NavMenuFolderItem', () => {
    it('emits submenu-click in expanded mode', async () => {
        const wrapper = mount(NavMenuFolderItem, {
            props: {
                item: folderItem,
                isCollapsed: false,
                activeMenuIndex: '',
                collapsedDropdownOpenId: null,
                hasNotifications: false,
                isEntryNotified: () => false,
                isNavItemNotified: () => false,
                isDashboardItem: () => false
            }
        });

        await wrapper.find('[data-testid="submenu-btn"]').trigger('click');

        expect(wrapper.emitted('submenu-click')).toBeTruthy();
    });

    it('emits collapsed-dropdown-open-change in collapsed mode', async () => {
        const wrapper = mount(NavMenuFolderItem, {
            props: {
                item: folderItem,
                isCollapsed: true,
                activeMenuIndex: '',
                collapsedDropdownOpenId: null,
                hasNotifications: false,
                isEntryNotified: () => false,
                isNavItemNotified: () => false,
                isDashboardItem: () => false
            }
        });

        await wrapper.find('[data-testid="dropdown-open"]').trigger('click');

        expect(wrapper.emitted('collapsed-dropdown-open-change')).toBeTruthy();
    });
});
