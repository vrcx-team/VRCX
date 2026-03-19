export const ONLINE_SESSION_MERGE_GAP_MS = 5 * 60 * 1000;

/**
 * Builds online sessions from Online/Offline events.
 * @param {Array<{created_at: string, type: string}>} events - Sorted by created_at
 * @returns {Array<{start: number, end: number}>} Sessions as Unix timestamps (ms)
 */
export function buildSessionsFromEvents(events) {
    const sessions = [];
    let currentStart = null;

    for (const event of events) {
        const ts = new Date(event.created_at).getTime();
        if (event.type === 'Online') {
            if (currentStart !== null) {
                sessions.push({ start: currentStart, end: ts });
            }
            currentStart = ts;
        } else if (event.type === 'Offline' && currentStart !== null) {
            sessions.push({ start: currentStart, end: ts });
            currentStart = null;
        }
    }
    return sessions;
}

/**
 * Builds online sessions from gamelog_location rows.
 * Each row: created_at = enter time, time = duration in ms (updated on leave).
 * If time = 0, the user may still be in this instance or it wasn't updated.
 * For the last row with time=0, we estimate end = next row's start or now.
 * Merges adjacent sessions within mergeGapMs.
 * @param {Array<{created_at: string, time: number}>} rows
 * @param {number} [mergeGapMs] - Merge gap threshold (default 5 min)
 * @returns {Array<{start: number, end: number}>}
 */
export function buildSessionsFromGamelog(
    rows,
    mergeGapMs = ONLINE_SESSION_MERGE_GAP_MS
) {
    if (rows.length === 0) return [];

    const rawSessions = [];
    for (let i = 0; i < rows.length; i++) {
        const start = new Date(rows[i].created_at).getTime();
        let duration = rows[i].time || 0;

        if (duration === 0) {
            // time not yet updated: estimate end as next row's start, or now for the last row
            if (i < rows.length - 1) {
                duration = new Date(rows[i + 1].created_at).getTime() - start;
            } else {
                // Last row, user may still be online - use current time
                duration = Date.now() - start;
            }
            // Cap at 24h to avoid unreasonable durations from stale data
            duration = Math.min(duration, 24 * 60 * 60 * 1000);
        }

        if (duration > 0) {
            rawSessions.push({ start, end: start + duration });
        }
    }

    if (rawSessions.length === 0) return [];

    rawSessions.sort((a, b) => a.start - b.start);

    const merged = [{ ...rawSessions[0] }];
    for (let i = 1; i < rawSessions.length; i++) {
        const last = merged[merged.length - 1];
        const curr = rawSessions[i];
        if (curr.start <= last.end + mergeGapMs) {
            last.end = Math.max(last.end, curr.end);
        } else {
            merged.push({ ...curr });
        }
    }
    return merged;
}

/**
 * Computes intersection intervals between two sorted, non-overlapping session arrays.
 * @param {Array<{start: number, end: number}>} sessionsA
 * @param {Array<{start: number, end: number}>} sessionsB
 * @returns {Array<{start: number, end: number}>}
 */
function computeIntersections(sessionsA, sessionsB) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < sessionsA.length && j < sessionsB.length) {
        const a = sessionsA[i];
        const b = sessionsB[j];
        const start = Math.max(a.start, b.start);
        const end = Math.min(a.end, b.end);
        if (start < end) {
            result.push({ start, end });
        }
        if (a.end < b.end) {
            i++;
        } else {
            j++;
        }
    }
    return result;
}

/**
 * Increments a 7×24 grid for each hour-slot covered by the given time range.
 * @param {number[][]} grid - 7×24 array (dayOfWeek × hour)
 * @param {number} startMs
 * @param {number} endMs
 */
function incrementGrid(grid, startMs, endMs) {
    // Walk hour by hour from start to end
    const ONE_HOUR = 3600000;
    let cursor = startMs;

    while (cursor < endMs) {
        const d = new Date(cursor);
        const day = d.getDay(); // 0=Sun
        const hour = d.getHours();
        grid[day][hour]++;

        // Move to next hour boundary
        const nextHour = new Date(cursor);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setTime(nextHour.getTime() + ONE_HOUR);
        cursor = nextHour.getTime();
    }
}

