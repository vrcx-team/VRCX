import { reactive } from 'vue';

export const sessionStart = Date.now();

const MAX_LOG_ENTRIES = 2000;
let _entryId = 0;

export const activityCounters = reactive({
    totalGetCount: 0
});

export const logEntries = reactive([]);

export function incrementGetCount() {
    activityCounters.totalGetCount++;
}

export function addApiLogEntry(method, endpoint, status) {
    if (logEntries.length >= MAX_LOG_ENTRIES) {
        logEntries.splice(0, 200);
    }
    logEntries.push({ id: _entryId++, ts: Date.now(), type: 'api', method, endpoint, status });
}

export function addImageCacheLogEntry(url, status) {
    incrementGetCount();
    if (logEntries.length >= MAX_LOG_ENTRIES) {
        logEntries.splice(0, 200);
    }
    logEntries.push({ id: _entryId++, ts: Date.now(), type: 'api', method: 'GET', endpoint: url, status });
}

export function clearLogEntries() {
    logEntries.splice(0, logEntries.length);
}

if (typeof PerformanceObserver !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            const url = entry.name;
            if (url.includes('/api/1/image/') || url.includes('/api/1/file/')) {
                addImageCacheLogEntry(url, 200);
            }
        }
    });
    observer.observe({ type: 'resource', buffered: true });
}
