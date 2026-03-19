import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { database } from '../services/database';
import {
    buildSessionsFromGamelog,
    ONLINE_SESSION_MERGE_GAP_MS
} from '../shared/utils/overlapCalculator';

const ACTIVITY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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

function mergeWithLastSession(lastSession, newSessions) {
    if (!lastSession || newSessions.length === 0) {
        return { replaceLastSession: null, sessions: newSessions };
    }

    const firstSession = newSessions[0];
    if (firstSession.start > lastSession.end + ONLINE_SESSION_MERGE_GAP_MS) {
        return { replaceLastSession: null, sessions: newSessions };
    }

    const mergedFirst = {
        start: Math.min(lastSession.start, firstSession.start),
        end: Math.max(lastSession.end, firstSession.end)
    };
    return {
        replaceLastSession: lastSession,
        sessions: [mergedFirst, ...newSessions.slice(1)]
    };
}

export const useActivityStore = defineStore('Activity', () => {
    const { t } = useI18n();

    function getCache(userId) {
        return database.getActivityCache(userId);
    }

    function isExpired(cacheEntry) {
        if (!cacheEntry?.updatedAt) {
            return true;
        }
        const updatedAtMs = Date.parse(cacheEntry.updatedAt);
        if (Number.isNaN(updatedAtMs)) {
            return true;
        }
        return Date.now() - updatedAtMs >= ACTIVITY_CACHE_TTL_MS;
    }

    function isRefreshing(userId) {
        return refreshJobs.has(userId);
    }

    async function fullRefresh(userId, isSelf) {
        if (isSelf) {
            const rows = await database.getCurrentUserOnlineSessions();
            const sessions = buildSessionsFromGamelog(rows);
            const sourceLastCreatedAt =
                rows.length > 0 ? rows[rows.length - 1].created_at : '';
            const entry = {
                userId,
                updatedAt: new Date().toISOString(),
                isSelf,
                sourceLastCreatedAt,
                pendingSessionStartAt: null,
                sessions
            };
            await database.replaceActivityCache(entry);
            return database.getActivityCache(userId);
        }

        const events = await database.getOnlineOfflineSessions(userId);
        const { sessions, pendingSessionStartAt } = buildSessionsAndPendingFromEvents(events);
        const sourceLastCreatedAt =
            events.length > 0 ? events[events.length - 1].created_at : '';
        const entry = {
            userId,
            updatedAt: new Date().toISOString(),
            isSelf,
            sourceLastCreatedAt,
            pendingSessionStartAt,
            sessions
        };
        await database.replaceActivityCache(entry);
        return database.getActivityCache(userId);
    }

    async function incrementalRefresh(meta) {
        const updatedAt = new Date().toISOString();

        if (meta.isSelf) {
            if (!meta.sourceLastCreatedAt) {
                return fullRefresh(meta.userId, true);
            }

            const rows = await database.getCurrentUserOnlineSessionsAfter(
                meta.sourceLastCreatedAt
            );
            if (rows.length === 0) {
                await database.touchActivityCacheMeta({
                    ...meta,
                    updatedAt
                });
                return database.getActivityCache(meta.userId);
            }

            const sourceLastCreatedAt = rows[rows.length - 1].created_at;
            const newSessionsRaw = buildSessionsFromGamelog(rows);
            const lastSession = await database.getLastActivityCacheSession(meta.userId);
            const merged = mergeWithLastSession(lastSession, newSessionsRaw);

            await database.appendActivityCache({
                ...meta,
                updatedAt,
                sourceLastCreatedAt,
                pendingSessionStartAt: null,
                sessions: merged.sessions,
                replaceLastSession: merged.replaceLastSession
            });
            return database.getActivityCache(meta.userId);
        }

        if (!meta.sourceLastCreatedAt) {
            return fullRefresh(meta.userId, false);
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

        const { sessions, pendingSessionStartAt } = buildSessionsAndPendingFromEvents(
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

    function refreshActivityCache(userId, isSelf, options = {}) {
        const { notifyStart = false, notifyComplete = false } = options;

        const existing = refreshJobs.get(userId);
        if (existing) {
            return existing;
        }

        if (notifyStart) {
            toast.info(t('dialog.user.activity.refresh_started'), {
                position: 'bottom-center'
            });
        }

        const job = (async () => {
            const meta = await database.getActivityCacheMeta(userId);
            const entry =
                meta && meta.isSelf === isSelf
                    ? await incrementalRefresh(meta)
                    : await fullRefresh(userId, isSelf);
            if (notifyComplete) {
                toast.success(t('dialog.user.activity.refresh_complete'), {
                    position: 'bottom-center'
                });
            }
            return entry;
        })().finally(() => {
            refreshJobs.delete(userId);
        });

        refreshJobs.set(userId, job);
        return job;
    }

    return {
        getCache,
        isExpired,
        isRefreshing,
        refreshActivityCache,
        ttlMs: ACTIVITY_CACHE_TTL_MS
    };
});
