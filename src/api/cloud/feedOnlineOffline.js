import taskQueue from "../../service/taskQueue";

export function insertFeedOnlineOffline(data) {
    taskQueue({
        url: '/feed/online-offline',
        method: 'POST',
        data
    });
}
