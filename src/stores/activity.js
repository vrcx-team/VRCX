import { defineStore } from 'pinia';

import { database } from '../services/database';
import { mergeSessions } from '../shared/utils/activityEngine.js';
import { runActivityWorkerTask } from '../workers/activityWorkerRunner.js';

const snapshotMap = new Map();
const inFlightJobs = new Map();
const workerCall = runActivityWorkerTask;
const MAX_SNAPSHOT_ENTRIES = 12;
let deferredWriteQueue = Promise.resolve();

function deferWrite(task) {
    const run = () => {
        deferredWriteQueue = deferredWriteQueue
            .catch(() => {})
            .then(task)
            .catch((error) => {
                console.error('[Activity] deferred write failed:', error);
            });
        return deferredWriteQueue;
    };
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run);
        return;
    }
    setTimeout(run, 0);
}

function createSnapshot(userId, isSelf) {
    return {
        userId,
        isSelf,
        sync: {
            userId,
            updatedAt: '',
            isSelf,
            sourceLastCreatedAt: '',
            pendingSessionStartAt: null,
            cachedRangeDays: 0
        },
        sessions: [],
        activityViews: new Map(),
        overlapViews: new Map()
    };
}

function getSnapshot(userId, isSelf) {
    let snapshot = snapshotMap.get(userId);
    if (!snapshot) {
        snapshot = createSnapshot(userId, isSelf);
        snapshotMap.set(userId, snapshot);
    } else if (typeof isSelf === 'boolean') {
        snapshot.isSelf = isSelf;
        snapshot.sync.isSelf = isSelf;
    }
    touchSnapshot(userId, snapshot);
    pruneSnapshots();
    return snapshot;
}

function touchSnapshot(userId, snapshot) {
    snapshotMap.delete(userId);
    snapshotMap.set(userId, snapshot);
}

function pruneSnapshots() {
    if (snapshotMap.size <= MAX_SNAPSHOT_ENTRIES) {
        return;
    }

    for (const [userId] of snapshotMap) {
        if (isUserInFlight(userId)) {
            continue;
        }
        snapshotMap.delete(userId);
        if (snapshotMap.size <= MAX_SNAPSHOT_ENTRIES) {
            break;
        }
    }
}

function isUserInFlight(userId) {
    for (const key of inFlightJobs.keys()) {
        if (key.startsWith(`${userId}:`)) {
            return true;
        }
    }
    return false;
}

function clearDerivedViews(snapshot) {
    snapshot.activityViews.clear();
    snapshot.overlapViews.clear();
}

function overlapExcludeKey(excludeHours) {
    if (!excludeHours?.enabled) {
        return '';
    }
    return `${excludeHours.startHour}-${excludeHours.endHour}`;
}

function pairCursor(leftCursor, rightCursor) {
    return `${leftCursor || ''}|${rightCursor || ''}`;
}

