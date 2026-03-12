import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('@/shared/utils/common', () => ({ openExternalLink: vi.fn() }));
vi.mock('../../../stores', () => ({
    useDashboardStore: () => ({
        createDashboard: vi.fn(async () => ({ id: 'dashboard-1', name: 'Dashboard', icon: 'ri-dashboard-line' })),
        getDashboard: vi.fn(() => ({ id: 'dashboard-1', name: 'Dashboard', icon: 'ri-dashboard-line' })),
        updateDashboard: vi.fn(async () => {}),
        deleteDashboard: vi.fn(async () => {}),
        setEditingDashboardId: vi.fn()
    }),
    useModalStore: () => ({
        confirm: vi.fn(async () => ({ ok: true }))
    })
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/hover-card', () => ({
    HoverCard: { template: '<div><slot /></div>' },
    HoverCardContent: { template: '<div><slot /></div>' },
    HoverCardTrigger: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/input-group', () => ({
    InputGroupButton: { template: '<button><slot /></button>' },
    InputGroupField: { template: '<input />' }
}));
vi.mock('@/components/ui/separator', () => ({ Separator: { template: '<hr />' } }));
vi.mock('@/components/ui/tree', () => ({
    Tree: {
        props: ['items'],
        template: '<div><slot :flatten-items="[]" /></div>'
    }
}));
vi.mock('@dnd-kit/vue', () => ({ DragDropProvider: { template: '<div><slot /></div>' } }));
vi.mock('@dnd-kit/vue/sortable', () => ({ isSortable: () => false }));
vi.mock('lucide-vue-next', () => new Proxy({}, { get: () => ({ template: '<i />' }) }));
vi.mock('../SortableTreeNode.vue', () => ({ default: { template: '<div />' } }));

import CustomNavDialog from '../CustomNavDialog.vue';

describe('CustomNavDialog.vue', () => {
    it('keeps folder nameKey when restoring defaults and saving', async () => {
        const defaultLayout = [
            {
                type: 'folder',
                id: 'default-folder-social',
                nameKey: 'nav_tooltip.social',
                name: 'Social',
                icon: 'ri-group-line',
                items: ['friend-log']
            }
        ];

        const wrapper = mount(CustomNavDialog, {
            props: {
                visible: true,
                layout: [],
                hiddenKeys: [],
                defaultLayout
            }
        });

        const buttons = wrapper.findAll('[data-testid="btn"]');
        const resetButton = buttons.find((button) => button.text().includes('nav_menu.custom_nav.restore_default'));
        const saveButton = buttons.find((button) => button.text().includes('common.actions.confirm'));

        await resetButton.trigger('click');
        await saveButton.trigger('click');

        const emitted = wrapper.emitted('save');
        expect(emitted).toBeTruthy();
        expect(emitted[0][0]).toEqual(defaultLayout);
        expect(emitted[0][0][0].nameKey).toBe('nav_tooltip.social');
    });
});
