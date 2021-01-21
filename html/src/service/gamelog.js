// requires binding of LogWatcher

var contextMap = new Map(); // <string, object>

class GameLogService {
    async poll(loginUser) {
        var rawGameLogs = await LogWatcher.Get();
        var gameLogs = [];
        var now = Date.now();

        for (var [fileName, dt, type, ...args] of rawGameLogs) {
            var context = contextMap.get(fileName);
            if (context === undefined) {
                context = {
                    updatedAt: null,

                    // location
                    location: null,
                };
                contextMap.set(fileName, context);
            }

            var gameLog = parseRawGameLog(dt, type, args);

            switch (gameLog.type) {
                case 'location':
                    context.location = gameLog.location;
                    break;
            }

            context.updatedAt = now;

            gameLogs.push(gameLog);
        }

        return gameLogs;
    }

    async reset() {
        await LogWatcher.Reset();
        contextMap.clear();
    }
}

function parseRawGameLog(dt, type, args) {
    var gameLog = {
        dt,
        type
    };

    switch (type) {
        case 'location':
            gameLog.location = args[0];
            break;

        case 'world':
            gameLog.worldName = args[0];
            break;

        case 'player-joined':
            gameLog.userDisplayName = args[0];
            break;

        case 'player-left':
            gameLog.userDisplayName = args[0];
            break;

        case 'notification':
            gameLog.json = args[0];
            break;
    }

    return gameLog;
}

var self = new GameLogService();
window.gameLogService = self;

export {
    self as default,
    GameLogService as LogWatcherService
};
