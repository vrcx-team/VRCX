import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    useAppearanceSettingsStore: vi.fn()
}));

vi.mock('../../stores', () => ({
    useAppearanceSettingsStore: (...args) =>
        mocks.useAppearanceSettingsStore(...args)
}));

import { formatDateFilter } from '../dateCoordinator';

describe('dateCoordinator.formatDateFilter', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: false,
            currentCulture: 'en-gb'
        });
    });

    test('returns "-" for empty and invalid input', () => {
        expect(formatDateFilter('', 'long')).toBe('-');
        expect(formatDateFilter(null, 'long')).toBe('-');
        expect(formatDateFilter(undefined, 'long')).toBe('-');
        expect(formatDateFilter('invalid-date', 'long')).toBe('-');
    });

    test('uses ISO long format when dtIsoFormat is enabled', () => {
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: true,
            dtHour12: false,
            currentCulture: 'ja-jp'
        });

        const result = formatDateFilter('2024-01-02T03:04:05Z', 'long');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('keeps culture unchanged when underscore is not at index 4', () => {
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: false,
            currentCulture: 'en_us'
        });
        const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');
        localeSpy.mockReturnValue('01/02/2024');

        formatDateFilter('2024-01-02T03:04:05Z', 'date');

        expect(localeSpy).toHaveBeenCalledWith(
            'en_us',
            expect.objectContaining({
                year: 'numeric'
            })
        );
    });

    test('truncates culture when underscore is at index 4', () => {
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: false,
            currentCulture: 'abcd_ef'
        });
        const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');
        localeSpy.mockReturnValue('01/02/2024');

        formatDateFilter('2024-01-02T03:04:05Z', 'date');

        expect(localeSpy).toHaveBeenCalledWith(
            'abcd',
            expect.objectContaining({
                year: 'numeric'
            })
        );
    });

    test('falls back to en-gb when currentCulture is empty', () => {
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: false,
            currentCulture: ''
        });
        const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');
        localeSpy.mockReturnValue('02/01/2024');

        formatDateFilter('2024-01-02T03:04:05Z', 'date');

        expect(localeSpy).toHaveBeenCalledWith(
            'en-gb',
            expect.objectContaining({
                year: 'numeric'
            })
        );
    });

    test('uses hourCycle h12 and lowercases AM/PM in short format', () => {
        mocks.useAppearanceSettingsStore.mockReturnValue({
            dtIsoFormat: false,
            dtHour12: true,
            currentCulture: 'en-us'
        });
        const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');
        localeSpy.mockReturnValue('01/02, 10:30 PM');

        const result = formatDateFilter('2024-01-02T22:30:00Z', 'short');

        expect(localeSpy).toHaveBeenCalledWith(
            'en-us',
            expect.objectContaining({
                hourCycle: 'h12'
            })
        );
        expect(result).toContain('pm');
        expect(result).not.toContain('PM');
    });

    test('returns "-" and warns when format is unknown', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = formatDateFilter('2024-01-02T03:04:05Z', 'unknown');

        expect(result).toBe('-');
        expect(warnSpy).toHaveBeenCalledWith('Unknown date format: unknown');
    });
});
