import dayjs from 'dayjs';

const STORAGE_KEY = 'vrcx:sentry:piniaActions';

function formatAction(actionName, count) {
    return count > 1 ? `${actionName}×${count}` : actionName;
}

function getStorage() {
    try {
        return localStorage;
    } catch {
        return null;
    }
}

function safeJsonParse(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function safeJsonStringify(value, fallback = '[]') {
    try {
        return JSON.stringify(value);
    } catch {
        return fallback;
    }
}

export function getPiniaActionTrail() {
    const storage = getStorage();
    if (!storage) return [];

    const data = safeJsonParse(storage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
}

export function clearPiniaActionTrail() {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEY);
}

export function appendPiniaActionTrail(entry, maxEntries = 200) {
    const storage = getStorage();
    if (!storage) return;

    const existing = getPiniaActionTrail();
    existing.push(entry);

    let removed = 0;

    if (existing.length > maxEntries) {
        removed = existing.length - maxEntries;
        existing.splice(0, removed);
    }

    try {
        storage.setItem(STORAGE_KEY, safeJsonStringify(existing));
    } catch {
        // ignore
    }

    return {
        index: existing.length - 1,
        removed
    };
}

export function createPiniaActionTrailPlugin({
    maxEntries = 200,
    dedupeWindowMs = 1000
} = {}) {
    const actionStateByName = new Map();

    return ({ store }) => {
        store.$onAction(({ name }) => {
            const storage = getStorage();
            if (!storage) return;

            const now = dayjs().valueOf();
            const prev = actionStateByName.get(name) ?? {
                lastAt: 0,
                count: 0,
                lastIndex: null
            };

            const isWithinWindow = now - prev.lastAt < dedupeWindowMs;

            if (isWithinWindow && prev.lastIndex !== null) {
                const trail = getPiniaActionTrail();
                const idx = prev.lastIndex;

                if (idx >= 0 && idx < trail.length) {
                    const existingEntry = trail[idx];
                    if (existingEntry) {
                        const nextCount = (prev.count ?? 1) + 1;
                        trail[idx] = {
                            ...existingEntry,
                            ts: now,
                            action: formatAction(name, nextCount)
                        };

                        try {
                            storage.setItem(
                                STORAGE_KEY,
                                safeJsonStringify(trail)
                            );
                        } catch {
                            // ignore
                        }

                        actionStateByName.set(name, {
                            lastAt: now,
                            count: nextCount,
                            lastIndex: idx
                        });
                        return;
                    }
                }
            }

            const appendResult = appendPiniaActionTrail(
                {
                    ts: now,
                    action: name
                },
                maxEntries
            );

            const removed = appendResult?.removed ?? 0;
            if (removed > 0) {
                for (const [actionName, actionState] of actionStateByName) {
                    if (!actionState || actionState.lastIndex === null) {
                        continue;
                    }
                    const shifted = actionState.lastIndex - removed;
                    actionStateByName.set(actionName, {
                        ...actionState,
                        lastIndex: shifted >= 0 ? shifted : null
                    });
                }
            }

            actionStateByName.set(name, {
                lastAt: now,
                count: 1,
                lastIndex: appendResult?.index ?? null
            });
        });
    };
}

function readPerformanceMemory() {
    // @ts-ignore
    const memory = window?.performance?.memory;
    if (!memory) return null;
    const { usedJSHeapSize, jsHeapSizeLimit } = memory;
    if (
        typeof usedJSHeapSize !== 'number' ||
        typeof jsHeapSizeLimit !== 'number'
    ) {
        return null;
    }
    return { usedJSHeapSize, jsHeapSizeLimit };
}

export function startRendererMemoryThresholdReport(
    Sentry,
    { intervalMs = 10_000, thresholdRatio = 0.8, cooldownMs = 5 * 60_000 } = {}
) {
    const initial = readPerformanceMemory();
    if (!initial) return null;

    if (!Sentry?.withScope) return null;

    let lastSent = 0;

    return setInterval(() => {
        const m = readPerformanceMemory();
        if (!m) return;

        const ratio = m.usedJSHeapSize / m.jsHeapSizeLimit;
        if (!Number.isFinite(ratio) || ratio < thresholdRatio) return;

        const now = dayjs().valueOf();
        if (now - lastSent < cooldownMs) return;
        lastSent = now;

        const trail = getPiniaActionTrail();
        const trailText = trail
            .map((entry) => {
                const t =
                    typeof entry?.ts === 'number'
                        ? dayjs(entry.ts).format('HH:mm:ss')
                        : '';
                const a = entry?.action ?? '';
                if (!t && !a) return '';
                if (!t) return String(a);
                if (!a) return t;
                return `${t} ${a}`;
            })
            .filter(Boolean)
            .join(';');
        Sentry.withScope((scope) => {
            scope.setLevel('warning');
            scope.setTag('reason', 'high-js-heap');
            scope.setContext('memory', {
                usedMB: m.usedJSHeapSize / 1024 / 1024,
                limitMB: m.jsHeapSizeLimit / 1024 / 1024,
                ratio
            });
            scope.setContext('pinia_actions', {
                trailText,
                count: trail.length
            });
            Sentry.captureMessage(
                'Memory usage critical: nearing JS heap limit'
            );
        });
    }, intervalMs);
}
