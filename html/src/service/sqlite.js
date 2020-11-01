// requires binding of SQLite

class SQLiteService {
    execute(callback, sql, args = null) {
        return new Promise((resolve, reject) => {
            SQLite.Execute(callback, resolve, reject, sql, args);
        });
    }

    executeNonQuery(sql, args = null) {
        return SQLite.ExecuteNonQuery(sql, args);
    }
}

var self = new SQLiteService();

export {
    self as default,
    SQLiteService
};
