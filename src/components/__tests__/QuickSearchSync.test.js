import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    setQuery: vi.fn(),
    filterStateRaw: {
        search: '',
        filtered: {
            items: new Map(),
            count: 0,
            groups: new Set()
        }
    },
    filterState: null,
    allItemsEntries: [
        ['a', {}],
        ['b', {}]
    ],
    allGroupsEntries: [['g1', {}]]
}));

vi.mock('@/components/ui/command', async () => {
    const { reactive, ref } = await import('vue');
    const filterState = reactive(mocks.filterStateRaw);
    mocks.filterState = filterState;
    const allItems = ref(new Map(mocks.allItemsEntries));
    const allGroups = ref(new Map(mocks.allGroupsEntries));
    return {
        useCommand: () => ({
            filterState,
            allItems,
            allGroups
        })
    };
});

vi.mock('../../stores/quickSearch', () => ({
    useQuickSearchStore: () => ({
        setQuery: (...args) => mocks.setQuery(...args)
    })
}));

import QuickSearchSync from '../QuickSearchSync.vue';

describe('QuickSearchSync.vue', () => {
    it('syncs query and keeps hint groups/items visible when query length < 2', async () => {
        mount(QuickSearchSync);

        mocks.filterState.search = 'a';
        await Promise.resolve();
        await Promise.resolve();

        expect(mocks.setQuery).toHaveBeenCalledWith('a');
        expect(mocks.filterState.filtered.count).toBe(2);
        expect(mocks.filterState.filtered.items.get('a')).toBe(1);
        expect(mocks.filterState.filtered.groups.has('g1')).toBe(true);
    });

    it('overrides Command filter for longer queries so Worker results are not hidden', async () => {
        mount(QuickSearchSync);

        mocks.filterState.search = 'rene';
        await Promise.resolve();
        await Promise.resolve();

        expect(mocks.setQuery).toHaveBeenCalledWith('rene');
        expect(mocks.filterState.filtered.count).toBe(2);
        expect(mocks.filterState.filtered.items.get('a')).toBe(1);
        expect(mocks.filterState.filtered.items.get('b')).toBe(1);
        expect(mocks.filterState.filtered.groups.has('g1')).toBe(true);
    });
});
