import { openExternalLink } from '../shared/utils';
import { useModalStore } from '../stores';

// requires binding of SQLite
class SQLiteService {
    handleSQLiteError(e) {
        if (typeof e.message === 'string') {
            const modalStore = useModalStore();
            if (e.message.includes('database disk image is malformed')) {
                modalStore
                    .confirm({
                        description:
                            'Please repair or delete your database file by following these instructions.',
                        title: 'Your database is corrupted'
                    })
                    .then(({ ok }) => {
                        if (!ok) return;
                        openExternalLink(
                            'https://github.com/vrcx-team/VRCX/wiki#how-to-repair-vrcx-database'
                        );
                    })
                    .catch(() => {});
            }
            if (e.message.includes('database or disk is full')) {
                modalStore.alert({
                    description: 'Please free up some disk space.',
                    title: 'Disk containing database is full'
                });
            }
            if (
                e.message.includes('database is locked') ||
                e.message.includes('attempt to write a readonly database')
            ) {
                modalStore.alert({
                    description:
                        'Please close other applications that might be using the database file.',
                    title: 'Database is locked'
                });
            }
            if (e.message.includes('disk I/O error')) {
                modalStore.alert({
                    description: 'Please check your disk for errors.',
                    title: 'Disk I/O error'
                });
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
