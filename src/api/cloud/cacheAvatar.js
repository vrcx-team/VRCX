import taskQueue from "../../service/taskQueue";

export function cacheAvatarInsert(data){
    taskQueue({
        url: '/cache/avatar',
        method: 'POST',
        data
    });
}

export function cacheAvatarDelete(id){
    taskQueue({
        url: `/cache/avatar/${id}`,
        method: 'DELETE'
    });
}