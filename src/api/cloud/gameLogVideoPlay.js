import taskQueue from "../../service/taskQueue";

export function gameLogVideoPlayInsert(data){
    taskQueue({
        url: '/game-log/video-play',
        method: 'POST',
        data
    });
}

export function gameLogVideoPlayDelete(params){
    taskQueue({
        url: '/game-log/video-play',
        method: 'DELETE',
        params
    });
}