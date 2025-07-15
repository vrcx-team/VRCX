import sqliteService from '../sqlite.js';
import { dbVars } from '../database';

const feed = {
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
        }, `SELECT * FROM ${dbVars.userPrefix}_feed_gps WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${dbVars.userPrefix}_feed_status WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${dbVars.userPrefix}_feed_bio WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${dbVars.userPrefix}_feed_avatar WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
        }, `SELECT * FROM ${dbVars.userPrefix}_feed_online_offline WHERE created_at >= date('${dateOffset}') ORDER BY id DESC`);
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
    },

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

    async lookupFeedDatabase(search, filters, vipList) {
        var search = search.replaceAll("'", "''");
        if (search.startsWith('wrld_') || search.startsWith('grp_')) {
            return this.getFeedByInstanceId(search, filters, vipList);
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
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_gps WHERE (display_name LIKE '%${search}%' OR world_name LIKE '%${search}%' OR group_name LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_status WHERE (display_name LIKE '%${search}%' OR status LIKE '%${search}%' OR status_description LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_bio WHERE (display_name LIKE '%${search}%' OR bio LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_avatar WHERE ((display_name LIKE '%${search}%' OR avatar_name LIKE '%${search}%') ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM ${dbVars.userPrefix}_feed_online_offline WHERE ((display_name LIKE '%${search}%' OR world_name LIKE '%${search}%' OR group_name LIKE '%${search}%') ${query}) ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
        feedDatabase.splice(0, feedDatabase.length - dbVars.maxTableSize);
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
                feedDatabase.unshift(row);
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
                feedDatabase.unshift(row);
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
        feedDatabase.splice(0, feedDatabase.length - dbVars.maxTableSize);
        return feedDatabase;
    }
};

export { feed };
