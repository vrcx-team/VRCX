import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    showFavoriteDialog: vi.fn(),
    showUserDialog: vi.fn(),
    showSendBoopDialog: vi.fn(),
    removeLocalFriendFavorite: vi.fn(),
    deleteFavorite: vi.fn(),
    sendRequestInvite: vi.fn(() => Promise.resolve()),
    sendInvite: vi.fn(() => Promise.resolve()),
    selfInvite: vi.fn(() => Promise.resolve()),
    fetch: vi.fn(() => Promise.resolve({ ref: { name: 'World Name' } })),
    showLaunchDialog: vi.fn(),
    checkCanInvite: vi.fn(() => true),
    checkCanInviteSelf: vi.fn(() => true),
    isRealInstance: vi.fn(() => true),
    currentUser: { isBoopingEnabled: true },
    isGameRunning: { value: true },
    lastLocation: { value: { location: 'wrld_here:123~private' } },
    lastLocationDestination: { value: 'wrld_destination:456~private' },
    toastSuccess: vi.fn()
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
        t: (key) => key
    })
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: (...args) => mocks.toastSuccess(...args)
    }
}));

vi.mock('../../../../stores', () => ({
    useFavoriteStore: () => ({
        showFavoriteDialog: (...args) => mocks.showFavoriteDialog(...args)
    }),
    useUserStore: () => ({
        showSendBoopDialog: (...args) => mocks.showSendBoopDialog(...args),
        currentUser: mocks.currentUser
    }),
    useGameStore: () => ({
        isGameRunning: mocks.isGameRunning
    }),
    useLocationStore: () => ({
        lastLocation: mocks.lastLocation,
        lastLocationDestination: mocks.lastLocationDestination
    }),
    useLaunchStore: () => ({
        showLaunchDialog: (...args) => mocks.showLaunchDialog(...args)
    })
}));

vi.mock('../../../../api', () => ({
    favoriteRequest: {
        deleteFavorite: (...args) => mocks.deleteFavorite(...args)
    },
    notificationRequest: {
        sendRequestInvite: (...args) => mocks.sendRequestInvite(...args),
        sendInvite: (...args) => mocks.sendInvite(...args)
    },
    instanceRequest: {
        selfInvite: (...args) => mocks.selfInvite(...args)
    },
    queryRequest: {
        fetch: (...args) => mocks.fetch(...args)
    }
}));

vi.mock('../../../../coordinators/favoriteCoordinator', () => ({
    removeLocalFriendFavorite: (...args) =>
        mocks.removeLocalFriendFavorite(...args)
}));

vi.mock('../../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('../../../../composables/useInviteChecks', () => ({
    useInviteChecks: () => ({
        checkCanInvite: (...args) => mocks.checkCanInvite(...args),
        checkCanInviteSelf: (...args) => mocks.checkCanInviteSelf(...args)
    })
}));

vi.mock('../../../../composables/useUserDisplay', () => ({
    useUserDisplay: () => ({
        userImage: () => 'https://example.com/avatar.png'
    })
}));

vi.mock('../../../../shared/utils', () => ({
    parseLocation: () => ({
        worldId: 'wrld_123',
        instanceId: '123',
        tag: '123~private'
    }),
    isRealInstance: (...args) => mocks.isRealInstance(...args)
}));

vi.mock('../../../../components/Location.vue', () => ({
    default: {
        template: '<span data-testid="location" />'
    }
}));

vi.mock('@/components/ui/item', () => ({
    Item: {
        emits: ['click'],
        template:
            '<div data-testid="item" @click="$emit(\'click\', $event)"><slot /></div>'
    },
    ItemActions: { template: '<div><slot /></div>' },
    ItemMedia: { template: '<div><slot /></div>' },
    ItemContent: { template: '<div><slot /></div>' },
    ItemTitle: { template: '<div><slot /></div>' },
    ItemDescription: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/avatar', () => ({
    Avatar: { template: '<div><slot /></div>' },
    AvatarImage: { template: '<img />' },
    AvatarFallback: { template: '<span><slot /></span>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\', $event)"><slot /></button>'
    }
}));

vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<input data-testid="checkbox" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
    }
}));

vi.mock('@/components/ui/context-menu', () => ({
    ContextMenu: { template: '<div><slot /></div>' },
    ContextMenuTrigger: { template: '<div><slot /></div>' },
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuSeparator: { template: '<hr />' },
    ContextMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="context-item" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuSeparator: { template: '<hr />' },
    DropdownMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="dropdown-item" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    MoreHorizontal: { template: '<i />' },
    Trash2: { template: '<i />' },
    User: { template: '<i />' }
}));

import FavoritesFriendItem from '../FavoritesFriendItem.vue';

/**
 *
 * @param {Record<string, any>} props
 */
