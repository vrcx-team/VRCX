// requires binding of LogWatcher

class GameLogService {
    parseRawGameLog(dt, type, args) {
        var gameLog = {
            dt,
            type
        };

        switch (type) {
            case 'location':
                gameLog.location = args[0];
                gameLog.worldName = args[1];
                break;

            case 'location-destination':
                gameLog.location = args[0];
                break;

            case 'player-joined':
                gameLog.displayName = args[0];
                gameLog.userId = args[1];
                break;

            case 'player-left':
                gameLog.displayName = args[0];
                gameLog.userId = args[1];
                break;

            case 'notification':
                gameLog.json = args[0];
                break;

            case 'portal-spawn':
                break;

            case 'event':
                gameLog.event = args[0];
                break;

            case 'video-play':
                gameLog.videoUrl = args[0];
                gameLog.displayName = args[1];
                break;

            case 'resource-load-string':
            case 'resource-load-image':
                gameLog.resourceUrl = args[0];
                break;

            case 'video-sync':
                gameLog.timestamp = args[0];
                break;

            case 'vrcx':
                gameLog.data = args[0];
                break;

            case 'api-request':
                gameLog.url = args[0];
                break;

            case 'avatar-change':
                gameLog.displayName = args[0];
                gameLog.avatarName = args[1];
                break;

            case 'photon-id':
                gameLog.displayName = args[0];
                gameLog.photonId = args[1];
                break;

            case 'screenshot':
                gameLog.screenshotPath = args[0];
                break;

            case 'vrc-quit':
                break;

            case 'openvr-init':
                break;

            case 'desktop-mode':
                break;

            case 'udon-exception':
                gameLog.data = args[0];
                break;

            case 'sticker-spawn':
                gameLog.userId = args[0];
                gameLog.displayName = args[1];
                gameLog.fileId = args[2];
                break;

            default:
                break;
        }

        return gameLog;
    }

    async getAll() {
        var gameLogs = [];
        var done = false;
        while (!done) {
            var rawGameLogs = await LogWatcher.Get();
            // eslint-disable-next-line no-unused-vars
            for (var [fileName, dt, type, ...args] of rawGameLogs) {
                var gameLog = this.parseRawGameLog(dt, type, args);
                gameLogs.push(gameLog);
            }
            if (rawGameLogs.length === 0) {
                done = true;
            }
        }
        return gameLogs;
    }

    async setDateTill(dateTill) {
        await LogWatcher.SetDateTill(dateTill);
    }

    async reset() {
        await LogWatcher.Reset();
    }
}

var self = new GameLogService();
window.gameLogService = self;

export { self as default, GameLogService as LogWatcherService };
