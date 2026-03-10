import dayjs from 'dayjs';

const STORAGE_KEY = 'vrcx:sentry:piniaActions';
const DEFAULT_MAX_ENTRIES = 200;

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

export function appendPiniaActionTrail(entry, options) {
    const storage = getStorage();
    if (!storage) return;

    const maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;

    const existing = getPiniaActionTrail();
    existing.push(entry);

    if (existing.length > maxEntries) {
        existing.splice(0, existing.length - maxEntries);
    }

    try {
        storage.setItem(STORAGE_KEY, safeJsonStringify(existing));
    } catch {
        // ignore
    }
}

export function createPiniaActionTrailPlugin(options) {
    const maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
    return ({ store }) => {
        store.$onAction(({ name }) => {
            appendPiniaActionTrail(
                {
                    t: dayjs().format('HH:mm:ss'),
                    a: name
                },
                { maxEntries }
            );
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

        const now = Date.now();
        if (now - lastSent < cooldownMs) return;
        lastSent = now;

        const trail = getPiniaActionTrail();
        const trailText = JSON.stringify(trail);
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
