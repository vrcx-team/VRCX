import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    showFavoriteDialog: vi.fn(),
    showAvatarDialog: vi.fn(),
    selectAvatarWithConfirmation: vi.fn(),
    deleteFavorite: vi.fn(),
    removeLocalAvatarFavorite: vi.fn(),
    currentUser: { currentAvatar: '' }
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

vi.mock('../../../../stores', () => ({
    useFavoriteStore: () => ({
        showFavoriteDialog: (...args) => mocks.showFavoriteDialog(...args)
    }),
    useUserStore: () => ({
        currentUser: mocks.currentUser
    })
}));

vi.mock('../../../../coordinators/avatarCoordinator', () => ({
    showAvatarDialog: (...args) => mocks.showAvatarDialog(...args),
    selectAvatarWithConfirmation: (...args) =>
        mocks.selectAvatarWithConfirmation(...args)
}));

vi.mock('../../../../coordinators/favoriteCoordinator', () => ({
    removeLocalAvatarFavorite: (...args) =>
        mocks.removeLocalAvatarFavorite(...args)
}));

vi.mock('../../../../api', () => ({
    favoriteRequest: {
        deleteFavorite: (...args) => mocks.deleteFavorite(...args)
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
        template:
            '<img data-testid="avatar-image" :src="src" :class="$attrs.class" />'
    },
    AvatarFallback: {
        template:
            '<span data-testid="avatar-fallback" :class="$attrs.class"><slot /></span>'
    }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="button" @click="$emit(\'click\', $event)"><slot /></button>'
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
            '<button data-testid="ctx-item" @click="$emit(\'click\')"><slot /></button>'
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
            '<button data-testid="dd-item" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    AlertTriangle: { template: '<i />' },
    Lock: { template: '<i />' },
    MoreHorizontal: { template: '<i />' },
    Trash2: { template: '<i />' }
}));

import FavoritesAvatarItem from '../FavoritesAvatarItem.vue';

/**
 *
 * @param {Record<string, any>} props
 */
function mountItem(props = {}) {
    return mount(FavoritesAvatarItem, {
        props: {
            favorite: {
                id: 'avtr_1',
                ref: {
                    name: 'Avatar One',
                    authorName: 'Author',
                    thumbnailImageUrl: 'https://example.com/avatar_256.png',
                    releaseStatus: 'public'
                }
            },
            group: 'FavGroup',
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

describe('FavoritesAvatarItem.vue', () => {
    beforeEach(() => {
        mocks.showFavoriteDialog.mockReset();
        mocks.showAvatarDialog.mockReset();
        mocks.selectAvatarWithConfirmation.mockReset();
        mocks.deleteFavorite.mockReset();
        mocks.removeLocalAvatarFavorite.mockReset();
        mocks.currentUser.currentAvatar = '';
    });

    it('opens avatar details when item is clicked', async () => {
        const wrapper = mountItem();

        await wrapper.get('[data-testid="item"]').trigger('click');

        expect(mocks.showAvatarDialog).toHaveBeenCalledWith('avtr_1');
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

    it('uses rounded avatar shell and 128 thumbnail image', () => {
        const wrapper = mountItem();

        expect(wrapper.get('[data-testid="avatar"]').classes()).toEqual(
            expect.arrayContaining(['rounded-sm', 'size-full'])
        );
        expect(
            wrapper.get('[data-testid="avatar-image"]').attributes('src')
        ).toContain('avatar_128.png');
        expect(
            wrapper.get('[data-testid="avatar-fallback"]').classes()
        ).toContain('rounded-sm');
    });

    it('shows fallback text when thumbnail is missing', () => {
        const wrapper = mountItem({
            favorite: {
                id: 'avtr_no_thumb',
                ref: {
                    name: 'Bravo',
                    authorName: 'Author',
                    thumbnailImageUrl: '',
                    releaseStatus: 'public'
                }
            }
        });

        expect(wrapper.find('[data-testid="avatar-image"]').exists()).toBe(
            false
        );
        expect(wrapper.get('[data-testid="avatar-fallback"]').text()).toContain(
            'B'
        );
    });

    it('uses local delete flow for local favorites', async () => {
        const wrapper = mountItem({
            isLocalFavorite: true,
            group: { name: 'LocalGroup' },
            favorite: {
                id: 'avtr_local',
                name: 'Local Avatar',
                thumbnailImageUrl: ''
            }
        });

        await clickMenuItem(wrapper, 'view.favorite.delete_tooltip');

        expect(mocks.removeLocalAvatarFavorite).toHaveBeenCalledWith(
            'avtr_local',
            'LocalGroup'
        );
        expect(mocks.deleteFavorite).not.toHaveBeenCalled();
    });

    it('uses remote delete flow for remote favorites', async () => {
        const wrapper = mountItem();

        await clickMenuItem(wrapper, 'view.favorite.unfavorite_tooltip');

        expect(mocks.deleteFavorite).toHaveBeenCalledWith({
            objectId: 'avtr_1'
        });
        expect(mocks.removeLocalAvatarFavorite).not.toHaveBeenCalled();
    });
});
