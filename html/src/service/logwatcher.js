// requires binding of LogWatcher

class LogWatcherService {
    get() {
        return LogWatcher.Get();
    }

    reset() {
        return LogWatcher.Reset();
    }
}

var self = new LogWatcherService();
window.logWatcherService = self;

export {
    self as default,
    LogWatcherService
};
