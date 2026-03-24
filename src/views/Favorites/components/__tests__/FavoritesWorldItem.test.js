import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    showFavoriteDialog: vi.fn(),
    deleteFavorite: vi.fn(),
    removeLocalWorldFavorite: vi.fn(),
    newInstanceSelfInvite: vi.fn(),
    createNewInstance: vi.fn(),
    showWorldDialog: vi.fn(),
    canOpenInstanceInGame: false
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

vi.mock('@/components/ui/context-menu', () => ({
    ContextMenu: {
        template: '<div><slot /></div>'
    },
    ContextMenuTrigger: {
        template: '<div><slot /></div>'
    },
    ContextMenuContent: {
        template: '<div><slot /></div>'
    },
    ContextMenuSeparator: {
        template: '<hr />'
    },
    ContextMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="ctx-item" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: {
        template: '<div><slot /></div>'
    },
    DropdownMenuTrigger: {
        template: '<div><slot /></div>'
    },
    DropdownMenuContent: {
        template: '<div><slot /></div>'
    },
    DropdownMenuSeparator: {
        template: '<hr />'
    },
    DropdownMenuItem: {
        emits: ['click'],
        template:
            '<button data-testid="dd-item" @click="$emit(\'click\')"><slot /></button>'
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
    Avatar: { template: '<div data-testid="avatar"><slot /></div>' },
    AvatarImage: {
        props: ['src'],
        template: '<img data-testid="avatar-image" :src="src" />'
    },
    AvatarFallback: {
        template: '<span data-testid="avatar-fallback"><slot /></span>'
    }
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

vi.mock('lucide-vue-next', () => ({
    AlertTriangle: { template: '<i />' },
    Image: { template: '<i />' },
    Lock: { template: '<i />' },
    MoreHorizontal: { template: '<i />' }
}));

vi.mock('../../../../stores', () => ({
    useFavoriteStore: () => ({
        showFavoriteDialog: (...args) => mocks.showFavoriteDialog(...args)
    }),
    useInviteStore: () => ({
        canOpenInstanceInGame: mocks.canOpenInstanceInGame
    }),
    useInstanceStore: () => ({
        createNewInstance: (...args) => mocks.createNewInstance(...args)
    })
}));

vi.mock('../../../../api', () => ({
    favoriteRequest: {
        deleteFavorite: (...args) => mocks.deleteFavorite(...args)
    }
}));

vi.mock('../../../../coordinators/inviteCoordinator', () => ({
    runNewInstanceSelfInviteFlow: (...args) =>
        mocks.newInstanceSelfInvite(...args)
}));

vi.mock('../../../../coordinators/worldCoordinator', () => ({
    showWorldDialog: (...args) => mocks.showWorldDialog(...args)
}));

vi.mock('../../../../coordinators/favoriteCoordinator', () => ({
    removeLocalWorldFavorite: (...args) =>
        mocks.removeLocalWorldFavorite(...args)
}));

import FavoritesWorldItem from '../FavoritesWorldItem.vue';

/**
 *
 * @param {Record<string, any>} props
 */
function mountItem(props = {}) {
    return mount(FavoritesWorldItem, {
        props: {
            favorite: {
                id: 'wrld_default',
                ref: {
                    name: 'Default World',
                    authorName: 'Author',
                    thumbnailImageUrl: '',
                    releaseStatus: 'public'
                }
            },
            group: 'Favorites',
            isLocalFavorite: false,
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

describe('FavoritesWorldItem.vue', () => {
    beforeEach(() => {
        mocks.showFavoriteDialog.mockReset();
        mocks.deleteFavorite.mockReset();
        mocks.removeLocalWorldFavorite.mockReset();
        mocks.newInstanceSelfInvite.mockReset();
        mocks.createNewInstance.mockReset();
        mocks.showWorldDialog.mockReset();
        mocks.canOpenInstanceInGame = false;
    });

    it('opens world details when item is clicked', async () => {
        const wrapper = mountItem();

        await wrapper.get('[data-testid="item"]').trigger('click');

        expect(mocks.showWorldDialog).toHaveBeenCalledWith('wrld_default');
    });

    it('renders the full 5-item action menu', () => {
        const wrapper = mountItem();
        const text = wrapper.text();

        expect(text).toContain('common.actions.view_details');
        expect(text).toContain('dialog.world.actions.new_instance');
        expect(text).toContain(
            'dialog.world.actions.new_instance_and_self_invite'
        );
        expect(text).toContain('view.favorite.edit_favorite_tooltip');
        expect(text).toContain('view.favorite.unfavorite_tooltip');
    });

    it('opens world details from menu action', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'common.actions.view_details');

        expect(mocks.showWorldDialog).toHaveBeenCalledWith('wrld_default');
    });

    it('opens edit favorite dialog from menu action', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'view.favorite.edit_favorite_tooltip');

        expect(mocks.showFavoriteDialog).toHaveBeenCalledWith(
            'world',
            'wrld_default'
        );
    });

    it('emits toggle-select in edit mode for remote favorites', async () => {
        const wrapper = mountItem({ editMode: true });

        await wrapper.get('[data-testid="checkbox"]').setValue(true);

        expect(wrapper.emitted('toggle-select')).toEqual([[true]]);
    });

    it('does not show checkbox in edit mode for local favorites', () => {
        const wrapper = mountItem({
            editMode: true,
            isLocalFavorite: true,
            favorite: {
                id: 'wrld_local_1',
                name: 'Local World'
            }
        });

        expect(wrapper.find('[data-testid="checkbox"]').exists()).toBe(false);
    });

    it('renders fallback id when world ref is missing', () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_missing_ref'
            },
            isLocalFavorite: true
        });

        expect(wrapper.text()).toContain('wrld_missing_ref');
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

    it('uses rounded avatar fallback when thumbnail is missing', () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_no_thumb',
                ref: {
                    name: 'No Thumb World',
                    authorName: 'Author',
                    thumbnailImageUrl: '',
                    releaseStatus: 'public'
                }
            }
        });

        expect(wrapper.find('[data-testid="avatar-image"]').exists()).toBe(
            false
        );
        expect(wrapper.get('[data-testid="avatar"]').classes()).toEqual(
            expect.arrayContaining(['rounded-sm', 'size-full'])
        );
        expect(
            wrapper.get('[data-testid="avatar-fallback"]').classes()
        ).toContain('rounded-sm');
    });

    it('deletes local favorite via coordinator', async () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_local_1',
                name: 'Local World'
            },
            group: 'LocalGroup',
            isLocalFavorite: true
        });

        await clickMenuItem(wrapper, 'view.favorite.delete_tooltip');

        expect(mocks.removeLocalWorldFavorite).toHaveBeenCalledWith(
            'wrld_local_1',
            'LocalGroup'
        );
        expect(mocks.deleteFavorite).not.toHaveBeenCalled();
    });

    it('deletes remote favorite via API', async () => {
        const wrapper = mountItem({ isLocalFavorite: false });

        await clickMenuItem(wrapper, 'view.favorite.unfavorite_tooltip');

        expect(mocks.deleteFavorite).toHaveBeenCalledWith({
            objectId: 'wrld_default'
        });
        expect(mocks.removeLocalWorldFavorite).not.toHaveBeenCalled();
    });

    it('runs new instance and self invite actions from menu', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'dialog.world.actions.new_instance');
        await clickMenuItem(
            wrapper,
            'dialog.world.actions.new_instance_and_self_invite'
        );

        expect(mocks.createNewInstance).toHaveBeenCalledWith('wrld_default');
        expect(mocks.newInstanceSelfInvite).toHaveBeenCalledWith(
            'wrld_default'
        );
    });
});
