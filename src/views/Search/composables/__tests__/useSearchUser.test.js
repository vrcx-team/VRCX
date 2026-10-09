import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    searchText: require('vue').ref(''),
    moreSearchUser: vi.fn(() => Promise.resolve())
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('../../../../stores', () => ({
    useSearchStore: () => ({
        searchText: mocks.searchText,
        moreSearchUser: (...args) => mocks.moreSearchUser(...args)
    })
}));

import { useSearchUser } from '../useSearchUser';

describe('useSearchUser', () => {
    beforeEach(() => {
        mocks.searchText.value = '';
        mocks.moreSearchUser.mockReset();
        mocks.moreSearchUser.mockResolvedValue(undefined);
    });

    it('passes page direction into handleMoreSearchUser', async () => {
        const api = useSearchUser();
        api.searchUserParams.value = {
            n: 10,
            offset: 10,
            search: 'Alice',
            customFields: 'displayName',
            sort: 'relevance'
        };

        await api.handleMoreSearchUser(-1);

        expect(mocks.moreSearchUser).toHaveBeenCalledWith(-1, api.searchUserParams.value);
    });
});
