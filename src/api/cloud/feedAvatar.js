import taskQueue from "../../service/taskQueue";

export function insertFeedAvatar(data) {
    taskQueue({
        url: '/feed/avatar',
        method: 'POST',
        data
    });
}
