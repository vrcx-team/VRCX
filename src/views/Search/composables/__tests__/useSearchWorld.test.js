import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    searchText: require('vue').ref(''),
    cachedConfig: require('vue').ref({ dynamicWorldRows: [] }),
    cachedWorlds: new Map(),
    replaceBioSymbols: vi.fn((text) => text),
    getWorlds: vi.fn()
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('../../../../stores', () => ({
    useSearchStore: () => ({
        searchText: mocks.searchText
    }),
    useAuthStore: () => ({
        cachedConfig: mocks.cachedConfig
    }),
    useWorldStore: () => ({
        cachedWorlds: mocks.cachedWorlds
    })
}));

vi.mock('../../../../shared/utils', () => ({
    replaceBioSymbols: (...args) => mocks.replaceBioSymbols(...args)
}));

vi.mock('../../../../api', () => ({
    worldRequest: {
        getWorlds: (...args) => mocks.getWorlds(...args)
    }
}));

import { useSearchWorld } from '../useSearchWorld';

describe('useSearchWorld', () => {
    beforeEach(() => {
        mocks.searchText.value = '';
        mocks.cachedConfig.value = { dynamicWorldRows: [] };
        mocks.cachedWorlds.clear();
        mocks.replaceBioSymbols.mockReset();
        mocks.replaceBioSymbols.mockImplementation((text) => text);
        mocks.getWorlds.mockReset();
    });

    it('creates relevance params and appends system_approved tag', async () => {
        mocks.searchText.value = 'home world';
        mocks.replaceBioSymbols.mockReturnValue('home world');
        mocks.cachedWorlds.set('wrld_1', { id: 'wrld_1', name: 'World One' });
        mocks.getWorlds.mockResolvedValue({
            json: [{ id: 'wrld_1' }, { id: 'wrld_missing' }]
        });

        const api = useSearchWorld();
        api.searchWorld({});
        await Promise.resolve();
        await Promise.resolve();

        expect(mocks.getWorlds).toHaveBeenCalledWith(
            {
                n: 10,
                offset: 0,
                sort: 'relevance',
                search: 'home world',
                order: 'descending',
                tag: 'system_approved'
            },
            ''
        );
        expect(api.searchWorldParams.value.search).toBe('home world');
    });

    it('selects category row and uses row sort settings', async () => {
        mocks.cachedConfig.value = {
            dynamicWorldRows: [
                {
                    index: 2,
                    sortHeading: 'featured',
                    sortOrder: 'ascending',
                    tag: 'party'
                }
            ]
        };
        mocks.getWorlds.mockResolvedValue({ json: [] });

        const api = useSearchWorld();
        api.handleSearchWorldCategorySelect(2);
        await Promise.resolve();
        await Promise.resolve();

        expect(api.searchWorldCategoryIndex.value).toBe(2);
        expect(mocks.getWorlds).toHaveBeenCalledWith(
            {
                n: 10,
                offset: 0,
                sort: 'order',
                featured: 'true',
                order: 'ascending',
                tag: 'party,system_approved'
            },
            ''
        );
    });
});
