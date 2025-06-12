import taskQueue from '../../service/taskQueue';

export function moderationInsert(data) {
    taskQueue({
        url: '/moderation',
        method: 'POST',
        data
    });
}

export function moderationDel(data) {
    taskQueue({
        url: '/moderation',
        method: 'DELETE',
        data
    });
}