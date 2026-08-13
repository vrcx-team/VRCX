import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

function escapeSql(value) {
    return String(value).replace(/'/g, "''");
}

const friendGroups = {
    /**
     * 用单个好友的最新群组列表整体替换其关系记录（事务内，先删后插）。
     * @param {string} friendId
     * @param {Array<{groupId: string, joinedAt?: string, membershipStatus?: string, visibility?: string}>} entries
     */
    async replaceFriendGroups(friendId, entries) {
        if (!dbVars.userPrefix || !friendId) {
            return;
        }
        const table = `${dbVars.userPrefix}_friend_groups`;
        const safeFriendId = escapeSql(friendId);
        await sqliteService.executeNonQuery('BEGIN');
        try {
            await sqliteService.executeNonQuery(
                `DELETE FROM ${table} WHERE friend_id = '${safeFriendId}'`
            );
            const now = new Date().toISOString();
            if (entries && entries.length > 0) {
                let values = '';
                for (const entry of entries) {
                    if (!entry || !entry.groupId) {
                        continue;
                    }
                    values += `('${safeFriendId}', '${escapeSql(entry.groupId)}', '${escapeSql(entry.joinedAt || '')}', '${escapeSql(entry.membershipStatus || '')}', '${escapeSql(entry.visibility || '')}', '${now}'),`;
                }
                if (values) {
                    values = values.slice(0, -1);
                    await sqliteService.executeNonQuery(
                        `INSERT OR REPLACE INTO ${table} (friend_id, group_id, joined_at, membership_status, visibility, fetched_at) VALUES ${values}`
                    );
                }
            } else {
                // 无可见群的好友：写标记行记录已检查时间（供增量同步跳过）
                await sqliteService.executeNonQuery(
                    `INSERT OR REPLACE INTO ${table} (friend_id, group_id, joined_at, membership_status, visibility, fetched_at) VALUES (@friend_id, '', '', '', '', @now)`,
                    {
                        '@friend_id': friendId,
                        '@now': now
                    }
                );
            }
            await sqliteService.executeNonQuery('COMMIT');
        } catch (err) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw err;
        }
    },

    /**
     * 好友解除关系时清理其群组关系记录。
     * @param {string} friendId
     */
    async deleteFriendGroups(friendId) {
        if (!dbVars.userPrefix || !friendId) {
            return;
        }
        const table = `${dbVars.userPrefix}_friend_groups`;
        await sqliteService.executeNonQuery(
            `DELETE FROM ${table} WHERE friend_id = @friend_id`,
            {
                '@friend_id': friendId
            }
        );
    },

    /**
     * 查询单个好友加入的群组。
     * @param {string} friendId
     * @returns {Promise<Array<{groupId: string, joinedAt: string, membershipStatus: string, visibility: string, fetchedAt: string}>>}
     */
    async getFriendGroups(friendId) {
        const result = [];
        if (!dbVars.userPrefix || !friendId) {
            return result;
        }
        const table = `${dbVars.userPrefix}_friend_groups`;
        await sqliteService.execute(
            (dbRow) => {
                result.push({
                    groupId: dbRow[0],
                    joinedAt: dbRow[1],
                    membershipStatus: dbRow[2],
                    visibility: dbRow[3],
                    fetchedAt: dbRow[4]
                });
            },
            `SELECT group_id, joined_at, membership_status, visibility, fetched_at FROM ${table} WHERE friend_id = @friend_id`,
            {
                '@friend_id': friendId
            }
        );
        return result;
    },

    /**
     * 每个好友最近一次拉取群组的时间（增量同步判定用）。
     * @returns {Promise<Map<string, string|null>>} friendId -> fetched_at
     */
    async getFriendGroupFetchTimes() {
        const map = new Map();
        if (!dbVars.userPrefix) {
            return map;
        }
        const table = `${dbVars.userPrefix}_friend_groups`;
        await sqliteService.execute((dbRow) => {
            if (dbRow[0]) {
                map.set(dbRow[0], dbRow[1] || null);
            }
        }, `SELECT friend_id, MAX(fetched_at) FROM ${table} GROUP BY friend_id`);
        return map;
    },

    /**
     * 批量写入/更新群实体缓存（分批参数化，免疫 emoji 等特殊字符且远快于逐条）。
     * @param {Array<{id: string, name?: string, shortCode?: string, discriminator?: string, description?: string, iconUrl?: string, bannerUrl?: string, privacy?: string, memberCount?: number}>} groups
     */
    async upsertCacheGroups(groups) {
        if (!dbVars.userPrefix || !groups || groups.length === 0) {
            return;
        }
        const table = `${dbVars.userPrefix}_cache_group`;
        const now = new Date().toISOString();
        // System.Data.SQLite 参数上限约 999，每行 11 个参数 → 每批 80 行
        const BATCH_SIZE = 80;
        await sqliteService.executeNonQuery('BEGIN');
        try {
            for (let i = 0; i < groups.length; i += BATCH_SIZE) {
                const batch = groups.slice(i, i + BATCH_SIZE);
                const rows = [];
                const args = {};
                for (let r = 0; r < batch.length; r++) {
                    const group = batch[r];
                    if (!group || !group.id) {
                        continue;
                    }
                    const memberCount =
                        typeof group.memberCount === 'number' &&
                        Number.isFinite(group.memberCount)
                            ? group.memberCount
                            : 0;
                    rows.push(
                        `(@id${r}, @added_at${r}, @updated_at${r}, @name${r}, @short_code${r}, @discriminator${r}, @description${r}, @icon_url${r}, @banner_url${r}, @privacy${r}, @member_count${r})`
                    );
                    args[`@id${r}`] = group.id;
                    args[`@added_at${r}`] = now;
                    args[`@updated_at${r}`] = now;
                    args[`@name${r}`] = group.name || '';
                    args[`@short_code${r}`] = group.shortCode || '';
                    args[`@discriminator${r}`] = group.discriminator || '';
                    args[`@description${r}`] = group.description || '';
                    args[`@icon_url${r}`] = group.iconUrl || '';
                    args[`@banner_url${r}`] = group.bannerUrl || '';
                    args[`@privacy${r}`] = group.privacy || '';
                    args[`@member_count${r}`] = memberCount;
                }
                if (rows.length > 0) {
                    await sqliteService.executeNonQuery(
                        `INSERT OR REPLACE INTO ${table} (id, added_at, updated_at, name, short_code, discriminator, description, icon_url, banner_url, privacy, member_count) VALUES ${rows.join(',')}`,
                        args
                    );
                }
            }
            await sqliteService.executeNonQuery('COMMIT');
        } catch (err) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw err;
        }
    },

    /**
     * 读取全部已缓存的群实体。
     * @returns {Promise<Map<string, object>>} groupId -> group
     */
    async getCachedGroups() {
        const result = new Map();
        if (!dbVars.userPrefix) {
            return result;
        }
        const table = `${dbVars.userPrefix}_cache_group`;
        await sqliteService.execute((dbRow) => {
            result.set(dbRow[0], {
                id: dbRow[0],
                name: dbRow[1],
                shortCode: dbRow[2],
                discriminator: dbRow[3],
                description: dbRow[4],
                iconUrl: dbRow[5],
                bannerUrl: dbRow[6],
                privacy: dbRow[7],
                memberCount: dbRow[8]
            });
        }, `SELECT id, name, short_code, discriminator, description, icon_url, banner_url, privacy, member_count FROM ${table}`);
        return result;
    },

    /**
     * 聚合查询：按好友加入数排序的热门群组列表。
     * @param {number} [minFriends] 至少多少好友加入才展示
     * @param {number} [limit]
     * @returns {Promise<Array<{groupId: string, name: string, shortCode: string, discriminator: string, description: string, iconUrl: string, bannerUrl: string, privacy: string, memberCount: number, friendCount: number}>>}
     */
    async getPopularGroups(minFriends = 2, limit = 200) {
        const result = [];
        if (!dbVars.userPrefix) {
            return result;
        }
        const groupTable = `${dbVars.userPrefix}_cache_group`;
        const linkTable = `${dbVars.userPrefix}_friend_groups`;
        await sqliteService.execute(
            (dbRow) => {
                result.push({
                    groupId: dbRow[0],
                    name: dbRow[1],
                    shortCode: dbRow[2],
                    discriminator: dbRow[3],
                    description: dbRow[4],
                    iconUrl: dbRow[5],
                    bannerUrl: dbRow[6],
                    privacy: dbRow[7],
                    memberCount: dbRow[8],
                    friendCount: dbRow[9]
                });
            },
            `SELECT g.id, g.name, g.short_code, g.discriminator, g.description, g.icon_url, g.banner_url, g.privacy, g.member_count, COUNT(f.friend_id) AS friend_count
            FROM ${groupTable} g
            INNER JOIN ${linkTable} f ON f.group_id = g.id
            GROUP BY g.id
            HAVING COUNT(f.friend_id) >= @minFriends
            ORDER BY friend_count DESC, g.member_count DESC
            LIMIT @limit`,
            {
                '@minFriends': minFriends,
                '@limit': limit
            }
        );
        return result;
    },

    /**
     * 每个热门群组内已加入的好友 id 列表（头像预览用）。
     * @param {number} [minFriends]
     * @returns {Promise<Map<string, Array<string>>>} groupId -> [friendId, ...]
     */
    async getPopularGroupFriendIds(minFriends = 2) {
        const map = new Map();
        if (!dbVars.userPrefix) {
            return map;
        }
        const linkTable = `${dbVars.userPrefix}_friend_groups`;
        await sqliteService.execute((dbRow) => {
            if (dbRow[0]) {
                const friendIds = dbRow[1]
                    ? dbRow[1].split(',').filter(Boolean)
                    : [];
                map.set(dbRow[0], friendIds);
            }
        }, `SELECT group_id, GROUP_CONCAT(friend_id) FROM ${linkTable} WHERE group_id != '' GROUP BY group_id HAVING COUNT(friend_id) >= ${minFriends}`);
        return map;
    }
};

export { friendGroups };
