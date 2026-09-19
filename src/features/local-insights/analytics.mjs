/**
 * Local shared-session analysis. No HTTP, polling, hidden-location inference,
 * creator-as-participant inference, or writes to the source database.
 * Only complete join/leave pairs in a recorded observer session are counted.
 */
export const EXCLUDED_USER_IDS = Object.freeze([
    'usr_1cf3480c-c735-447d-9227-8e1acbb6bf18'
]);
export const MAX_RECORDS = 60000;
export const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
const TYPES = new Set(['Location', 'OnPlayerJoined', 'OnPlayerLeft']);
const ORDER = { OnPlayerLeft: 0, Location: 1, OnPlayerJoined: 2 };

export function isExcluded(userId, observerId = '') {
    return !userId || userId === observerId || EXCLUDED_USER_IDS.includes(userId);
}
function timestamp(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) return NaN;
    return Date.parse(value);
}
const text = (value, max = 512) => typeof value === 'string' ? value.slice(0, max) : '';
export function visibleLocation(value) {
    return typeof value === 'string' && /^wrld_[^\s:]+:[^\s]+$/.test(value);
}
function redact(value, observerId) {
    let result = text(value, 2048);
    for (const id of [...EXCLUDED_USER_IDS, observerId].filter(Boolean)) {
        result = result.split(id).join('[excluded]');
    }
    return result;
}
function union(intervals) {
    const sorted = intervals.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
    const output = [];
    for (const [s, e] of sorted) {
        const last = output.at(-1);
        if (last && s <= last[1]) last[1] = Math.max(last[1], e);
        else output.push([s, e]);
    }
    return output;
}
function overlap(left, right) {
    const result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        const start = Math.max(left[i][0], right[j][0]);
        const end = Math.min(left[i][1], right[j][1]);
        if (end > start) result.push([start, end]);
        if (left[i][1] <= right[j][1]) i += 1;
        else j += 1;
    }
    return union(result);
}

/** Build an in-memory, bounded index from local GameLog records. */
export function indexRecords(input, { since, until, observerId = '' } = {}) {
    const from = timestamp(since);
    const to = timestamp(until);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to || to - from > 31 * 86400000) {
        throw new Error('Select a valid time range of at most 31 days.');
    }
    if (!Array.isArray(input) || input.length > MAX_RECORDS) {
        throw new Error('Too many records. Select a shorter range.');
    }
    const diagnostics = { invalid: 0, duplicates: 0, invisible: 0, missingObserver: 0, incomplete: 0 };
    const names = new Map();
    const worldNames = new Map();
    const seen = new Set();
    const events = [];
    for (const raw of input) {
        if (!raw || typeof raw !== 'object' || !TYPES.has(raw.type)) continue;
        const at = timestamp(raw.created_at);
        if (!Number.isFinite(at) || at > to) { diagnostics.invalid += 1; continue; }
        const userId = text(raw.userId);
        if (raw.type !== 'Location' && isExcluded(userId, observerId)) continue;
        let location = text(raw.location, 2048);
        if (!visibleLocation(location)) {
            diagnostics.invisible += 1;
            if (raw.type !== 'Location') continue;
            location = ''; // Loss of observer visibility is still a session boundary.
        }
        const key = JSON.stringify([at, raw.type, userId, location]);
        if (seen.has(key)) { diagnostics.duplicates += 1; continue; }
        seen.add(key);
        const event = {
            at, type: raw.type, userId, location,
            displayName: text(raw.displayName, 128) || userId,
            rowId: text(String(raw.rowId ?? ''), 64),
            worldName: text(raw.worldName, 256)
        };
        events.push(event);
        if (event.type !== 'Location') names.set(userId, event.displayName);
        if (event.worldName) worldNames.set(location, event.worldName);
    }
    events.sort((a, b) => a.at - b.at || ORDER[a.type] - ORDER[b.type] || a.rowId.localeCompare(b.rowId, 'en', { numeric: true }));
    const sessions = [];
    const active = new Map();
    const incompleteByUser = new Map();
    let observerLocation = '';
    function incomplete(userId) {
        diagnostics.incomplete += 1;
        incompleteByUser.set(userId, (incompleteByUser.get(userId) || 0) + 1);
    }
    for (const event of events) {
        if (event.type === 'Location') {
            for (const userId of active.keys()) incomplete(userId);
            active.clear();
            observerLocation = event.location;
            continue;
        }
        if (event.location !== observerLocation) { diagnostics.missingObserver += 1; continue; }
        if (event.type === 'OnPlayerJoined') {
            if (active.has(event.userId)) incomplete(event.userId);
            active.set(event.userId, event);
            continue;
        }
        const join = active.get(event.userId);
        active.delete(event.userId);
        if (!join) continue;
        const duration = event.at - join.at;
        if (duration <= 0 || duration > MAX_SESSION_MS) { incomplete(event.userId); continue; }
        const start = Math.max(join.at, from);
        const end = Math.min(event.at, to);
        if (end <= start) continue;
        sessions.push({
            userId: event.userId, location: event.location, start, end,
            joinRowId: join.rowId, leaveRowId: event.rowId
        });
    }
    for (const userId of active.keys()) incomplete(userId);
    return { from, to, observerId, names, worldNames, events, sessions, diagnostics, incompleteByUser };
}

