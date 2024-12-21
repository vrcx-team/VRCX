// requires binding of SQLite

class SQLiteService {
    async execute(callback, sql, args = null) {
        var item = await SQLite.Execute(sql, args);
        if (item.Item1 !== null) {
            throw item.Item1;
        }
        item.Item2?.forEach((item) => {
            callback(item);
        });
    }

    executeNonQuery(sql, args = null) {
        return SQLite.ExecuteNonQuery(sql, args);
    }
}

var self = new SQLiteService();
window.sqliteService = self;

export { self as default, SQLiteService };
