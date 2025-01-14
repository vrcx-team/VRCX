// requires binding of SQLite

class SQLiteService {
    async execute(callback, sql, args = null) {
        if (LINUX) {
            if (args) {
                args = new Map(Object.entries(args));
            }
            var json = await SQLite.ExecuteJson(sql, args);
            var items = JSON.parse(json);
            if (json.status === 'error') {
                throw new Error(json.message);
            }
            items.data.forEach((item) => {
                callback(item);
            });
            return;
        }
        var item = await SQLite.Execute(sql, args);
        if (item.Item1 !== null) {
            throw item.Item1;
        }
        item.Item2?.forEach((item) => {
            callback(item);
        });
    }

    executeNonQuery(sql, args = null) {
        if (LINUX && args) {
            args = new Map(Object.entries(args));
        }
        return SQLite.ExecuteNonQuery(sql, args);
    }
}

var self = new SQLiteService();
window.sqliteService = self;

export { self as default, SQLiteService };