export function listPeople(index, friendIds = null) {
    const eligible = new Set(index.events.filter((e) => e.type !== 'Location' && e.at >= index.from && e.at <= index.to).map((e) => e.userId));
    return [...eligible].filter((id) => !isExcluded(id, index.observerId) && (!friendIds || friendIds.has(id)))
        .map((id) => ({ id, name: index.names.get(id) || id }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildReport(index, targetId, { friendIds = new Set() } = {}) {
    if (isExcluded(targetId, index.observerId)) throw new Error('This account is excluded from local analysis.');
    if (!index.names.has(targetId)) throw new Error('No local observations for this person in the loaded data.');
    const targetSessions = index.sessions.filter((s) => s.userId === targetId);
    const targetByLocation = new Map();
    for (const s of targetSessions) {
        if (!targetByLocation.has(s.location)) targetByLocation.set(s.location, []);
        targetByLocation.get(s.location).push([s.start, s.end]);
    }
    for (const [location, ranges] of targetByLocation) targetByLocation.set(location, union(ranges));
    const peers = new Map();
    for (const s of index.sessions) {
        if (s.userId === targetId || isExcluded(s.userId, index.observerId) || !targetByLocation.has(s.location)) continue;
        if (!peers.has(s.userId)) peers.set(s.userId, new Map());
        const locations = peers.get(s.userId);
        if (!locations.has(s.location)) locations.set(s.location, []);
        locations.get(s.location).push([s.start, s.end]);
    }
    const companions = [];
    for (const [id, locations] of peers) {
        let observedMs = 0;
        let segments = 0;
        for (const [location, ranges] of locations) {
            const intersections = overlap(targetByLocation.get(location), union(ranges));
            observedMs += intersections.reduce((sum, [a, b]) => sum + b - a, 0);
            segments += intersections.length;
        }
        if (observedMs > 0) companions.push({ id, name: index.names.get(id) || id, observedMs, segments, isFriend: friendIds.has(id) });
    }
    companions.sort((a, b) => b.observedMs - a.observedMs || a.id.localeCompare(b.id));
    const allRanges = union(targetSessions.map((s) => [s.start, s.end]));
    const observedMs = allRanges.reduce((sum, [a, b]) => sum + b - a, 0);
    const dayMap = new Map();
    for (const [start, end] of allRanges) {
        let cursor = start;
        while (cursor < end) {
            const date = new Date(cursor);
            const key = date.toISOString().slice(0, 10);
            const stop = Math.min(end, Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
            dayMap.set(key, (dayMap.get(key) || 0) + stop - cursor);
            cursor = stop;
        }
    }
    const timeline = index.events.filter((e) => e.userId === targetId && e.at >= index.from && e.at <= index.to)
        .map((e) => ({
            at: e.at, type: e.type, rowId: e.rowId, source: 'GameLog',
            location: redact(e.location, index.observerId),
            worldName: redact(index.worldNames.get(e.location) || e.location.split(':')[0], index.observerId)
        })).reverse();
    return {
        schemaVersion: 1, kind: 'local-observed-shared-sessions',
        target: { id: targetId, name: index.names.get(targetId) },
        since: new Date(index.from).toISOString(), until: new Date(index.to).toISOString(),
        observedMs, completeSessions: targetSessions.length,
        incompleteSessions: index.incompleteByUser.get(targetId) || 0,
        companions,
        days: [...dayMap].sort(([a], [b]) => a.localeCompare(b)).map(([day, ms]) => ({ day, observedMs: ms })),
        timeline,
        notice: 'Observed co-presence in your own recorded sessions, not total online time or proof of interaction. Missing and private activity is unknown. Creators are not presumed present.'
    };
}
