export const ONLINE_SESSION_MERGE_GAP_MS = 5 * 60 * 1000;
export const DEFAULT_MAX_SESSION_MS = 8 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function buildSessionsFromEvents(events, initialStart = null) {
    const sessions = [];
    let currentStart = initialStart;

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

    return {
        pendingSessionStartAt: currentStart,
        sessions
    };
}

export function buildSessionsFromGamelog(rows, mergeGapMs = ONLINE_SESSION_MERGE_GAP_MS, nowMs = Date.now()) {
    if (rows.length === 0) {
        return [];
    }

    const rawSessions = [];
    for (let i = 0; i < rows.length; i++) {
        const start = new Date(rows[i].created_at).getTime();
        let duration = rows[i].time || 0;
        if (duration === 0) {
            if (i < rows.length - 1) {
                duration = new Date(rows[i + 1].created_at).getTime() - start;
            } else {
                duration = nowMs - start;
            }
            duration = Math.min(duration, 24 * 60 * 60 * 1000);
        }
        if (duration > 0) {
            rawSessions.push({ start, end: start + duration });
        }
    }

    rawSessions.sort((a, b) => a.start - b.start);
    return mergeSessions([], rawSessions, mergeGapMs);
}

export function mergeSessions(olderSessions, newerSessions, mergeGapMs = ONLINE_SESSION_MERGE_GAP_MS) {
    if (olderSessions.length === 0 && newerSessions.length === 0) {
        return [];
    }
    const all = [...olderSessions.map(cloneSession), ...newerSessions.map(cloneSession)];
    if (all.length === 0) {
        return [];
    }
    all.sort((a, b) => a.start - b.start);

    const merged = [all[0]];
    for (let i = 1; i < all.length; i++) {
        const last = merged[merged.length - 1];
        const current = all[i];
        if (current.start <= last.end + mergeGapMs) {
            last.end = Math.max(last.end, current.end);
            last.isOpenTail = last.isOpenTail || current.isOpenTail;
            last.sourceRevision = current.sourceRevision || last.sourceRevision || '';
        } else {
            merged.push(current);
        }
    }
    return merged;
}

export function clipSessionsToRange(sessions, rangeStartMs, rangeEndMs = Date.now()) {
    return sessions
        .filter((session) => session.end > rangeStartMs && session.start < rangeEndMs)
        .map((session) => ({
            ...session,
            start: Math.max(session.start, rangeStartMs),
            end: Math.min(session.end, rangeEndMs)
        }))
        .filter((session) => session.end > session.start);
}

export function buildHeatmapBuckets(
    sessions,
    windowStartMs,
    nowMs,
    maxSessionMs = DEFAULT_MAX_SESSION_MS
) {
    const buckets = new Float64Array(168);

    for (const session of sessions) {
        const effectiveEnd = Math.min(session.end, session.start + maxSessionMs);
        const start = Math.max(session.start, windowStartMs);
        const end = Math.min(effectiveEnd, nowMs);
        if (end <= start) {
            continue;
        }

        let cursor = start;
        while (cursor < end) {
            const date = new Date(cursor);
            const slot = date.getDay() * 24 + date.getHours();
            const nextHour = new Date(cursor);
            nextHour.setMinutes(0, 0, 0);
            nextHour.setTime(nextHour.getTime() + ONE_HOUR_MS);
            const segmentEnd = Math.min(nextHour.getTime(), end);
            buckets[slot] += (segmentEnd - cursor) / 60000;
            cursor = segmentEnd;
        }
    }

    return Array.from(buckets);
}

export function buildOverlapBuckets(
    selfSessions,
    targetSessions,
    windowStartMs,
    nowMs,
    maxSessionMs = DEFAULT_MAX_SESSION_MS
) {
    const intersections = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < selfSessions.length && rightIndex < targetSessions.length) {
        const left = selfSessions[leftIndex];
        const right = targetSessions[rightIndex];
        const leftEnd = Math.min(left.end, left.start + maxSessionMs);
        const rightEnd = Math.min(right.end, right.start + maxSessionMs);
        const start = Math.max(left.start, right.start);
        const end = Math.min(leftEnd, rightEnd);

        if (start < end) {
            intersections.push({ start, end });
        }

        if (leftEnd < rightEnd) {
            leftIndex++;
        } else {
            rightIndex++;
        }
    }

    return buildHeatmapBuckets(intersections, windowStartMs, nowMs, maxSessionMs);
}

