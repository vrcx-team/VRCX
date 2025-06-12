import taskQueue from "../../service/taskQueue";

export function insertWorldMemo(data) {
    taskQueue({
        url: '/memo/world',
        method: 'POST',
        data
    });
}

export function deleteWorldMemoByWorldId(id) {
    taskQueue({
        url: `/memo/world/${id}`,
        method: 'DELETE'
    });
}