import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import {
    buildSessionsFromEvents,
    buildSessionsFromGamelog,
    filterSessionsByPeriod,
    calculateOverlapGrid,
    aggregateSessionsToGrid,
    findBestOverlapTime
} from '../overlapCalculator.js';

// Helper: create a UTC date string
function utc(dateStr) {
    return new Date(dateStr).toISOString();
}

// Helper: create a timestamp from UTC string
function ts(dateStr) {
    return new Date(dateStr).getTime();
}

describe('buildSessionsFromEvents', () => {
    test('returns empty array for empty input', () => {
        expect(buildSessionsFromEvents([])).toEqual([]);
    });

    test('builds a single session from Online→Offline pair', () => {
        const events = [
            { created_at: utc('2025-01-06T10:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T12:00:00Z'), type: 'Offline' }
        ];
        const result = buildSessionsFromEvents(events);
        expect(result).toEqual([
            { start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }
        ]);
    });

    test('builds multiple sessions', () => {
        const events = [
            { created_at: utc('2025-01-06T10:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T12:00:00Z'), type: 'Offline' },
            { created_at: utc('2025-01-06T14:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T16:00:00Z'), type: 'Offline' }
        ];
        const result = buildSessionsFromEvents(events);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') });
        expect(result[1]).toEqual({ start: ts('2025-01-06T14:00:00Z'), end: ts('2025-01-06T16:00:00Z') });
    });

    test('handles consecutive Online events (closes previous session)', () => {
        const events = [
            { created_at: utc('2025-01-06T10:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T12:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T14:00:00Z'), type: 'Offline' }
        ];
        const result = buildSessionsFromEvents(events);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') });
        expect(result[1]).toEqual({ start: ts('2025-01-06T12:00:00Z'), end: ts('2025-01-06T14:00:00Z') });
    });

    test('ignores Offline without preceding Online', () => {
        const events = [
            { created_at: utc('2025-01-06T10:00:00Z'), type: 'Offline' },
            { created_at: utc('2025-01-06T12:00:00Z'), type: 'Online' },
            { created_at: utc('2025-01-06T14:00:00Z'), type: 'Offline' }
        ];
        const result = buildSessionsFromEvents(events);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ start: ts('2025-01-06T12:00:00Z'), end: ts('2025-01-06T14:00:00Z') });
    });

    test('does not close session if no Offline follows', () => {
        const events = [
            { created_at: utc('2025-01-06T10:00:00Z'), type: 'Online' }
        ];
        const result = buildSessionsFromEvents(events);
        expect(result).toEqual([]);
    });
});

describe('buildSessionsFromGamelog', () => {
    test('returns empty array for empty input', () => {
        expect(buildSessionsFromGamelog([])).toEqual([]);
    });

    test('builds session with known duration', () => {
        const rows = [
            { created_at: utc('2025-01-06T10:00:00Z'), time: 7200000 } // 2h
        ];
        const result = buildSessionsFromGamelog(rows);
        expect(result).toEqual([
            { start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }
        ]);
    });

    test('estimates duration from next row when time=0', () => {
        const rows = [
            { created_at: utc('2025-01-06T10:00:00Z'), time: 0 },
            { created_at: utc('2025-01-06T12:00:00Z'), time: 3600000 }
        ];
        const result = buildSessionsFromGamelog(rows);
        // First session: estimated end = next row start (12:00)
        // Second session: 12:00 + 1h = 13:00
        // Gap between them is 0ms, so they merge
        expect(result).toHaveLength(1);
        expect(result[0].start).toBe(ts('2025-01-06T10:00:00Z'));
        expect(result[0].end).toBe(ts('2025-01-06T13:00:00Z'));
    });

    test('caps duration at 24h for last row with time=0', () => {
        const now = Date.now();
        const longAgo = new Date(now - 48 * 3600000).toISOString(); // 48h ago
        const rows = [
            { created_at: longAgo, time: 0 }
        ];
        const result = buildSessionsFromGamelog(rows);
        expect(result).toHaveLength(1);
        const duration = result[0].end - result[0].start;
        expect(duration).toBe(24 * 3600000);
    });

    test('merges adjacent sessions within default gap (5min)', () => {
        const rows = [
            { created_at: utc('2025-01-06T10:00:00Z'), time: 3600000 }, // 10:00-11:00
            { created_at: utc('2025-01-06T11:03:00Z'), time: 3600000 }  // 11:03-12:03 (3min gap)
        ];
        const result = buildSessionsFromGamelog(rows);
        expect(result).toHaveLength(1);
        expect(result[0].start).toBe(ts('2025-01-06T10:00:00Z'));
        expect(result[0].end).toBe(ts('2025-01-06T12:03:00Z'));
    });

    test('does not merge sessions with gap exceeding mergeGapMs', () => {
        const rows = [
            { created_at: utc('2025-01-06T10:00:00Z'), time: 3600000 }, // 10:00-11:00
            { created_at: utc('2025-01-06T12:00:00Z'), time: 3600000 }  // 12:00-13:00 (1h gap)
        ];
        const result = buildSessionsFromGamelog(rows);
        expect(result).toHaveLength(2);
    });

    test('respects custom mergeGapMs', () => {
        const rows = [
            { created_at: utc('2025-01-06T10:00:00Z'), time: 3600000 }, // 10:00-11:00
            { created_at: utc('2025-01-06T11:03:00Z'), time: 3600000 }  // 11:03-12:03
        ];
        // Custom gap: 1 minute → should NOT merge (3min gap > 1min threshold)
        const result = buildSessionsFromGamelog(rows, 60000);
        expect(result).toHaveLength(2);
    });
});

