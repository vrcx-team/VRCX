import taskQueue from '../../service/taskQueue';

export function gameLogEventInsert(data) {
    taskQueue({
        url: '/game-log/event',
        method: 'POST',
        data
    });
}

export function gameLogEventDelete(params) {
    taskQueue({
        url: '/game-log/event',
        method: 'DELETE',
        params
    });
}