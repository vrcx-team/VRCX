import { describe, expect, it, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({
    avatarRemoteDatabase: require('vue').ref(true),
    searchText: require('vue').ref(''),
    lookupAvatars: vi.fn()
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('../../../../stores', () => ({
    useAdvancedSettingsStore: () => ({
        avatarRemoteDatabase: mocks.avatarRemoteDatabase
    }),
    useSearchStore: () => ({
        searchText: mocks.searchText
    })
}));

vi.mock('../../../../coordinators/avatarCoordinator', () => ({
    lookupAvatars: (...args) => mocks.lookupAvatars(...args)
}));

import { useSearchAvatar } from '../useSearchAvatar';

describe('useSearchAvatar', () => {
    beforeEach(() => {
        mocks.avatarRemoteDatabase.value = true;
        mocks.searchText.value = '';
        mocks.lookupAvatars.mockReset();
    });

    it('queries remote avatars and builds first page', async () => {
        mocks.searchText.value = 'alice';
        mocks.lookupAvatars.mockResolvedValue([
            { id: 'avtr_1', name: 'A' },
            { id: 'avtr_1', name: 'A-dup' },
            { id: 'avtr_2', name: 'B' }
        ]);

        const api = useSearchAvatar();
        await api.searchAvatar();

        expect(mocks.lookupAvatars).toHaveBeenCalledWith('search', 'alice');
        expect(api.searchAvatarResults.value.map((x) => x.id)).toEqual(['avtr_1', 'avtr_2']);
        expect(api.searchAvatarPage.value.map((x) => x.id)).toEqual(['avtr_1', 'avtr_2']);
        expect(api.searchAvatarPageNum.value).toBe(0);
    });

    it('skips remote query when text is too short', async () => {
        mocks.searchText.value = 'ab';
        const api = useSearchAvatar();

        await api.searchAvatar();

        expect(mocks.lookupAvatars).not.toHaveBeenCalled();
        expect(api.searchAvatarResults.value).toEqual([]);
    });

    it('paginates results by 10 items', () => {
        const api = useSearchAvatar();
        api.searchAvatarResults.value = Array.from({ length: 25 }, (_, i) => ({ id: `avtr_${i}` }));
        api.searchAvatarPage.value = api.searchAvatarResults.value.slice(0, 10);

        api.moreSearchAvatar(1);
        expect(api.searchAvatarPageNum.value).toBe(1);
        expect(api.searchAvatarPage.value.map((x) => x.id)).toEqual(
            Array.from({ length: 10 }, (_, i) => `avtr_${i + 10}`)
        );

        api.moreSearchAvatar(-1);
        expect(api.searchAvatarPageNum.value).toBe(0);
        expect(api.searchAvatarPage.value.map((x) => x.id)).toEqual(
            Array.from({ length: 10 }, (_, i) => `avtr_${i}`)
        );
    });
});
