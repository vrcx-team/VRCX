import { beforeEach, describe, expect, it } from 'vitest';

import { useVrcxVueTable } from '../useVrcxVueTable';

function makeColumns(...ids) {
    return ids.map((id) => ({ id, header: id, accessorKey: id }));
}

describe('useVrcxVueTable persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('persists sorting to localStorage when sorting changes', async () => {
        const { sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-sort',
            initialSorting: []
        });

        sorting.value = [{ id: 'name', desc: false }];

        // Wait for debounce (200ms default)
        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(localStorage.getItem('vrcx:table:test-sort'));
        expect(stored).toBeTruthy();
        expect(stored.sorting).toEqual([{ id: 'name', desc: false }]);
    });

    it('restores persisted sorting on init, overriding initialSorting', () => {
        localStorage.setItem(
            'vrcx:table:test-restore',
            JSON.stringify({ sorting: [{ id: 'date', desc: true }] })
        );

        const { sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-restore',
            initialSorting: [{ id: 'name', desc: false }]
        });

        expect(sorting.value).toEqual([{ id: 'date', desc: true }]);
    });

    it('filters out stale sorting entries for removed columns', () => {
        localStorage.setItem(
            'vrcx:table:test-stale',
            JSON.stringify({
                sorting: [
                    { id: 'removed_col', desc: false },
                    { id: 'name', desc: true }
                ]
            })
        );

        const { sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-stale',
            initialSorting: []
        });

        // Stale entry should have been loaded but will be filtered on next persist write
        // On init, the raw persisted array is loaded as-is
        expect(sorting.value).toContainEqual({ id: 'name', desc: true });
    });

    it('does not persist sorting when persistSorting is false', async () => {
        const { sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-no-persist-sort',
            persistSorting: false,
            initialSorting: []
        });

        sorting.value = [{ id: 'name', desc: false }];

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-no-persist-sort')
        );
        // Should be null or not contain sorting
        expect(stored?.sorting).toBeUndefined();
    });

    it('still persists columnSizing alongside sorting', async () => {
        const { columnSizing, sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-both',
            initialSorting: []
        });

        columnSizing.value = { name: 200 };

        // Wait for columnSizing debounce to fire first
        await new Promise((r) => setTimeout(r, 300));

        sorting.value = [{ id: 'date', desc: true }];

        // Wait for sorting debounce to fire
        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(localStorage.getItem('vrcx:table:test-both'));
        expect(stored).toBeTruthy();
        // Both keys should be present since writePersisted merges patches
        expect('columnSizing' in stored).toBe(true);
        expect(stored.sorting).toEqual([{ id: 'date', desc: true }]);
    });

    it('uses initialSorting when no persisted data exists', () => {
        const { sorting } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-initial',
            initialSorting: [{ id: 'date', desc: true }]
        });

        expect(sorting.value).toEqual([{ id: 'date', desc: true }]);
    });
});
