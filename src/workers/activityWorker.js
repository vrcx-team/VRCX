import {
    buildSessionsFromEvents,
    buildSessionsFromGamelog,
    buildHeatmapBuckets,
    buildOverlapBuckets,
    computeActivityView,
    computeOverlapView,
    normalizeBuckets
} from '../shared/utils/activityEngine.js';

self.addEventListener('message', (event) => {
    const { type, seq, payload } = event.data;

    try {
        let result;
        switch (type) {
            case 'computeSessionsSnapshot':
                result = computeSessionsSnapshot(payload);
                break;
            case 'computeActivityView':
                result = computeActivityView(payload);
                break;
            case 'computeOverlapView':
                result = computeOverlapView(payload);
                break;
            case 'buildSessionsFromGamelog':
                result = {
                    sessions: buildSessionsFromGamelog(
                        payload.rows || [],
                        payload.mergeGapMs,
                        payload.nowMs
                    )
                };
                break;
            case 'buildSessionsFromEvents':
                result = buildSessionsFromEvents(payload.events || [], payload.initialStart ?? null);
                break;
            case 'buildHeatmapBuckets':
                result = {
                    buckets: buildHeatmapBuckets(
                        payload.sessions || [],
                        payload.windowStartMs,
                        payload.nowMs,
                        payload.maxSessionMs
                    )
                };
                break;
            case 'buildOverlapBuckets':
                result = {
                    buckets: buildOverlapBuckets(
                        payload.selfSessions || [],
                        payload.friendSessions || [],
                        payload.windowStartMs,
                        payload.nowMs,
                        payload.maxSessionMs
                    )
                };
                break;
            case 'normalizeHeatmapBuckets':
                if ('thresholdMinutes' in payload || 'mode' in payload) {
                    console.warn('[activityWorker] normalizeHeatmapBuckets received legacy payload fields (thresholdMinutes/mode). Use payload.config instead.');
                }
                result = {
                    normalized: normalizeBuckets(
                        payload.buckets || [],
                        payload.config || {}
                    )
                };
                break;
            default:
                throw new Error(`Unknown activity worker task: ${type}`);
        }

        self.postMessage({ type: 'result', seq, payload: result });
    } catch (error) {
        self.postMessage({
            type: 'error',
            seq,
            payload: { message: error instanceof Error ? error.message : String(error) }
        });
    }
});

function computeSessionsSnapshot(payload) {
    const sourceRevision = payload.sourceRevision || '';
    if (payload.sourceType === 'self_gamelog') {
        const sessions = buildSessionsFromGamelog(payload.rows, payload.mergeGapMs, payload.nowMs)
            .map((session, index, list) => ({
                ...session,
                isOpenTail: index === list.length - 1 && payload.mayHaveOpenTail === true,
                sourceRevision
            }));
        return {
            sessions,
            pendingSessionStartAt: null
        };
    }

    const result = buildSessionsFromEvents(payload.events, payload.initialStart);
    return {
        pendingSessionStartAt: result.pendingSessionStartAt,
        sessions: result.sessions.map((session) => ({
            ...session,
            isOpenTail: false,
            sourceRevision
        }))
    };
}
