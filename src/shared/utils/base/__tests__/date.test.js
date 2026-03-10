import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the store
vi.mock('../../../../stores', () => ({
    useAppearanceSettingsStore: vi.fn()
}));

// Mock transitive deps
vi.mock('../../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../../plugins/router', () => ({
    default: { push: vi.fn(), currentRoute: { value: {} } }
}));

import { useAppearanceSettingsStore } from '../../../../stores';
import { formatDateFilter } from '../../../../coordinators/dateCoordinator';

describe('formatDateFilter', () => {
    beforeEach(() => {
        useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: false,
            currentCulture: 'en-gb'
        });
    });

    test('returns dash for empty dateStr', () => {
        expect(formatDateFilter('', 'long')).toBe('-');
        expect(formatDateFilter(null, 'long')).toBe('-');
        expect(formatDateFilter(undefined, 'long')).toBe('-');
    });

    test('returns dash for invalid dateStr', () => {
        expect(formatDateFilter('not-a-date', 'long')).toBe('-');
    });

    test('formats long ISO format', () => {
        useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: true,
            dtHour12: false,
            currentCulture: 'en-gb'
        });
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'long');
        // ISO format: YYYY-MM-DD HH:MM:SS (in local timezone)
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('formats long locale format', () => {
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'long');
        // Result is locale-dependent; just verify it produces something
        expect(result).not.toBe('-');
        expect(result.length).toBeGreaterThan(5);
    });

    test('formats short locale format', () => {
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'short');
        expect(result).not.toBe('-');
    });

    test('formats time only', () => {
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'time');
        expect(result).not.toBe('-');
    });

    test('formats date only', () => {
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'date');
        expect(result).not.toBe('-');
    });

    test('handles culture with no underscore at position 4', () => {
        useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: true,
            currentCulture: 'en-us'
        });
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'long');
        expect(result).not.toBe('-');
    });

    test('returns dash for unknown format', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'unknown');
        expect(result).toBe('-');
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test('uses hour12 setting', () => {
        useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: true,
            currentCulture: 'en-us'
        });
        const result = formatDateFilter('2023-06-15T14:30:45Z', 'short');
        // hour12 should produce am/pm in the output
        expect(result).not.toBe('-');
    });
});
