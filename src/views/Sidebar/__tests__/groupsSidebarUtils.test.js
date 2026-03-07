import { describe, expect, test } from 'vitest';

import {
    buildGroupHeaderRow,
    buildGroupItemRow,
    estimateGroupRowSize,
    getGroupId
} from '../groupsSidebarUtils';

// ─── getGroupId ──────────────────────────────────────────────────────

describe('getGroupId', () => {
    test('extracts groupId from first element', () => {
        const group = [{ group: { groupId: 'grp_abc' } }];
        expect(getGroupId(group)).toBe('grp_abc');
    });

    test('returns empty string for empty array', () => {
        expect(getGroupId([])).toBe('');
    });

    test('returns empty string when group property is missing', () => {
        expect(getGroupId([{}])).toBe('');
        expect(getGroupId([{ group: {} }])).toBe('');
    });
});

// ─── buildGroupHeaderRow ─────────────────────────────────────────────

describe('buildGroupHeaderRow', () => {
    const group = [
        { group: { groupId: 'grp_1', name: 'Test Group' } },
        { group: { groupId: 'grp_1', name: 'Test Group' } }
    ];

    test('builds header row with correct properties', () => {
        const cfg = { grp_1: { isCollapsed: false } };
        const row = buildGroupHeaderRow(group, 0, cfg);
        expect(row).toEqual({
            type: 'group-header',
            key: 'group-header:grp_1',
            groupId: 'grp_1',
            label: 'Test Group',
            count: 2,
            isCollapsed: false,
            headerPaddingTop: '0px'
        });
    });

    test('sets headerPaddingTop to 10px for non-first groups', () => {
        const cfg = {};
        const row = buildGroupHeaderRow(group, 1, cfg);
        expect(row.headerPaddingTop).toBe('10px');
    });

    test('reflects collapsed state from config', () => {
        const cfg = { grp_1: { isCollapsed: true } };
        const row = buildGroupHeaderRow(group, 0, cfg);
        expect(row.isCollapsed).toBe(true);
    });

    test('defaults to not collapsed when cfg entry is missing', () => {
        const cfg = {};
        const row = buildGroupHeaderRow(group, 0, cfg);
        expect(row.isCollapsed).toBe(false);
    });
});

// ─── buildGroupItemRow ───────────────────────────────────────────────

describe('buildGroupItemRow', () => {
    const ref = {
        group: { iconUrl: 'https://example.com/icon.png', name: 'My Group' },
        instance: {
            id: 'inst_123',
            ownerId: 'usr_456',
            userCount: 5,
            capacity: 16,
            location: 'wrld_abc:inst_123~private'
        }
    };

    test('builds item row with correct properties', () => {
        const row = buildGroupItemRow(ref, 0, 'grp_1', true);
        expect(row).toEqual({
            type: 'group-item',
            key: 'group-item:grp_1:inst_123',
            ownerId: 'usr_456',
            iconUrl: 'https://example.com/icon.png',
            name: 'My Group',
            userCount: 5,
            capacity: 16,
            location: 'wrld_abc:inst_123~private',
            isVisible: true
        });
    });

    test('uses index as fallback key when instance id is missing', () => {
        const row = buildGroupItemRow({}, 7, 'grp_1', true);
        expect(row.key).toBe('group-item:grp_1:7');
    });

    test('defaults to empty/zero values for missing properties', () => {
        const row = buildGroupItemRow({}, 0, 'grp_1', true);
        expect(row.ownerId).toBe('');
        expect(row.iconUrl).toBe('');
        expect(row.name).toBe('');
        expect(row.userCount).toBe(0);
        expect(row.capacity).toBe(0);
        expect(row.location).toBe('');
    });

    test('hides age-gated instances when isAgeGatedVisible is false', () => {
        const ageGatedRef = { ...ref, ageGate: true };
        const row = buildGroupItemRow(ageGatedRef, 0, 'grp_1', false);
        expect(row.isVisible).toBe(false);
    });

    test('shows age-gated instances when isAgeGatedVisible is true', () => {
        const ageGatedRef = { ...ref, ageGate: true };
        const row = buildGroupItemRow(ageGatedRef, 0, 'grp_1', true);
        expect(row.isVisible).toBe(true);
    });

    test('detects age gate from location string', () => {
        const refWithAgeGateLocation = {
            ...ref,
            location: 'wrld_abc:inst_123~ageGate'
        };
        const row = buildGroupItemRow(
            refWithAgeGateLocation,
            0,
            'grp_1',
            false
        );
        expect(row.isVisible).toBe(false);
    });
});

// ─── estimateGroupRowSize ────────────────────────────────────────────

describe('estimateGroupRowSize', () => {
    test('returns 44 for null/undefined', () => {
        expect(estimateGroupRowSize(null)).toBe(44);
        expect(estimateGroupRowSize(undefined)).toBe(44);
    });

    test('returns 30 for group-header', () => {
        expect(estimateGroupRowSize({ type: 'group-header' })).toBe(30);
    });

    test('returns 52 for group-item', () => {
        expect(estimateGroupRowSize({ type: 'group-item' })).toBe(52);
    });

    test('returns 52 for unknown type', () => {
        expect(estimateGroupRowSize({ type: 'unknown' })).toBe(52);
    });
});
