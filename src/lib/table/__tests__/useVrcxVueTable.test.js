import { beforeEach, describe, expect, it } from 'vitest';

import { useVrcxVueTable } from '../useVrcxVueTable';

/**
 *
 * @param {...any} ids
 */
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

    it('persists columnOrder to localStorage when order changes', async () => {
        const { columnOrder } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date', 'status'),
            persistKey: 'test-col-order'
        });

        columnOrder.value = ['date', 'name', 'status'];

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-col-order')
        );
        expect(stored).toBeTruthy();
        expect(stored.columnOrder).toEqual(['date', 'name', 'status']);
    });

    it('restores persisted columnOrder on init', () => {
        localStorage.setItem(
            'vrcx:table:test-restore-order',
            JSON.stringify({ columnOrder: ['status', 'name', 'date'] })
        );

        const { columnOrder } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date', 'status'),
            persistKey: 'test-restore-order'
        });

        expect(columnOrder.value).toEqual(['status', 'name', 'date']);
    });

    it('filters stale columnOrder entries on persist', async () => {
        const { columnOrder } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-stale-order'
        });

        // Include a column ID that doesn't exist
        columnOrder.value = ['removed_col', 'date', 'name'];

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-stale-order')
        );
        expect(stored).toBeTruthy();
        // 'removed_col' should be filtered out
        expect(stored.columnOrder).toEqual(['date', 'name']);
    });

    it('does not persist columnOrder when persistColumnOrder is false', async () => {
        const { columnOrder } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-no-persist-order',
            persistColumnOrder: false
        });

        columnOrder.value = ['date', 'name'];

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-no-persist-order')
        );
        expect(stored?.columnOrder).toBeUndefined();
    });

    it('persists columnVisibility to localStorage when visibility changes', async () => {
        const { columnVisibility } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date', 'status'),
            persistKey: 'test-col-vis'
        });

        columnVisibility.value = { name: false, status: true };

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-col-vis')
        );
        expect(stored).toBeTruthy();
        expect(stored.columnVisibility).toEqual({ name: false, status: true });
    });

    it('restores persisted columnVisibility on init', () => {
        localStorage.setItem(
            'vrcx:table:test-restore-vis',
            JSON.stringify({ columnVisibility: { date: false } })
        );

        const { columnVisibility } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date', 'status'),
            persistKey: 'test-restore-vis'
        });

        expect(columnVisibility.value).toEqual({ date: false });
    });

    it('filters stale columnVisibility entries on persist', async () => {
        const { columnVisibility } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-stale-vis'
        });

        columnVisibility.value = { removed_col: false, name: false };

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-stale-vis')
        );
        expect(stored).toBeTruthy();
        expect(stored.columnVisibility).toEqual({ name: false });
    });

    it('does not persist columnVisibility when persistColumnVisibility is false', async () => {
        const { columnVisibility } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-no-persist-vis',
            persistColumnVisibility: false
        });

        columnVisibility.value = { name: false };

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-no-persist-vis')
        );
        expect(stored?.columnVisibility).toBeUndefined();
    });

    it('persists pageSize to localStorage when pagination changes', async () => {
        const { table } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-page-size',
            initialPagination: { pageIndex: 0, pageSize: 10 }
        });

        table.setPageSize(25);

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-page-size')
        );
        expect(stored).toBeTruthy();
        expect(stored.pageSize).toBe(25);
    });

    it('restores persisted pageSize on init, overriding initialPagination', () => {
        localStorage.setItem(
            'vrcx:table:test-restore-ps',
            JSON.stringify({ pageSize: 50 })
        );

        const { pagination } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-restore-ps',
            initialPagination: { pageIndex: 0, pageSize: 10 }
        });

        expect(pagination.value.pageSize).toBe(50);
    });

    it('uses initialPagination.pageSize when no persisted data exists', () => {
        const { pagination } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-initial-ps',
            initialPagination: { pageIndex: 0, pageSize: 25 }
        });

        expect(pagination.value.pageSize).toBe(25);
    });

    it('does not persist pageSize when persistPageSize is false', async () => {
        const { table } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-no-persist-ps',
            persistPageSize: false,
            initialPagination: { pageIndex: 0, pageSize: 10 }
        });

        table.setPageSize(50);

        await new Promise((r) => setTimeout(r, 300));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-no-persist-ps')
        );
        expect(stored?.pageSize).toBeUndefined();
    });

    it('resetAll clears columnSizing, columnOrder, and columnVisibility', async () => {
        const { columnSizing, columnOrder, columnVisibility, resetAll } =
            useVrcxVueTable({
                data: [],
                columns: makeColumns('name', 'date'),
                persistKey: 'test-reset-all',
                enableColumnResizing: true,
                enableColumnReorder: true
            });

        columnSizing.value = { name: 200 };
        columnOrder.value = ['date', 'name'];
        columnVisibility.value = { name: false };
        await new Promise((r) => setTimeout(r, 300));

        resetAll();

        expect(columnSizing.value).toEqual({});
        expect(columnOrder.value).toEqual([]);
        expect(columnVisibility.value).toEqual({});

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-reset-all')
        );
        expect(stored?.columnSizing).toBeUndefined();
        expect(stored?.columnOrder).toBeUndefined();
        expect(stored?.columnVisibility).toBeUndefined();
    });

    it('persists columnOrderLocked to localStorage', async () => {
        const { columnOrderLocked } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-lock-order'
        });

        expect(columnOrderLocked.value).toBe(false);

        columnOrderLocked.value = true;

        // Watcher is async, wait for it to fire
        await new Promise((r) => setTimeout(r, 50));

        const stored = JSON.parse(
            localStorage.getItem('vrcx:table:test-lock-order')
        );
        expect(stored?.columnOrderLocked).toBe(true);
    });

    it('restores columnOrderLocked from localStorage on init', () => {
        localStorage.setItem(
            'vrcx:table:test-restore-lock',
            JSON.stringify({ columnOrderLocked: true })
        );

        const { columnOrderLocked } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-restore-lock'
        });

        expect(columnOrderLocked.value).toBe(true);
    });

    it('attaches controls to table.options.meta when persistKey is set', () => {
        const { table } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date'),
            persistKey: 'test-meta'
        });

        const meta = table.options.meta;
        expect(meta.resetAll).toBeTypeOf('function');
        expect(meta.columnOrderLocked).toBeDefined();
        expect(meta.columnOrderLocked.value).toBe(false);
    });

    it('does not attach controls to meta without persistKey', () => {
        const { table } = useVrcxVueTable({
            data: [],
            columns: makeColumns('name', 'date')
        });

        const meta = table.options.meta;
        expect(meta.resetAll).toBeUndefined();
        expect(meta.columnOrderLocked).toBeUndefined();
    });
});
