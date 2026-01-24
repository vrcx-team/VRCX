import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const feed = {
    addGPSToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_gps (created_at, user_id, display_name, location, world_name, previous_location, time, group_name) VALUES (@created_at, @user_id, @display_name, @location, @world_name, @previous_location, @time, @group_name)`,
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
    },

    addStatusToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_status (created_at, user_id, display_name, status, status_description, previous_status, previous_status_description) VALUES (@created_at, @user_id, @display_name, @status, @status_description, @previous_status, @previous_status_description)`,
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
    },

    addBioToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_bio (created_at, user_id, display_name, bio, previous_bio) VALUES (@created_at, @user_id, @display_name, @bio, @previous_bio)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@bio': entry.bio,
                '@previous_bio': entry.previousBio
            }
        );
    },

    addAvatarToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_avatar (created_at, user_id, display_name, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url) VALUES (@created_at, @user_id, @display_name, @owner_id, @avatar_name, @current_avatar_image_url, @current_avatar_thumbnail_image_url, @previous_current_avatar_image_url, @previous_current_avatar_thumbnail_image_url)`,
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
    },

    addOnlineOfflineToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_online_offline (created_at, user_id, display_name, type, location, world_name, time, group_name) VALUES (@created_at, @user_id, @display_name, @type, @location, @world_name, @time, @group_name)`,
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
    },

    async searchFeedDatabase(
        search,
        filters,
        vipList,
        maxEntries = dbVars.maxTableSize
    ) {
        if (search.startsWith('wrld_') || search.startsWith('grp_')) {
            return this.getFeedByInstanceId(search, filters, vipList);
        }
        var vipQuery = '';
        var vipArgs = {};
        if (vipList.length > 0) {
            var vipPlaceholders = [];
            vipList.forEach((vip, i) => {
                var key = `@vip_${i}`;
                vipArgs[key] = vip;
                vipPlaceholders.push(key);
            });
            vipQuery = `AND user_id IN (${vipPlaceholders.join(', ')})`;
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
        var searchLike = `%${search}%`;
        var selects = [];
        var baseColumns = [
            'id',
            'created_at',
            'user_id',
            'display_name',
            'type',
            'location',
            'world_name',
            'previous_location',
            'time',
            'group_name',
            'status',
            'status_description',
            'previous_status',
            'previous_status_description',
            'bio',
            'previous_bio',
            'owner_id',
            'avatar_name',
            'current_avatar_image_url',
            'current_avatar_thumbnail_image_url',
            'previous_current_avatar_image_url',
            'previous_current_avatar_thumbnail_image_url'
        ].join(', ');
        if (gps) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE (display_name LIKE @searchLike OR world_name LIKE @searchLike OR group_name LIKE @searchLike) ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (status) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Status' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, status, status_description, previous_status, previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_status WHERE (display_name LIKE @searchLike OR status LIKE @searchLike OR status_description LIKE @searchLike) ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (bio) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Bio' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, bio, previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_bio WHERE (display_name LIKE @searchLike OR bio LIKE @searchLike) ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (avatar) {
            var avatarQuery = '';
            if (aviPrivate) {
                avatarQuery = 'AND user_id = owner_id';
            } else if (aviPublic) {
                avatarQuery = 'AND user_id != owner_id';
            }
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Avatar' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_avatar WHERE (display_name LIKE @searchLike OR avatar_name LIKE @searchLike) ${avatarQuery} ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
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
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE (display_name LIKE @searchLike OR world_name LIKE @searchLike OR group_name LIKE @searchLike) ${query} ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (selects.length === 0) {
            return [];
        }
        var feedDatabase = [];
        var args = {
            '@searchLike': searchLike,
            '@limit': maxEntries,
            '@perTable': maxEntries,
            ...vipArgs
        };
        await sqliteService.execute(
            (dbRow) => {
                var type = dbRow[4];
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type
                };
                switch (type) {
                    case 'GPS':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.previousLocation = dbRow[7];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                    case 'Status':
                        row.status = dbRow[10];
                        row.statusDescription = dbRow[11];
                        row.previousStatus = dbRow[12];
                        row.previousStatusDescription = dbRow[13];
                        break;
                    case 'Bio':
                        row.bio = dbRow[14];
                        row.previousBio = dbRow[15];
                        break;
                    case 'Avatar':
                        row.ownerId = dbRow[16];
                        row.avatarName = dbRow[17];
                        row.currentAvatarImageUrl = dbRow[18];
                        row.currentAvatarThumbnailImageUrl = dbRow[19];
                        row.previousCurrentAvatarImageUrl = dbRow[20];
                        row.previousCurrentAvatarThumbnailImageUrl = dbRow[21];
                        break;
                    case 'Online':
                    case 'Offline':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                }
                feedDatabase.push(row);
            },
            `SELECT ${baseColumns} FROM (${selects.join(' UNION ALL ')}) ORDER BY created_at DESC, id DESC LIMIT @limit`,
            args
        );
        return feedDatabase;
    },

    async lookupFeedDatabase(
        filters,
        vipList,
        maxEntries = dbVars.maxTableSize
    ) {
        var vipQuery = '';
        var vipArgs = {};
        if (vipList.length > 0) {
            var vipPlaceholders = [];
            vipList.forEach((vip, i) => {
                var key = `@vip_${i}`;
                vipArgs[key] = vip;
                vipPlaceholders.push(key);
            });
            vipQuery = `AND user_id IN (${vipPlaceholders.join(', ')})`;
        }
        var gps = true;
        var status = true;
        var bio = true;
        var avatar = true;
        var online = true;
        var offline = true;
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
        var selects = [];
        var baseColumns = [
            'id',
            'created_at',
            'user_id',
            'display_name',
            'type',
            'location',
            'world_name',
            'previous_location',
            'time',
            'group_name',
            'status',
            'status_description',
            'previous_status',
            'previous_status_description',
            'bio',
            'previous_bio',
            'owner_id',
            'avatar_name',
            'current_avatar_image_url',
            'current_avatar_thumbnail_image_url',
            'previous_current_avatar_image_url',
            'previous_current_avatar_thumbnail_image_url'
        ].join(', ');
        if (gps) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (status) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Status' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, status, status_description, previous_status, previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_status WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (bio) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Bio' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, bio, previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_bio WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (avatar) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Avatar' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_avatar WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
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
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE 1=1 ${query} ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (selects.length === 0) {
            return [];
        }
        var feedDatabase = [];
        var args = {
            '@limit': maxEntries,
            '@perTable': maxEntries,
            ...vipArgs
        };
        await sqliteService.execute(
            (dbRow) => {
                var type = dbRow[4];
                var row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type
                };
                switch (type) {
                    case 'GPS':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.previousLocation = dbRow[7];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                    case 'Status':
                        row.status = dbRow[10];
                        row.statusDescription = dbRow[11];
                        row.previousStatus = dbRow[12];
                        row.previousStatusDescription = dbRow[13];
                        break;
                    case 'Bio':
                        row.bio = dbRow[14];
                        row.previousBio = dbRow[15];
                        break;
                    case 'Avatar':
                        row.ownerId = dbRow[16];
                        row.avatarName = dbRow[17];
                        row.currentAvatarImageUrl = dbRow[18];
                        row.currentAvatarThumbnailImageUrl = dbRow[19];
                        row.previousCurrentAvatarImageUrl = dbRow[20];
                        row.previousCurrentAvatarThumbnailImageUrl = dbRow[21];
                        break;
                    case 'Online':
                    case 'Offline':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                }
                feedDatabase.push(row);
            },
            `SELECT ${baseColumns} FROM (${selects.join(' UNION ALL ')}) ORDER BY created_at DESC, id DESC LIMIT @limit`,
            args
        );
        return feedDatabase;
    },

    async getFeedByInstanceId(instanceId, filters, vipList) {
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
                feedDatabase.push(row);
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_gps WHERE location LIKE '%${instanceId}%' ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
                feedDatabase.push(row);
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_online_offline WHERE (location LIKE '%${instanceId}%' ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
        if (feedDatabase.length > dbVars.maxTableSize) {
            feedDatabase.splice(0, feedDatabase.length - dbVars.maxTableSize);
        }
        return feedDatabase;
    }
};

export { feed };
