import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    selfInvite: vi.fn(async () => ({})),
    writeText: vi.fn(),
    getBool: vi.fn(async () => false),
    launchDialogData: {
        value: {
            visible: true,
            loading: true,
            tag: 'wrld_1:123',
            shortName: 'abc'
        }
    }
}));

Object.assign(globalThis, {
    navigator: { clipboard: { writeText: (...a) => mocks.writeText(...a) } }
});

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../stores', () => ({
    useFriendStore: () => ({ friends: ref(new Map()) }),
    useGameStore: () => ({ isGameRunning: ref(false) }),
    useInviteStore: () => ({ canOpenInstanceInGame: ref(false) }),
    useLaunchStore: () => ({
        launchDialogData: mocks.launchDialogData,
        launchGame: vi.fn(),
        tryOpenInstanceInVrc: vi.fn()
    }),
    useLocationStore: () => ({ lastLocation: ref({ friendList: new Map() }) }),
    useModalStore: () => ({ confirm: vi.fn() })
}));
vi.mock('../../../shared/utils', () => ({
    getLaunchURL: () => 'vrchat://launch',
    isRealInstance: () => true,
    parseLocation: () => ({
        isRealInstance: true,
        worldId: 'wrld_1',
        instanceId: '123',
        tag: 'wrld_1:123'
    })
}));
vi.mock('../../../composables/useInviteChecks', () => ({
    useInviteChecks: () => ({ checkCanInvite: () => true })
}));
vi.mock('../../../api', () => ({
    instanceRequest: {
        selfInvite: (...a) => mocks.selfInvite(...a),
        getInstanceShortName: vi.fn()
    },
    queryRequest: { fetch: vi.fn() }
}));
vi.mock('../../../services/config', () => ({
    default: { getBool: (...a) => mocks.getBool(...a), setBool: vi.fn() }
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
    DialogDescription: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuItem: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/field', () => ({
    Field: { template: '<div><slot /></div>' },
    FieldGroup: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/button-group', () => ({
    ButtonGroup: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/input-group', () => ({
    InputGroupField: { template: '<input />' }
}));
vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));
vi.mock('../InviteDialog/InviteDialog.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('lucide-vue-next', () => ({
    Copy: { template: '<i />' },
    Info: { template: '<i />' },
    MoreHorizontal: { template: '<i />' }
}));

import LaunchDialog from '../LaunchDialog.vue';

describe('LaunchDialog.vue', () => {
    beforeEach(() => {
        mocks.selfInvite.mockClear();
    });

    it('renders launch dialog header', async () => {
        const wrapper = mount(LaunchDialog);
        await Promise.resolve();
        expect(wrapper.text()).toContain('dialog.launch.header');
    });
});
