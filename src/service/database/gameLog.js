import sqliteService from '../sqlite.js';
import { dbVars } from '../database';

const gameLog = {
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
    },

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
    },

    updateGamelogLocationTimeToDatabase(entry) {
        sqliteService.executeNonQuery(
            `UPDATE gamelog_location SET time = @time WHERE created_at = @created_at`,
            {
                '@created_at': entry.created_at,
                '@time': entry.time
            }
        );
    },

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
    },

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
    },

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
    },

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
    },

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
    },

    addGamelogEventToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO gamelog_event (created_at, data) VALUES (@created_at, @data)`,
            {
                '@created_at': entry.created_at,
                '@data': entry.data
            }
        );
    },

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
    },

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
    },

    async getVisitCount(worldId) {
        var ref = {
            visitCount: 0,
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
    },

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
    },

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
    },

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
    },

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
    },

    async getUserStats(input, inCurrentWorld) {
        var i = 0;
        var instances = new Set();
        var ref = {
            timeSpent: 0,
            lastSeen: '',
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
                    ref.lastSeen = row[0];
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
    },

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
                    lastSeen: dbRow[0],
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
    },

    async getGameLogByLocation(instanceId, filters) {
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
            }, `SELECT * FROM gamelog_location WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_join_leave WHERE (location LIKE '%${instanceId}%' AND user_id != '${dbVars.userId}') ${query} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_portal_spawn WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_video_play WHERE location LIKE '%${instanceId}%' ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_resource_load WHERE location LIKE '%${instanceId}%' ${checkString} ${checkImage} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
        gamelogDatabase.splice(0, gamelogDatabase.length - dbVars.maxTableSize);
        return gamelogDatabase;
    },

    /**
     * Lookup the game log database for a specific search term
     * @param {string} search The search term
     * @param {Array} filters The filters to apply
     * @param {Array} [vipList] The list of VIP users
     * @returns {Promise<any[]>} The game log data
     */

    async lookupGameLogDatabase(search, filters, vipList = []) {
        var search = search.replaceAll("'", "''");
        if (search.startsWith('wrld_') || search.startsWith('grp_')) {
            return this.getGameLogByLocation(search, filters);
        }
        let vipQuery = '';
        if (vipList.length > 0) {
            vipQuery = 'AND user_id IN (';
            for (var i = 0; i < vipList.length; i++) {
                vipQuery += `'${vipList[i].replaceAll("'", "''")}'`;
                if (i < vipList.length - 1) {
                    vipQuery += ', ';
                }
            }
            vipQuery += ')';
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
            }, `SELECT * FROM gamelog_location WHERE world_name LIKE '%${search}%' OR group_name LIKE '%${search}%' ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_join_leave WHERE (display_name LIKE '%${search}%' AND user_id != '${dbVars.userId}') ${vipQuery} ${query} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_portal_spawn WHERE (display_name LIKE '%${search}%' OR world_name LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_event WHERE data LIKE '%${search}%' ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_external WHERE (display_name LIKE '%${search}%' OR message LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_video_play WHERE (video_url LIKE '%${search}%' OR video_name LIKE '%${search}%' OR display_name LIKE '%${search}%') ${vipQuery} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
            }, `SELECT * FROM gamelog_resource_load WHERE resource_url LIKE '%${search}%' ${checkString} ${checkImage} ORDER BY id DESC LIMIT ${dbVars.maxTableSize}`);
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
        gamelogDatabase.splice(0, gamelogDatabase.length - dbVars.maxTableSize);
        return gamelogDatabase;
    },

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
    },

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
    },

    async getPreviousInstancesByUserId(input) {
        var groupingTimeTolerance = 1 * 60 * 60 * 1000; // 1 hour
        var data = new Set();
        var currentGroup;
        var prevEvent;

        await sqliteService.execute(
            (dbRow) => {
                var [
                    created_at_iso,
                    created_at_ts,
                    location,
                    time,
                    worldName,
                    groupName,
                    eventId,
                    eventType
                ] = dbRow;

                if (
                    !currentGroup ||
                    currentGroup.location !== location ||
                    (created_at_ts - currentGroup.last_ts >
                        groupingTimeTolerance && // groups multiple OnPlayerJoined and OnPlayerLeft together if they are within time tolerance limit
                        !(
                            prevEvent === 'OnPlayerJoined' &&
                            eventType === 'OnPlayerLeft'
                        )) // allows OnPlayerLeft to connect with nearby OnPlayerJoined
                ) {
                    currentGroup = {
                        created_at: created_at_iso,
                        location,
                        time,
                        worldName,
                        groupName,
                        events: [eventId],
                        last_ts: created_at_ts
                    };

                    data.add(currentGroup);
                } else {
                    currentGroup.time += time;
                    currentGroup.last_ts = created_at_ts;
                    currentGroup.events.push(eventId);
                }

                prevEvent = eventType;
            },
            `
            WITH grouped_locations AS (
                SELECT DISTINCT location, world_name, group_name
                FROM gamelog_location
            )
            SELECT gamelog_join_leave.created_at, strftime("%s", gamelog_join_leave.created_at) * 1000 created_at_ts, gamelog_join_leave.location, gamelog_join_leave.time, grouped_locations.world_name, grouped_locations.group_name, gamelog_join_leave.id, gamelog_join_leave.type
            FROM gamelog_join_leave
            INNER JOIN grouped_locations ON gamelog_join_leave.location = grouped_locations.location
            WHERE user_id = @userId OR display_name = @displayName
            ORDER BY gamelog_join_leave.id ASC`,
            {
                '@userId': input.id,
                '@displayName': input.displayName
            }
        );

        return data;
    },

    async getPreviousInstancesByWorldId(input) {
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
    },

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
    },

    async getPreviousDisplayNamesByUserId(ref) {
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
    },

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
    },

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
    },

    /**
     *
     * @param {string} startDate: utc string of startOfDay
     * @param {string} endDate: utc string endOfDay
     * @returns
     */
    async getInstanceActivity(startDate, endDate) {
        const currentUserData = [];
        const detailData = new Map();
        await sqliteService.execute(
            (row) => {
                const rowData = {
                    id: row[0],
                    created_at: row[1],
                    type: row[2],
                    display_name: row[3],
                    location: row[4],
                    user_id: row[5],
                    time: row[6]
                };

                // skip dirty data
                if (!rowData.location || rowData.location === 'traveling') {
                    return;
                }

                if (rowData.user_id === dbVars.userId) {
                    currentUserData.push(rowData);
                }
                const instanceData = detailData.get(rowData.location);

                detailData.set(rowData.location, [
                    ...(instanceData || []),
                    rowData
                ]);
            },
            `SELECT
                     *
                FROM
                    gamelog_join_leave
                WHERE type = "OnPlayerLeft"
                    AND (
                        strftime('%Y-%m-%dT%H:%M:%SZ', created_at, '-' || (time * 1.0 / 1000) || ' seconds') BETWEEN @utc_start_date AND @utc_end_date
                        OR created_at BETWEEN @utc_start_date AND @utc_end_date
                    );`,
            {
                '@utc_start_date': startDate,
                '@utc_end_date': endDate
            }
        );

        return { currentUserData, detailData };
    },

    /**
     * Get the All Date of Instance Activity for the current user
     * @returns {Promise<null>}
     */
    async getDateOfInstanceActivity() {
        let result = [];
        await sqliteService.execute(
            (row) => {
                result.push(row[0]);
            },
            `SELECT created_at 
                FROM gamelog_join_leave 
                WHERE user_id = @userId`,
            {
                '@userId': dbVars.userId
            }
        );
        return result;
    },

    async getInstanceJoinHistory() {
        var oneWeekAgo = new Date(Date.now() - 604800000).toJSON();
        var instances = new Map();
        await sqliteService.execute(
            (row) => {
                if (!instances.has(row[1])) {
                    var epoch = new Date(row[0]).getTime();
                    instances.set(row[1], epoch);
                }
            },
            `SELECT created_at, location FROM gamelog_join_leave WHERE user_id = @userId AND created_at > @created_at ORDER BY created_at DESC`,
            {
                '@userId': dbVars.userId,
                '@created_at': oneWeekAgo
            }
        );
        return instances;
    },

    deleteGameLogInstanceByInstanceId(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_location WHERE location = @location`,
            {
                '@location': input.location
            }
        );
    },

    deleteGameLogInstance(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_join_leave WHERE (user_id = @user_id OR display_name = @displayName) AND (location = @location) AND (id in (${input.events.join(',')}))`,
            {
                '@user_id': input.id,
                '@displayName': input.displayName,
                '@location': input.location
            }
        );
    },

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
    },

    deleteGameLogVideoPlay(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_video_play WHERE created_at = @created_at AND video_url = @video_url AND location = @location`,
            {
                '@created_at': input.created_at,
                '@video_url': input.videoUrl,
                '@location': input.location
            }
        );
    },

    deleteGameLogEvent(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_event WHERE created_at = @created_at AND data = @data`,
            {
                '@created_at': input.created_at,
                '@data': input.data
            }
        );
    },

    deleteGameLogExternal(input) {
        sqliteService.executeNonQuery(
            `DELETE FROM gamelog_external WHERE created_at = @created_at AND message = @message`,
            {
                '@created_at': input.created_at,
                '@message': input.message
            }
        );
    },

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
};

export { gameLog };
