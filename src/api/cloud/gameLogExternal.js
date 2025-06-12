import taskQueue from '../../service/taskQueue';

export function gameLogExternalInsert(data) {
    taskQueue({
        url: '/game-log/external',
        method: 'POST',
        data
    });
}

export function gameLogExternalDelete(params) {
    taskQueue({
        url: '/game-log/external',
        method: 'DELETE',
        params
    });
}
