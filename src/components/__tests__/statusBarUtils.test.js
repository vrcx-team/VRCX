import { describe, expect, test, beforeEach } from 'vitest';

import {
    defaultVisibility,
    formatAppUptime,
    formatUtcHour,
    loadClockCount,
    loadClocks,
    loadVisibility,
    normalizeClock,
    normalizeUtcHour,
    parseClockOffset
} from '../statusBarUtils';

// ─── normalizeUtcHour ────────────────────────────────────────────────

describe('normalizeUtcHour', () => {
    test('passes through normal integer values', () => {
        expect(normalizeUtcHour(0)).toBe(0);
        expect(normalizeUtcHour(5)).toBe(5);
        expect(normalizeUtcHour(-5)).toBe(-5);
    });

    test('clamps to lower bound -12', () => {
        expect(normalizeUtcHour(-12)).toBe(-12);
        expect(normalizeUtcHour(-13)).toBe(-12);
        expect(normalizeUtcHour(-100)).toBe(-12);
    });

    test('clamps to upper bound 14', () => {
        expect(normalizeUtcHour(14)).toBe(14);
        expect(normalizeUtcHour(15)).toBe(14);
        expect(normalizeUtcHour(100)).toBe(14);
    });

    test('rounds fractional values', () => {
        expect(normalizeUtcHour(5.4)).toBe(5);
        expect(normalizeUtcHour(5.5)).toBe(6);
        expect(normalizeUtcHour(-5.7)).toBe(-6);
    });

    test('returns 0 for NaN and Infinity', () => {
        expect(normalizeUtcHour(NaN)).toBe(0);
        expect(normalizeUtcHour(Infinity)).toBe(0);
        expect(normalizeUtcHour(-Infinity)).toBe(0);
    });

    test('coerces string numbers', () => {
        expect(normalizeUtcHour('9')).toBe(9);
        expect(normalizeUtcHour('-3')).toBe(-3);
    });

    test('returns 0 for non-numeric strings', () => {
        expect(normalizeUtcHour('abc')).toBe(0);
    });
});

// ─── formatUtcHour ───────────────────────────────────────────────────

describe('formatUtcHour', () => {
    test('formats positive offsets with plus sign', () => {
        expect(formatUtcHour(9)).toBe('UTC+9');
        expect(formatUtcHour(14)).toBe('UTC+14');
    });

    test('formats negative offsets', () => {
        expect(formatUtcHour(-5)).toBe('UTC-5');
        expect(formatUtcHour(-12)).toBe('UTC-12');
    });

    test('formats zero as positive', () => {
        expect(formatUtcHour(0)).toBe('UTC+0');
    });

    test('normalises before formatting', () => {
        expect(formatUtcHour(20)).toBe('UTC+14');
        expect(formatUtcHour(-20)).toBe('UTC-12');
    });
});

// ─── parseClockOffset ────────────────────────────────────────────────

describe('parseClockOffset', () => {
    test('parses numeric input', () => {
        expect(parseClockOffset(9)).toBe(9);
        expect(parseClockOffset(-3)).toBe(-3);
    });

    test('parses plain numeric strings', () => {
        expect(parseClockOffset('5')).toBe(5);
        expect(parseClockOffset('-7')).toBe(-7);
        expect(parseClockOffset('+3')).toBe(3);
    });

    test('parses numeric strings with whitespace', () => {
        expect(parseClockOffset('  5 ')).toBe(5);
    });

    test('parses UTC+N pattern', () => {
        expect(parseClockOffset('UTC+9')).toBe(9);
        expect(parseClockOffset('UTC-5')).toBe(-5);
        expect(parseClockOffset('utc+0')).toBe(0);
    });

    test('parses UTC pattern with half-hour offset', () => {
        expect(parseClockOffset('UTC+5:30')).toBe(6); // 5.5 rounds to 6
        expect(parseClockOffset('UTC-9:30')).toBe(-9); // -9.5 rounds to -9 (Math.round toward +Infinity)
    });

    test('returns 0 for non-string non-number input', () => {
        expect(parseClockOffset(null)).toBe(0);
        expect(parseClockOffset(undefined)).toBe(0);
        expect(parseClockOffset(true)).toBe(0);
        expect(parseClockOffset([])).toBe(0);
    });

    test('returns 0 for unrecognised string patterns', () => {
        expect(parseClockOffset('not-a-timezone')).toBe(0);
    });
});

// ─── normalizeClock ──────────────────────────────────────────────────

describe('normalizeClock', () => {
    test('normalises entry with offset key', () => {
        expect(normalizeClock({ offset: 9 })).toEqual({ offset: 9 });
        expect(normalizeClock({ offset: '5' })).toEqual({ offset: 5 });
    });

    test('normalises legacy entry with timezone key', () => {
        expect(normalizeClock({ timezone: 'UTC+9' })).toEqual({ offset: 9 });
    });

    test('prefers offset over timezone when both present', () => {
        expect(normalizeClock({ offset: 3, timezone: 'UTC+9' })).toEqual({
            offset: 3
        });
    });

    test('returns { offset: 0 } for non-object input', () => {
        expect(normalizeClock(null)).toEqual({ offset: 0 });
        expect(normalizeClock(undefined)).toEqual({ offset: 0 });
        expect(normalizeClock(42)).toEqual({ offset: 0 });
        expect(normalizeClock('string')).toEqual({ offset: 0 });
    });

    test('returns { offset: 0 } for object without known keys', () => {
        expect(normalizeClock({ foo: 'bar' })).toEqual({ offset: 0 });
        expect(normalizeClock({})).toEqual({ offset: 0 });
    });
});

