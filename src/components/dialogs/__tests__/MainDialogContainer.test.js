import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    closeMainDialog: vi.fn(),
    handleBreadcrumbClick: vi.fn(),
    dialogCrumbs: {
        value: [
            { type: 'user', id: 'u1', label: 'User' },
            { type: 'world', id: 'w1', label: 'World' }
        ]
    },
    userVisible: { value: true }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('@/stores', () => ({
    useUiStore: () => ({
        dialogCrumbs: mocks.dialogCrumbs.value,
        closeMainDialog: (...a) => mocks.closeMainDialog(...a),
        handleBreadcrumbClick: (...a) => mocks.handleBreadcrumbClick(...a)
    }),
    useUserStore: () => ({ userDialog: { visible: mocks.userVisible.value } }),
    useWorldStore: () => ({ worldDialog: { visible: false } }),
    useAvatarStore: () => ({ avatarDialog: { visible: false } }),
    useGroupStore: () => ({ groupDialog: { visible: false } }),
    useInstanceStore: () => ({
        previousInstancesInfoDialog: ref({ visible: false }),
        previousInstancesListDialog: ref({ visible: false, variant: 'user' })
    })
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/breadcrumb', () => ({
    Breadcrumb: { template: '<div><slot /></div>' },
    BreadcrumbList: { template: '<div><slot /></div>' },
    BreadcrumbItem: { template: '<div><slot /></div>' },
    BreadcrumbLink: { template: '<div><slot /></div>' },
    BreadcrumbSeparator: { template: '<span>/</span>' },
    BreadcrumbPage: { template: '<span><slot /></span>' },
    BreadcrumbEllipsis: { template: '<span>...</span>' }
}));
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="crumb-dd" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));
vi.mock('lucide-vue-next', () => ({ ArrowLeft: { template: '<i />' } }));
vi.mock('../AvatarDialog/AvatarDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../GroupDialog/GroupDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../PreviousInstancesDialog/PreviousInstancesInfoDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../PreviousInstancesDialog/PreviousInstancesListDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../UserDialog/UserDialog.vue', () => ({
    default: { template: '<div data-testid="user-dialog" />' }
}));
vi.mock('../WorldDialog/WorldDialog.vue', () => ({
    default: { template: '<div />' }
}));

import MainDialogContainer from '../MainDialogContainer.vue';

describe('MainDialogContainer.vue', () => {
    beforeEach(() => {
        mocks.handleBreadcrumbClick.mockClear();
    });

    it('renders active dialog and handles breadcrumb back click', async () => {
        const wrapper = mount(MainDialogContainer);
        expect(wrapper.find('[data-testid="user-dialog"]').exists()).toBe(true);

        await wrapper.get('[data-testid="btn"]').trigger('click');
        expect(mocks.handleBreadcrumbClick).toHaveBeenCalled();
    });
});
