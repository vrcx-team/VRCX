import taskQueue from '../../service/taskQueue';

export function cacheWorldInsert(data) {
    taskQueue({
        url: '/cache/world',
        method: 'POST',
        data
    });
}

export function cacheWorldDeleteById(id) {
    taskQueue({
        url: `/cache/world/${id}`,
        method: 'DELETE'
    });
}