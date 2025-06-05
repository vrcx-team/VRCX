export default {
    insert: function (data) {
        window.taskQueue.addTask({
            url: '/memo',
            method: 'POST',
            data
        });
    }
};
