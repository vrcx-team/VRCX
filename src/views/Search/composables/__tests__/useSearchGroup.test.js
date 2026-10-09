import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    searchText: require('vue').ref(''),
    replaceBioSymbols: vi.fn((text) => text),
    groupSearch: vi.fn()
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('../../../../stores', () => ({
    useSearchStore: () => ({
        searchText: mocks.searchText
    })
}));

vi.mock('../../../../shared/utils', () => ({
    replaceBioSymbols: (...args) => mocks.replaceBioSymbols(...args)
}));

vi.mock('../../../../api', () => ({
    groupRequest: {
        groupSearch: (...args) => mocks.groupSearch(...args)
    }
}));

import { useSearchGroup } from '../useSearchGroup';

describe('useSearchGroup', () => {
    beforeEach(() => {
        mocks.searchText.value = '';
        mocks.replaceBioSymbols.mockReset();
        mocks.replaceBioSymbols.mockImplementation((text) => text);
        mocks.groupSearch.mockReset();
    });

    it('moves backward paging offset without going below zero', async () => {
        mocks.groupSearch.mockResolvedValue({ json: [] });
        const api = useSearchGroup();
        api.searchGroupParams.value = { n: 10, offset: 5, query: 'abc' };

        await api.moreSearchGroup(-1);

        expect(mocks.groupSearch).toHaveBeenCalledWith({
            n: 10,
            offset: 0,
            query: 'abc'
        });
    });
});
