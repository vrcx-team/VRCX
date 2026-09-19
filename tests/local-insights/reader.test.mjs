import test from 'node:test';
import assert from 'node:assert/strict';
import { readDatabase } from '../../src/features/local-insights/readDatabase.mjs';
import { EXCLUDED_USER_IDS } from '../../src/features/local-insights/analytics.mjs';
const options = { since: '2026-09-19T18:00:00Z', until: '2026-09-19T22:00:00Z', observerId: 'demo:observer', userPrefix: 'usrdemo' };
function mock(extra = {}) {
    const calls = [];
    const execute = async (callback, sql, params) => {
        calls.push({ sql, params }); let rows = [];
        if (sql.includes('friend_log_current')) rows = [['demo:alex', 'Alex'], [options.observerId, 'Self'], [EXCLUDED_USER_IDS[0], 'Excluded']];
        else if (sql.includes('created_at < @start')) rows = [[1, '2026-09-18T17:00:00Z', 'wrld_demo:1', 'Room']];
        else if (sql.includes('gamelog_join_leave')) rows = [[2, options.since, 'OnPlayerJoined', 'Alex', 'wrld_demo:1', 'demo:alex'], [3, options.since, 'OnPlayerJoined', 'Excluded', 'wrld_demo:1', EXCLUDED_USER_IDS[0]]];
        if (extra.override) rows = extra.override(sql, rows);
        rows.forEach(callback); if (extra.after) extra.after(sql);
    };
    return { calls, execute };
}
test('SQL adapter uses bounded SELECTs and parameter bindings', async () => {
    const m = mock(); const result = await readDatabase(m.execute, options);
    assert.equal(m.calls.length, 4); assert(m.calls.every(({ sql }) => sql.startsWith('SELECT ') && /LIMIT \d+/.test(sql)));
    assert(m.calls.every(({ sql }) => !sql.includes(options.observerId)));
    assert.equal(m.calls[3].params['@observer'], options.observerId); assert.equal(m.calls[3].params['@excluded'], EXCLUDED_USER_IDS[0]);
    assert.equal(m.calls[3].params['@start'], '2026-09-18T18:00:00.000Z'); assert.deepEqual([...result.friendIds], ['demo:alex']); assert.equal(result.records.length, 2);
});
test('SQL identifiers cannot inject statements', async () => { const m = mock(); await assert.rejects(readDatabase(m.execute, { ...options, userPrefix: 'x; DROP TABLE y' }), /sign in/); assert.equal(m.calls.length, 0); });
test('account switch rejects stale results', async () => {
    let current = true; const m = mock({ after: () => { current = false; } }); await assert.rejects(readDatabase(m.execute, { ...options, isCurrent: () => current }), /account changed/); assert.equal(m.calls.length, 1);
});
test('overflow is explicit instead of silently truncated totals', async () => {
    const m = mock({ override: (sql, rows) => sql.includes('gamelog_join_leave') ? Array(50001).fill(rows[0]) : rows }); await assert.rejects(readDatabase(m.execute, options), /too large/);
});
test('native errors propagate instead of presenting stale data', async () => { await assert.rejects(readDatabase(async () => { throw new Error('database is locked'); }, options), /locked/); });
test('empty database stays empty and performs no writes', async () => { const result = await readDatabase(async () => {}, options); assert.deepEqual(result.records, []); assert.equal(result.friendIds.size, 0); });
