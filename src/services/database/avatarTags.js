import sqliteService from '../sqlite.js';

const avatarTags = {
    async getAvatarTags(avatarId) {
        const tags = [];
        await sqliteService.execute(
            (dbRow) => {
                tags.push({ tag: dbRow[0], color: dbRow[1] || null });
            },
            `SELECT tag, color FROM avatar_tags WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
        return tags;
    },

    async getAllAvatarTags() {
        const map = new Map();
        await sqliteService.execute((dbRow) => {
            const avatarId = dbRow[0];
            const tag = dbRow[1];
            const color = dbRow[2] || null;
            if (!map.has(avatarId)) {
                map.set(avatarId, []);
            }
            map.get(avatarId).push({ tag, color });
        }, `SELECT avatar_id, tag, color FROM avatar_tags`);
        return map;
    },

    async getAllDistinctTags() {
        const tags = [];
        await sqliteService.execute((dbRow) => {
            tags.push(dbRow[0]);
        }, `SELECT DISTINCT tag FROM avatar_tags ORDER BY tag`);
        return tags;
    },

    async addAvatarTag(avatarId, tag, color = null) {
        await sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO avatar_tags (avatar_id, tag, color) VALUES (@avatar_id, @tag, @color)`,
            {
                '@avatar_id': avatarId,
                '@tag': tag,
                '@color': color
            }
        );
    },

    async updateAvatarTagColor(avatarId, tag, color) {
        await sqliteService.executeNonQuery(
            `UPDATE avatar_tags SET color = @color WHERE avatar_id = @avatar_id AND tag = @tag`,
            {
                '@avatar_id': avatarId,
                '@tag': tag,
                '@color': color
            }
        );
    },

    async removeAvatarTag(avatarId, tag) {
        await sqliteService.executeNonQuery(
            `DELETE FROM avatar_tags WHERE avatar_id = @avatar_id AND tag = @tag`,
            {
                '@avatar_id': avatarId,
                '@tag': tag
            }
        );
    },

    async removeAllAvatarTags(avatarId) {
        await sqliteService.executeNonQuery(
            `DELETE FROM avatar_tags WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
    }
};

export { avatarTags };
