import taskQueue from '../../service/taskQueue';

export function gameLogPortalSpawnInsert(data) {
    taskQueue({
        url: '/game-log/portal-spawn',
        method: 'POST',
        data
    });
}
