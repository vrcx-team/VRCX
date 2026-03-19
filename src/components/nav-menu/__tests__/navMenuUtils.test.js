import { describe, expect, test } from 'vitest';

import {
    getFirstNavRoute,
    isEntryNotified,
    normalizeHiddenKeys,
    sanitizeLayout
} from '../navMenuUtils';

// Minimal nav definitions for testing
const testDefinitions = [
    { key: 'feed', routeName: 'feed' },
    { key: 'search', routeName: 'search' },
    { key: 'tools', routeName: 'tools' },
    { key: 'charts-instance', routeName: 'charts-instance' },
    { key: 'charts-mutual', routeName: 'charts-mutual' },
    { key: 'charts-hot-worlds', routeName: 'charts-hot-worlds' },
    { key: 'notification', routeName: 'notification' },
    { key: 'direct-access', action: 'direct-access' }
];
const testDefinitionMap = new Map(testDefinitions.map((d) => [d.key, d]));
const mockT = (key) => `translated:${key}`;
const mockGenerateFolderId = () => 'generated-folder-id';

// ─── normalizeHiddenKeys ─────────────────────────────────────────────

describe('normalizeHiddenKeys', () => {
    test('returns empty array for non-array input', () => {
        expect(normalizeHiddenKeys(null, testDefinitionMap)).toEqual([]);
        expect(normalizeHiddenKeys(undefined, testDefinitionMap)).toEqual([]);
        expect(normalizeHiddenKeys('string', testDefinitionMap)).toEqual([]);
        expect(normalizeHiddenKeys(42, testDefinitionMap)).toEqual([]);
    });

    test('returns empty array for empty array', () => {
        expect(normalizeHiddenKeys([], testDefinitionMap)).toEqual([]);
    });

    test('filters out invalid keys', () => {
        expect(
            normalizeHiddenKeys(
                ['feed', 'nonexistent', 'search'],
                testDefinitionMap
            )
        ).toEqual(['feed', 'search']);
    });

    test('deduplicates keys', () => {
        expect(
            normalizeHiddenKeys(['feed', 'feed', 'search'], testDefinitionMap)
        ).toEqual(['feed', 'search']);
    });

    test('filters out falsy values', () => {
        expect(
            normalizeHiddenKeys(
                [null, '', undefined, 'feed'],
                testDefinitionMap
            )
        ).toEqual(['feed']);
    });

    test('preserves order of valid keys', () => {
        expect(
            normalizeHiddenKeys(['tools', 'feed', 'search'], testDefinitionMap)
        ).toEqual(['tools', 'feed', 'search']);
    });
});

// ─── getFirstNavRoute ────────────────────────────────────────────────

describe('getFirstNavRoute', () => {
    test('returns null for empty layout', () => {
        expect(getFirstNavRoute([], testDefinitionMap)).toBeNull();
    });

    test('returns first item routeName', () => {
        const layout = [{ type: 'item', key: 'feed' }];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBe('feed');
    });

    test('skips items without routeName', () => {
        const layout = [
            { type: 'item', key: 'direct-access' },
            { type: 'item', key: 'search' }
        ];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBe('search');
    });

    test('returns route from folder items', () => {
        const layout = [
            {
                type: 'folder',
                items: ['feed', 'search']
            }
        ];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBe('feed');
    });

    test('returns null when no routable items exist', () => {
        const layout = [{ type: 'item', key: 'direct-access' }];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBeNull();
    });

    test('returns null for unknown keys', () => {
        const layout = [{ type: 'item', key: 'unknown' }];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBeNull();
    });

    test('checks folder items for routable entry', () => {
        const layout = [
            {
                type: 'folder',
                items: ['direct-access', 'tools']
            }
        ];
        expect(getFirstNavRoute(layout, testDefinitionMap)).toBe('tools');
    });
});

// ─── isEntryNotified ─────────────────────────────────────────────────

describe('isEntryNotified', () => {
    test('returns false for null/undefined entry', () => {
        expect(isEntryNotified(null, ['feed'])).toBe(false);
        expect(isEntryNotified(undefined, ['feed'])).toBe(false);
    });

    test('matches by index', () => {
        const entry = { index: 'feed' };
        expect(isEntryNotified(entry, ['feed', 'search'])).toBe(true);
    });

    test('matches by routeName', () => {
        const entry = { routeName: 'search' };
        expect(isEntryNotified(entry, ['search'])).toBe(true);
    });

    test('matches by path last segment', () => {
        const entry = { path: '/app/settings' };
        expect(isEntryNotified(entry, ['settings'])).toBe(true);
    });

    test('returns false when no match', () => {
        const entry = { index: 'feed', routeName: 'feed' };
        expect(isEntryNotified(entry, ['search', 'tools'])).toBe(false);
    });

    test('matches any of multiple targets', () => {
        const entry = {
            index: 'feed',
            routeName: 'home',
            path: '/app/dashboard'
        };
        expect(isEntryNotified(entry, ['dashboard'])).toBe(true);
    });

    test('returns false for empty notifiedMenus', () => {
        const entry = { index: 'feed' };
        expect(isEntryNotified(entry, [])).toBe(false);
    });
});

