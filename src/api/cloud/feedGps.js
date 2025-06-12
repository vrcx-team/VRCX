import taskQueue from "../../service/taskQueue";

export function insertFeedGps(data) {
    taskQueue({
        url: '/feed/gps',
        method: 'POST',
        data
    });
}