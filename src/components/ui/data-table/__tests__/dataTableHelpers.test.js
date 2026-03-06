import { describe, expect, it } from 'vitest';

import {
    getColStyle,
    getToggleableColumns,
    isReorderable,
    isSpacer,
    isStretch,
    resolveHeaderLabel
} from '../dataTableHelpers';

// Helper to create a mock TanStack column instance
const mockCol = (id, meta = {}, overrides = {}) => ({
    id,
    columnDef: { meta },
    ...overrides
});

describe('isSpacer', () => {
    it('returns true for __spacer column', () => {
        expect(isSpacer({ id: '__spacer' })).toBe(true);
    });

    it('returns false for regular column', () => {
        expect(isSpacer({ id: 'name' })).toBe(false);
    });

    it('returns false for null/undefined', () => {
        expect(isSpacer(null)).toBe(false);
        expect(isSpacer(undefined)).toBe(false);
    });
});

describe('isStretch', () => {
    it('returns true when meta.stretch is true', () => {
        expect(isStretch(mockCol('detail', { stretch: true }))).toBe(true);
    });

    it('returns false when meta.stretch is absent', () => {
        expect(isStretch(mockCol('name'))).toBe(false);
    });

    it('returns false for null column', () => {
        expect(isStretch(null)).toBe(false);
    });
});

describe('resolveHeaderLabel', () => {
    it('returns string label from meta', () => {
        expect(resolveHeaderLabel(mockCol('name', { label: 'Name' }))).toBe(
            'Name'
        );
    });

    it('calls function label and returns result', () => {
        const col = mockCol('name', { label: () => 'Translated Name' });
        expect(resolveHeaderLabel(col)).toBe('Translated Name');
    });

    it('falls back to column id when no label', () => {
        expect(resolveHeaderLabel(mockCol('displayName'))).toBe('displayName');
    });

    it('returns empty string for null column', () => {
        expect(resolveHeaderLabel(null)).toBe('');
    });

    it('returns empty string for undefined column', () => {
        expect(resolveHeaderLabel(undefined)).toBe('');
    });
});

describe('getToggleableColumns', () => {
    it('includes columns with meta.label', () => {
        const cols = [mockCol('name', { label: 'Name' })];
        expect(getToggleableColumns(cols)).toHaveLength(1);
    });

    it('excludes spacer columns', () => {
        const cols = [
            mockCol('name', { label: 'Name' }),
            { id: '__spacer', columnDef: { meta: { label: 'Spacer' } } }
        ];
        expect(getToggleableColumns(cols)).toHaveLength(1);
        expect(getToggleableColumns(cols)[0].id).toBe('name');
    });

    it('includes stretch columns', () => {
        const cols = [
            mockCol('name', { label: 'Name' }),
            mockCol('detail', { stretch: true, label: 'Detail' })
        ];
        expect(getToggleableColumns(cols)).toHaveLength(2);
    });

    it('excludes columns with disableVisibilityToggle', () => {
        const cols = [
            mockCol('name', { label: 'Name' }),
            mockCol('hidden', {
                label: 'Hidden',
                disableVisibilityToggle: true
            })
        ];
        expect(getToggleableColumns(cols)).toHaveLength(1);
    });

    it('excludes columns without meta.label', () => {
        const cols = [
            mockCol('name', { label: 'Name' }),
            mockCol('icon'),
            mockCol('expand', {})
        ];
        expect(getToggleableColumns(cols)).toHaveLength(1);
    });

    it('returns empty array for non-array input', () => {
        expect(getToggleableColumns(null)).toEqual([]);
    });

    it('returns empty array when all columns are excluded', () => {
        const cols = [
            { id: '__spacer', columnDef: { meta: {} } },
            mockCol('icon')
        ];
        expect(getToggleableColumns(cols)).toEqual([]);
    });
});

describe('getColStyle', () => {
    it('returns width 0px for spacer column', () => {
        expect(getColStyle({ id: '__spacer' })).toEqual({ width: '0px' });
    });

    it('returns null for stretch column', () => {
        expect(getColStyle(mockCol('detail', { stretch: true }))).toBeNull();
    });

    it('returns width from getSize()', () => {
        const col = { ...mockCol('name'), getSize: () => 200 };
        expect(getColStyle(col)).toEqual({ width: '200px' });
    });

    it('returns null when getSize returns non-finite', () => {
        const col = { ...mockCol('name'), getSize: () => NaN };
        expect(getColStyle(col)).toBeNull();
    });

    it('returns null when getSize is missing', () => {
        expect(getColStyle(mockCol('name'))).toBeNull();
    });
});

describe('isReorderable', () => {
    const noPinning = () => false;

    it('returns true for normal column with label', () => {
        const header = { column: mockCol('name', { label: 'Name' }) };
        expect(isReorderable(header, noPinning)).toBe(true);
    });

    it('returns false for column without label', () => {
        const header = { column: mockCol('expander') };
        expect(isReorderable(header, noPinning)).toBe(false);
    });

    it('returns false for spacer column', () => {
        const header = { column: { id: '__spacer', columnDef: { meta: {} } } };
        expect(isReorderable(header, noPinning)).toBe(false);
    });

    it('returns false for pinned column', () => {
        const header = { column: mockCol('name', { label: 'Name' }) };
        const isPinned = () => true;
        expect(isReorderable(header, isPinned)).toBe(false);
    });

    it('returns false for columns with disableReorder', () => {
        const header = {
            column: mockCol('name', { label: 'Name', disableReorder: true })
        };
        expect(isReorderable(header, noPinning)).toBe(false);
    });

    it('returns false for null header', () => {
        expect(isReorderable(null, noPinning)).toBe(false);
    });

    it('returns false for header without column', () => {
        expect(isReorderable({}, noPinning)).toBe(false);
    });
});
