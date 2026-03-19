import { database } from '../services/database';
import {
    buildSessionsFromGamelog,
    ONLINE_SESSION_MERGE_GAP_MS
} from '../shared/utils/overlapCalculator';

/** @typedef {{ start: number, end: number }} Session */

/**
 * Module-level singleton cache for the current user's online sessions.
 * Lazy-loaded on first access, then incrementally updated.
 */

/** @type {Session[] | null} */
let cachedSessions = null;

/** @type {string[] | null} */
let cachedTimestamps = null;

/** @type {string | null} */
let lastRowCreatedAt = null;

/** @type {'idle' | 'loading' | 'ready'} */
let status = 'idle';

/** @type {Promise<void> | null} */
let loadPromise = null;

/** @type {Array<() => void>} */
const onReadyCallbacks = [];

/** @type {ReturnType<typeof setInterval> | null} */
let refreshTimer = null;

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Executes all onReady callbacks and clears the list.
 */
function flushCallbacks() {
    const cbs = onReadyCallbacks.splice(0);
    for (const cb of cbs) {
        try {
            cb();
        } catch (e) {
            console.error('useCurrentUserSessions onReady callback error:', e);
        }
    }
}

/**
 * Starts the periodic incremental refresh timer.
 * Only starts if not already running.
 */
function startRefreshTimer() {
    if (refreshTimer) return;
    refreshTimer = setInterval(async () => {
        if (status !== 'ready') return;
        try {
            await incrementalUpdate();
        } catch (e) {
            console.error('useCurrentUserSessions periodic refresh error:', e);
        }
    }, REFRESH_INTERVAL_MS);
}

/**
 * Full load: queries all gamelog_location rows and builds sessions.
 * @returns {Promise<void>}
 */
async function fullLoad() {
    status = 'loading';
    try {
        const rows = await database.getCurrentUserOnlineSessions();
        cachedTimestamps = rows.map((r) => r.created_at);
        cachedSessions = buildSessionsFromGamelog(rows);
        if (rows.length > 0) {
            lastRowCreatedAt = rows[rows.length - 1].created_at;
        }
        status = 'ready';
        startRefreshTimer();
        flushCallbacks();
    } catch (e) {
        status = 'idle';
        throw e;
    }
}

/**
 * Incremental update: only fetches rows newer than lastRowCreatedAt.
 * Merges new sessions into the cached sessions array.
 * @returns {Promise<void>}
 */
async function incrementalUpdate() {
    if (!lastRowCreatedAt || status !== 'ready') return;

    const newRows =
        await database.getCurrentUserOnlineSessionsAfter(lastRowCreatedAt);
    if (newRows.length === 0) return;

    lastRowCreatedAt = newRows[newRows.length - 1].created_at;
    cachedTimestamps.push(...newRows.map((r) => r.created_at));

    const newSessions = buildSessionsFromGamelog(newRows);
    if (newSessions.length === 0) return;

    // Merge: if last cached session and first new session overlap or are close, merge them
    if (cachedSessions.length > 0 && newSessions.length > 0) {
        const last = cachedSessions[cachedSessions.length - 1];
        const first = newSessions[0];
        if (first.start <= last.end + ONLINE_SESSION_MERGE_GAP_MS) {
            last.end = Math.max(last.end, first.end);
            newSessions.shift();
        }
    }
    cachedSessions.push(...newSessions);
}

/**
 * Returns whether the cache is ready.
 * @returns {boolean}
 */
function isReady() {
    return status === 'ready';
}

/**
 * Returns whether the cache is currently loading.
 * @returns {boolean}
 */
function isLoading() {
    return status === 'loading';
}

/**
 * Gets the cached sessions. If not loaded yet, triggers a full load.
 * If already loaded, does an incremental update first.
 * @returns {Promise<Session[]>}
 */
async function getSessions() {
    if (status === 'ready') {
        await incrementalUpdate();
        return cachedSessions;
    }

    if (status === 'loading') {
        // Wait for existing load to complete
        await loadPromise;
        return cachedSessions;
    }

    // idle: trigger full load
    loadPromise = fullLoad();
    try {
        await loadPromise;
        return cachedSessions;
    } finally {
        loadPromise = null;
    }
}

/**
 * Gets the cached timestamps (created_at strings from gamelog_location).
 * Must be called after getSessions() or after onReady fires.
 * @returns {string[]}
 */
function getTimestamps() {
    return cachedTimestamps || [];
}

/**
 * Registers a callback to be called when the cache becomes ready.
 * If already ready, callback is invoked immediately.
 * @param {() => void} callback
 */
function onReady(callback) {
    if (status === 'ready') {
        callback();
        return;
    }
    onReadyCallbacks.push(callback);
}

/**
 * Triggers a full load if idle, or returns the existing promise if loading.
 * Does NOT block the caller — designed for fire-and-forget usage.
 * Returns the promise so callers can optionally await it.
 * @returns {Promise<void>}
 */
function triggerLoad() {
    if (status === 'ready') return Promise.resolve();
    if (status === 'loading') return loadPromise;

    loadPromise = fullLoad().finally(() => {
        loadPromise = null;
    });
    return loadPromise;
}

/**
 * Invalidates the cache and stops the refresh timer.
 */
function invalidate() {
    cachedSessions = null;
    cachedTimestamps = null;
    lastRowCreatedAt = null;
    status = 'idle';
    loadPromise = null;
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

export function useCurrentUserSessions() {
    return {
        isReady,
        isLoading,
        getSessions,
        getTimestamps,
        onReady,
        triggerLoad,
        invalidate
    };
}
