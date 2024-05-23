import sqliteService from '../service/sqlite.js';

class Database {
    setmaxTableSize(limit) {
        Database.maxTableSize = limit;
    }

    async initUserTables(userId) {
        Database.userId = userId;
        Database.userPrefix = userId.replaceAll('-', '').replaceAll('_', '');
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_gps (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, location TEXT, world_name TEXT, previous_location TEXT, time INTEGER, group_name TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_status (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, status TEXT, status_description TEXT, previous_status TEXT, previous_status_description TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_bio (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, bio TEXT, previous_bio TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_avatar (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, owner_id TEXT, avatar_name TEXT, current_avatar_image_url TEXT, current_avatar_thumbnail_image_url TEXT, previous_current_avatar_image_url TEXT, previous_current_avatar_thumbnail_image_url TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_feed_online_offline (id INTEGER PRIMARY KEY, created_at TEXT, user_id TEXT, display_name TEXT, type TEXT, location TEXT, world_name TEXT, time INTEGER, group_name TEXT)`
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
            `CREATE TABLE IF NOT EXISTS ${Database.userPrefix}_avatar_history (avatar_id TEXT PRIMARY KEY, created_at TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS memos (user_id TEXT PRIMARY KEY, edited_at TEXT, memo TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS world_memos (world_id TEXT PRIMARY KEY, edited_at TEXT, memo TEXT)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS avatar_memos (avatar_id TEXT PRIMARY KEY, edited_at TEXT, memo TEXT)`
        );
    }

    async initTables() {
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_location (id INTEGER PRIMARY KEY, created_at TEXT, location TEXT, world_id TEXT, world_name TEXT, time INTEGER, group_name TEXT, UNIQUE(created_at, location))`
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
            `CREATE TABLE IF NOT EXISTS gamelog_resource_load (id INTEGER PRIMARY KEY, created_at TEXT, resource_url TEXT, resource_type TEXT, location TEXT, UNIQUE(created_at, resource_url))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_event (id INTEGER PRIMARY KEY, created_at TEXT, data TEXT, UNIQUE(created_at, data))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS gamelog_external (id INTEGER PRIMARY KEY, created_at TEXT, message TEXT, display_name TEXT, user_id TEXT, location TEXT, UNIQUE(created_at, message))`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS cache_avatar (id TEXT PRIMARY KEY, added_at TEXT, author_id TEXT, author_name TEXT, created_at TEXT, description TEXT, image_url TEXT, name TEXT, release_status TEXT, thumbnail_image_url TEXT, updated_at TEXT, version INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS cache_world (id TEXT PRIMARY KEY, added_at TEXT, author_id TEXT, author_name TEXT, created_at TEXT, description TEXT, image_url TEXT, name TEXT, release_status TEXT, thumbnail_image_url TEXT, updated_at TEXT, version INTEGER)`
        );
        await sqliteService.executeNonQuery(
            `CREATE TABLE IF NOT EXISTS favorite_world (id INTEGER PRIMARY KEY, created_at TEXT, world_id TEXT, group_name TEXT)`
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
                time: dbRow[7],
                groupName: dbRow[8]
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
                type: 'Bio',
                bio: dbRow[4],
                previousBio: dbRow[5]
            };
            feedDatabase.unshift(row);
        }, `SELECT * FROM ${Database.userPrefix}_feed_bio WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
                time: dbRow[7],
                groupName: dbRow[8]
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

    // memos

    async getMemo(userId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    userId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM memos WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
        return row;
    }

    async getAllMemos() {
        var memos = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                userId: dbRow[0],
                memo: dbRow[1]
            };
            memos.push(row);
        }, 'SELECT user_id, memo FROM memos');
        return memos;
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

    // world memos

    async getWorldMemo(worldId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    worldId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM world_memos WHERE world_id = @world_id`,
            {
                '@world_id': worldId
            }
        );
        return row;
    }

    setWorldMemo(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO world_memos (world_id, edited_at, memo) VALUES (@world_id, @edited_at, @memo)`,
            {
                '@world_id': entry.worldId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    }

    deleteWorldMemo(worldId) {
        sqliteService.executeNonQuery(
            `DELETE FROM world_memos WHERE world_id = @world_id`,
            {
                '@world_id': worldId
            }
        );
    }

    // Avatar memos

    async getAvatarMemoDB(avatarId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    avatarId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM avatar_memos WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
        return row;
    }

    setAvatarMemo(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO avatar_memos (avatar_id, edited_at, memo) VALUES (@avatar_id, @edited_at, @memo)`,
            {
                '@avatar_id': entry.avatarId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    }

    deleteAvatarMemo(avatarId) {
        sqliteService.executeNonQuery(
            `DELETE FROM avatar_memos WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
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
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_gps (created_at, user_id, display_name, location, world_name, previous_location, time, group_name) VALUES (@created_at, @user_id, @display_name, @location, @world_name, @previous_location, @time, @group_name)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@previous_location': entry.previousLocation,
                '@time': entry.time,
                '@group_name': entry.groupName
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

    addBioToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_bio (created_at, user_id, display_name, bio, previous_bio) VALUES (@created_at, @user_id, @display_name, @bio, @previous_bio)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@bio': entry.bio,
                '@previous_bio': entry.previousBio
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
            `INSERT OR IGNORE INTO ${Database.userPrefix}_feed_online_offline (created_at, user_id, display_name, type, location, world_name, time, group_name) VALUES (@created_at, @user_id, @display_name, @type, @location, @world_name, @time, @group_name)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@type': entry.type,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@time': entry.time,
                '@group_name': entry.groupName
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
                time: dbRow[5],
                groupName: dbRow[6]
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
                type: dbRow[3],
                resourceUrl: dbRow[2],
                location: dbRow[4]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_resource_load WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'Event',
                data: dbRow[2]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_event WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: 'External',
                message: dbRow[2],
                displayName: dbRow[3],
                userId: dbRow[4],
                location: dbRow[5]
            };
            gamelogDatabase.unshift(row);
        }, `SELECT * FROM gamelog_external WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
            `INSERT OR IGNORE INTO gamelog_location (created_at, location, world_id, world_name, time, group_name) VALUES (@created_at, @location, @world_id, @world_name, @time, @group_name)`,
            {
                '@created_at': entry.created_at,
                '@location': entry.location,
                '@world_id': entry.worldId,
                '@world_name': entry.worldName,
                '@time': entry.time,
                '@group_name': entry.groupName
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

    addGamelogJoinLeaveBulk(inputData) {
        if (inputData.length === 0) {
            return;
        }
        var sqlValues = '';
        var items = [
            'created_at',
            'type',
            'displayName',
            'location',
            'userId',
            'time'
        ];
        for (var line of inputData) {
            var field = {};
            for (var item of items) {
                if (typeof line[item] === 'string') {
                    field[item] = line[item].replace(/'/g, "''");
                } else if (typeof line[item] === 'number') {
                    field[item] = line[item];
                } else {
                    field[item] = '';
                }
            }
            sqlValues += `('${field.created_at}', '${field.type}', '${field.displayName}', '${field.location}', '${field.userId}', '${field.time}'), `;
        }
        sqlValues = sqlValues.slice(0, -2);
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_join_leave (created_at, type, display_name, location, user_id, time) VALUES ${sqlValues}`
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

    addGamelogResourceLoadToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_resource_load (created_at, resource_url, resource_type, location) VALUES (@created_at, @resource_url, @resource_type, @location)`,
            {
                '@created_at': entry.created_at,
                '@resource_url': entry.resourceUrl,
                '@resource_type': entry.type,
                '@location': entry.location
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

    addGamelogExternalToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_external (created_at, message, display_name, user_id, location) VALUES (@created_at, @message, @display_name, @user_id, @location)`,
            {
                '@created_at': entry.created_at,
                '@message': entry.message,
                '@display_name': entry.displayName,
                '@user_id': entry.userId,
                '@location': entry.location
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
        if (!entry.created_at || !entry.type || !entry.id) {
            console.error('Notification is missing required field', entry);
            throw new Error('Notification is missing required field');
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

    async getBioTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${Database.userPrefix}_feed_bio`);
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

    async getResourceLoadTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_resource_load`);
        return size;
    }

    async getEventTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_event`);
        return size;
    }

    async getExternalTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_external`);
        return size;
    }

    async getLastVisit(worldId, currentWorldMatch) {
        if (currentWorldMatch) {
            var count = 2;
        } else {
            var count = 1;
        }
        var ref = {
            created_at: '',
            worldId: ''
        };
        await sqliteService.execute(
            (row) => {
                ref = {
                    created_at: row[0],
                    worldId: row[1]
                };
            },
            `SELECT created_at, world_id FROM gamelog_location WHERE world_id = @worldId ORDER BY id DESC LIMIT @count`,
            {
                '@worldId': worldId,
                '@count': count
            }
        );
        return ref;
    }

    async getVisitCount(worldId) {
        var ref = {
            visitCount: '',
            worldId: ''
        };
        await sqliteService.execute(
            (row) => {
                ref = {
                    visitCount: row[0],
                    worldId
                };
            },
            `SELECT COUNT(DISTINCT location) FROM gamelog_location WHERE world_id = @worldId`,
            {
                '@worldId': worldId
            }
        );
        return ref;
    }

    async getTimeSpentInWorld(worldId) {
        var ref = {
            timeSpent: 0,
            worldId
        };
        await sqliteService.execute(
            (row) => {
                if (typeof row[0] === 'number') {
                    ref.timeSpent += row[0];
                }
            },
            `SELECT time FROM gamelog_location WHERE world_id = @worldId`,
            {
                '@worldId': worldId
            }
        );
        return ref;
    }

    async getLastSeen(input, inCurrentWorld) {
        if (inCurrentWorld) {
            var count = 2;
        } else {
            var count = 1;
        }
        var ref = {
            created_at: '',
            userId: ''
        };
        await sqliteService.execute(
            (row) => {
                if (row[1]) {
                    ref = {
                        created_at: row[0],
                        userId: row[1]
                    };
                } else {
                    ref = {
                        created_at: row[0],
                        userId: input.id
                    };
                }
            },
            `SELECT created_at, user_id FROM gamelog_join_leave WHERE user_id = @userId OR display_name = @displayName ORDER BY id DESC LIMIT @count`,
            {
                '@userId': input.id,
                '@displayName': input.displayName,
                '@count': count
            }
        );
        return ref;
    }

    async getJoinCount(input) {
        var ref = {
            joinCount: '',
            userId: ''
        };
        await sqliteService.execute(
            (row) => {
                if (row[1]) {
                    ref = {
                        joinCount: row[0],
                        userId: row[1]
                    };
                } else {
                    ref = {
                        joinCount: row[0],
                        userId: input.id
                    };
                }
            },
            `SELECT COUNT(DISTINCT location) FROM gamelog_join_leave WHERE (type = 'OnPlayerJoined') AND (user_id = @userId OR display_name = @displayName)`,
            {
                '@userId': input.id,
                '@displayName': input.displayName
            }
        );
        return ref;
    }

    async getTimeSpent(input) {
        var ref = {
            timeSpent: 0,
            userId: input.id
        };
        await sqliteService.execute(
            (row) => {
                if (typeof row[0] === 'number') {
                    ref.timeSpent += row[0];
                }
            },
            `SELECT time FROM gamelog_join_leave WHERE (type = 'OnPlayerLeft') AND (user_id = @userId OR display_name = @displayName)`,
            {
                '@userId': input.id,
                '@displayName': input.displayName
            }
        );
        return ref;
    }

    async getUserStats(input, inCurrentWorld) {
        var i = 0;
        var instances = new Set();
        var ref = {
            timeSpent: 0,
            created_at: '',
            joinCount: 0,
            userId: input.id,
            previousDisplayNames: new Map()
        };
        await sqliteService.execute(
            (row) => {
                if (typeof row[2] === 'number') {
                    ref.timeSpent += row[2];
                }
                i++;
                if (i === 1 || (inCurrentWorld && i === 2)) {
                    ref.created_at = row[0];
                }
                instances.add(row[3]);
                if (input.displayName !== row[4]) {
                    ref.previousDisplayNames.set(row[4], row[0]);
                }
            },
            `SELECT created_at, user_id, time, location, display_name FROM gamelog_join_leave WHERE user_id = @userId OR display_name = @displayName ORDER BY id DESC`,
            {
                '@userId': input.id,
                '@displayName': input.displayName
            }
        );
        instances.delete('');
        ref.joinCount = instances.size;
        return ref;
    }

    async getAllUserStats(userIds, displayNames) {
        var data = [];
        // this makes me most sad
        var userIdsString = '';
        for (var userId of userIds) {
            userIdsString += `'${userId}', `;
        }
        userIdsString = userIdsString.slice(0, -2);
        var displayNamesString = '';
        for (var displayName of displayNames) {
            displayNamesString += `'${displayName.replaceAll("'", "''")}', `;
        }
        displayNamesString = displayNamesString.slice(0, -2);

        await sqliteService.execute(
            (dbRow) => {
                var row = {
                    created_at: dbRow[0],
                    userId: dbRow[1],
                    timeSpent: dbRow[2],
                    joinCount: dbRow[3],
                    displayName: dbRow[4]
                };
                data.push(row);
            },
            `SELECT
                g.created_at,
                g.user_id,
                SUM(g.time) AS timeSpent,
                COUNT(DISTINCT g.location) AS joinCount,
                g.display_name,
                MAX(g.id) AS max_id
            FROM
                gamelog_join_leave g
            WHERE
                g.user_id IN (${userIdsString})
                OR g.display_name IN (${displayNamesString})
            GROUP BY
                g.user_id,
                g.display_name
            ORDER BY
                g.user_id DESC
            `
        );
        return data;
    }

    static async getFeedByInstanceId(instanceId, filters, vipList) {
        var feedDatabase = [];
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
        var online = true;
        var offline = true;
        if (filters.length > 0) {
            gps = false;
            online = false;
            offline = false;
            filters.forEach((filter) => {
                switch (filter) {
                    case 'GPS':
                        gps = true;
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
                    time: dbRow[7],
                    groupName: dbRow[8]
                };
                feedDatabase.unshift(row);
            }, `SELECT * FROM ${Database.userPrefix}_feed_gps WHERE location LIKE '%${instanceId}%' ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
                    time: dbRow[7],
                    groupName: dbRow[8]
                };
                feedDatabase.unshift(row);
            }, `SELECT * FROM ${Database.userPrefix}_feed_online_offline WHERE (location LIKE '%${instanceId}%' ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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

    async lookupFeedDatabase(search, filters, vipList) {
        var search = search.replaceAll("'", "''");
        if (search.startsWith('wrld_')) {
            return Database.getFeedByInstanceId(search, filters, vipList);
        }
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
        var bio = true;
        var avatar = true;
        var online = true;
        var offline = true;
        var aviPublic = search.includes('public');
        var aviPrivate = search.includes('private');
        if (filters.length > 0) {
            gps = false;
            status = false;
            bio = false;
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
                    case 'Bio':
                        bio = true;
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
                    time: dbRow[7],
                    groupName: dbRow[8]
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
        if (bio) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type: 'Bio',
                    bio: dbRow[4],
                    previousBio: dbRow[5]
                };
                feedDatabase.unshift(row);
            }, `SELECT * FROM ${Database.userPrefix}_feed_bio WHERE (display_name LIKE '%${search}%' OR bio LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (avatar) {
            var query = '';
            if (aviPrivate) {
                query = 'OR user_id = owner_id';
            } else if (aviPublic) {
                query = 'OR user_id != owner_id';
            }
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
            }, `SELECT * FROM ${Database.userPrefix}_feed_avatar WHERE ((display_name LIKE '%${search}%' OR avatar_name LIKE '%${search}%') ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
                    time: dbRow[7],
                    groupName: dbRow[8]
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

    static async getGameLogByLocation(instanceId, filters) {
        var gamelogDatabase = [];
        var location = true;
        var onplayerjoined = true;
        var onplayerleft = true;
        var portalspawn = true;
        var videoplay = true;
        var resourceload_string = true;
        var resourceload_image = true;
        if (filters.length > 0) {
            location = false;
            onplayerjoined = false;
            onplayerleft = false;
            portalspawn = false;
            videoplay = false;
            resourceload_string = false;
            resourceload_image = false;
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
                    case 'VideoPlay':
                        videoplay = true;
                        break;
                    case 'StringLoad':
                        resourceload_string = true;
                        break;
                    case 'ImageLoad':
                        resourceload_image = true;
                        break;
                }
            });
        }
        if (location) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'Location',
                    location: dbRow[2],
                    worldId: dbRow[3],
                    worldName: dbRow[4],
                    time: dbRow[5],
                    groupName: dbRow[6]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_location WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_join_leave WHERE (location LIKE '%${instanceId}%' AND user_id != '${Database.userId}') ${query} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_portal_spawn WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_video_play WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
        }
        if (resourceload_string || resourceload_image) {
            var checkString = '';
            var checkImage = '';
            if (!resourceload_string) {
                checkString = `AND resource_type != 'StringLoad'`;
            }
            if (!resourceload_image) {
                checkString = `AND resource_type != 'ImageLoad'`;
            }
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: dbRow[3],
                    resourceUrl: dbRow[2],
                    location: dbRow[4]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_resource_load WHERE location LIKE '%${instanceId}%' ${checkString} ${checkImage} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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

    async lookupGameLogDatabase(search, filters) {
        var search = search.replaceAll("'", "''");
        if (search.startsWith('wrld_')) {
            return Database.getGameLogByLocation(search, filters);
        }
        var location = true;
        var onplayerjoined = true;
        var onplayerleft = true;
        var portalspawn = true;
        var msgevent = true;
        var external = true;
        var videoplay = true;
        var resourceload_string = true;
        var resourceload_image = true;
        if (filters.length > 0) {
            location = false;
            onplayerjoined = false;
            onplayerleft = false;
            portalspawn = false;
            msgevent = false;
            external = false;
            videoplay = false;
            resourceload_string = false;
            resourceload_image = false;
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
                    case 'External':
                        external = true;
                        break;
                    case 'VideoPlay':
                        videoplay = true;
                        break;
                    case 'StringLoad':
                        resourceload_string = true;
                        break;
                    case 'ImageLoad':
                        resourceload_image = true;
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
                    time: dbRow[5],
                    groupName: dbRow[6]
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
        if (external) {
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: 'External',
                    message: dbRow[2],
                    displayName: dbRow[3],
                    userId: dbRow[4],
                    location: dbRow[5]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_external WHERE (display_name LIKE '%${search}%' OR message LIKE '%${search}%') ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
        if (resourceload_string || resourceload_image) {
            var checkString = '';
            var checkImage = '';
            if (!resourceload_string) {
                checkString = `AND resource_type != 'StringLoad'`;
            }
            if (!resourceload_image) {
                checkString = `AND resource_type != 'ImageLoad'`;
            }
            await sqliteService.execute((dbRow) => {
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: dbRow[3],
                    resourceUrl: dbRow[2],
                    location: dbRow[4]
                };
                gamelogDatabase.unshift(row);
            }, `SELECT * FROM gamelog_resource_load WHERE resource_url LIKE '%${search}%' ${checkString} ${checkImage} ORDER BY id DESC LIMIT ${Database.maxTableSize}`);
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
        await sqliteService.execute((dbRow) => {
            gamelogDatabase.unshift(dbRow[0]);
        }, 'SELECT created_at FROM gamelog_resource_load ORDER BY id DESC LIMIT 1');
        if (gamelogDatabase.length > 0) {
            gamelogDatabase.sort();
            var newDate = gamelogDatabase[gamelogDatabase.length - 1];
            if (newDate > dateOffset && newDate < date) {
                date = newDate;
            }
        }
        return date;
    }

    async getGameLogWorldNameByWorldId(worldId) {
        var worldName = '';
        await sqliteService.execute(
            (dbRow) => {
                worldName = dbRow[0];
            },
            'SELECT world_name FROM gamelog_location WHERE world_id = @worldId ORDER BY id DESC LIMIT 1',
            {
                '@worldId': worldId
            }
        );
        return worldName;
    }

    async getModeration(userId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
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
            },
            `SELECT * FROM ${Database.userPrefix}_moderation WHERE user_id = @userId`,
            {
                '@userId': userId
            }
        );
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

    async getpreviousInstancesByUserId(input) {
        var data = new Map();
        await sqliteService.execute(
            (dbRow) => {
                var time = 0;
                if (dbRow[2]) {
                    time = dbRow[2];
                }
                var ref = data.get(dbRow[1]);
                if (typeof ref !== 'undefined') {
                    time += ref.time;
                }
                var row = {
                    created_at: dbRow[0],
                    location: dbRow[1],
                    time,
                    worldName: dbRow[3],
                    groupName: dbRow[4]
                };
                data.set(row.location, row);
            },
            `SELECT DISTINCT gamelog_join_leave.created_at, gamelog_join_leave.location, gamelog_join_leave.time, gamelog_location.world_name, gamelog_location.group_name
            FROM gamelog_join_leave
            INNER JOIN gamelog_location ON gamelog_join_leave.location = gamelog_location.location
            WHERE user_id = @userId OR display_name = @displayName
            ORDER BY gamelog_join_leave.id DESC`,
            {
                '@userId': input.id,
                '@displayName': input.displayName
            }
        );
        return data;
    }

    deleteGameLogInstance(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_join_leave WHERE (user_id = @user_id OR display_name = @displayName) AND (location = @location)`,
            {
                '@user_id': input.id,
                '@displayName': input.displayName,
                '@location': input.location
            }
        );
    }

    deleteGameLogEntry(input) {
        switch (input.type) {
            case 'VideoPlay':
                this.deleteGameLogVideoPlay(input);
                break;
            case 'Event':
                this.deleteGameLogEvent(input);
                break;
            case 'External':
                this.deleteGameLogExternal(input);
                break;
            case 'StringLoad':
            case 'ImageLoad':
                this.deleteGameLogResourceLoad(input);
                break;
        }
    }

    deleteGameLogVideoPlay(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_video_play WHERE created_at = @created_at AND video_url = @video_url AND location = @location`,
            {
                '@created_at': input.created_at,
                '@video_url': input.videoUrl,
                '@location': input.location
            }
        );
    }

    deleteGameLogEvent(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_event WHERE created_at = @created_at AND data = @data`,
            {
                '@created_at': input.created_at,
                '@data': input.data
            }
        );
    }

    deleteGameLogExternal(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_external WHERE created_at = @created_at AND message = @message`,
            {
                '@created_at': input.created_at,
                '@message': input.message
            }
        );
    }

    deleteGameLogResourceLoad(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_resource_load WHERE created_at = @created_at AND resource_url = @resource_url AND location = @location`,
            {
                '@created_at': input.created_at,
                '@resource_url': input.resourceUrl,
                '@type': input.type,
                '@location': input.location
            }
        );
    }

    async getpreviousInstancesByWorldId(input) {
        var data = new Map();
        await sqliteService.execute(
            (dbRow) => {
                var time = 0;
                if (dbRow[2]) {
                    time = dbRow[2];
                }
                var ref = data.get(dbRow[1]);
                if (typeof ref !== 'undefined') {
                    time += ref.time;
                }
                var row = {
                    created_at: dbRow[0],
                    location: dbRow[1],
                    time,
                    worldName: dbRow[3],
                    groupName: dbRow[4]
                };
                data.set(row.location, row);
            },
            `SELECT created_at, location, time, world_name, group_name
            FROM gamelog_location
            WHERE world_id = @worldId
            ORDER BY id DESC`,
            {
                '@worldId': input.id
            }
        );
        return data;
    }

    deleteGameLogInstanceByInstanceId(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_location WHERE location = @location`,
            {
                '@location': input.location
            }
        );
    }

    async getPlayersFromInstance(location) {
        var players = new Map();
        await sqliteService.execute(
            (dbRow) => {
                var time = 0;
                var count = 0;
                var created_at = dbRow[0];
                if (dbRow[3]) {
                    time = dbRow[3];
                }
                var ref = players.get(dbRow[1]);
                if (typeof ref !== 'undefined') {
                    time += ref.time;
                    count = ref.count;
                    created_at = ref.created_at;
                }
                if (dbRow[4] === 'OnPlayerJoined') {
                    count++;
                }
                var row = {
                    created_at,
                    displayName: dbRow[1],
                    userId: dbRow[2],
                    time,
                    count
                };
                players.set(row.displayName, row);
            },
            `SELECT created_at, display_name, user_id, time, type FROM gamelog_join_leave WHERE location = @location`,
            {
                '@location': location
            }
        );
        return players;
    }

    async getpreviousDisplayNamesByUserId(ref) {
        var data = new Map();
        await sqliteService.execute(
            (dbRow) => {
                var row = {
                    created_at: dbRow[0],
                    displayName: dbRow[1]
                };
                if (ref.displayName !== row.displayName) {
                    data.set(row.displayName, row.created_at);
                }
            },
            `SELECT created_at, display_name
            FROM gamelog_join_leave
            WHERE user_id = @userId
            ORDER BY id DESC`,
            {
                '@userId': ref.id
            }
        );
        return data;
    }

    async cleanLegendFromFriendLog() {
        await sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_friend_log_history
            WHERE type = 'TrustLevel' AND created_at > '2022-05-04T01:00:00.000Z'
            AND ((trust_level = 'Veteran User' AND previous_trust_level = 'Trusted User') OR (trust_level = 'Trusted User' AND previous_trust_level = 'Veteran User'))`
        );
    }

    addAvatarToCache(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO cache_avatar (id, added_at, author_id, author_name, created_at, description, image_url, name, release_status, thumbnail_image_url, updated_at, version) VALUES (@id, @added_at, @author_id, @author_name, @created_at, @description, @image_url, @name, @release_status, @thumbnail_image_url, @updated_at, @version)`,
            {
                '@id': entry.id,
                '@added_at': new Date().toJSON(),
                '@author_id': entry.authorId,
                '@author_name': entry.authorName,
                '@created_at': entry.created_at,
                '@description': entry.description,
                '@image_url': entry.imageUrl,
                '@name': entry.name,
                '@release_status': entry.releaseStatus,
                '@thumbnail_image_url': entry.thumbnailImageUrl,
                '@updated_at': entry.updated_at,
                '@version': entry.version
            }
        );
    }

    addAvatarToHistory(avatarId) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${Database.userPrefix}_avatar_history (avatar_id, created_at) VALUES (@avatar_id, @created_at)`,
            {
                '@avatar_id': avatarId,
                '@created_at': new Date().toJSON()
            }
        );
    }

    async getAvatarHistory(currentUserId, limit = 100) {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                id: dbRow[0],
                authorId: dbRow[4],
                authorName: dbRow[5],
                created_at: dbRow[6],
                description: dbRow[7],
                imageUrl: dbRow[8],
                name: dbRow[9],
                releaseStatus: dbRow[10],
                thumbnailImageUrl: dbRow[11],
                updated_at: dbRow[12],
                version: dbRow[13]
            };
            data.push(row);
        }, `SELECT * FROM ${Database.userPrefix}_avatar_history INNER JOIN cache_avatar ON cache_avatar.id = ${Database.userPrefix}_avatar_history.avatar_id WHERE author_id != "${currentUserId}" ORDER BY ${Database.userPrefix}_avatar_history.created_at DESC LIMIT ${limit}`);
        return data;
    }

    async getCachedAvatarById(id) {
        var data = null;
        await sqliteService.execute(
            (dbRow) => {
                data = {
                    id: dbRow[0],
                    // added_at: dbRow[1],
                    authorId: dbRow[2],
                    authorName: dbRow[3],
                    created_at: dbRow[4],
                    description: dbRow[5],
                    imageUrl: dbRow[6],
                    name: dbRow[7],
                    releaseStatus: dbRow[8],
                    thumbnailImageUrl: dbRow[9],
                    updated_at: dbRow[10],
                    version: dbRow[11]
                };
            },
            `SELECT * FROM cache_avatar WHERE id = @id`,
            {
                '@id': id
            }
        );
        return data;
    }

    clearAvatarHistory() {
        sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_avatar_history`
        );
        sqliteService.executeNonQuery('DELETE FROM cache_avatar');
    }

    addWorldToCache(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO cache_world (id, added_at, author_id, author_name, created_at, description, image_url, name, release_status, thumbnail_image_url, updated_at, version) VALUES (@id, @added_at, @author_id, @author_name, @created_at, @description, @image_url, @name, @release_status, @thumbnail_image_url, @updated_at, @version)`,
            {
                '@id': entry.id,
                '@added_at': new Date().toJSON(),
                '@author_id': entry.authorId,
                '@author_name': entry.authorName,
                '@created_at': entry.created_at,
                '@description': entry.description,
                '@image_url': entry.imageUrl,
                '@name': entry.name,
                '@release_status': entry.releaseStatus,
                '@thumbnail_image_url': entry.thumbnailImageUrl,
                '@updated_at': entry.updated_at,
                '@version': entry.version
            }
        );
    }

    addWorldToFavorites(worldId, groupName) {
        sqliteService.executeNonQuery(
            'INSERT OR REPLACE INTO favorite_world (world_id, group_name, created_at) VALUES (@world_id, @group_name, @created_at)',
            {
                '@world_id': worldId,
                '@group_name': groupName,
                '@created_at': new Date().toJSON()
            }
        );
    }

    renameWorldFavoriteGroup(newGroupName, groupName) {
        sqliteService.executeNonQuery(
            `UPDATE favorite_world SET group_name = @new_group_name WHERE group_name = @group_name`,
            {
                '@new_group_name': newGroupName,
                '@group_name': groupName
            }
        );
    }

    deleteWorldFavoriteGroup(groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_world WHERE group_name = @group_name`,
            {
                '@group_name': groupName
            }
        );
    }

    removeWorldFromFavorites(worldId, groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_world WHERE world_id = @world_id AND group_name = @group_name`,
            {
                '@world_id': worldId,
                '@group_name': groupName
            }
        );
    }

    removeWorldFromCache(worldId) {
        sqliteService.executeNonQuery(
            `DELETE FROM cache_world WHERE id = @world_id`,
            {
                '@world_id': worldId
            }
        );
    }

    async getWorldFavorites() {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                created_at: dbRow[1],
                worldId: dbRow[2],
                groupName: dbRow[3]
            };
            data.push(row);
        }, 'SELECT * FROM favorite_world');
        return data;
    }

    async getWorldCache() {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                id: dbRow[0],
                // added_at: dbRow[1],
                authorId: dbRow[2],
                authorName: dbRow[3],
                created_at: dbRow[4],
                description: dbRow[5],
                imageUrl: dbRow[6],
                name: dbRow[7],
                releaseStatus: dbRow[8],
                thumbnailImageUrl: dbRow[9],
                updated_at: dbRow[10],
                version: dbRow[11]
            };
            data.push(row);
        }, 'SELECT * FROM cache_world');
        return data;
    }

    async getCachedWorldById(id) {
        var data = null;
        await sqliteService.execute(
            (dbRow) => {
                data = {
                    id: dbRow[0],
                    // added_at: dbRow[1],
                    authorId: dbRow[2],
                    authorName: dbRow[3],
                    created_at: dbRow[4],
                    description: dbRow[5],
                    imageUrl: dbRow[6],
                    name: dbRow[7],
                    releaseStatus: dbRow[8],
                    thumbnailImageUrl: dbRow[9],
                    updated_at: dbRow[10],
                    version: dbRow[11]
                };
            },
            `SELECT * FROM cache_world WHERE id = @id`,
            {
                '@id': id
            }
        );
        return data;
    }

    async fixGameLogTraveling() {
        var travelingList = [];
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
            travelingList.unshift(row);
        }, 'SELECT * FROM gamelog_join_leave WHERE type = "OnPlayerLeft" AND location = "traveling"');
        travelingList.forEach(async (travelingEntry) => {
            await sqliteService.execute(
                (dbRow) => {
                    var onPlayingJoin = {
                        rowId: dbRow[0],
                        created_at: dbRow[1],
                        type: dbRow[2],
                        displayName: dbRow[3],
                        location: dbRow[4],
                        userId: dbRow[5],
                        time: dbRow[6]
                    };
                    sqliteService.executeNonQuery(
                        `UPDATE gamelog_join_leave SET location = @location WHERE id = @rowId`,
                        {
                            '@rowId': travelingEntry.rowId,
                            '@location': onPlayingJoin.location
                        }
                    );
                },
                'SELECT * FROM gamelog_join_leave WHERE type = "OnPlayerJoined" AND display_name = @displayName AND created_at <= @created_at ORDER BY created_at DESC LIMIT 1',
                {
                    '@displayName': travelingEntry.displayName,
                    '@created_at': travelingEntry.created_at
                }
            );
        });
    }

    async fixNegativeGPS() {
        var gpsTables = [];
        await sqliteService.execute((dbRow) => {
            gpsTables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_gps'`);
        gpsTables.forEach((tableName) => {
            sqliteService.executeNonQuery(
                `UPDATE ${tableName} SET time = 0 WHERE time < 0`
            );
        });
    }

    async getGameLogInstancesTime() {
        var instances = new Map();
        await sqliteService.execute((dbRow) => {
            var time = 0;
            var location = dbRow[0];
            if (dbRow[1]) {
                time = dbRow[1];
            }
            var ref = instances.get(location);
            if (typeof ref !== 'undefined') {
                time += ref;
            }
            instances.set(location, time);
        }, 'SELECT location, time FROM gamelog_location');
        return instances;
    }

    async getBrokenLeaveEntries() {
        var instances = await this.getGameLogInstancesTime();
        var badEntries = [];
        await sqliteService.execute((dbRow) => {
            if (typeof dbRow[1] === 'number') {
                var ref = instances.get(dbRow[0]);
                if (typeof ref !== 'undefined' && dbRow[1] > ref) {
                    badEntries.push(dbRow[2]);
                }
            }
        }, `SELECT location, time, id FROM gamelog_join_leave WHERE type = 'OnPlayerLeft' AND time > 0`);
        return badEntries;
    }

    async fixBrokenLeaveEntries() {
        var badEntries = await this.getBrokenLeaveEntries();
        var badEntriesList = '';
        var count = badEntries.length;
        badEntries.forEach((entry) => {
            count--;
            if (count === 0) {
                badEntriesList = badEntriesList.concat(entry);
            } else {
                badEntriesList = badEntriesList.concat(`${entry}, `);
            }
        });

        sqliteService.executeNonQuery(
            `UPDATE gamelog_join_leave SET time = 0 WHERE id IN (${badEntriesList})`
        );
    }

    async getUserIdFromDisplayName(displayName) {
        var userId = '';
        await sqliteService.execute(
            (row) => {
                userId = row[0];
            },
            `SELECT user_id FROM gamelog_join_leave WHERE display_name = @displayName AND user_id != "" ORDER BY id DESC LIMIT 1`,
            {
                '@displayName': displayName
            }
        );
        return userId;
    }

    async fixBrokenGroupInvites() {
        var notificationTables = [];
        await sqliteService.execute((dbRow) => {
            notificationTables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_notifications'`);
        notificationTables.forEach((tableName) => {
            sqliteService.executeNonQuery(
                `DELETE FROM ${tableName} WHERE type LIKE '%.%'`
            );
        });
    }

    async fixBrokenNotifications() {
        await sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_notifications WHERE (created_at is null or created_at = '')`
        );
    }

    async fixBrokenGroupChange() {
        await sqliteService.executeNonQuery(
            `DELETE FROM ${Database.userPrefix}_notifications WHERE type = 'groupChange' AND created_at < '2024-04-23T03:00:00.000Z'`
        );
    }

    async updateTableForGroupNames() {
        var tables = [];
        await sqliteService.execute((dbRow) => {
            tables.push(dbRow[0]);
        }, `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE '%_feed_gps' OR name LIKE '%_feed_online_offline' OR name = 'gamelog_location'`);
        for (var tableName of tables) {
            try {
                await sqliteService.executeNonQuery(
                    `SELECT group_name FROM ${tableName} LIMIT 1`
                );
            } catch (e) {
                if (e.indexOf('no such column') === -1) {
                    throw e;
                }
                sqliteService.executeNonQuery(
                    `ALTER TABLE ${tableName} ADD group_name TEXT DEFAULT ''`
                );
            }
        }
        // Fix gamelog_location column typo
        try {
            await sqliteService.executeNonQuery(
                `SELECT groupName FROM gamelog_location LIMIT 1`
            );
            await sqliteService.executeNonQuery(
                `ALTER TABLE gamelog_location DROP COLUMN groupName`
            );
        } catch (e) {
            if (e.indexOf('no such column') === -1) {
                throw e;
            }
        }
    }

    async vacuum() {
        await sqliteService.executeNonQuery('VACUUM');
    }

    async setWal() {
        await sqliteService.executeNonQuery('PRAGMA journal_mode=WAL');
    }
}

var self = new Database();
window.database = self;

export { self as default, Database };
