import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    favoriteWorldGroups: null,
    shiftHeld: null,
    showFavoriteDialog: vi.fn(),
    deleteFavorite: vi.fn(),
    newInstanceSelfInvite: vi.fn(),
    createNewInstance: vi.fn()
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
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
    ContextMenuItem: {
        emits: ['click'],
        template: '<button @click="$emit(\'click\')"><slot /></button>'
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
            '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
    }
}));

vi.mock('lucide-vue-next', () => ({
    AlertTriangle: { template: '<i />' },
    Lock: { template: '<i />' },
    Mail: { template: '<i />' },
    Plus: { template: '<i />' },
    Star: { template: '<i />' },
    Trash2: { template: '<i />' }
}));

vi.mock('../../../../stores', () => ({
    useFavoriteStore: () => ({
        favoriteWorldGroups: mocks.favoriteWorldGroups,
        showFavoriteDialog: (...args) => mocks.showFavoriteDialog(...args)
    }),
    useInviteStore: () => ({
        newInstanceSelfInvite: (...args) => mocks.newInstanceSelfInvite(...args),
        canOpenInstanceInGame: false
    }),
    useInstanceStore: () => ({
        createNewInstance: (...args) => mocks.createNewInstance(...args)
    }),
    useUiStore: () => ({
        shiftHeld: mocks.shiftHeld
    })
}));

vi.mock('../../../../api', () => ({
    favoriteRequest: {
        deleteFavorite: (...args) => mocks.deleteFavorite(...args)
    }
}));

import FavoritesWorldItem from '../FavoritesWorldItem.vue';

/**
 *
 * @param props
 */
function mountItem(props = {}) {
    return mount(FavoritesWorldItem, {
        props: {
            favorite: {
                id: 'wrld_default',
                name: 'Default World',
                authorName: 'Author'
            },
            group: 'Favorites',
            isLocalFavorite: true,
            editMode: false,
            ...props
        },
        global: {
            stubs: {
                TooltipWrapper: {
                    template: '<div><slot /></div>'
                },
                FavoritesMoveDropdown: {
                    template: '<div />'
                }
            }
        }
    });
}

describe('FavoritesWorldItem.vue', () => {
    beforeEach(() => {
        mocks.favoriteWorldGroups = ref([]);
        mocks.shiftHeld = ref(false);
        mocks.showFavoriteDialog.mockReset();
        mocks.deleteFavorite.mockReset();
        mocks.newInstanceSelfInvite.mockReset();
        mocks.createNewInstance.mockReset();
    });

    it('renders fallback text when local favorite has no name', () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_missing_name'
            }
        });

        expect(wrapper.text()).toContain('wrld_missing_name');
    });

    it('emits local remove event in fallback mode when delete is clicked', async () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_missing_name'
            },
            group: 'LocalGroup'
        });

        await wrapper.get('[data-testid="btn"]').trigger('click');

        expect(wrapper.emitted('remove-local-world-favorite')).toEqual([
            ['wrld_missing_name', 'LocalGroup']
        ]);
        expect(mocks.deleteFavorite).not.toHaveBeenCalled();
    });

    it('opens local favorite dialog in edit mode when shift is not held', async () => {
        const wrapper = mountItem({
            favorite: {
                id: 'wrld_local_1',
                name: 'Local World',
                authorName: 'Author'
            },
            editMode: true
        });

        await wrapper.get('[data-testid="btn"]').trigger('click');

        expect(mocks.showFavoriteDialog).toHaveBeenCalledWith(
            'world',
            'wrld_local_1'
        );
        expect(wrapper.emitted('remove-local-world-favorite')).toBeUndefined();
    });
});
