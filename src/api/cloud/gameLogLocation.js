import taskQueue from '../../service/taskQueue';

export function insertGameLogLocation(data) {
    taskQueue({
        url: '/game-log/location',
        method: 'POST',
        data
    });
}

export function updateGameLogLocation(data) {
    taskQueue({
        url: '/game-log/location',
        method: 'PUT',
        data
    });
}
