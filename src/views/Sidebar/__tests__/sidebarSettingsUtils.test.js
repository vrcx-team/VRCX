import { describe, expect, test } from 'vitest';

import {
    normalizeFavoriteGroupsChange,
    resolveFavoriteGroups
} from '../sidebarSettingsUtils';

// ─── resolveFavoriteGroups ───────────────────────────────────────────

describe('resolveFavoriteGroups', () => {
    const allKeys = ['group_1', 'group_2', 'local:MyGroup'];

    test('returns allKeys when stored is empty (= all)', () => {
        expect(resolveFavoriteGroups([], allKeys)).toEqual(allKeys);
    });

    test('returns stored value when not empty', () => {
        const stored = ['group_1'];
        expect(resolveFavoriteGroups(stored, allKeys)).toEqual(stored);
    });

    test('returns stored even if it equals allKeys', () => {
        expect(resolveFavoriteGroups([...allKeys], allKeys)).toEqual(allKeys);
    });

    test('handles empty allKeys', () => {
        expect(resolveFavoriteGroups([], [])).toEqual([]);
    });
});

// ─── normalizeFavoriteGroupsChange ───────────────────────────────────

describe('normalizeFavoriteGroupsChange', () => {
    const allKeys = ['group_1', 'group_2', 'local:MyGroup'];

    test('returns [] when value is null', () => {
        expect(normalizeFavoriteGroupsChange(null, allKeys)).toEqual([]);
    });

    test('returns [] when value is empty array', () => {
        expect(normalizeFavoriteGroupsChange([], allKeys)).toEqual([]);
    });

    test('returns [] when all groups are selected', () => {
        expect(normalizeFavoriteGroupsChange([...allKeys], allKeys)).toEqual(
            []
        );
    });

    test('returns [] when value is superset of allKeys', () => {
        expect(
            normalizeFavoriteGroupsChange([...allKeys, 'extra'], allKeys)
        ).toEqual([]);
    });

    test('returns filter subset when not all selected', () => {
        const subset = ['group_1'];
        expect(normalizeFavoriteGroupsChange(subset, allKeys)).toEqual(subset);
    });

    test('returns filter subset with two items', () => {
        const subset = ['group_1', 'group_2'];
        expect(normalizeFavoriteGroupsChange(subset, allKeys)).toEqual(subset);
    });

    test('treats non-empty value as all-selected when allKeys is empty (vacuous truth)', () => {
        expect(normalizeFavoriteGroupsChange(['group_1'], [])).toEqual([]);
    });
});
