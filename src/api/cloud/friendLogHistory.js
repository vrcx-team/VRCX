import taskQueue from '../../service/taskQueue';

export function friendLogHistoryInsert(data) {
    taskQueue({
        url: '/friend-log/history',
        method: 'POST',
        data
    });
}

export function friendLogHistoryInsertBatch(data) {
    taskQueue({
        url: '/friend-log/history/batch',
        method: 'POST',
        data
    });
}

export function friendLogHistoryDeleteById(id) {
    taskQueue({
        url: `/friend-log/history/${id}`,
        method: 'DELETE'
    });
}