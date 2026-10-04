import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

function parseBioLinks(value) {
    try {
        const links = JSON.parse(value);
        return Array.isArray(links) ? links : [];
    } catch {
        return [];
    }
}

function parseRow(dbRow) {
    return {
        userId: dbRow[0],
        bio: dbRow[1],
        bioLinks: parseBioLinks(dbRow[2]),
        updatedAt: dbRow[3]
    };
}

const userProfile = {
    async getUserProfile(userId) {
        let row = null;
        await sqliteService.execute(
            (dbRow) => {
                row = parseRow(dbRow);
            },
            `SELECT user_id, bio, bio_links, updated_at FROM ${dbVars.userPrefix}_user_profile WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
        return row;
    },

    async getAllUserProfiles() {
        const data = [];
        await sqliteService.execute((dbRow) => {
            data.push(parseRow(dbRow));
        }, `SELECT user_id, bio, bio_links, updated_at FROM ${dbVars.userPrefix}_user_profile`);
        return data;
    },

    setUserProfile(profile) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${dbVars.userPrefix}_user_profile (user_id, bio, bio_links, updated_at) VALUES (@user_id, @bio, @bio_links, @updated_at)`,
            {
                '@user_id': profile.id,
                '@bio': profile.bio,
                '@bio_links': JSON.stringify(profile.bioLinks),
                '@updated_at': new Date().toJSON()
            }
        );
    },

    deleteUserProfile(userId) {
        sqliteService.executeNonQuery(`DELETE FROM ${dbVars.userPrefix}_user_profile WHERE user_id = @user_id`, {
            '@user_id': userId
        });
    }
};

export { userProfile, parseBioLinks };
