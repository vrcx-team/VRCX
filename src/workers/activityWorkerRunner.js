import ActivityWorker from './activityWorker.js?worker&inline';

let worker = null;
let workerSeq = 0;
const pendingWorkerCallbacks = new Map();

function getWorker() {
    if (!worker) {
        worker = new ActivityWorker();
        worker.onmessage = (event) => {
            const { type, seq, payload } = event.data;
            const callback = pendingWorkerCallbacks.get(seq);
            if (!callback) {
                return;
            }
            pendingWorkerCallbacks.delete(seq);
            if (type === 'error') {
                callback.reject(new Error(payload.message));
                return;
            }
            callback.resolve(payload);
        };
    }
    return worker;
}

export function runActivityWorkerTask(type, payload) {
    return new Promise((resolve, reject) => {
        const seq = ++workerSeq;
        pendingWorkerCallbacks.set(seq, { resolve, reject });
        getWorker().postMessage({ type, seq, payload });
    });
}