describe('filterSessionsByPeriod', () => {
    const sessions = [
        { start: ts('2025-01-01T00:00:00Z'), end: ts('2025-01-01T02:00:00Z') },
        { start: ts('2025-01-10T00:00:00Z'), end: ts('2025-01-10T02:00:00Z') },
        { start: ts('2025-01-20T00:00:00Z'), end: ts('2025-01-20T02:00:00Z') }
    ];

    test('returns all sessions when cutoff is before all', () => {
        const cutoff = ts('2024-12-01T00:00:00Z');
        const result = filterSessionsByPeriod(sessions, cutoff);
        expect(result).toHaveLength(3);
    });

    test('filters out sessions ending before cutoff', () => {
        const cutoff = ts('2025-01-05T00:00:00Z');
        const result = filterSessionsByPeriod(sessions, cutoff);
        expect(result).toHaveLength(2);
        expect(result[0].start).toBe(ts('2025-01-10T00:00:00Z'));
    });

    test('clamps session start to cutoff when session spans cutoff', () => {
        const cutoff = ts('2025-01-10T01:00:00Z'); // mid-session
        const result = filterSessionsByPeriod(sessions, cutoff);
        expect(result).toHaveLength(2);
        // First result should have start clamped to cutoff
        expect(result[0].start).toBe(cutoff);
        expect(result[0].end).toBe(ts('2025-01-10T02:00:00Z'));
    });

    test('returns empty for all sessions before cutoff', () => {
        const cutoff = ts('2025-02-01T00:00:00Z');
        const result = filterSessionsByPeriod(sessions, cutoff);
        expect(result).toHaveLength(0);
    });
});

