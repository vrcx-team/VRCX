import { describe, expect, it } from 'vitest';

import {
    filterOrderByColumns,
    filterSizingByColumns,
    filterSortingByColumns,
    filterVisibilityByColumns,
    findStretchColumnId,
    getColumnId,
    safeJsonParse,
    withSpacerColumn
} from '../useVrcxVueTable';

const cols = (...ids) => ids.map((id) => ({ id }));

describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
        expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    });

    it('returns null for invalid JSON', () => {
        expect(safeJsonParse('not json')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(safeJsonParse('')).toBeNull();
    });

    it('returns null for null/undefined', () => {
        expect(safeJsonParse(null)).toBeNull();
        expect(safeJsonParse(undefined)).toBeNull();
    });
});

describe('filterSizingByColumns', () => {
    it('keeps only keys matching column IDs', () => {
        const sizing = { name: 200, date: 150, removed: 100 };
        expect(filterSizingByColumns(sizing, cols('name', 'date'))).toEqual({
            name: 200,
            date: 150
        });
    });

    it('returns empty object for null sizing', () => {
        expect(filterSizingByColumns(null, cols('a'))).toEqual({});
    });

    it('returns empty object for non-object sizing', () => {
        expect(filterSizingByColumns('bad', cols('a'))).toEqual({});
    });

    it('returns empty object for null columns', () => {
        expect(filterSizingByColumns({ a: 1 }, null)).toEqual({});
    });
});

describe('filterSortingByColumns', () => {
    it('keeps entries with valid column IDs', () => {
        const sorting = [
            { id: 'name', desc: false },
            { id: 'removed', desc: true }
        ];
        expect(filterSortingByColumns(sorting, cols('name', 'date'))).toEqual([
            { id: 'name', desc: false }
        ]);
    });

    it('returns empty array for non-array input', () => {
        expect(filterSortingByColumns(null, cols('a'))).toEqual([]);
        expect(filterSortingByColumns('bad', cols('a'))).toEqual([]);
    });

    it('returns empty array for null columns', () => {
        expect(
            filterSortingByColumns([{ id: 'a', desc: false }], null)
        ).toEqual([]);
    });
});

describe('filterOrderByColumns', () => {
    it('keeps IDs present in columns', () => {
        expect(
            filterOrderByColumns(
                ['date', 'removed', 'name'],
                cols('name', 'date')
            )
        ).toEqual(['date', 'name']);
    });

    it('returns empty array for non-array input', () => {
        expect(filterOrderByColumns(null, cols('a'))).toEqual([]);
        expect(filterOrderByColumns({}, cols('a'))).toEqual([]);
    });

    it('returns empty array for null columns', () => {
        expect(filterOrderByColumns(['a'], null)).toEqual([]);
    });
});

describe('filterVisibilityByColumns', () => {
    it('keeps keys matching column IDs', () => {
        const vis = { name: false, removed: true, date: false };
        expect(filterVisibilityByColumns(vis, cols('name', 'date'))).toEqual({
            name: false,
            date: false
        });
    });

    it('returns empty object for null visibility', () => {
        expect(filterVisibilityByColumns(null, cols('a'))).toEqual({});
    });

    it('returns empty object for non-object visibility', () => {
        expect(filterVisibilityByColumns(42, cols('a'))).toEqual({});
    });

    it('returns empty object for null columns', () => {
        expect(filterVisibilityByColumns({ a: true }, null)).toEqual({});
    });
});

describe('getColumnId', () => {
    it('returns id when present', () => {
        expect(getColumnId({ id: 'foo' })).toBe('foo');
    });

    it('falls back to accessorKey', () => {
        expect(getColumnId({ accessorKey: 'bar' })).toBe('bar');
    });

    it('prefers id over accessorKey', () => {
        expect(getColumnId({ id: 'foo', accessorKey: 'bar' })).toBe('foo');
    });

    it('returns null for null/undefined', () => {
        expect(getColumnId(null)).toBeNull();
        expect(getColumnId(undefined)).toBeNull();
    });

    it('returns null for empty object', () => {
        expect(getColumnId({})).toBeNull();
    });
});

describe('findStretchColumnId', () => {
    it('returns the ID of the stretch column', () => {
        const columns = [
            { id: 'a' },
            { id: 'b', meta: { stretch: true } },
            { id: 'c' }
        ];
        expect(findStretchColumnId(columns)).toBe('b');
    });

    it('returns first stretch column when multiple exist', () => {
        const columns = [
            { id: 'x', meta: { stretch: true } },
            { id: 'y', meta: { stretch: true } }
        ];
        expect(findStretchColumnId(columns)).toBe('x');
    });

    it('returns null when no stretch column exists', () => {
        expect(findStretchColumnId([{ id: 'a' }, { id: 'b' }])).toBeNull();
    });

    it('returns null for non-array input', () => {
        expect(findStretchColumnId(null)).toBeNull();
        expect(findStretchColumnId('bad')).toBeNull();
    });

    it('falls back to accessorKey for stretch column', () => {
        const columns = [{ accessorKey: 'detail', meta: { stretch: true } }];
        expect(findStretchColumnId(columns)).toBe('detail');
    });
});

describe('withSpacerColumn', () => {
    const baseCols = [{ id: 'a' }, { id: 'b' }];

    it('appends spacer column at the end when no stretchAfterId', () => {
        const result = withSpacerColumn(baseCols, true);
        expect(result).toHaveLength(3);
        expect(result[2].id).toBe('__spacer');
    });

    it('uses custom spacerId', () => {
        const result = withSpacerColumn(baseCols, true, 'custom_spacer');
        expect(result[2].id).toBe('custom_spacer');
    });

    it('inserts spacer after stretchAfterId column', () => {
        const columns = [{ id: 'x' }, { id: 'stretch' }, { id: 'y' }];
        const result = withSpacerColumn(columns, true, '__spacer', 'stretch');
        expect(result.map((c) => c.id)).toEqual([
            'x',
            'stretch',
            '__spacer',
            'y'
        ]);
    });

    it('returns original columns when disabled', () => {
        const result = withSpacerColumn(baseCols, false);
        expect(result).toBe(baseCols);
    });

    it('does not add duplicate spacer', () => {
        const columns = [{ id: 'a' }, { id: '__spacer' }];
        const result = withSpacerColumn(columns, true);
        expect(result).toBe(columns);
        expect(result).toHaveLength(2);
    });

    it('returns non-array input as-is', () => {
        expect(withSpacerColumn(null, true)).toBeNull();
    });

    it('appends spacer when stretchAfterId not found', () => {
        const result = withSpacerColumn(baseCols, true, '__spacer', 'missing');
        expect(result).toHaveLength(3);
        expect(result[2].id).toBe('__spacer');
    });

    it('spacer column has correct defaults', () => {
        const result = withSpacerColumn(baseCols, true);
        const spacer = result[2];
        expect(spacer.enableSorting).toBe(false);
        expect(spacer.size).toBe(0);
        expect(spacer.minSize).toBe(0);
        expect(spacer.header()).toBeNull();
        expect(spacer.cell()).toBeNull();
    });
});
