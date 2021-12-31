import sqliteService from '../service/sqlite.js';

class Database {
    setmaxTableSize(limit) {
        Database.maxTableSize = limit;
    }

    async initUserTables(userId) {
        Database.userId = userId;
        Database.userPrefix = userId.replaceAll('-', '').replaceAll('_', '');
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_gps (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, location TEXT, world_name TEXT, previous_location TEXT, time INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_status (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, status TEXT, status_description TEXT, previous_status TEXT, previous_status_description TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_avatar (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, owner_id TEXT, avatar_name TEXT, current_avatar_image_url TEXT, current_avatar_thumbnail_image_url TEXT, previous_current_avatar_image_url TEXT, previous_current_avatar_thumbnail_image_url TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_online_offline (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, type TEXT, location TEXT, world_name TEXT, time INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_friend_log_current (user_id TEXT PRIMARY KEY, display_name TEXT, trust_level TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_friend_log_history (id INTEGER PRIMARY KEY, created_at TEXT, type TEXT, user_id TEXT, display_name TEXT, previous_display_name TEXT, trust_level TEXT, previous_trust_level TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_notifications (id TEXT PRIMARY KEY, created_at TEXT, type TEXT, sender_user_id TEXT, sender_username TEXT, receiver_user_id TEXT, message TEXT, world_id TEXT, world_name TEXT, image_url TEXT, invite_message TEXT, request_message TEXT, response_message TEXT, expired INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_moderation (user_id TEXT PRIMARY KEY, updated_at TEXT, display_name TEXT, block INTEGER, mute INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS memos (user_id TEXT PRIMARY KEY, edited_at TEXT, memo TEXT)`
        );
    }

    async initTables() {
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_location (id INTEGER PRIMARY KEY, created_at TEXT, location TEXT, world_id TEXT, world_name TEXT, time INTEGER, UNIQUE(created_at, location))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_join_leave (id INTEGER PRIMARY KEY, created_at TEXT, type TEXT, display_name TEXT, location TEXT, user_id TEXT, time INTEGER, UNIQUE(created_at, type, display_name))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_portal_spawn (id INTEGER PRIMARY KEY, created_at TEXT, display_name TEXT, location TEXT, user_id TEXT, instance_id TEXT, world_name TEXT, UNIQUE(created_at, display_name))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_video_play (id INTEGER PRIMARY KEY, created_at TEXT, video_url TEXT, video_name TEXT, video_id TEXT, location TEXT, display_name TEXT, user_id TEXT, UNIQUE(created_at, video_url))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_event (id INTEGER PRIMARY KEY, created_at TEXT, data TEXT, UNIQUE(created_at, data))`
        );
    }

    async getFeedDatabase() {
        var feedDatabase = [];
        var date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
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
        }, `SELECT * FROM ${Database.userPrefix}_feed_gps WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${Database.userPrefix}_feed_status WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${Database.userPrefix}_feed_avatar WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${Database.userPrefix}_feed_online_offline WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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

    begin() {
        sqliteService.executeNonQuery('BEGIN');
    }

    commit() {
        sqliteService.executeNonQuery('COMMIT');
    }

    async getMemo(input) {
        var userId = input.replaceAll("'", '');
        var row = {};
        await sqliteService.execute((dbRow) => {
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
        }, `SELECT * FROM ${Database.userPrefix}_friend_log_current`);
        return friendLogCurrent;
    }

    setFriendLogCurrent(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${Database.userPrefix}_friend_log_current (user_id, display_name, trust_level) VALUES (@user_id, @display_name, @trust_level)`,
            {
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@trust_level': entry.trustLevel
            }
        );
    }

    setFriendLogCurrentArray(inputData) {
        if (inputData.length === 0) {
            return;
        }
        var sqlValues = '';
        var items = ['userId', 'displayName', 'trustLevel'];
        for (var line of inputData) {
            var field = {};
            for (var item of items) {
                if (typeof line[item] === 'string') {
                    field[item] = line[item].replace(/'/g, "''");
                } else {
                    field[item] = '';
                }
            }
            sqlValues += `('${field.userId}', '${field.displayName}', '${field.trustLevel}'), `;
        }
        sqlValues = sqlValues.slice(0, -2);
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${Database.userPrefix}_friend_log_current (user_id, display_name, trust_level) VALUES ${sqlValues}`
        );
    }

    deleteFriendLogCurrent(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_friend_log_current WHERE user_id = @user_id`,
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
        }, `SELECT * FROM ${Database.userPrefix}_friend_log_history`);
        return friendLogHistory;
    }

    addFriendLogHistory(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_friend_log_history (created_at, type, user_id, display_name, previous_display_name, trust_level, previous_trust_level) VALUES (@created_at, @type, @user_id, @display_name, @previous_display_name, @trust_level, @previous_trust_level)`,
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

    addFriendLogHistoryArray(inputData) {
        if (inputData.length === 0) {
            return;
        }
        var sqlValues = '';
        var items = [
            'created_at',
            'type',
            'userId',
            'displayName',
            'previousDisplayName',
            'trustLevel',
            'previousTrustLevel'
        ];
        for (var i = 0; i < inputData.length; ++i) {
            var line = inputData[i];
            sqlValues += '(';
            for (var k = 0; k < items.length; ++k) {
                var item = items[k];
                var field = '';
                if (typeof line[item] === 'string') {
                    field = `'${line[item].replace(/'/g, "''")}'`;
                } else {
                    field = null;
                }
                sqlValues += field;
                if (k < items.length - 1) {
                    sqlValues += ', ';
                }
            }
            sqlValues += ')';
            if (i < inputData.length - 1) {
                sqlValues += ', ';
            }
            // sqlValues `('${line.created_at}', '${line.type}', '${line.userId}', '${line.displayName}', '${line.previousDisplayName}', '${line.trustLevel}', '${line.previousTrustLevel}'), `
        }
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_friend_log_history (created_at, type, user_id, display_name, previous_display_name, trust_level, previous_trust_level) VALUES ${sqlValues}`
        );
    }

    deleteFriendLogHistory(rowId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_friend_log_history WHERE id = @row_id`,
            {
                '@row_id': rowId
            }
        );
    }

    addGPSToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_gps (created_at, user_id, display_name, location, world_name, previous_location, time) VALUES (@created_at, @user_id, @display_name, @location, @world_name, @previous_location, @time)`,
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
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_status (created_at, user_id, display_name, status, status_description, previous_status, previous_status_description) VALUES (@created_at, @user_id, @display_name, @status, @status_description, @previous_status, @previous_status_description)`,
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
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_avatar (created_at, user_id, display_name, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url) VALUES (@created_at, @user_id, @display_name, @owner_id, @avatar_name, @current_avatar_image_url, @current_avatar_thumbnail_image_url, @previous_current_avatar_image_url, @previous_current_avatar_thumbnail_image_url)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@owner_id': entry.ownerId,
                '@avatar_name': entry.avatarName,
                '@current_avatar_image_url': entry.currentAvatarImageUrl,
                '@current_avatar_thumbnail_image_url':
                    entry.currentAvatarThumbnailImageUrl,
                '@previous_current_avatar_image_url':
                    entry.previousCurrentAvatarImageUrl,
                '@previous_current_avatar_thumbnail_image_url':
                    entry.previousCurrentAvatarThumbnailImageUrl
            }
        );
    }

    addOnlineOfflineToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_online_offline (created_at, user_id, display_name, type, location, world_name, time) VALUES (@created_at, @user_id, @display_name, @type, @location, @world_name, @time)`,
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

    async getGamelogDatabase() {
        var gamelogDatabase = [];
        var date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
        var dateOffset = date.toJSON();
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'Location',
                location: dbRow[2],
                worldId: dbRow[3],
                worldName: dbRow[4],
                time: dbRow[5]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_location WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: dbRow[2],
                displayName: dbRow[3],
                location: dbRow[4],
                userId: dbRow[5],
                time: dbRow[6]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_join_leave WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'PortalSpawn',
                displayName: dbRow[2],
                location: dbRow[3],
                userId: dbRow[4],
                instanceId: dbRow[5],
                worldName: dbRow[6]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_portal_spawn WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'VideoPlay',
                videoUrl: dbRow[2],
                videoName: dbRow[3],
                videoId: dbRow[4],
                location: dbRow[5],
                displayName: dbRow[6],
                userId: dbRow[7]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_video_play WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'Event',
                data: dbRow[2]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_event WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        gamelogDatabase.sort(compareByCreatedAt);
        return gamelogDatabase;
    }

    addGamelogLocationToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_location (created_at, location, world_id, world_name, time) VALUES (@created_at, @location, @world_id, @world_name, @time)`,
            {
                '@created_at': entry.created_at,
                '@location': entry.location,
                '@world_id': entry.worldId,
                '@world_name': entry.worldName,
                '@time': entry.time
            }
        );
    }

    updateGamelogLocationTimeToDatabase(entry) {
        sqliteService.executeNonQuery(
            `UPDATE gamelog_location SET time = @time WHERE created_at = @created_at`,
            {
                '@created_at': entry.created_at,
                '@time': entry.time
            }
        );
    }

    addGamelogJoinLeaveToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_join_leave (created_at, type, display_name, location, user_id, time) VALUES (@created_at, @type, @display_name, @location, @user_id, @time)`,
            {
                '@created_at': entry.created_at,
                '@type': entry.type,
                '@display_name': entry.displayName,
                '@location': entry.location,
                '@user_id': entry.userId,
                '@time': entry.time
            }
        );
    }

    addGamelogPortalSpawnToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_portal_spawn (created_at, display_name, location, user_id, instance_id, world_name) VALUES (@created_at, @display_name, @location, @user_id, @instance_id, @world_name)`,
            {
                '@created_at': entry.created_at,
                '@display_name': entry.displayName,
                '@location': entry.location,
                '@user_id': entry.userId,
                '@instance_id': entry.instanceId,
                '@world_name': entry.worldName
            }
        );
    }

    addGamelogVideoPlayToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_video_play (created_at, video_url, video_name, video_id, location, display_name, user_id) VALUES (@created_at, @video_url, @video_name, @video_id, @location, @display_name, @user_id)`,
            {
                '@created_at': entry.created_at,
                '@video_url': entry.videoUrl,
                '@video_name': entry.videoName,
                '@video_id': entry.videoId,
                '@location': entry.location,
                '@display_name': entry.displayName,
                '@user_id': entry.userId
            }
        );
    }

    addGamelogEventToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_event (created_at, data) VALUES (@created_at, @data)`,
            {
                '@created_at': entry.created_at,
                '@data': entry.data
            }
        );
    }

    async getNotifications() {
        var notifications = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                id: dbRow[0],
                created_at: dbRow[1],
                type: dbRow[2],
                senderUserId: dbRow[3],
                senderUsername: dbRow[4],
                receiverUserId: dbRow[5],
                message: dbRow[6],
                details: {
                    worldId: dbRow[7],
                    worldName: dbRow[8],
                    imageUrl: dbRow[9],
                    inviteMessage: dbRow[10],
                    requestMessage: dbRow[11],
                    responseMessage: dbRow[12]
                }
            };
            row.$isExpired = false;
            if (dbRow[13] === 1) {
                row.$isExpired = true;
            }
            notifications.unshift(row);
        }, `SELECT * FROM ${Database.userPrefix}_notifications ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        return notifications;
    }

    addNotificationToDatabase(row) {
        var entry = {
            id: '',
            created_at: '',
            type: '',
            senderUserId: '',
            senderUsername: '',
            receiverUserId: '',
            message: '',
            ...row,
            details: {
                worldId: '',
                worldName: '',
                imageUrl: '',
                inviteMessage: '',
                requestMessage: '',
                responseMessage: '',
                ...row.details
            }
        };
        var expired = 0;
        if (row.$isExpired) {
            expired = 1;
        }
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_notifications (id, created_at, type, sender_user_id, sender_username, receiver_user_id, message, world_id, world_name, image_url, invite_message, request_message, response_message, expired) VALUES (@id, @created_at, @type, @sender_user_id, @sender_username, @receiver_user_id, @message, @world_id, @world_name, @image_url, @invite_message, @request_message, @response_message, @expired)`,
            {
                '@id': entry.id,
                '@created_at': entry.created_at,
                '@type': entry.type,
                '@sender_user_id': entry.senderUserId,
                '@sender_username': entry.senderUsername,
                '@receiver_user_id': entry.receiverUserId,
                '@message': entry.message,
                '@world_id': entry.details.worldId,
                '@world_name': entry.details.worldName,
                '@image_url': entry.details.imageUrl,
                '@invite_message': entry.details.inviteMessage,
                '@request_message': entry.details.requestMessage,
                '@response_message': entry.details.responseMessage,
                '@expired': expired
            }
        );
    }

    deleteNotification(rowId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_notifications WHERE id = @row_id`,
            {
                '@row_id': rowId
            }
        );
    }

    updateNotificationExpired(entry) {
        var expired = 0;
        if (entry.$isExpired) {
            expired = 1;
        }
        sqliteService.executeNonQuery(
            `UPDATE ${Database.userPrefix}_notifications SET expired = @expired WHERE id = @id`,
            {
                '@id': entry.id,
                '@expired': expired
            }
        );
    }

    async getGpsTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_feed_gps`);
        return size;
    }

    async getStatusTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_feed_status`);
        return size;
    }

    async getAvatarTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_feed_avatar`);
        return size;
    }

    async getOnlineOfflineTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_feed_online_offline`);
        return size;
    }

    async getFriendLogHistoryTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_friend_log_history`);
        return size;
    }

    async getNotificationTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_notifications`);
        return size;
    }

    async getLocationTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_location`);
        return size;
    }

    async getJoinLeaveTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_join_leave`);
        return size;
    }

    async getPortalSpawnTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_portal_spawn`);
        return size;
    }

    async getVideoPlayTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_video_play`);
        return size;
    }

    async getEventTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_event`);
        return size;
    }

    async getLastVisit(input) {
        var worldId = input.replaceAll("'", '');
        var ref = {
            created_at: '',
            worldId: ''
        };
        await sqliteService.execute((row) => {
            ref = {
                created_at: row[0],
                worldId: row[1]
            };
        }, `SELECT created_at, world_id FROM gamelog_location WHERE world_id = '${worldId}' ORDER BY id DESC LIMIT 1`);
        return ref;
    }

    async getVisitCount(input) {
        var worldId = input.replaceAll("'", '');
        var ref = {
            visitCount: '',
            worldId: ''
        };
        await sqliteService.execute((row) => {
            ref = {
                visitCount: row[0],
                worldId: input
            };
        }, `SELECT COUNT(*) FROM gamelog_location WHERE world_id = '${worldId}'`);
        return ref;
    }

    async getTimeSpentInWorld(input) {
        var worldId = input.replaceAll("'", '');
        var ref = {
            timeSpent: 0,
            worldId: input
        };
        await sqliteService.execute((row) => {
            if (typeof row[0] === 'number') {
                ref.timeSpent += row[0];
            }
        }, `SELECT time FROM gamelog_location WHERE world_id = '${worldId}'`);
        return ref;
    }

    async getLastSeen(input) {
        var userId = input.id.replaceAll("'", '');
        var displayName = input.displayName.replaceAll("'", "''");
        var ref = {
            created_at: '',
            userId: ''
        };
        await sqliteService.execute((row) => {
            if (row[1]) {
                ref = {
                    created_at: row[0],
                    userId: row[1]
                };
            } else {
                ref = {
                    created_at: row[0],
                    userId
                };
            }
        }, `SELECT created_at, user_id FROM gamelog_join_leave WHERE user_id = '${userId}' OR display_name = '${displayName}' ORDER BY id DESC LIMIT 1`);
        return ref;
    }

    async getJoinCount(input) {
        var userId = input.id.replaceAll("'", '');
        var displayName = input.displayName.replaceAll("'", "''");
        var ref = {
            joinCount: '',
            userId: ''
        };
        await sqliteService.execute((row) => {
            if (row[1]) {
                ref = {
                    joinCount: row[0],
                    userId: row[1]
                };
            } else {
                ref = {
                    joinCount: row[0],
                    userId
                };
            }
        }, `SELECT COUNT(*) FROM gamelog_join_leave WHERE (type = 'OnPlayerJoined') AND (user_id = '${userId}' OR display_name = '${displayName}')`);
        return ref;
    }

    async getTimeSpent(input) {
        var userId = input.id.replaceAll("'", '');
        var displayName = input.displayName.replaceAll("'", "''");
        var ref = {
            timeSpent: 0,
            userId
        };
        await sqliteService.execute((row) => {
            if (typeof row[0] === 'number') {
                ref.timeSpent += row[0];
            }
        }, `SELECT time FROM gamelog_join_leave WHERE (type = 'OnPlayerLeft') AND (user_id = '${userId}' OR display_name = '${displayName}')`);
        return ref;
    }

    async lookupFeedDatabase(search, filters, vipList) {
        var search = search.replaceAll("'", "''");
        var vipQuery = '';
        if (vipList.length > 0) {
            vipQuery = 'AND user_id IN (';
            vipList.forEach((vip, i) => {
                vipQuery += `'${vip.replaceAll("'", "''")}'`;
                if (i < vipList.length - 1) {
                    vipQuery += ', ';
                }
            });
            vipQuery += ')';
        }
        var gps = true;
        var status = true;
        var avatar = true;
        var online = true;
        var offline = true;
        if (filters.length > 0) {
            gps = false;
            status = false;
            avatar = false;
            online = false;
            offline = false;
            filters.forEach((filter) => {
                switch (filter) {
                    case 'GPS':
                        gps = true;
                        break;
                    case 'Status':
                        status = true;
                        break;
                    case 'Avatar':
                        avatar = true;
                        break;
                    case 'Online':
                        online = true;
                        break;
                    case 'Offline':
                        offline = true;
                        break;
                }
            });
        }
        var feedDatabase = [];
        if (gps) {
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
            }, `SELECT * FROM ${Database.userPrefix}_feed_gps WHERE (display_name LIKE '%${search}%' OR world_name LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (status) {
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
            }, `SELECT * FROM ${Database.userPrefix}_feed_status WHERE (display_name LIKE '%${search}%' OR status LIKE '%${search}%' OR status_description LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (avatar) {
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
            }, `SELECT * FROM ${Database.userPrefix}_feed_avatar WHERE (display_name LIKE '%${search}%' OR avatar_name LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (online || offline) {
            var query = '';
            if (!online || !offline) {
                if (online) {
                    query = "AND type = 'Online'";
                } else if (offline) {
                    query = "AND type = 'Offline'";
                }
            }
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
            }, `SELECT * FROM ${Database.userPrefix}_feed_online_offline WHERE ((display_name LIKE '%${search}%' OR world_name LIKE '%${search}%') ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
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
        feedDatabase.splice(0, feedDatabase.length - Database.maxTableSize);
        return feedDatabase;
    }

    async lookupGameLogDatabase(search, filters) {
        var search = search.replaceAll("'", "''");
        var location = true;
        var onplayerjoined = true;
        var onplayerleft = true;
        var portalspawn = true;
        var msgevent = true;
        var videoplay = true;
        if (filters.length > 0) {
            location = false;
            onplayerjoined = false;
            onplayerleft = false;
            portalspawn = false;
            msgevent = false;
            videoplay = false;
            filters.forEach((filter) => {
                switch (filter) {
                    case 'Location':
                        location = true;
                        break;
                    case 'OnPlayerJoined':
                        onplayerjoined = true;
                        break;
                    case 'OnPlayerLeft':
                        onplayerleft = true;
                        break;
                    case 'PortalSpawn':
                        portalspawn = true;
                        break;
                    case 'Event':
                        msgevent = true;
                        break;
                    case 'VideoPlay':
                        videoplay = true;
                        break;
                }
            });
        }
        var gamelogDatabase = [];
        if (location) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'Location',
                    location: dbRow[2],
                    worldId: dbRow[3],
                    worldName: dbRow[4],
                    time: dbRow[5]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_location WHERE world_name LIKE '%${search}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (onplayerjoined || onplayerleft) {
            var query = '';
            if (!onplayerjoined || !onplayerleft) {
                if (onplayerjoined) {
                    query = "AND type = 'OnPlayerJoined'";
                } else if (onplayerleft) {
                    query = "AND type = 'OnPlayerLeft'";
                }
            }
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: dbRow[2],
                    displayName: dbRow[3],
                    location: dbRow[4],
                    userId: dbRow[5],
                    time: dbRow[6]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_join_leave WHERE (display_name LIKE '%${search}%' AND user_id != '${Database.userId}') ${query} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (portalspawn) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'PortalSpawn',
                    displayName: dbRow[2],
                    location: dbRow[3],
                    userId: dbRow[4],
                    instanceId: dbRow[5],
                    worldName: dbRow[6]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_portal_spawn WHERE (display_name LIKE '%${search}%' OR world_name LIKE '%${search}%') ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (msgevent) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'Event',
                    data: dbRow[2]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_event WHERE data LIKE '%${search}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (videoplay) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'VideoPlay',
                    videoUrl: dbRow[2],
                    videoName: dbRow[3],
                    videoId: dbRow[4],
                    location: dbRow[5],
                    displayName: dbRow[6],
                    userId: dbRow[7]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_video_play WHERE video_url LIKE '%${search}%' OR video_name LIKE '%${search}%' OR display_name LIKE '%${search}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
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
        gamelogDatabase.sort(compareByCreatedAt);
        gamelogDatabase.splice(
            0,
            gamelogDatabase.length - Database.maxTableSize
        );
        return gamelogDatabase;
    }

    async getLastDateGameLogDatabase() {
        var gamelogDatabase = [];
        var date = new Date().toJSON();
        var dateOffset = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_location ORDER BY id DESC LIMIT 1');
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_join_leave ORDER BY id DESC LIMIT 1');
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_portal_spawn ORDER BY id DESC LIMIT 1');
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_event ORDER BY id DESC LIMIT 1');
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_video_play ORDER BY id DESC LIMIT 1');
        if (gamelogDatabase.length > 0) {
            gamelogDatabase.sort();
            var newDate = gamelogDatabase[gamelogDatabase.length - 1];
            if (newDate > dateOffset) {
                date = newDate;
            }
        }
        return date;
    }

    async getModeration(input) {
        var userId = input.replaceAll("'", '');
        var row = {};
        await sqliteService.execute((dbRow) => {
            var block = false;
            var mute = false;
            if (dbRow[3] === 1) {
                block = true;
            }
            if (dbRow[4] === 1) {
                mute = true;
            }
            row = {
                userId: dbRow[0],
                updatedAt: dbRow[1],
                displayName: dbRow[2],
                block,
                mute
            };
        }, `SELECT * FROM ${Database.userPrefix}_moderation WHERE user_id = '${userId}'`);
        return row;
    }

    setModeration(entry) {
        var block = 0;
        var mute = 0;
        if (entry.block) {
            block = 1;
        }
        if (entry.mute) {
            mute = 1;
        }
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${Database.userPrefix}_moderation (user_id, updated_at, display_name, block, mute) VALUES (@user_id, @updated_at, @display_name, @block, @mute)`,
            {
                '@user_id': entry.userId,
                '@updated_at': entry.updatedAt,
                '@display_name': entry.displayName,
                '@block': block,
                '@mute': mute
            }
        );
    }

    deleteModeration(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_moderation WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
    }
}

var self = new Database();
window.database = self;

export {self as default, Database};
