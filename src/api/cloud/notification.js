import taskQueue from '../../service/taskQueue';

export function notificationsInsert(data) {
    taskQueue({
        url: '/notifications',
        method: 'POST',
        data
    });
}

export function notificationsDel(id){
    taskQueue({
        url: `/notifications/${id}`,
        method: 'DELETE',
        data
    });
}

export function notificationExpiredUpdate(data){
    taskQueue({
        url: '/notifications',
        method: 'PUT',
        data
    });
}