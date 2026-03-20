import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const activityCache = {
    /**
     * @param {string} userId
     * @returns {Promise<{
     *   userId: string,
     *   updatedAt: string,
     *   isSelf: boolean,
     *   sourceLastCreatedAt: string,
     *   pendingSessionStartAt: number | null
     * } | null>}
     */
    async getActivityCacheMeta(userId) {
        let row = null;
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    userId: dbRow[0],
                    updatedAt: dbRow[1],
                    isSelf: Boolean(dbRow[2]),
                    sourceLastCreatedAt: dbRow[3] || '',
                    pendingSessionStartAt:
                        typeof dbRow[4] === 'number' ? dbRow[4] : null
                };
            },
            `SELECT user_id, updated_at, is_self, source_last_created_at, pending_session_start_at
             FROM ${dbVars.userPrefix}_activity_cache_meta
             WHERE user_id = @userId`,
            { '@userId': userId }
        );
        return row;
    },

    /**
     * @param {string} userId
     * @returns {Promise<Array<{start: number, end: number}>>}
     */
    async getActivityCacheSessions(userId) {
        const sessions = [];
        await sqliteService.execute(
            (dbRow) => {
                sessions.push({
                    start: dbRow[0],
                    end: dbRow[1]
                });
            },
            `SELECT start_at, end_at
             FROM ${dbVars.userPrefix}_activity_cache_sessions
             WHERE user_id = @userId
             ORDER BY start_at`,
            { '@userId': userId }
        );
        return sessions;
    },

    /**
     * @param {string} userId
     * @returns {Promise<{
     *   userId: string,
     *   updatedAt: string,
     *   isSelf: boolean,
     *   sourceLastCreatedAt: string,
     *   pendingSessionStartAt: number | null,
     *   sessions: Array<{start: number, end: number}>
     * } | null>}
     */
    async getActivityCache(userId) {
        const meta = await this.getActivityCacheMeta(userId);
        if (!meta) {
            return null;
        }
        const sessions = await this.getActivityCacheSessions(userId);
        return {
            ...meta,
            sessions
        };
    },

    /**
     * @param {string} userId
     * @returns {Promise<{start: number, end: number} | null>}
     */
    async getLastActivityCacheSession(userId) {
        let row = null;
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    start: dbRow[0],
                    end: dbRow[1]
                };
            },
            `SELECT start_at, end_at
             FROM ${dbVars.userPrefix}_activity_cache_sessions
             WHERE user_id = @userId
             ORDER BY start_at DESC
             LIMIT 1`,
            { '@userId': userId }
        );
        return row;
    },

    /**
     * @param {{
     *   userId: string,
     *   updatedAt: string,
     *   isSelf: boolean,
     *   sourceLastCreatedAt: string,
     *   pendingSessionStartAt: number | null,
     *   sessions: Array<{start: number, end: number}>
     * }} entry
     * @returns {Promise<void>}
     */
    async replaceActivityCache(entry) {
        await sqliteService.executeNonQuery('BEGIN');
        try {
            await sqliteService.executeNonQuery(
                `DELETE FROM ${dbVars.userPrefix}_activity_cache_sessions WHERE user_id = @userId`,
                { '@userId': entry.userId }
            );
            await upsertSessions(entry.userId, entry.sessions);
            await upsertMeta(entry);
            await sqliteService.executeNonQuery('COMMIT');
        } catch (error) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw error;
        }
    },

    /**
     * @param {{
     *   userId: string,
     *   updatedAt: string,
     *   isSelf: boolean,
     *   sourceLastCreatedAt: string,
     *   pendingSessionStartAt: number | null,
     *   sessions: Array<{start: number, end: number}>,
     *   replaceLastSession?: {start: number, end: number} | null
     * }} entry
     * @returns {Promise<void>}
     */
    async appendActivityCache(entry) {
        await sqliteService.executeNonQuery('BEGIN');
        try {
            if (entry.replaceLastSession) {
                await sqliteService.executeNonQuery(
                    `DELETE FROM ${dbVars.userPrefix}_activity_cache_sessions
                     WHERE user_id = @userId AND start_at = @start AND end_at = @end`,
                    {
                        '@userId': entry.userId,
                        '@start': entry.replaceLastSession.start,
                        '@end': entry.replaceLastSession.end
                    }
                );
            }
            await upsertSessions(entry.userId, entry.sessions);
            await upsertMeta(entry);
            await sqliteService.executeNonQuery('COMMIT');
        } catch (error) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw error;
        }
    },

    /**
     * @param {{
     *   userId: string,
     *   updatedAt: string,
     *   isSelf: boolean,
     *   sourceLastCreatedAt: string,
     *   pendingSessionStartAt: number | null
     * }} entry
     * @returns {Promise<void>}
     */
    async touchActivityCacheMeta(entry) {
        await upsertMeta(entry);
    }
};

async function upsertMeta(entry) {
    await sqliteService.executeNonQuery(
        `INSERT OR REPLACE INTO ${dbVars.userPrefix}_activity_cache_meta
         (user_id, updated_at, is_self, source_last_created_at, pending_session_start_at)
         VALUES (@user_id, @updated_at, @is_self, @source_last_created_at, @pending_session_start_at)`,
        {
            '@user_id': entry.userId,
            '@updated_at': entry.updatedAt,
            '@is_self': entry.isSelf ? 1 : 0,
            '@source_last_created_at': entry.sourceLastCreatedAt || '',
            '@pending_session_start_at': entry.pendingSessionStartAt
        }
    );
}

async function upsertSessions(userId, sessions = []) {
    const chunkSize = 250;
    for (let chunkStart = 0; chunkStart < sessions.length; chunkStart += chunkSize) {
        const chunk = sessions.slice(chunkStart, chunkStart + chunkSize);
        const args = {};
        const values = chunk.map((session, index) => {
            const suffix = `${chunkStart + index}`;
            args[`@user_id_${suffix}`] = userId;
            args[`@start_at_${suffix}`] = session.start;
            args[`@end_at_${suffix}`] = session.end;
            return `(@user_id_${suffix}, @start_at_${suffix}, @end_at_${suffix})`;
        });

        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${dbVars.userPrefix}_activity_cache_sessions
             (user_id, start_at, end_at)
             VALUES ${values.join(', ')}`,
            args
        );
    }
}

export { activityCache };