// ─── loadVisibility ──────────────────────────────────────────────────

describe('loadVisibility', () => {
    let storage;

    beforeEach(() => {
        storage = createMockStorage();
    });

    test('returns defaults when storage is empty', () => {
        expect(loadVisibility(storage)).toEqual(defaultVisibility);
    });

    test('merges saved values with defaults', () => {
        storage.setItem(
            'VRCX_statusBarVisibility',
            JSON.stringify({ vrchat: false, ws: false })
        );
        const result = loadVisibility(storage);
        expect(result.vrchat).toBe(false);
        expect(result.ws).toBe(false);
        // Other defaults preserved
        expect(result.proxy).toBe(true);
        expect(result.zoom).toBe(true);
    });

    test('returns defaults on corrupt JSON', () => {
        storage.setItem('VRCX_statusBarVisibility', '{bad-json');
        expect(loadVisibility(storage)).toEqual(defaultVisibility);
    });

    test('returns a new object each time (no shared reference)', () => {
        const a = loadVisibility(storage);
        const b = loadVisibility(storage);
        expect(a).not.toBe(b);
        expect(a).toEqual(b);
    });
});

// ─── loadClocks ──────────────────────────────────────────────────────

describe('loadClocks', () => {
    const defaults = [{ offset: 9 }, { offset: 0 }, { offset: -5 }];
    let storage;

    beforeEach(() => {
        storage = createMockStorage();
    });

    test('returns defaults when storage is empty', () => {
        const result = loadClocks(storage, defaults);
        expect(result).toEqual(defaults);
    });

    test('loads valid saved clocks', () => {
        storage.setItem(
            'VRCX_statusBarClocks',
            JSON.stringify([{ offset: 1 }, { offset: 2 }, { offset: 3 }])
        );
        expect(loadClocks(storage, defaults)).toEqual([
            { offset: 1 },
            { offset: 2 },
            { offset: 3 }
        ]);
    });

    test('returns defaults for wrong array length', () => {
        storage.setItem(
            'VRCX_statusBarClocks',
            JSON.stringify([{ offset: 1 }])
        );
        expect(loadClocks(storage, defaults)).toEqual(defaults);
    });

    test('returns defaults for non-array JSON', () => {
        storage.setItem('VRCX_statusBarClocks', JSON.stringify({ offset: 1 }));
        expect(loadClocks(storage, defaults)).toEqual(defaults);
    });

    test('returns defaults on corrupt JSON', () => {
        storage.setItem('VRCX_statusBarClocks', 'not-json');
        expect(loadClocks(storage, defaults)).toEqual(defaults);
    });

    test('normalises clock entries from storage', () => {
        storage.setItem(
            'VRCX_statusBarClocks',
            JSON.stringify([
                { offset: '5' },
                { timezone: 'UTC+3' },
                { offset: 99 }
            ])
        );
        expect(loadClocks(storage, defaults)).toEqual([
            { offset: 5 },
            { offset: 3 },
            { offset: 14 } // clamped
        ]);
    });

    test('returned defaults are independent copies', () => {
        const a = loadClocks(storage, defaults);
        const b = loadClocks(storage, defaults);
        expect(a).not.toBe(b);
        a[0].offset = 999;
        expect(b[0].offset).not.toBe(999);
    });
});

// ─── loadClockCount ──────────────────────────────────────────────────

describe('loadClockCount', () => {
    let storage;

    beforeEach(() => {
        storage = createMockStorage();
    });

    test('returns 2 when storage is empty', () => {
        expect(loadClockCount(storage)).toBe(2);
    });

    test.each([0, 1, 2, 3])('returns valid stored count %i', (n) => {
        storage.setItem('VRCX_statusBarClockCount', String(n));
        expect(loadClockCount(storage)).toBe(n);
    });

    test('returns 2 for out-of-range values', () => {
        storage.setItem('VRCX_statusBarClockCount', '4');
        expect(loadClockCount(storage)).toBe(2);

        storage.setItem('VRCX_statusBarClockCount', '-1');
        expect(loadClockCount(storage)).toBe(2);
    });

    test('returns 2 for non-numeric values', () => {
        storage.setItem('VRCX_statusBarClockCount', 'abc');
        expect(loadClockCount(storage)).toBe(2);
    });
});

// ─── formatAppUptime ─────────────────────────────────────────────────

describe('formatAppUptime', () => {
    test('formats zero seconds', () => {
        expect(formatAppUptime(0)).toBe('00:00:00');
    });

    test('formats seconds only', () => {
        expect(formatAppUptime(45)).toBe('00:00:45');
    });

    test('formats minutes and seconds', () => {
        expect(formatAppUptime(125)).toBe('00:02:05');
    });

    test('formats hours, minutes, and seconds', () => {
        expect(formatAppUptime(3661)).toBe('01:01:01');
    });

    test('handles large values (over 24 hours)', () => {
        // 100 hours = 360000 seconds
        expect(formatAppUptime(360000)).toBe('100:00:00');
    });

    test('treats negative values as zero', () => {
        expect(formatAppUptime(-10)).toBe('00:00:00');
    });

    test('floors fractional seconds', () => {
        expect(formatAppUptime(59.9)).toBe('00:00:59');
    });
});

// ─── test helpers ────────────────────────────────────────────────────

/** Minimal in-memory Storage-like object for testing. */
function createMockStorage() {
    const data = new Map();
    return {
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: (key) => data.delete(key),
        clear: () => data.clear()
    };
}
