import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('lucide-vue-next', () => ({
    Heart: { template: '<i />' }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<span><slot /></span>' }
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarFooter: { template: '<div><slot /></div>' },
    SidebarMenu: { template: '<div><slot /></div>' },
    SidebarMenuItem: { template: '<div><slot /></div>' },
    SidebarMenuButton: {
        emits: ['click'],
        template:
            '<button data-testid="sidebar-menu-btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuItem: {
        emits: ['click', 'select'],
        template:
            '<button data-testid="dd-item" @click="$emit(\'click\')" @mousedown="$emit(\'select\')"><slot /></button>'
    },
    DropdownMenuLabel: { template: '<div><slot /></div>' },
    DropdownMenuSeparator: { template: '<div />' },
    DropdownMenuSub: { template: '<div><slot /></div>' },
    DropdownMenuSubTrigger: { template: '<div><slot /></div>' },
    DropdownMenuSubContent: { template: '<div><slot /></div>' },
    DropdownMenuCheckboxItem: {
        emits: ['select'],
        template:
            '<button data-testid="dd-check" @click="$emit(\'select\')"><slot /></button>'
    }
}));

import NavMenuFooter from '../NavMenuFooter.vue';

const baseProps = {
    isCollapsed: false,
    isDarkMode: false,
    hasPendingUpdate: false,
    hasPendingInstall: false,
    version: '2026.01.01',
    vrcxLogo: 'logo.png',
    themes: ['system'],
    themeMode: 'system',
    tableDensity: 'standard',
    themeColors: [{ key: 'blue', label: 'Blue', swatch: '#00f' }],
    currentThemeColor: 'blue',
    isApplyingThemeColor: false,
    themeDisplayName: (value) => value,
    themeColorDisplayName: (value) => value?.key || ''
};

describe('NavMenuFooter', () => {
    it('renders version and emits toggle-theme click', async () => {
        const wrapper = mount(NavMenuFooter, { props: baseProps });

        expect(wrapper.text()).toContain('2026.01.01');

        const buttons = wrapper.findAll('[data-testid="sidebar-menu-btn"]');
        await buttons[1].trigger('click');

        expect(wrapper.emitted('toggle-theme')).toHaveLength(1);
    });
});
