import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexRecords, buildReport, listPeople, EXCLUDED_USER_IDS, MAX_RECORDS } from '../../src/features/local-insights/analytics.mjs';
const fixture = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const run = (records = fixture.records, options = {}) => indexRecords(records, { ...fixture, ...options });
const report = (records = fixture.records, options = {}) => buildReport(run(records, options), fixture.targetId, { friendIds: new Set(fixture.friendIds) });

test('fixture: 90 minutes, two closed sessions, one unclosed session', () => {
    const r = report(); assert.equal(r.observedMs / 60000, 90); assert.equal(r.completeSessions, 2); assert.equal(r.incompleteSessions, 1);
});
test('observed non-friend is included; creator without evidence is not', () => {
    const r = report();
    assert.deepEqual(r.companions.map((p) => ({ id: p.id, minutes: p.observedMs / 60000 })), fixture.expected.companions);
    assert.equal(r.companions[0].isFriend, false); assert.equal(r.companions.some((p) => p.id === 'demo:owner'), false);
});
test('no extra credit for duplicate records or record order', () => { assert.deepEqual(report([...fixture.records, ...fixture.records].reverse()), report()); });
test('range clipping uses actual pairs from before the range', () => { assert.equal(report(undefined, { since: '2026-09-19T18:30:00Z' }).observedMs / 60000, 65); });
test('missing leave does not run to current time', () => { assert.equal(report(fixture.records.filter((r) => r.rowId !== '7' && r.rowId !== '13')).observedMs, 0); });
test('repeat join without leave discards previous open start', () => {
    const rows = structuredClone(fixture.records); rows.push({ ...rows[1], rowId: '99', created_at: '2026-09-19T18:55:00Z' }); assert.equal(report(rows).observedMs / 60000, 40);
});
test('same world but a different instance is not co-presence', () => {
    const rows = fixture.records.map((r) => r.userId === 'demo:blair' ? { ...r, location: 'wrld_demo-one:999' } : r);
    assert.equal(report(rows).companions.some((p) => p.id === 'demo:blair'), false);
});
test('private and busy states never establish residual location', () => {
    const rows = fixture.records.concat([
        { type: 'OnPlayerJoined', userId: 'demo:hidden', created_at: '2026-09-19T18:10:00Z', location: 'private' },
        { type: 'OnPlayerLeft', userId: 'demo:hidden', created_at: '2026-09-19T18:50:00Z', location: 'private' }
    ]);
    assert.equal(report(rows).companions.some((p) => p.id === 'demo:hidden'), false); assert.equal(JSON.stringify(report(rows)).includes('likely'), false);
});
test('excluded IDs and observer cannot be targets, peers or timeline actors', () => {
    for (const id of [...EXCLUDED_USER_IDS, fixture.observerId]) {
        const rows = fixture.records.concat(fixture.records.filter((r) => r.userId === fixture.targetId).map((r) => ({ ...r, userId: id })));
        const index = run(rows); assert.throws(() => buildReport(index, id), /excluded/); assert.equal(listPeople(index).some((p) => p.id === id), false);
        assert.equal(JSON.stringify(buildReport(index, fixture.targetId)).includes(id), false);
    }
});
test('UTC midnight splits durations without double counting', () => {
    const location = 'wrld_demo:300';
    const rows = [
        { type: 'Location', created_at: '2026-09-19T23:40:00Z', location },
        { type: 'OnPlayerJoined', created_at: '2026-09-19T23:50:00Z', userId: fixture.targetId, location },
        { type: 'OnPlayerLeft', created_at: '2026-09-20T00:10:00Z', userId: fixture.targetId, location }
    ];
    assert.deepEqual(report(rows, { since: '2026-09-19T23:00:00Z', until: '2026-09-20T01:00:00Z' }).days.map((d) => d.observedMs / 60000), [10, 10]);
});
test('invalid timestamps are rejected, not interpreted as local timezone', () => {
    const rows = fixture.records.concat([{ ...fixture.records[1], created_at: '2026-09-19 18:05:00' }]); assert.equal(run(rows).diagnostics.invalid, 1); assert.equal(report(rows).observedMs, report().observedMs);
});
test('no source mutation; bounded inputs and invalid ranges fail closed', () => {
    const before = JSON.stringify(fixture); report(); assert.equal(JSON.stringify(fixture), before);
    assert.throws(() => run(new Array(MAX_RECORDS + 1)), /Too many/); assert.throws(() => run([], { since: fixture.until, until: fixture.since }), /valid time range/);
});
test('a location boundary prevents pairing across separate visits', () => {
    const rows = fixture.records.concat([{ type: 'Location', rowId: '98', created_at: '2026-09-19T18:35:00Z', location: fixture.records[0].location }]); assert.equal(report(rows).observedMs / 60000, 30);
});
test('empty data and unknown targets are explicit', () => { assert.deepEqual(listPeople(run([])), []); assert.throws(() => buildReport(run([]), fixture.targetId), /No local/); });
test('unavailable observer location closes the prior observation window', () => {
    const rows = fixture.records.concat([{ type: 'Location', created_at: '2026-09-19T18:35:00Z', location: 'offline' }]); assert.equal(report(rows).observedMs / 60000, 30);
});