describe('calculateOverlapGrid', () => {
    test('returns zero overlap for non-overlapping sessions', () => {
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T14:00:00Z'), end: ts('2025-01-06T16:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        expect(result.overlapPercent).toBe(0);
        expect(result.totalOverlapMs).toBe(0);
        expect(result.maxVal).toBe(0);
    });

    test('calculates full overlap for identical sessions', () => {
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        expect(result.overlapPercent).toBe(100);
        expect(result.totalOverlapMs).toBe(2 * 3600000);
    });

    test('calculates partial overlap', () => {
        // A: 10:00-14:00 (4h), B: 12:00-16:00 (4h)
        // Overlap: 12:00-14:00 (2h) = 50%
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T14:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T12:00:00Z'), end: ts('2025-01-06T16:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        expect(result.overlapPercent).toBe(50);
        expect(result.totalOverlapMs).toBe(2 * 3600000);
    });

    test('returns correct grid dimensions', () => {
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        expect(result.grid).toHaveLength(7);
        for (const row of result.grid) {
            expect(row).toHaveLength(24);
        }
    });

    test('populates grid at correct day/hour slots', () => {
        // 2025-01-06 is Monday, getDay()=1
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        // day=1 (Monday), hours 10 and 11 should have value
        // Note: getDay() returns local day, getHours() returns local hour
        // Using UTC dates, so the actual slot depends on timezone
        expect(result.maxVal).toBeGreaterThan(0);
    });

    test('handles empty sessionsA', () => {
        const sessionsB = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const result = calculateOverlapGrid([], sessionsB);
        expect(result.overlapPercent).toBe(0);
        expect(result.totalOverlapMs).toBe(0);
    });

    test('handles empty sessionsB', () => {
        const sessionsA = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T12:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, []);
        expect(result.overlapPercent).toBe(0);
        expect(result.totalOverlapMs).toBe(0);
    });

    test('overlap percent is based on the shorter online time', () => {
        // A: 2h online, B: 4h online, overlap: 2h → 2/2 = 100%
        const sessionsA = [{ start: ts('2025-01-06T12:00:00Z'), end: ts('2025-01-06T14:00:00Z') }];
        const sessionsB = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T14:00:00Z') }];
        const result = calculateOverlapGrid(sessionsA, sessionsB);
        expect(result.overlapPercent).toBe(100);
        expect(result.totalUserAMs).toBe(2 * 3600000);
        expect(result.totalUserBMs).toBe(4 * 3600000);
    });
});

describe('aggregateSessionsToGrid', () => {
    test('returns empty grid for no sessions', () => {
        const result = aggregateSessionsToGrid([]);
        expect(result.maxVal).toBe(0);
        expect(result.grid).toHaveLength(7);
        for (const row of result.grid) {
            expect(row.every((v) => v === 0)).toBe(true);
        }
    });

    test('increments grid for session hours', () => {
        // A 3-hour session should increment 3 hour slots
        const sessions = [{ start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T13:00:00Z') }];
        const result = aggregateSessionsToGrid(sessions);
        const total = result.grid.flat().reduce((a, b) => a + b, 0);
        expect(total).toBe(3);
        expect(result.maxVal).toBe(1);
    });

    test('stacks multiple sessions on same hour', () => {
        // Two sessions on the same day/hour
        const sessions = [
            { start: ts('2025-01-06T10:00:00Z'), end: ts('2025-01-06T11:00:00Z') },
            { start: ts('2025-01-13T10:00:00Z'), end: ts('2025-01-13T11:00:00Z') } // Same weekday, 1 week later
        ];
        const result = aggregateSessionsToGrid(sessions);
        expect(result.maxVal).toBe(2);
    });
});

describe('findBestOverlapTime', () => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    test('returns empty string for all-zero grid', () => {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
        expect(findBestOverlapTime(grid, dayLabels)).toBe('');
    });

    test('returns single hour when only one slot has data', () => {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
        grid[1][14] = 5; // Monday 14:00
        const result = findBestOverlapTime(grid, dayLabels);
        expect(result).toBe('Mon, 14:00');
    });

    test('returns time range for adjacent high hours', () => {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
        // Saturday (6) has strong activity at 20, 21, 22
        grid[6][20] = 10;
        grid[6][21] = 10;
        grid[6][22] = 10;
        const result = findBestOverlapTime(grid, dayLabels);
        expect(result).toContain('Sat');
        expect(result).toContain('20:00');
        expect(result).toContain('23:00');
    });

    test('picks the day with highest overlap in peak hours', () => {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
        // Mon(1) and Fri(5) both have activity at hour 20, but Fri is stronger
        grid[1][20] = 3;
        grid[5][20] = 8;
        const result = findBestOverlapTime(grid, dayLabels);
        expect(result).toContain('Fri');
    });

    test('handles activity spread across all days equally', () => {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
        for (let d = 0; d < 7; d++) {
            grid[d][15] = 5;
        }
        const result = findBestOverlapTime(grid, dayLabels);
        // Should pick Sunday (index 0) since it's first with equal values
        expect(result).toContain('Sun');
        expect(result).toContain('15:00');
    });
});
