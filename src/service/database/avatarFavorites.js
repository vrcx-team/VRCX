import sqliteService from '../sqlite.js';
import { dbVars } from '../database';

const avatarFavorites = {
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
    },

    addAvatarToHistory(avatarId) {
        sqliteService.executeNonQuery(
            `INSERT INTO ${dbVars.userPrefix}_avatar_history (avatar_id, created_at, time)
            VALUES (@avatar_id, @created_at, 0)
            ON CONFLICT(avatar_id) DO UPDATE SET created_at = @created_at`,
            {
                '@avatar_id': avatarId,
                '@created_at': new Date().toJSON()
            }
        );
    },

    async getAvatarTimeSpent(avatarId) {
        var ref = {
            timeSpent: 0,
            avatarId
        };
        await sqliteService.execute(
            (row) => {
                ref.timeSpent = row[0];
            },
            `SELECT time FROM ${dbVars.userPrefix}_avatar_history WHERE avatar_id = @avatarId`,
            {
                '@avatarId': avatarId
            }
        );

        return ref;
    },

    addAvatarTimeSpent(avatarId, timeSpent) {
        sqliteService.executeNonQuery(
            `UPDATE ${dbVars.userPrefix}_avatar_history SET time = time + @timeSpent WHERE avatar_id = @avatarId`,
            {
                '@avatarId': avatarId,
                '@timeSpent': timeSpent
            }
        );
    },

    async getAvatarHistory(currentUserId, limit = 100) {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                id: dbRow[0],
                authorId: dbRow[5],
                authorName: dbRow[6],
                created_at: dbRow[7],
                description: dbRow[8],
                imageUrl: dbRow[9],
                name: dbRow[10],
                releaseStatus: dbRow[11],
                thumbnailImageUrl: dbRow[12],
                updated_at: dbRow[13],
                version: dbRow[14]
            };
            data.push(row);
        }, `SELECT * FROM ${dbVars.userPrefix}_avatar_history INNER JOIN cache_avatar ON cache_avatar.id = ${dbVars.userPrefix}_avatar_history.avatar_id WHERE author_id != '${currentUserId}' ORDER BY ${dbVars.userPrefix}_avatar_history.created_at DESC LIMIT ${limit}`);
        return data;
    },

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
    },

    clearAvatarHistory() {
        sqliteService.executeNonQuery(
            `DELETE FROM ${dbVars.userPrefix}_avatar_history`
        );
        sqliteService.executeNonQuery('DELETE FROM cache_avatar');
    },

    addAvatarToFavorites(avatarId, groupName) {
        sqliteService.executeNonQuery(
            'INSERT OR REPLACE INTO favorite_avatar (avatar_id, group_name, created_at) VALUES (@avatar_id, @group_name, @created_at)',
            {
                '@avatar_id': avatarId,
                '@group_name': groupName,
                '@created_at': new Date().toJSON()
            }
        );
    },

    renameAvatarFavoriteGroup(newGroupName, groupName) {
        sqliteService.executeNonQuery(
            `UPDATE favorite_avatar SET group_name = @new_group_name WHERE group_name = @group_name`,
            {
                '@new_group_name': newGroupName,
                '@group_name': groupName
            }
        );
    },

    deleteAvatarFavoriteGroup(groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_avatar WHERE group_name = @group_name`,
            {
                '@group_name': groupName
            }
        );
    },

    removeAvatarFromFavorites(avatarId, groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_avatar WHERE avatar_id = @avatar_id AND group_name = @group_name`,
            {
                '@avatar_id': avatarId,
                '@group_name': groupName
            }
        );
    },

    async getAvatarFavorites() {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                created_at: dbRow[1],
                avatarId: dbRow[2],
                groupName: dbRow[3]
            };
            data.push(row);
        }, 'SELECT * FROM favorite_avatar');
        return data;
    },

    removeAvatarFromCache(avatarId) {
        sqliteService.executeNonQuery(
            `DELETE FROM cache_avatar WHERE id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
    },

    async getAvatarCache() {
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
        }, 'SELECT * FROM cache_avatar');
        return data;
    }
};

export { avatarFavorites };