export const useActivityStore = defineStore('Activity', () => {
    async function getCache(userId, isSelf = false) {
        const snapshot = await hydrateSnapshot(userId, isSelf);
        return {
            userId: snapshot.userId,
            isSelf: snapshot.isSelf,
            updatedAt: snapshot.sync.updatedAt,
            sourceLastCreatedAt: snapshot.sync.sourceLastCreatedAt,
            pendingSessionStartAt: snapshot.sync.pendingSessionStartAt,
            cachedRangeDays: snapshot.sync.cachedRangeDays,
            sessions: snapshot.sessions
        };
    }

    function getCachedDays(userId) {
        return snapshotMap.get(userId)?.sync.cachedRangeDays || 0;
    }

    function isRefreshing(userId) {
        for (const key of inFlightJobs.keys()) {
            if (key.startsWith(`${userId}:`)) {
                return true;
            }
        }
        return false;
    }

    async function loadActivity(
        userId,
        {
            isSelf = false,
            rangeDays = 30,
            normalizeConfig,
            dayLabels,
            forceRefresh = false
        }
    ) {
        const snapshot = await ensureSnapshot(userId, {
            isSelf,
            rangeDays,
            forceRefresh
        });
        const cacheKey = String(rangeDays);
        const currentCursor = snapshot.sync.sourceLastCreatedAt || '';

        let view = snapshot.activityViews.get(cacheKey);
        if (!forceRefresh && view?.builtFromCursor === currentCursor) {
            return buildActivityResponse(snapshot, view);
        }

        if (!forceRefresh) {
            const persisted = await database.getActivityBucketCacheV2({
                ownerUserId: userId,
                rangeDays,
                viewKind: database.ACTIVITY_VIEW_KIND.ACTIVITY
            });
            if (persisted?.builtFromCursor === currentCursor) {
                view = {
                    ...persisted.summary,
                    rawBuckets: persisted.rawBuckets,
                    normalizedBuckets: persisted.normalizedBuckets,
                    builtFromCursor: persisted.builtFromCursor,
                    builtAt: persisted.builtAt
                };
                snapshot.activityViews.set(cacheKey, view);
                return buildActivityResponse(snapshot, view);
            }
        }

        const computed = await workerCall('computeActivityView', {
            sessions: snapshot.sessions,
            dayLabels,
            rangeDays,
            normalizeConfig
        });
        view = {
            ...computed,
            builtFromCursor: currentCursor,
            builtAt: new Date().toISOString()
        };
        snapshot.activityViews.set(cacheKey, view);
        deferWrite(() =>
            database.upsertActivityBucketCacheV2({
                ownerUserId: userId,
                rangeDays,
                viewKind: database.ACTIVITY_VIEW_KIND.ACTIVITY,
                builtFromCursor: currentCursor,
                rawBuckets: view.rawBuckets,
                normalizedBuckets: view.normalizedBuckets,
                summary: {
                    peakDay: view.peakDay,
                    peakTime: view.peakTime,
                    filteredEventCount: view.filteredEventCount
                },
                builtAt: view.builtAt
            })
        );
        return buildActivityResponse(snapshot, view);
    }

    async function loadOverlap(
        currentUserId,
        targetUserId,
        {
            rangeDays = 30,
            dayLabels,
            normalizeConfig,
            excludeHours,
            forceRefresh = false
        }
    ) {
        const [selfSnapshot, targetSnapshot] = await Promise.all([
            ensureSnapshot(currentUserId, {
                isSelf: true,
                rangeDays,
                forceRefresh
            }),
            ensureSnapshot(targetUserId, {
                isSelf: false,
                rangeDays,
                forceRefresh
            })
        ]);

        const excludeKey = overlapExcludeKey(excludeHours);
        const cacheKey = `${targetUserId}:${rangeDays}:${excludeKey}`;
        const cursor = pairCursor(
            selfSnapshot.sync.sourceLastCreatedAt,
            targetSnapshot.sync.sourceLastCreatedAt
        );

        let view = targetSnapshot.overlapViews.get(cacheKey);
        if (view?.builtFromCursor === cursor) {
            return view;
        }

        const persisted = await database.getActivityBucketCacheV2({
            ownerUserId: currentUserId,
            targetUserId,
            rangeDays,
            viewKind: database.ACTIVITY_VIEW_KIND.OVERLAP,
            excludeKey
        });
        if (persisted?.builtFromCursor === cursor) {
            view = {
                ...persisted.summary,
                rawBuckets: persisted.rawBuckets,
                normalizedBuckets: persisted.normalizedBuckets,
                builtFromCursor: persisted.builtFromCursor,
                builtAt: persisted.builtAt
            };
            targetSnapshot.overlapViews.set(cacheKey, view);
            return view;
        }

        view = await workerCall('computeOverlapView', {
            selfSessions: selfSnapshot.sessions,
            targetSessions: targetSnapshot.sessions,
            dayLabels,
            rangeDays,
            excludeHours: excludeHours?.enabled ? excludeHours : null,
            normalizeConfig
        });
        view = {
            ...view,
            builtFromCursor: cursor,
            builtAt: new Date().toISOString()
        };
        targetSnapshot.overlapViews.set(cacheKey, view);
        deferWrite(() =>
            database.upsertActivityBucketCacheV2({
                ownerUserId: currentUserId,
                targetUserId,
                rangeDays,
                viewKind: database.ACTIVITY_VIEW_KIND.OVERLAP,
                excludeKey,
                builtFromCursor: cursor,
                rawBuckets: view.rawBuckets,
                normalizedBuckets: view.normalizedBuckets,
                summary: {
                    overlapPercent: view.overlapPercent,
                    bestOverlapTime: view.bestOverlapTime
                },
                builtAt: view.builtAt
            })
        );
        return view;
    }

    async function loadTopWorlds(
        userId,
        { rangeDays = 30, limit = 5, sortBy = 'time', excludeWorldId = '' }
    ) {
        void userId;
        return database.getMyTopWorlds(rangeDays, limit, sortBy, excludeWorldId);
    }

    async function refreshActivity(userId, options) {
        return loadActivity(userId, { ...options, forceRefresh: true });
    }

    async function loadActivityView({
        userId,
        isSelf = false,
        rangeDays = 30,
        dayLabels,
        forceRefresh = false
    }) {
        const response = await loadActivity(userId, {
            isSelf,
            rangeDays,
            dayLabels,
            forceRefresh,
            normalizeConfig: pickActivityNormalizeConfig(isSelf, rangeDays)
        });
        return {
            hasAnyData: response.sessions.length > 0,
            filteredEventCount: response.view.filteredEventCount,
            peakDay: response.view.peakDay,
            peakTime: response.view.peakTime,
            rawBuckets: response.view.rawBuckets,
            normalizedBuckets: response.view.normalizedBuckets
        };
    }

    async function loadOverlapView({
        currentUserId,
        targetUserId,
        rangeDays = 30,
        dayLabels,
        excludeHours,
        forceRefresh = false
    }) {
        const response = await loadOverlap(currentUserId, targetUserId, {
            rangeDays,
            dayLabels,
            excludeHours,
            forceRefresh,
            normalizeConfig: pickOverlapNormalizeConfig(rangeDays)
        });
        return {
            hasOverlapData: response.rawBuckets.some((value) => value > 0),
            overlapPercent: response.overlapPercent,
            bestOverlapTime: response.bestOverlapTime,
            rawBuckets: response.rawBuckets,
            normalizedBuckets: response.normalizedBuckets
        };
    }

    async function loadTopWorldsView({
        userId,
        rangeDays = 30,
        limit = 5,
        sortBy = 'time',
        excludeWorldId = ''
    }) {
        return loadTopWorlds(userId, {
            rangeDays,
            limit,
            sortBy,
            excludeWorldId,
            isSelf: true
        });
    }

    function invalidateUser(userId) {
        if (!userId) {
            return;
        }
        snapshotMap.delete(userId);
    }

    return {
        getCache,
        getCachedDays,
        isRefreshing,
        loadActivity,
        loadActivityView,
        loadOverlap,
        loadOverlapView,
        loadTopWorlds,
        loadTopWorldsView,
        refreshActivity,
        invalidateUser,
        workerCall: runActivityWorkerTask
    };
});