/**
 * Filters sessions to only include those overlapping with the given time range.
 * @param {Array<{start: number, end: number}>} sessions
 * @param {number} cutoffMs - Only include sessions that end after this timestamp
 * @returns {Array<{start: number, end: number}>}
 */
export function filterSessionsByPeriod(sessions, cutoffMs) {
    return sessions
        .filter((s) => s.end > cutoffMs)
        .map((s) => ({
            start: Math.max(s.start, cutoffMs),
            end: s.end
        }));
}

/**
 * Calculates overlap grid and statistics between two users' sessions.
 * @param {Array<{start: number, end: number}>} sessionsA - Current user
 * @param {Array<{start: number, end: number}>} sessionsB - Target user
 * @returns {{
 *   grid: number[][],
 *   maxVal: number,
 *   totalOverlapMs: number,
 *   totalUserAMs: number,
 *   totalUserBMs: number,
 *   overlapPercent: number
 * }}
 */
export function calculateOverlapGrid(sessionsA, sessionsB) {
    const overlapSessions = computeIntersections(sessionsA, sessionsB);

    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const session of overlapSessions) {
        incrementGrid(grid, session.start, session.end);
    }

    const totalOverlapMs = overlapSessions.reduce((sum, s) => sum + (s.end - s.start), 0);
    const totalUserAMs = sessionsA.reduce((sum, s) => sum + (s.end - s.start), 0);
    const totalUserBMs = sessionsB.reduce((sum, s) => sum + (s.end - s.start), 0);
    const minOnline = Math.min(totalUserAMs, totalUserBMs);
    const overlapPercent = minOnline > 0 ? Math.round((totalOverlapMs / minOnline) * 100) : 0;

    let maxVal = 0;
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            if (grid[d][h] > maxVal) maxVal = grid[d][h];
        }
    }

    return { grid, maxVal, totalOverlapMs, totalUserAMs, totalUserBMs, overlapPercent };
}

/**
 * Aggregates sessions into a 7×24 grid (dayOfWeek × hour).
 * For each session, increments all hour slots it covers.
 * @param {Array<{start: number, end: number}>} sessions
 * @returns {{ grid: number[][], maxVal: number }}
 */
export function aggregateSessionsToGrid(sessions) {
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const session of sessions) {
        incrementGrid(grid, session.start, session.end);
    }
    let maxVal = 0;
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            if (grid[d][h] > maxVal) maxVal = grid[d][h];
        }
    }
    return { grid, maxVal };
}

/**
 * Finds the best time to meet based on the overlap grid.
 * @param {number[][]} grid - 7×24 (dayOfWeek × hour)
 * @param {string[]} dayLabels - ['Sun', 'Mon', ..., 'Sat']
 * @returns {string} e.g. "Sat, 20:00–23:00" or empty string
 */
export function findBestOverlapTime(grid, dayLabels) {
    const hourSums = new Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
        for (let d = 0; d < 7; d++) {
            hourSums[h] += grid[d][h];
        }
    }

    let maxHourSum = 0;
    let maxHourIdx = 0;
    for (let h = 0; h < 24; h++) {
        if (hourSums[h] > maxHourSum) {
            maxHourSum = hourSums[h];
            maxHourIdx = h;
        }
    }
    if (maxHourSum === 0) return '';

    const threshold = maxHourSum * 0.6;
    let startHour = maxHourIdx;
    let endHour = maxHourIdx;
    while (startHour > 0 && hourSums[startHour - 1] >= threshold) {
        startHour--;
    }
    while (endHour < 23 && hourSums[endHour + 1] >= threshold) {
        endHour++;
    }

    const daySums = new Array(7).fill(0);
    for (let d = 0; d < 7; d++) {
        for (let h = startHour; h <= endHour; h++) {
            daySums[d] += grid[d][h];
        }
    }
    let maxDaySum = 0;
    let maxDayIdx = 0;
    for (let d = 0; d < 7; d++) {
        if (daySums[d] > maxDaySum) {
            maxDaySum = daySums[d];
            maxDayIdx = d;
        }
    }

    const dayName = dayLabels[maxDayIdx];
    const timeRange =
        startHour === endHour
            ? `${String(startHour).padStart(2, '0')}:00`
            : `${String(startHour).padStart(2, '0')}:00\u2013${String(endHour + 1).padStart(2, '0')}:00`;

    return `${dayName}, ${timeRange}`;
}
