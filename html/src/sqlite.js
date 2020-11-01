// requires binding of SQLite

function execute(callback, sql, args = null) {
    return new Promise(function (resolve, reject) {
        SQLite.Execute(callback, resolve, reject, sql, args)
    });
}

function executeNonQuery(sql, args = null) {
    return SQLite.ExecuteNonQuery(sql, args);
}

export default {
    execute,
    executeNonQuery
};
