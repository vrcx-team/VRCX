import { dbVars } from '../database';

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
        // }
        // await sqliteService.executeNonQuery('PRAGMA user_version = 1');
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
    }
};

export { tableAlter };
