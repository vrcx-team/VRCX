import { defineStore } from 'pinia';

import { database } from '../services/database';
import { ONLINE_SESSION_MERGE_GAP_MS } from '../shared/utils/overlapCalculator';
const refreshJobs = new Map();

function buildSessionsAndPendingFromEvents(events, initialStart = null) {
    const sessions = [];
    let currentStart = initialStart;

    for (const event of events) {
        const ts = new Date(event.created_at).getTime();
        if (event.type === 'Online') {
            // Treat consecutive Online events as reconnect boundaries.
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

export const useActivityStore = defineStore('Activity', () => {
    function getCache(userId) {
        return database.getActivityCache(userId);
    }

    function isRefreshing(userId) {
        return refreshJobs.has(userId);
    }

    async function fullRefresh(userId) {
        const events = await database.getOnlineOfflineSessions(userId);
        const { sessions, pendingSessionStartAt } =
            buildSessionsAndPendingFromEvents(events);
        const sourceLastCreatedAt =
            events.length > 0 ? events[events.length - 1].created_at : '';
        const entry = {
            userId,
            updatedAt: new Date().toISOString(),
            isSelf: false,
            sourceLastCreatedAt,
            pendingSessionStartAt,
            sessions
        };
        await database.replaceActivityCache(entry);
        return database.getActivityCache(userId);
    }

    async function incrementalRefresh(meta) {
        const updatedAt = new Date().toISOString();

        if (!meta.sourceLastCreatedAt) {
            return fullRefresh(meta.userId);
        }

        const events = await database.getOnlineOfflineSessionsAfter(
            meta.userId,
            meta.sourceLastCreatedAt
        );
        if (events.length === 0) {
            await database.touchActivityCacheMeta({
                ...meta,
                updatedAt
            });
            return database.getActivityCache(meta.userId);
        }

        const { sessions, pendingSessionStartAt } =
            buildSessionsAndPendingFromEvents(
                events,
                meta.pendingSessionStartAt
            );
        const sourceLastCreatedAt = events[events.length - 1].created_at;

        await database.appendActivityCache({
            ...meta,
            updatedAt,
            sourceLastCreatedAt,
            pendingSessionStartAt,
            sessions
        });
        return database.getActivityCache(meta.userId);
    }

    function refreshActivityCache(userId) {
        const existing = refreshJobs.get(userId);
        if (existing) {
            return existing;
        }

        const job = (async () => {
            const meta = await database.getActivityCacheMeta(userId);
            if (!meta || meta.isSelf) {
                return fullRefresh(userId);
            }
            return incrementalRefresh(meta);
        })().finally(() => {
            refreshJobs.delete(userId);
        });

        refreshJobs.set(userId, job);
        return job;
    }

    return {
        getCache,
        isRefreshing,
        refreshActivityCache
    };
});
