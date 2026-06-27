import sqliteService from '../sqlite.js';

const tableAlter = {
    async upgradeDatabaseVersion() {
        await this.initTables();
        await this.cleanLegendFromFriendLog(); // fix friendLog spammed with crap
        await this.fixGameLogTraveling(); // fix bug with gameLog location being set as traveling
        await this.fixNegativeGPS(); // fix GPS being a negative value due to VRCX bug with traveling
        await this.fixBrokenLeaveEntries(); // fix user instance timer being higher than current user location timer
        await this.fixBrokenGroupInvites(); // fix notification v2 in wrong table
        await this.fixBrokenNotifications(); // fix notifications being null
        await this.fixBrokenGroupChange(); // fix spam group left & name change
        await this.fixCancelFriendRequestTypo(); // fix CancelFriendRequst typo
        await this.fixBrokenGameLogDisplayNames(); // fix gameLog display names "DisplayName (userId)"
        await this.updateTableForGroupNames();
        await this.addFriendLogFriendNumber();
        await this.updateTableForAvatarHistory();
        await this.addPerformanceIndexes(); // 16
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

    async addPerformanceIndexes() {
        // per-user friend_log_history: covers getFriendLogHistoryForUserId
        var tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_friend_log_history'`);
        for (var tableName of tables) {
            try {
                await sqliteService.executeNonQuery(
                    `CREATE INDEX IF NOT EXISTS ${tableName}_user_id_idx ON ${tableName} (user_id)`
                );
            } catch (e) {
                console.error(e);
            }
        }
    }
};

export { tableAlter };