function buildActivityResponse(snapshot, view) {
    return {
        userId: snapshot.userId,
        isSelf: snapshot.isSelf,
        cachedRangeDays: snapshot.sync.cachedRangeDays,
        sessions: snapshot.sessions,
        view
    };
}

async function hydrateSnapshot(userId, isSelf) {
    const snapshot = getSnapshot(userId, isSelf);
    if (snapshot.sync.updatedAt || snapshot.sessions.length > 0) {
        return snapshot;
    }

    const [syncState, sessions] = await Promise.all([
        database.getActivitySyncStateV2(userId),
        database.getActivitySessionsV2(userId)
    ]);

    if (syncState) {
        snapshot.sync = {
            ...snapshot.sync,
            ...syncState,
            isSelf:
                typeof syncState.isSelf === 'boolean'
                    ? syncState.isSelf
                    : snapshot.isSelf
        };
    }
    if (sessions.length > 0) {
        snapshot.sessions = sessions;
    }
    return snapshot;
}

async function ensureSnapshot(
    userId,
    { isSelf, rangeDays, forceRefresh = false }
) {
    const jobKey = `${userId}:${isSelf}:${rangeDays}:${forceRefresh ? 'force' : 'normal'}`;
    const existingJob = inFlightJobs.get(jobKey);
    if (existingJob) {
        return existingJob;
    }

    const job = (async () => {
        const snapshot = await hydrateSnapshot(userId, isSelf);
        if (forceRefresh || !snapshot.sync.updatedAt) {
            await fullRefresh(snapshot, rangeDays);
        } else {
            await incrementalRefresh(snapshot);
            if (rangeDays > snapshot.sync.cachedRangeDays) {
                await expandRange(snapshot, rangeDays);
            }
        }
        return snapshot;
    })().finally(() => {
        inFlightJobs.delete(jobKey);
    });

    inFlightJobs.set(jobKey, job);
    return job;
}

