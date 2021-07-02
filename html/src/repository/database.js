import sqliteService from '../service/sqlite.js';

class Database {
    async init(userId) {
        Database.userId = userId.replaceAll('-', '').replaceAll('_', '');
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_feed_gps (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, location TEXT, world_name TEXT, previous_location TEXT, time INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_feed_status (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, status TEXT, status_description TEXT, previous_status TEXT, previous_status_description TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_feed_avatar (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, owner_id TEXT, avatar_name TEXT, current_avatar_image_url TEXT, current_avatar_thumbnail_image_url TEXT, previous_current_avatar_image_url TEXT, previous_current_avatar_thumbnail_image_url TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_feed_online_offline (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, type TEXT, location TEXT, world_name TEXT, time INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_friend_log_current (user_id TEXT PRIMARY KEY, display_name TEXT, trust_level TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userId}_friend_log_history (id INTEGER PRIMARY KEY, created_at TEXT, type TEXT, user_id TEXT, display_name TEXT, previous_display_name TEXT, trust_level TEXT, previous_trust_level TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS memos (user_id TEXT PRIMARY KEY, edited_at TEXT, memo TEXT)`
        );
    }

    async getFeedDatabase() {
        var feedDatabase = [];
        var date = new Date();
        date.setDate(date.getDate() - 3);  // 3 day limit
        var dateOffset = date.toJSON();
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                userId: dbRow[2],
                displayName: dbRow[3],
                type: 'GPS',
                location: dbRow[4],
                worldName: dbRow[5],
                previousLocation: dbRow[6],
                time: dbRow[7]
            };
            feedDatabase.unshift(row);
        }, `SELECT * FROM ${Database.userId}_feed_gps WHERE created_at >= date('${dateOffset}')`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                userId: dbRow[2],
                displayName: dbRow[3],
                type: 'Status',
                status: dbRow[4],
                statusDescription: dbRow[5],
                previousStatus: dbRow[6],
                previousStatusDescription: dbRow[7]
            };
            feedDatabase.unshift(row);
        }, `SELECT * FROM ${Database.userId}_feed_status WHERE created_at >= date('${dateOffset}')`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                userId: dbRow[2],
                displayName: dbRow[3],
                type: 'Avatar',
                ownerId: dbRow[4],
                avatarName: dbRow[5],
                currentAvatarImageUrl: dbRow[6],
                currentAvatarThumbnailImageUrl: dbRow[7],
                previousCurrentAvatarImageUrl: dbRow[8],
                previousCurrentAvatarThumbnailImageUrl: dbRow[9]
            };
            feedDatabase.unshift(row);
        }, `SELECT * FROM ${Database.userId}_feed_avatar WHERE created_at >= date('${dateOffset}')`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                userId: dbRow[2],
                displayName: dbRow[3],
                type: dbRow[4],
                location: dbRow[5],
                worldName: dbRow[6],
                time: dbRow[7]
            };
            feedDatabase.unshift(row);
        }, `SELECT * FROM ${Database.userId}_feed_online_offline WHERE created_at >= date('${dateOffset}')`);
        var compareByCreatedAt = function (a, b) {
            var A = a.created_at;
            var B = b.created_at;
            if (A < B) {
                return -1;
            }
            if (A > B) {
                return 1;
            }
            return 0;
        };
        feedDatabase.sort(compareByCreatedAt);
        return feedDatabase;
    }

    async getMemo(userId) {
        var row = {};
        await sqliteService.execute((dbRow, userId) => {
            row = {
                userId: dbRow[0],
                editedAt: dbRow[1],
                memo: dbRow[2]
            };
        }, `SELECT * FROM memos WHERE user_id = '${userId}'`);
        return row;
    }

    setMemo(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO memos (user_id, edited_at, memo) VALUES (@user_id, @edited_at, @memo)`,
            {
                '@user_id': entry.userId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    }

    deleteMemo(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM memos WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
    }

    async getFriendLogCurrent() {
        var friendLogCurrent = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                userId: dbRow[0],
                displayName: dbRow[1],
                trustLevel: dbRow[2]
            };
            friendLogCurrent.unshift(row);
        }, `SELECT * FROM ${Database.userId}_friend_log_current`);
        return friendLogCurrent;
    }

    setFriendLogCurrent(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${Database.userId}_friend_log_current (user_id, display_name, trust_level) VALUES (@user_id, @display_name, @trust_level)`,
            {
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@trust_level': entry.trustLevel
            }
        );
    }

    deleteFriendLogCurrent(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userId}_friend_log_current WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
    }

    async getFriendLogHistory() {
        var friendLogHistory = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: dbRow[2],
                userId: dbRow[3],
                displayName: dbRow[4]
            };
            if (row.type === 'DisplayName') {
                row.previousDisplayName = dbRow[5];
            } else if (row.type === 'TrustLevel') {
                row.trustLevel = dbRow[6];
                row.previousTrustLevel = dbRow[7];
            }
            friendLogHistory.unshift(row);
        }, `SELECT * FROM ${Database.userId}_friend_log_history`);
        return friendLogHistory;
    }

    addFriendLogHistory(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userId}_friend_log_history (created_at, type, user_id, display_name, previous_display_name, trust_level, previous_trust_level) VALUES (@created_at, @type, @user_id, @display_name, @previous_display_name, @trust_level, @previous_trust_level)`,
            {
                '@created_at': entry.created_at,
                '@type': entry.type,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@previous_display_name': entry.previousDisplayName,
                '@trust_level': entry.trustLevel,
                '@previous_trust_level': entry.previousTrustLevel
            }
        );
    }

    deleteFriendLogHistory(rowId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userId}_friend_log_history WHERE id = @row_id`,
            {
                '@row_id': rowId
            }
        );
    }

    addGPSToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userId}_feed_gps (created_at, user_id, display_name, location, world_name, previous_location, time) VALUES (@created_at, @user_id, @display_name, @location, @world_name, @previous_location, @time)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@previous_location': entry.previousLocation,
                '@time': entry.time
            }
        );
    }

    addStatusToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userId}_feed_status (created_at, user_id, display_name, status, status_description, previous_status, previous_status_description) VALUES (@created_at, @user_id, @display_name, @status, @status_description, @previous_status, @previous_status_description)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@status': entry.status,
                '@status_description': entry.statusDescription,
                '@previous_status': entry.previousStatus,
                '@previous_status_description': entry.previousStatusDescription
            }
        );
    }

    addAvatarToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userId}_feed_avatar (created_at, user_id, display_name, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url) VALUES (@created_at, @user_id, @display_name, @owner_id, @avatar_name, @current_avatar_image_url, @current_avatar_thumbnail_image_url, @previous_current_avatar_image_url, @previous_current_avatar_thumbnail_image_url)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@owner_id': entry.ownerId,
                '@avatar_name': entry.avatarName,
                '@current_avatar_image_url': entry.currentAvatarImageUrl,
                '@current_avatar_thumbnail_image_url': entry.currentAvatarThumbnailImageUrl,
                '@previous_current_avatar_image_url': entry.previousCurrentAvatarImageUrl,
                '@previous_current_avatar_thumbnail_image_url': entry.previousCurrentAvatarThumbnailImageUrl
            }
        );
    }

    addOnlineOfflineToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userId}_feed_online_offline (created_at, user_id, display_name, type, location, world_name, time) VALUES (@created_at, @user_id, @display_name, @type, @location, @world_name, @time)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@type': entry.type,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@time': entry.time
            }
        );
    }
}

var self = new Database();
window.database = self;

export {
    self as default,
    Database
};
