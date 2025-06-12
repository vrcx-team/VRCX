import taskQueue from '../../service/taskQueue';

export function friendLogCurrentInsert(data) {
    taskQueue({
        url: '/friend-log/current',
        method: 'POST',
        data
    });
}

export function friendLogCurrentInsertBatch(data) {
    taskQueue({
        url: '/friend-log/current/batch',
        method: 'POST',
        data
    });
}

export function friendLogCurrentDeleteByUserId(id) {
    taskQueue({
        url: `/friend-log/current/${id}`,
        method: 'DELETE'
    });
}