import taskQueue from '../../service/taskQueue';

export function avatarHistoryInsert(data) {
    taskQueue({
        url: '/avatar/history',
        method: 'POST',
        data
    });
}

export function avatarHistoryAddTime(data) {
    taskQueue({
        url: '/avatar/history/add/time',
        method: 'PUT',
        data
    });
}

export function avatarHistoryClear(currentUser){
    taskQueue({
        url: `/avatar/history/clear/${currentUser}`,
        method: 'DELETE'
    });
}