import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../../../stores', () => ({
    useUserStore: () => ({ userDialog: ref({ ref: { id: 'usr_2', $isModerator: false }, isFriend: false, isFavorite: false, incomingRequest: false, outgoingRequest: false, isBlock: false, isMute: false, isMuteChat: false, isInteractOff: false, isHideAvatar: false, isShowAvatar: false }), currentUser: ref({ id: 'usr_1', isBoopingEnabled: true }) }),
    useGameStore: () => ({ isGameRunning: ref(false) }),
    useLocationStore: () => ({ lastLocation: ref({ location: 'wrld_1:1' }) })
}));
vi.mock('../../../../composables/useInviteChecks', () => ({ useInviteChecks: () => ({ checkCanInvite: () => true }) }));
vi.mock('../../../ui/dropdown-menu', () => ({ DropdownMenu: { template: '<div><slot /></div>' }, DropdownMenuTrigger: { template: '<div><slot /></div>' }, DropdownMenuContent: { template: '<div><slot /></div>' }, DropdownMenuSeparator: { template: '<hr />' }, DropdownMenuItem: { emits: ['click'], template: '<button data-testid="dd-item" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('@/components/ui/button', () => ({ Button: { emits: ['click'], template: '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>' } }));
vi.mock('../../../ui/tooltip', () => ({ TooltipWrapper: { template: '<div><slot /></div>' } }));
vi.mock('lucide-vue-next', () => ({
    Check: { template: '<i />' },
    CheckCircle: { template: '<i />' },
    Flag: { template: '<i />' },
    LineChart: { template: '<i />' },
    Mail: { template: '<i />' },
    MessageCircle: { template: '<i />' },
    MessageSquare: { template: '<i />' },
    Mic: { template: '<i />' },
    MoreHorizontal: { template: '<i />' },
    MousePointer: { template: '<i />' },
    Pencil: { template: '<i />' },
    Plus: { template: '<i />' },
    RefreshCw: { template: '<i />' },
    Settings: { template: '<i />' },
    Share2: { template: '<i />' },
    Star: { template: '<i />' },
    Trash2: { template: '<i />' },
    User: { template: '<i />' },
    VolumeX: { template: '<i />' },
    X: { template: '<i />' },
    XCircle: { template: '<i />' }
}));

import UserActionDropdown from '../UserActionDropdown.vue';

describe('UserActionDropdown.vue', () => {
    it('forwards command callback from dropdown item', async () => {
        const userDialogCommand = vi.fn();
        const wrapper = mount(UserActionDropdown, { props: { userDialogCommand } });

        await wrapper.findAll('[data-testid="dd-item"]')[0].trigger('click');

        expect(userDialogCommand).toHaveBeenCalled();
    });
});
