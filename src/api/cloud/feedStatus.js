import taskQueue from "../../service/taskQueue";

export function insertFeedStatus(data) {
    taskQueue({
        url: '/feed/status',
        method: 'POST',
        data
    });
}
