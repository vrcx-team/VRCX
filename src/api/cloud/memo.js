import taskQueue from '../../service/taskQueue';

export function insert(data) {
    taskQueue({
        url: '/memo',
        method: 'POST',
        data
    });
}