export function normalizeBuckets(buckets, thresholdMinutes, capPercentile, mode) {
    const thresholded = buckets.map((value) => (value >= thresholdMinutes ? value : 0));
    const positiveValues = thresholded.filter((value) => value > 0).sort((a, b) => a - b);
    const cap = positiveValues.length > 0 ? percentile(positiveValues, capPercentile) : 1;
    const normalized = new Float64Array(168);

    for (let index = 0; index < 168; index++) {
        const value = thresholded[index];
        if (value <= 0) {
            normalized[index] = 0;
            continue;
        }
        const scaled = mode === 'log'
            ? Math.log1p(value) / Math.log1p(cap)
            : Math.sqrt(value / cap);
        normalized[index] = Math.min(Math.max(scaled, 0), 1);
    }

    return Array.from(normalized);
}

export function computePeaksFromBuckets(buckets, dayLabels) {
    const grid = bucketsToGrid(buckets);
    const daySums = new Array(7).fill(0);
    const hourSums = new Array(24).fill(0);
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            daySums[day] += grid[day][hour];
            hourSums[hour] += grid[day][hour];
        }
    }

    const maxDaySum = Math.max(...daySums, 0);
    const peakDay = maxDaySum > 0 ? dayLabels[daySums.indexOf(maxDaySum)] : '';
    const maxHourSum = Math.max(...hourSums, 0);
    let peakTime = '';
    if (maxHourSum > 0) {
        const threshold = maxHourSum * 0.7;
        let startHour = hourSums.indexOf(maxHourSum);
        let endHour = startHour;
        while (startHour > 0 && hourSums[startHour - 1] >= threshold) {
            startHour--;
        }
        while (endHour < 23 && hourSums[endHour + 1] >= threshold) {
            endHour++;
        }
        peakTime = startHour === endHour
            ? `${String(startHour).padStart(2, '0')}:00`
            : `${String(startHour).padStart(2, '0')}:00-${String(endHour + 1).padStart(2, '0')}:00`;
    }

    return { peakDay, peakTime };
}

export function findBestOverlapTimeFromBuckets(buckets, dayLabels) {
    const grid = bucketsToGrid(buckets);
    const hourSums = new Array(24).fill(0);
    for (let hour = 0; hour < 24; hour++) {
        for (let day = 0; day < 7; day++) {
            hourSums[hour] += grid[day][hour];
        }
    }

    const maxHourSum = Math.max(...hourSums, 0);
    if (maxHourSum === 0) {
        return '';
    }

    const threshold = maxHourSum * 0.6;
    let startHour = hourSums.indexOf(maxHourSum);
    let endHour = startHour;
    while (startHour > 0 && hourSums[startHour - 1] >= threshold) {
        startHour--;
    }
    while (endHour < 23 && hourSums[endHour + 1] >= threshold) {
        endHour++;
    }

    const daySums = new Array(7).fill(0);
    for (let day = 0; day < 7; day++) {
        for (let hour = startHour; hour <= endHour; hour++) {
            daySums[day] += grid[day][hour];
        }
    }
    const maxDaySum = Math.max(...daySums, 0);
    if (maxDaySum === 0) {
        return '';
    }
    const peakDayLabel = dayLabels[daySums.indexOf(maxDaySum)];
    return `${peakDayLabel}, ${String(startHour).padStart(2, '0')}:00-${String(endHour + 1).padStart(2, '0')}:00`;
}

