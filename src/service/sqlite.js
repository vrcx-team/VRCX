import { ElMessageBox } from 'element-plus';

import { openExternalLink } from '../shared/utils';

// requires binding of SQLite
class SQLiteService {
    handleSQLiteError(e) {
        if (typeof e.message === 'string') {
            if (e.message.includes('database disk image is malformed')) {
                ElMessageBox.confirm(
                    'Please repair or delete your database file by following these instructions.',
                    'Your database is corrupted',
                    {
                        confirmButtonText: 'Confirm',
                        type: 'warning'
                    }
                )
                    .then(async (action) => {
                        if (action !== 'confirm') return;
                        openExternalLink(
                            'https://github.com/vrcx-team/VRCX/wiki#how-to-repair-vrcx-database'
                        );
                    })
                    .catch(() => {});
            }
            if (e.message.includes('database or disk is full')) {
                ElMessageBox.alert(
                    'Please free up some disk space.',
                    'Disk containing database is full',
                    {
                        confirmButtonText: 'OK',
                        type: 'warning'
                    }
                ).catch(() => {});
            }
            if (e.message.includes('database is locked')) {
                ElMessageBox.alert(
                    'Please close other applications that might be using the database file.',
                    'Database is locked',
                    {
                        confirmButtonText: 'OK',
                        type: 'warning'
                    }
                ).catch(() => {});
            }
        }
        throw e;
    }

    async execute(callback, sql, args = null) {
        try {
            if (LINUX) {
                if (args) {
                    args = new Map(Object.entries(args));
                }
                var json = await SQLite.ExecuteJson(sql, args);
                var items = JSON.parse(json);
                items.forEach((item) => {
                    callback(item);
                });
                return;
            }
            var data = await SQLite.Execute(sql, args);
            data.forEach((row) => {
                callback(row);
            });
        } catch (e) {
            this.handleSQLiteError(e);
        }
    }

    async executeNonQuery(sql, args = null) {
        try {
            if (LINUX && args) {
                args = new Map(Object.entries(args));
            }
            return await SQLite.ExecuteNonQuery(sql, args);
        } catch (e) {
            this.handleSQLiteError(e);
        }
    }
}

var self = new SQLiteService();
window.sqliteService = self;

export { self as default, SQLiteService };
