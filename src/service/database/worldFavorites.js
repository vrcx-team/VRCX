import sqliteService from '../sqlite.js';

const worldFavorites = {
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
    },

    addWorldToFavorites(worldId, groupName) {
        sqliteService.executeNonQuery(
            'INSERT OR REPLACE INTO favorite_world (world_id, group_name, created_at) VALUES (@world_id, @group_name, @created_at)',
            {
                '@world_id': worldId,
                '@group_name': groupName,
                '@created_at': new Date().toJSON()
            }
        );
    },

    renameWorldFavoriteGroup(newGroupName, groupName) {
        sqliteService.executeNonQuery(
            `UPDATE favorite_world SET group_name = @new_group_name WHERE group_name = @group_name`,
            {
                '@new_group_name': newGroupName,
                '@group_name': groupName
            }
        );
    },

    deleteWorldFavoriteGroup(groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_world WHERE group_name = @group_name`,
            {
                '@group_name': groupName
            }
        );
    },

    removeWorldFromFavorites(worldId, groupName) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_world WHERE world_id = @world_id AND group_name = @group_name`,
            {
                '@world_id': worldId,
                '@group_name': groupName
            }
        );
    },

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
    },

    removeWorldFromCache(worldId) {
        sqliteService.executeNonQuery(
            `DELETE FROM cache_world WHERE id = @world_id`,
            {
                '@world_id': worldId
            }
        );
    },

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
    },

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
};

export { worldFavorites };