async function fullRefresh(snapshot, rangeDays) {
    const sourceItems = await database.getActivitySourceSliceV2({
        userId: snapshot.userId,
        isSelf: snapshot.isSelf,
        fromDays: rangeDays
    });
    const sourceLastCreatedAt =
        sourceItems.length > 0
            ? sourceItems[sourceItems.length - 1].created_at
            : '';
    const result = await workerCall('computeSessionsSnapshot', {
        sourceType: snapshot.isSelf ? 'self_gamelog' : 'friend_presence',
        rows: snapshot.isSelf ? sourceItems : undefined,
        events: snapshot.isSelf ? undefined : sourceItems,
        initialStart: null,
        nowMs: Date.now(),
        mayHaveOpenTail: snapshot.isSelf,
        sourceRevision: sourceLastCreatedAt
    });

    snapshot.sessions = result.sessions;
    snapshot.sync = {
        ...snapshot.sync,
        updatedAt: new Date().toISOString(),
        isSelf: snapshot.isSelf,
        sourceLastCreatedAt,
        pendingSessionStartAt: result.pendingSessionStartAt,
        cachedRangeDays: rangeDays
    };
    clearDerivedViews(snapshot);

    deferWrite(() =>
        database.replaceActivitySessionsV2(snapshot.userId, snapshot.sessions)
    );
    deferWrite(() => database.upsertActivitySyncStateV2(snapshot.sync));
}

async function incrementalRefresh(snapshot) {
    if (!snapshot.sync.sourceLastCreatedAt) {
        return;
    }

    const sourceItems = await database.getActivitySourceAfterV2({
        userId: snapshot.userId,
        isSelf: snapshot.isSelf,
        afterCreatedAt: snapshot.sync.sourceLastCreatedAt,
        inclusive: snapshot.isSelf
    });
    if (sourceItems.length === 0) {
        snapshot.sync.updatedAt = new Date().toISOString();
        deferWrite(() => database.upsertActivitySyncStateV2(snapshot.sync));
        return;
    }

    const sourceLastCreatedAt = sourceItems[sourceItems.length - 1].created_at;
    const result = await workerCall('computeSessionsSnapshot', {
        sourceType: snapshot.isSelf ? 'self_gamelog' : 'friend_presence',
        rows: snapshot.isSelf ? sourceItems : undefined,
        events: snapshot.isSelf ? undefined : sourceItems,
        initialStart: snapshot.isSelf
            ? null
            : snapshot.sync.pendingSessionStartAt,
        nowMs: Date.now(),
        mayHaveOpenTail: snapshot.isSelf,
        sourceRevision: sourceLastCreatedAt
    });

    const replaceFromStartAt =
        snapshot.sessions.length > 0
            ? snapshot.sessions[Math.max(snapshot.sessions.length - 1, 0)].start
            : null;
    const merged = mergeSessions(snapshot.sessions, result.sessions);
    snapshot.sessions = merged;
    snapshot.sync = {
        ...snapshot.sync,
        updatedAt: new Date().toISOString(),
        sourceLastCreatedAt,
        pendingSessionStartAt: result.pendingSessionStartAt
    };
    clearDerivedViews(snapshot);

    const tailSessions =
        replaceFromStartAt === null
            ? merged
            : merged.filter((session) => session.start >= replaceFromStartAt);
    deferWrite(() =>
        database.appendActivitySessionsV2({
            userId: snapshot.userId,
            sessions: tailSessions,
            replaceFromStartAt
        })
    );
    deferWrite(() => database.upsertActivitySyncStateV2(snapshot.sync));
}

