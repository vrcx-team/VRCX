import taskQueue from "../../service/taskQueue";

export function insertFeedBio(data) {
    taskQueue({
        url: '/feed/bio',
        method: 'POST',
        data
    });
}
