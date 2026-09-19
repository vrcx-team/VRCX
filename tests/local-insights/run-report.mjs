import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { indexRecords, buildReport } from '../../src/features/local-insights/analytics.mjs';
const fixture = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const report = buildReport(indexRecords(fixture.records, fixture), fixture.targetId, { friendIds: new Set(fixture.friendIds) });
const benchmark = [];
for (let i = 0; i < 16000; i++) {
    const t = Date.parse('2026-09-19T00:00:00Z') + i * 3000;
    const location = `wrld_demo-bench:${i}`;
    benchmark.push({ type: 'Location', created_at: t, location });
    benchmark.push({ type: 'OnPlayerJoined', created_at: t + 100, userId: 'demo:bench', location });
    benchmark.push({ type: 'OnPlayerLeft', created_at: t + 1100, userId: 'demo:bench', location });
}
const start = performance.now();
const measured = buildReport(indexRecords(benchmark, { since: '2026-09-19T00:00:00Z', until: '2026-09-20T00:00:00Z' }), 'demo:bench');
if (measured.completeSessions !== 16000 || measured.observedMs !== 16000000) throw new Error('Benchmark correctness failed');
const result = { fixture: report, benchmark: { records: benchmark.length, sessions: measured.completeSessions, durationMs: measured.observedMs, elapsedMs: Math.round((performance.now() - start) * 100) / 100 } };
mkdirSync(resolve('test-results'), { recursive: true });
writeFileSync(resolve('test-results/local-insights-report.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