// ─── sanitizeLayout ──────────────────────────────────────────────────

describe('sanitizeLayout', () => {
    const runSanitize = (layout, hiddenKeys = []) =>
        sanitizeLayout(
            layout,
            hiddenKeys,
            testDefinitionMap,
            testDefinitions,
            mockT,
            mockGenerateFolderId
        );

    test('returns default items for null/undefined layout', () => {
        const result = runSanitize(null);
        // Should include all non-chart items + charts folder
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((e) => e.type === 'item' && e.key === 'feed')).toBe(
            true
        );
    });

    test('preserves valid item entries', () => {
        const layout = [{ type: 'item', key: 'feed' }];
        const result = runSanitize(layout);
        expect(result[0]).toEqual({ type: 'item', key: 'feed' });
    });

    test('skips invalid item keys', () => {
        const layout = [
            { type: 'item', key: 'feed' },
            { type: 'item', key: 'nonexistent' }
        ];
        const result = runSanitize(layout);
        expect(result.find((e) => e.key === 'nonexistent')).toBeUndefined();
    });

    test('deduplicates item keys', () => {
        const layout = [
            { type: 'item', key: 'feed' },
            { type: 'item', key: 'feed' }
        ];
        const result = runSanitize(layout);
        const feedEntries = result.filter(
            (e) => e.type === 'item' && e.key === 'feed'
        );
        expect(feedEntries.length).toBe(1);
    });

    test('creates folder entries from valid items', () => {
        const layout = [
            {
                type: 'folder',
                id: 'my-folder',
                name: 'My Folder',
                icon: 'ri-star-line',
                items: ['feed', 'search']
            }
        ];
        const result = runSanitize(layout);
        const folder = result.find(
            (e) => e.type === 'folder' && e.id === 'my-folder'
        );
        expect(folder).toBeDefined();
        expect(folder.items).toEqual(['feed', 'search']);
        expect(folder.name).toBe('My Folder');
    });

    test('generates folder ID when missing', () => {
        const layout = [
            {
                type: 'folder',
                name: 'No ID Folder',
                items: ['feed']
            }
        ];
        const result = runSanitize(layout);
        const folder = result.find((e) => e.type === 'folder');
        expect(folder.id).toBe('generated-folder-id');
    });

    test('translates folder name from nameKey', () => {
        const layout = [
            {
                type: 'folder',
                id: 'f1',
                nameKey: 'nav_tooltip.favorites',
                items: ['feed']
            }
        ];
        const result = runSanitize(layout);
        const folder = result.find((e) => e.type === 'folder');
        expect(folder.name).toBe('translated:nav_tooltip.favorites');
    });

    test('appends missing definitions not in layout or hidden', () => {
        const layout = [{ type: 'item', key: 'feed' }];
        const result = runSanitize(layout);
        // All non-chart, non-hidden items should be present
        expect(result.some((e) => e.key === 'search')).toBe(true);
        expect(result.some((e) => e.key === 'tools')).toBe(true);
    });

    test('does not append hidden keys', () => {
        const layout = [{ type: 'item', key: 'feed' }];
        const result = runSanitize(layout, ['search', 'tools']);
        expect(
            result.find((e) => e.type === 'item' && e.key === 'search')
        ).toBeUndefined();
        expect(
            result.find((e) => e.type === 'item' && e.key === 'tools')
        ).toBeUndefined();
    });

    test('converts legacy "charts" item to charts folder', () => {
        const layout = [{ type: 'item', key: 'charts' }];
        const result = runSanitize(layout);
        const chartsFolder = result.find(
            (e) => e.type === 'folder' && e.id === 'default-folder-charts'
        );
        expect(chartsFolder).toBeDefined();
        expect(chartsFolder.items).toEqual([
            'charts-instance',
            'charts-mutual',
            'charts-hot-worlds'
        ]);
    });

    test('auto-appends charts folder when charts keys are neither used nor hidden', () => {
        const layout = [{ type: 'item', key: 'feed' }];
        const result = runSanitize(layout);
        const chartsFolder = result.find(
            (e) => e.type === 'folder' && e.id === 'default-folder-charts'
        );
        expect(chartsFolder).toBeDefined();
    });

    test('skips empty folders', () => {
        const layout = [
            {
                type: 'folder',
                id: 'empty-folder',
                name: 'Empty',
                items: []
            }
        ];
        const result = runSanitize(layout);
        expect(result.find((e) => e.id === 'empty-folder')).toBeUndefined();
    });
});
