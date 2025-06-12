import taskQueue from '../../service/taskQueue';

export function favoriteAvatarInsert(data) {
    taskQueue({
        url: '/favorite/avatar',
        method: 'POST',
        data
    });
}

export function favoriteAvatarRename(data) {
    taskQueue({
        url: '/favorite/avatar/rename',
        method: 'PUT',
        data
    });
}

export function favoriteAvatarDeleteByGroupName(groupName) {
    taskQueue({
        url: `/favorite/avatar/group-name/${groupName}`,
        method: 'DELETE'
    });
}

export function favoriteAvatarDeleteByAvatarAndGroupName(params) {
    taskQueue({
        url: `/favorite/avatar/remove`,
        method: 'DELETE',
        params
    });
}