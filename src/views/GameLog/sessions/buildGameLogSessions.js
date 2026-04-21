const TOLERANCE_MS = 1000;
const AGGREGATE_THRESHOLD = 5;
const AGGREGATE_WINDOW_MS = 5000;

function toEpoch(dateStr) {
    if (!dateStr) return 0;
    const t = Date.parse(dateStr);
    return Number.isNaN(t) ? 0 : t;
}

/** Time-based fallback: last segment whose epoch <= eventEpoch + tolerance. */
function findSegmentIndex(eventEpoch, segmentsAsc) {
    const target = eventEpoch + TOLERANCE_MS;
    for (let i = segmentsAsc.length - 1; i >= 0; i--) {
        if (segmentsAsc[i].epoch <= target) return i;
    }
    return 0;
}

function toMember(e) {
    return {
        displayName: e.displayName,
        userId: e.userId,
        created_at: e.created_at,
        isFriend: e.isFriend,
        isFavorite: e.isFavorite
    };
}

function makeGroup(groupType, batch) {
    return {
        type: groupType,
        created_at: batch[0].created_at,
        count: batch.length,
        members: batch.map(toMember)
    };
}

function aggregateTailEvents(events, matchType, groupType) {
    if (events.length === 0) return;

    // Find last matchType event
    let lastIdx = -1;
    for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].type === matchType) {
            lastIdx = i;
            break;
        }
    }
    if (lastIdx === -1) return;

    // Collect all matchType within window backward from last
    const windowStart =
        toEpoch(events[lastIdx].created_at) - AGGREGATE_WINDOW_MS;
    const indices = [];
    for (let i = lastIdx; i >= 0; i--) {
        if (toEpoch(events[i].created_at) < windowStart) break;
        if (events[i].type === matchType) indices.unshift(i);
    }
    if (indices.length < AGGREGATE_THRESHOLD) return;

    const batch = indices.map((i) => events[i]);
    const group = makeGroup(groupType, batch);
    // Remove matched events in reverse order, then insert group at first position
    for (let i = indices.length - 1; i >= 0; i--) events.splice(indices[i], 1);
    events.splice(indices[0], 0, group);
}

function aggregateHeadEvents(events, matchType, groupType) {
    if (events.length === 0) return;

    // Find first matchType event
    let firstIdx = -1;
    for (let i = 0; i < events.length; i++) {
        if (events[i].type === matchType) {
            firstIdx = i;
            break;
        }
    }
    if (firstIdx === -1) return;

    // Collect all matchType within window forward from first
    const windowEnd =
        toEpoch(events[firstIdx].created_at) + AGGREGATE_WINDOW_MS;
    const indices = [];
    for (let i = firstIdx; i < events.length; i++) {
        if (toEpoch(events[i].created_at) > windowEnd) break;
        if (events[i].type === matchType) indices.push(i);
    }
    if (indices.length < AGGREGATE_THRESHOLD) return;

    const batch = indices.map((i) => events[i]);
    const group = makeGroup(groupType, batch);
    // Remove matched events in reverse order, then insert group at first position
    for (let i = indices.length - 1; i >= 0; i--) events.splice(indices[i], 1);
    events.splice(indices[0], 0, group);
}

function applyAggregation(segmentsAsc) {
    for (const seg of segmentsAsc) {
        aggregateTailEvents(seg.events, 'OnPlayerLeft', 'LeftGroup');
        aggregateTailEvents(seg.events, 'OnPlayerJoined', 'JoinGroup');
        aggregateHeadEvents(seg.events, 'OnPlayerJoined', 'JoinGroup');
    }
}

function deduplicateVideoPlay(events) {
    for (let i = events.length - 1; i > 0; i--) {
        if (
            events[i].type === 'VideoPlay' &&
            events[i - 1].type === 'VideoPlay' &&
            events[i].videoUrl === events[i - 1].videoUrl
        ) {
            events[i - 1].playCount =
                (events[i - 1].playCount || 1) + (events[i].playCount || 1);
            events.splice(i, 1);
        }
    }
    for (const e of events) {
        if (e.type === 'VideoPlay' && !e.playCount) e.playCount = 1;
    }
}

export function buildGameLogSessions(locationSegments, flatEvents) {
    if (!locationSegments || locationSegments.length === 0) {
        return { segments: [] };
    }

    const segmentsAsc = locationSegments
        .map((loc) => ({
            id: loc.id,
            created_at: loc.created_at,
            epoch: toEpoch(loc.created_at),
            location: loc.location,
            worldId: loc.worldId,
            worldName: loc.worldName,
            groupName: loc.groupName,
            duration: loc.time || null,
            events: []
        }))
        .sort((a, b) => a.epoch - b.epoch);

    let dedupedEvents = flatEvents;
    if (flatEvents && flatEvents.length > 0) {
        const seen = new Set();
        dedupedEvents = flatEvents.filter((e) => {
            const key = `${e.type}\0${e.created_at}\0${e.userId || ''}\0${e.location || ''}\0${e.videoUrl || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    const locationMap = new Map();
    for (let i = 0; i < segmentsAsc.length; i++) {
        const loc = segmentsAsc[i].location;
        if (!locationMap.has(loc)) locationMap.set(loc, []);
        locationMap.get(loc).push(i);
    }

    if (dedupedEvents && dedupedEvents.length > 0) {
        for (const event of dedupedEvents) {
            const eventEpoch = toEpoch(event.created_at);
            const candidates = event.location
                ? locationMap.get(event.location)
                : null;
            let idx;

            if (candidates && candidates.length > 0) {
                idx = candidates[0];
                if (candidates.length > 1) {
                    for (let j = candidates.length - 1; j >= 0; j--) {
                        if (
                            segmentsAsc[candidates[j]].epoch <=
                            eventEpoch + TOLERANCE_MS
                        ) {
                            idx = candidates[j];
                            break;
                        }
                    }
                }
            } else {
                idx = findSegmentIndex(eventEpoch, segmentsAsc);
            }

            segmentsAsc[idx].events.push({ ...event });
        }
    }

    for (const seg of segmentsAsc) {
        seg.events.sort(
            (a, b) => toEpoch(a.created_at) - toEpoch(b.created_at)
        );
    }

    for (const seg of segmentsAsc) {
        const cutoff = seg.epoch - TOLERANCE_MS;
        seg.events = seg.events.filter((e) => toEpoch(e.created_at) >= cutoff);
    }

    for (const seg of segmentsAsc) {
        const windowEnd = seg.epoch + AGGREGATE_WINDOW_MS;
        const joinedIds = new Set();
        for (const e of seg.events) {
            if (toEpoch(e.created_at) > windowEnd) break;
            if (e.type === 'OnPlayerJoined' && e.userId) {
                joinedIds.add(e.userId);
            }
        }
        if (joinedIds.size > 0) {
            for (let i = seg.events.length - 1; i >= 0; i--) {
                const e = seg.events[i];
                if (toEpoch(e.created_at) > windowEnd) continue;
                if (
                    e.type === 'OnPlayerLeft' &&
                    e.userId &&
                    joinedIds.has(e.userId)
                ) {
                    seg.events.splice(i, 1);
                }
            }
        }
    }

    applyAggregation(segmentsAsc);

    for (const seg of segmentsAsc) {
        deduplicateVideoPlay(seg.events);
    }
    for (const seg of segmentsAsc) seg.events.reverse();
    const segments = segmentsAsc.reverse().map(({ epoch, ...rest }) => rest);

    return { segments };
}
