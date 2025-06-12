import taskQueue from "../../service/taskQueue";

export function insertAvatarMemo(data) {
    taskQueue({
        url: '/memo/avatar',
        method: 'POST',
        data
    });
}

export function deleteAvatarMemoByAvatarId(id) {
    taskQueue({
        url: `/memo/avatar/${id}`,
        method: 'DELETE'
    });
}