export function computeActivityView({
    sessions,
    dayLabels,
    rangeDays,
    nowMs = Date.now(),
    normalizeConfig,
    maxSessionMs = DEFAULT_MAX_SESSION_MS
}) {
    const windowStartMs = nowMs - rangeDays * 86400000;
    const clippedSessions = clipSessionsToRange(sessions, windowStartMs, nowMs);
    const rawBuckets = buildHeatmapBuckets(clippedSessions, windowStartMs, nowMs, maxSessionMs);
    const normalizedBuckets = normalizeBuckets(
        rawBuckets,
        normalizeConfig.thresholdMinutes,
        normalizeConfig.capPercentile,
        normalizeConfig.mode
    );
    const { peakDay, peakTime } = computePeaksFromBuckets(rawBuckets, dayLabels);
    return {
        rangeDays,
        rawBuckets,
        normalizedBuckets,
        peakDay,
        peakTime,
        filteredEventCount: clippedSessions.length
    };
}

export function computeOverlapView({
    selfSessions,
    targetSessions,
    dayLabels,
    rangeDays,
    excludeHours = null,
    nowMs = Date.now(),
    normalizeConfig,
    maxSessionMs = DEFAULT_MAX_SESSION_MS
}) {
    const windowStartMs = nowMs - rangeDays * 86400000;
    const clippedSelf = clipSessionsToRange(selfSessions, windowStartMs, nowMs);
    const clippedTarget = clipSessionsToRange(targetSessions, windowStartMs, nowMs);
    const selfBuckets = buildHeatmapBuckets(clippedSelf, windowStartMs, nowMs, maxSessionMs);
    const targetBuckets = buildHeatmapBuckets(clippedTarget, windowStartMs, nowMs, maxSessionMs);
    const rawBuckets = buildOverlapBuckets(clippedSelf, clippedTarget, windowStartMs, nowMs, maxSessionMs);

    if (excludeHours) {
        applyExcludeHours(rawBuckets, selfBuckets, targetBuckets, excludeHours);
    }

    const overlapMinutes = sum(rawBuckets);
    const selfMinutes = sum(selfBuckets);
    const targetMinutes = sum(targetBuckets);
    const denominator = Math.min(selfMinutes, targetMinutes);
    const overlapPercent = denominator > 0 ? Math.round((overlapMinutes / denominator) * 100) : 0;
    const normalizedBuckets = normalizeBuckets(
        rawBuckets,
        normalizeConfig.thresholdMinutes,
        normalizeConfig.capPercentile,
        normalizeConfig.mode
    );
    const bestOverlapTime = overlapMinutes > 0
        ? findBestOverlapTimeFromBuckets(rawBuckets, dayLabels)
        : '';

    return {
        rangeDays,
        rawBuckets,
        normalizedBuckets,
        overlapPercent,
        bestOverlapTime
    };
}

function cloneSession(session) {
    return {
        start: session.start,
        end: session.end,
        isOpenTail: Boolean(session.isOpenTail),
        sourceRevision: session.sourceRevision || ''
    };
}

function percentile(sortedValues, percentileValue) {
    if (sortedValues.length === 0) {
        return 1;
    }
    const index = (percentileValue / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) {
        return sortedValues[lower];
    }
    return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

function bucketsToGrid(buckets) {
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (let slot = 0; slot < 168; slot++) {
        grid[Math.floor(slot / 24)][slot % 24] = buckets[slot];
    }
    return grid;
}

function applyExcludeHours(rawBuckets, selfBuckets, targetBuckets, excludeHours) {
    const { startHour, endHour } = excludeHours;
    for (let day = 0; day < 7; day++) {
        if (startHour <= endHour) {
            zeroHourRange(day, startHour, endHour, rawBuckets, selfBuckets, targetBuckets);
        } else {
            zeroHourRange(day, startHour, 24, rawBuckets, selfBuckets, targetBuckets);
            zeroHourRange(day, 0, endHour, rawBuckets, selfBuckets, targetBuckets);
        }
    }
}

function zeroHourRange(day, startHour, endHour, rawBuckets, selfBuckets, targetBuckets) {
    for (let hour = startHour; hour < endHour; hour++) {
        const slot = day * 24 + hour;
        rawBuckets[slot] = 0;
        selfBuckets[slot] = 0;
        targetBuckets[slot] = 0;
    }
}

function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}