async function expandRange(snapshot, rangeDays) {
    const currentDays = snapshot.sync.cachedRangeDays || 0;
    if (rangeDays <= currentDays) {
        return;
    }

    const sourceItems = await database.getActivitySourceSliceV2({
        userId: snapshot.userId,
        isSelf: snapshot.isSelf,
        fromDays: rangeDays,
        toDays: currentDays
    });
    const result = await workerCall('computeSessionsSnapshot', {
        sourceType: snapshot.isSelf ? 'self_gamelog' : 'friend_presence',
        rows: snapshot.isSelf ? sourceItems : undefined,
        events: snapshot.isSelf ? undefined : sourceItems,
        initialStart: null,
        nowMs: Date.now(),
        mayHaveOpenTail: false,
        sourceRevision: snapshot.sync.sourceLastCreatedAt
    });

    if (result.sessions.length > 0) {
        snapshot.sessions = mergeSessions(result.sessions, snapshot.sessions);
        deferWrite(() =>
            database.replaceActivitySessionsV2(
                snapshot.userId,
                snapshot.sessions
            )
        );
    }
    snapshot.sync.cachedRangeDays = rangeDays;
    snapshot.sync.updatedAt = new Date().toISOString();
    clearDerivedViews(snapshot);

    deferWrite(() => database.upsertActivitySyncStateV2(snapshot.sync));
}

function pickActivityNormalizeConfig(isSelf, rangeDays) {
    const role = isSelf ? 'self' : 'friend';
    return (
        {
            self: {
                7: {
                    floorPercentile: 10,
                    capPercentile: 80,
                    rankWeight: 0.15,
                    targetCoverage: 0.12,
                    targetVolume: 40
                },
                30: {
                    floorPercentile: 15,
                    capPercentile: 85,
                    rankWeight: 0.2,
                    targetCoverage: 0.25,
                    targetVolume: 60
                },
                90: {
                    floorPercentile: 15,
                    capPercentile: 85,
                    rankWeight: 0.2,
                    targetCoverage: 0.3,
                    targetVolume: 50
                }
            },
            friend: {
                7: {
                    floorPercentile: 10,
                    capPercentile: 80,
                    rankWeight: 0.15,
                    targetCoverage: 0.12,
                    targetVolume: 40
                },
                30: {
                    floorPercentile: 15,
                    capPercentile: 85,
                    rankWeight: 0.2,
                    targetCoverage: 0.25,
                    targetVolume: 60
                },
                90: {
                    floorPercentile: 15,
                    capPercentile: 85,
                    rankWeight: 0.2,
                    targetCoverage: 0.3,
                    targetVolume: 50
                }
            }
        }[role][rangeDays] || {
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.25,
            targetVolume: 60
        }
    );
}

function pickOverlapNormalizeConfig(rangeDays) {
    return (
        {
            7: {
                floorPercentile: 10,
                capPercentile: 80,
                rankWeight: 0.15,
                targetCoverage: 0.08,
                targetVolume: 15
            },
            30: {
                floorPercentile: 15,
                capPercentile: 85,
                rankWeight: 0.2,
                targetCoverage: 0.15,
                targetVolume: 25
            },
            90: {
                floorPercentile: 15,
                capPercentile: 85,
                rankWeight: 0.2,
                targetCoverage: 0.18,
                targetVolume: 20
            }
        }[rangeDays] || {
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.15,
            targetVolume: 25
        }
    );
}
