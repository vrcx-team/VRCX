import taskQueue from '../../service/taskQueue';

export function insert(data) {
    taskQueue({
        url: '/game-log/join-leave',
        method: 'POST',
        data
    });
}
export function batchInsert(data) {
    taskQueue({
        url: '/game-log/join-leave/batch',
        method: 'POST',
        data
    });
}

export function gameLogInstanceDelete(params) {
    taskQueue({
        url: '',
        method: 'DELETE',
        params
    });
}