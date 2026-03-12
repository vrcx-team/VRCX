import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    selectResult: vi.fn(),
    userImage: vi.fn(() => 'https://example.com/u.png'),
    isOpen: { value: true },
    query: { value: '' },
    friendResults: { value: [] },
    ownAvatarResults: { value: [] },
    favoriteAvatarResults: { value: [] },
    ownWorldResults: { value: [] },
    favoriteWorldResults: { value: [] },
    ownGroupResults: { value: [] },
    joinedGroupResults: { value: [] },
    hasResults: { value: false }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../stores/globalSearch', () => ({
    useGlobalSearchStore: () => ({
        isOpen: mocks.isOpen,
        query: mocks.query,
        friendResults: mocks.friendResults,
        ownAvatarResults: mocks.ownAvatarResults,
        favoriteAvatarResults: mocks.favoriteAvatarResults,
        ownWorldResults: mocks.ownWorldResults,
        favoriteWorldResults: mocks.favoriteWorldResults,
        ownGroupResults: mocks.ownGroupResults,
        joinedGroupResults: mocks.joinedGroupResults,
        hasResults: mocks.hasResults,
        selectResult: (...args) => mocks.selectResult(...args)
    })
}));
vi.mock('../../composables/useUserDisplay', () => ({ useUserDisplay: () => ({ userImage: (...a) => mocks.userImage(...a) }) }));
vi.mock('../GlobalSearchSync.vue', () => ({ default: { template: '<div data-testid="sync" />' } }));
vi.mock('@/components/ui/dialog', () => ({ Dialog: { template: '<div><slot /></div>' }, DialogContent: { template: '<div><slot /></div>' }, DialogHeader: { template: '<div><slot /></div>' }, DialogTitle: { template: '<div><slot /></div>' }, DialogDescription: { template: '<div><slot /></div>' } }));
vi.mock('@/components/ui/command', () => ({
    Command: { template: '<div><slot /></div>' },
    CommandInput: { template: '<input />' },
    CommandList: { template: '<div><slot /></div>' },
    CommandGroup: { template: '<div><slot /></div>' },
    CommandItem: { emits: ['select'], template: '<button data-testid="cmd-item" @click="$emit(\'select\')"><slot /></button>' }
}));
vi.mock('lucide-vue-next', () => ({ Globe: { template: '<i />' }, Image: { template: '<i />' }, Users: { template: '<i />' } }));

import GlobalSearchDialog from '../GlobalSearchDialog.vue';

describe('GlobalSearchDialog.vue', () => {
    beforeEach(() => {
        mocks.selectResult.mockClear();
        mocks.query.value = '';
        mocks.hasResults.value = false;
        mocks.friendResults.value = [];
    });

    it('renders search dialog structure', () => {
        const wrapper = mount(GlobalSearchDialog);
        expect(wrapper.text()).toContain('side_panel.search_placeholder');
        expect(wrapper.find('[data-testid="sync"]').exists()).toBe(true);
    });
});
