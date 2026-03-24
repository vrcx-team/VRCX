import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    addFavorite: vi.fn(() => Promise.resolve()),
    deleteFavoriteNoConfirm: vi.fn(),
    toastSuccess: vi.fn(),
    favoriteDialog: {
        __v_isRef: true,
        value: {
            visible: true,
            type: 'friend',
            objectId: 'usr_1',
            currentGroup: null
        }
    }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('vue-sonner', () => ({
    toast: { success: (...a) => mocks.toastSuccess(...a) }
}));
vi.mock('../../../stores', () => ({
    useFavoriteStore: () => ({
        favoriteFriendGroups: ref([
            {
                key: 'group_1',
                type: 'friend',
                name: 'group_1',
                displayName: 'G1',
                count: 0,
                capacity: 100
            }
        ]),
        favoriteAvatarGroups: ref([]),
        favoriteWorldGroups: ref([]),
        favoriteDialog: mocks.favoriteDialog,
        localWorldFavoriteGroups: ref([]),
        localAvatarFavoriteGroups: ref([]),
        localFriendFavoriteGroups: ref([]),
        localWorldFavGroupLength: vi.fn(() => 0),
        hasLocalWorldFavorite: vi.fn(() => false),
        hasLocalAvatarFavorite: vi.fn(() => false),
        localAvatarFavGroupLength: vi.fn(() => 0),
        deleteFavoriteNoConfirm: (...a) => mocks.deleteFavoriteNoConfirm(...a),
        localFriendFavGroupLength: vi.fn(() => 0),
        hasLocalFriendFavorite: vi.fn(() => false)
    }),
    useUserStore: () => ({ isLocalUserVrcPlusSupporter: ref(true) })
}));
vi.mock('../../../api', () => ({
    favoriteRequest: { addFavorite: (...a) => mocks.addFavorite(...a) }
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('lucide-vue-next', () => ({ Check: { template: '<i />' } }));

import ChooseFavoriteGroupDialog from '../ChooseFavoriteGroupDialog.vue';

describe('ChooseFavoriteGroupDialog.vue', () => {
    beforeEach(() => {
        mocks.addFavorite.mockClear();
        mocks.toastSuccess.mockClear();
        mocks.favoriteDialog.value = {
            visible: true,
            type: 'friend',
            objectId: 'usr_1',
            currentGroup: null
        };
    });

    it('runs delete action for current group', async () => {
        mocks.favoriteDialog.value = {
            visible: true,
            type: 'friend',
            objectId: 'usr_1',
            currentGroup: {
                key: 'group_1',
                displayName: 'G1',
                count: 0,
                capacity: 100
            }
        };
        const wrapper = mount(ChooseFavoriteGroupDialog);
        await wrapper.get('[data-testid="btn"]').trigger('click');

        expect(mocks.deleteFavoriteNoConfirm).toHaveBeenCalledWith('usr_1');
    });
});
