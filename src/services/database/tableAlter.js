import sqliteService from '../sqlite.js';

const tableAlter = {
    async upgradeDatabaseVersion() {
        // var version = 0;
        // await sqliteService.execute((dbRow) => {
        //     version = dbRow[0];
        // }, 'PRAGMA user_version');
        // if (version === 0) {
        await this.updateTableForGroupNames();
        await this.addFriendLogFriendNumber();
        await this.updateTableForAvatarHistory();
        await this.ensureActivityCacheTables();
        // }
        // await sqliteService.executeNonQuery('PRAGMA user_version = 1');
    },

    async updateActivityTabDatabaseVersion() {
        await this.ensureActivityCacheTables();
        await this.ensureFeedOnlineOfflineIndexes();
    },

    async updateTableForGroupNames() {
        var tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_feed_gps' OR name LIKE '%_feed_online_offline' OR name = 'gamelog_location'`);
        for (var tableName of tables) {
            try {
                await sqliteService.executeNonQuery(
                    `ALTER TABLE ${tableName} ADD group_name TEXT DEFAULT ''`
                );
            } catch (e) {
                e = e.toString();
                if (e.indexOf('duplicate column name') === -1) {
                    console.error(e);
                }
            }
        }
        // Fix gamelog_location column typo
        try {
            await sqliteService.executeNonQuery(
                `ALTER TABLE gamelog_location DROP COLUMN groupName`
            );
        } catch (e) {
            e = e.toString();
            if (e.indexOf('no such column') === -1) {
                console.error(e);
            }
        }
    },

    async addFriendLogFriendNumber() {
        var tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_friend_log_current' OR name LIKE '%_friend_log_history'`);
        for (var tableName of tables) {
            try {
                await sqliteService.executeNonQuery(
                    `ALTER TABLE ${tableName} ADD friend_number INTEGER DEFAULT 0`
                );
            } catch (e) {
                e = e.toString();
                if (e.indexOf('duplicate column name') === -1) {
                    console.error(e);
                }
            }
        }
    },

    async updateTableForAvatarHistory() {
        var tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_avatar_history'`);
        for (var tableName of tables) {
            try {
                await sqliteService.executeNonQuery(
                    `ALTER TABLE ${tableName} ADD time INTEGER DEFAULT 0`
                );
            } catch (e) {
                e = e.toString();
                if (e.indexOf('duplicate column name') === -1) {
                    console.error(e);
                }
            }
        }
    },

    async ensureActivityCacheTables() {
        const tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_feed_online_offline'`);
        for (const tableName of tables) {
            const userPrefix = tableName.replace(/_feed_online_offline$/, '');
            await sqliteService.executeNonQuery(
                `CREATE TABLE IF NOT EXISTS ${userPrefix}_activity_cache_meta (user_id TEXT PRIMARY KEY, updated_at TEXT, is_self INTEGER DEFAULT 0, source_last_created_at TEXT, pending_session_start_at INTEGER)`
            );
            await sqliteService.executeNonQuery(
                `CREATE TABLE IF NOT EXISTS ${userPrefix}_activity_cache_sessions (user_id TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL, PRIMARY KEY (user_id, start_at, end_at))`
            );
            await sqliteService.executeNonQuery(
                `CREATE INDEX IF NOT EXISTS ${userPrefix}_activity_cache_sessions_user_start_idx ON ${userPrefix}_activity_cache_sessions (user_id, start_at)`
            );
        }
    },

    async ensureFeedOnlineOfflineIndexes() {
        const tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_feed_online_offline'`);
        for (const tableName of tables) {
            await sqliteService.executeNonQuery(
                `CREATE INDEX IF NOT EXISTS ${tableName}_user_created_idx ON ${tableName} (user_id, created_at)`
            );
        }
    }
};

export { tableAlter };