function mountItem(props = {}) {
    return mount(FavoritesFriendItem, {
        props: {
            favorite: {
                id: 'usr_1',
                ref: {
                    id: 'usr_1',
                    displayName: 'Alice',
                    statusDescription: 'Hello',
                    location: 'wrld_aaa:1~private',
                    travelingToLocation: '',
                    state: 'online'
                }
            },
            group: { key: 'g1', type: 'remote' },
            editMode: false,
            selected: false,
            ...props
        }
    });
}

/**
 *
 * @param wrapper
 * @param text
 */
async function clickMenuItem(wrapper, text) {
    const buttons = wrapper.findAll('button');
    const target = buttons.find((btn) => btn.text().includes(text));
    expect(target, `menu item not found: ${text}`).toBeTruthy();
    await target.trigger('click');
}

describe('FavoritesFriendItem.vue', () => {
    beforeEach(() => {
        mocks.showFavoriteDialog.mockReset();
        mocks.showUserDialog.mockReset();
        mocks.showSendBoopDialog.mockReset();
        mocks.removeLocalFriendFavorite.mockReset();
        mocks.deleteFavorite.mockReset();
        mocks.sendRequestInvite.mockClear();
        mocks.sendInvite.mockClear();
        mocks.selfInvite.mockClear();
        mocks.fetch.mockClear();
        mocks.showLaunchDialog.mockReset();
        mocks.checkCanInvite.mockReturnValue(true);
        mocks.checkCanInviteSelf.mockReturnValue(true);
        mocks.isRealInstance.mockReturnValue(true);
        mocks.currentUser.isBoopingEnabled = true;
        mocks.isGameRunning.value = true;
        mocks.lastLocation.value = { location: 'wrld_here:123~private' };
        mocks.lastLocationDestination.value = 'wrld_destination:456~private';
    });

    it('opens user dialog when item is clicked', async () => {
        const wrapper = mountItem();

        await wrapper.get('[data-testid="item"]').trigger('click');

        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_1');
    });

    it('adds the unified hover classes on item', () => {
        const wrapper = mountItem();

        expect(wrapper.get('[data-testid="item"]').classes()).toEqual(
            expect.arrayContaining([
                'favorites-item',
                'hover:bg-muted',
                'x-hover-list'
            ])
        );
    });

    it('emits toggle-select in edit mode checkbox', async () => {
        const wrapper = mountItem({ editMode: true });

        await wrapper.get('[data-testid="checkbox"]').setValue(true);

        expect(wrapper.emitted('toggle-select')).toEqual([[true]]);
    });

    it('uses local delete flow for local favorites', async () => {
        const wrapper = mountItem({ group: { key: 'Local', type: 'local' } });

        await clickMenuItem(wrapper, 'view.favorite.delete_tooltip');

        expect(mocks.removeLocalFriendFavorite).toHaveBeenCalledWith(
            'usr_1',
            'Local'
        );
        expect(mocks.deleteFavorite).not.toHaveBeenCalled();
    });

    it('uses remote delete flow for remote favorites', async () => {
        const wrapper = mountItem({ group: { key: 'Remote', type: 'remote' } });

        await clickMenuItem(wrapper, 'view.favorite.unfavorite_tooltip');

        expect(mocks.deleteFavorite).toHaveBeenCalledWith({
            objectId: 'usr_1'
        });
        expect(mocks.removeLocalFriendFavorite).not.toHaveBeenCalled();
    });

    it('renders invite/join actions only when online with instance', () => {
        const wrapper = mountItem();

        expect(wrapper.text()).toContain('dialog.user.actions.request_invite');
        expect(wrapper.text()).toContain('dialog.user.actions.invite');
        expect(wrapper.text()).toContain(
            'dialog.user.info.launch_invite_tooltip'
        );
        expect(wrapper.text()).toContain(
            'dialog.user.info.self_invite_tooltip'
        );
    });

    it('hides invite/join actions when offline', () => {
        const wrapper = mountItem({
            favorite: {
                id: 'usr_1',
                ref: {
                    id: 'usr_1',
                    displayName: 'Alice',
                    statusDescription: 'Offline',
                    location: 'offline',
                    travelingToLocation: '',
                    state: 'offline'
                }
            }
        });

        expect(wrapper.text()).not.toContain(
            'dialog.user.actions.request_invite'
        );
        expect(wrapper.text()).not.toContain(
            'dialog.user.info.launch_invite_tooltip'
        );
        expect(wrapper.text()).not.toContain(
            'dialog.user.info.self_invite_tooltip'
        );
    });

    it('triggers request invite action', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'dialog.user.actions.request_invite');

        expect(mocks.sendRequestInvite).toHaveBeenCalledWith(
            { platform: 'standalonewindows' },
            'usr_1'
        );
    });

    it('triggers join action', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'dialog.user.info.launch_invite_tooltip');

        expect(mocks.showLaunchDialog).toHaveBeenCalledWith(
            'wrld_aaa:1~private'
        );
    });
});
