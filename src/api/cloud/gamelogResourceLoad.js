import taskQueue from '../../service/taskQueue';

export function gamelogResourceLoadInsert(data) {
    taskQueue({
        url: '/game-log/resource-load',
        method: 'POST',
        data
    });
}

export function gamelogResourceLoadDelete(params) {
    taskQueue({
        url: '/game-log/resource-load',
        method: 'DELETE',
        params
    });
}
