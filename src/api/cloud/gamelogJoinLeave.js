export default {
    insert: function (data) {
        window.taskQueue.addTask({
            url: '/game-log/join-leave',
            method: 'POST',
            data
        });
    },
    batchInsert: function (data) {
        window.taskQueue.addTask({
            url: '/game-log/join-leave/batch',
            method: 'POST',
            data
        });
    }
};
