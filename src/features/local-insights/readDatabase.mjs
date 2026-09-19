import { EXCLUDED_USER_IDS, MAX_SESSION_MS, isExcluded } from './analytics.mjs';
const LOG_LIMIT = 50000;
const LOCATION_LIMIT = 5000;
const FRIEND_LIMIT = 20000;
/** Injected read-only SQL executor; kept separate for tests without native bindings. */
export async function readDatabase(execute, { since, until, observerId, userPrefix, isCurrent = () => true }) {
    if (!observerId || !/^[a-zA-Z0-9_]+$/.test(userPrefix || '')) throw new Error('Please sign in before reading local records.');
    const from = Date.parse(since);
    const to = Date.parse(until);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to || to - from > 31 * 86400000) throw new Error('Invalid date range.');
    const start = new Date(from - MAX_SESSION_MS).toISOString();
    const args = { '@start': start, '@end': new Date(to).toISOString(), '@observer': observerId, '@excluded': EXCLUDED_USER_IDS[0] };
    async function rows(sql, params, limit) {
        if (!isCurrent()) throw new Error('The active account changed. Reload this page.');
        const result = [];
        await execute((row) => { if (result.length <= limit) result.push(row); }, sql, params);
        if (!isCurrent()) throw new Error('The active account changed. Reload this page.');
        if (result.length > limit) throw new Error('The result is too large. Select a shorter time range.');
        return result;
    }
    const friends = await rows(`SELECT user_id, display_name FROM ${userPrefix}_friend_log_current LIMIT ${FRIEND_LIMIT + 1}`, null, FRIEND_LIMIT);
    const seed = await rows('SELECT id, created_at, location, world_name FROM gamelog_location WHERE created_at < @start ORDER BY created_at DESC, id DESC LIMIT 1', args, 1);
    const locations = await rows(`SELECT id, created_at, location, world_name FROM gamelog_location WHERE created_at >= @start AND created_at <= @end ORDER BY created_at, id LIMIT ${LOCATION_LIMIT + 1}`, args, LOCATION_LIMIT);
    const joins = await rows(`SELECT id, created_at, type, display_name, location, user_id FROM gamelog_join_leave WHERE created_at >= @start AND created_at <= @end AND user_id != @observer AND user_id != @excluded ORDER BY created_at, id LIMIT ${LOG_LIMIT + 1}`, args, LOG_LIMIT);
    const records = [...seed, ...locations].map(([rowId, created_at, location, worldName]) => ({ rowId, created_at, type: 'Location', location, worldName }));
    for (const [rowId, created_at, type, displayName, location, userId] of joins) {
        if (!isExcluded(userId, observerId)) records.push({ rowId, created_at, type, displayName, location, userId });
    }
    return { records, friendIds: new Set(friends.map(([id]) => id).filter((id) => !isExcluded(id, observerId))), observerId, since, until };
}
