import taskQueue from '../../service/taskQueue';

export function favoriteWorldInsert(data) {
    taskQueue({
        url: '/favorite/world',
        method: 'POST',
        data
    });
}

export function favoriteWorldRename(data) {
    taskQueue({
        url: '/favorite/world/rename',
        method: 'PUT',
        data
    });
}

export function favoriteWorldDelete(groupName) {
    taskQueue({
        url: `/favorite/world/group-name/${groupName}`,
        method: 'DELETE'
    });
}

export function favoriteWorldDeleteByGroupName(params) {
    taskQueue({
        url: `/favorite/world/remove`,
        method: 'DELETE',
        params
    });
}