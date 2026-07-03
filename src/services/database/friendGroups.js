import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

// Keep well under SQLite's SQLITE_MAX_VARIABLE_NUMBER (999 on older builds)
// even with several columns per row.
const INSERT_BATCH_SIZE = 100;

/**
 * Insert rows using fully parameterized placeholders (no manual string
 * escaping/concatenation of values) so arbitrary text - e.g. group names -
 * can never be misinterpreted as SQL syntax.
 * @param {string} table
 * @param {string[]} columns
 * @param {any[][]} rows
 */
async function insertRowsParameterized(table, columns, rows) {
    if (rows.length === 0) {
        return;
    }
    for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
        const batch = rows.slice(start, start + INSERT_BATCH_SIZE);
        const args = {};
        const valueClauses = batch.map((row, rowIndex) => {
            const placeholders = row.map((value, colIndex) => {
                const paramName = `@p${rowIndex}_${colIndex}`;
                args[paramName] = value;
                return paramName;
            });
            return `(${placeholders.join(', ')})`;
        });
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES ${valueClauses.join(', ')}`,
            args
        );
    }
}

const friendGroups = {
    async getFriendGroupsSnapshot() {
        const snapshot = {
            links: new Map(),
            groups: new Map(),
            meta: new Map()
        };
        if (!dbVars.userPrefix) {
            return snapshot;
        }
        const linkTable = `${dbVars.userPrefix}_friend_groups_links`;
        const infoTable = `${dbVars.userPrefix}_friend_groups_info`;
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            const groupId = dbRow[1];
            if (!friendId || !groupId) {
                return;
            }
            let list = snapshot.links.get(friendId);
            if (!list) {
                list = [];
                snapshot.links.set(friendId, list);
            }
            list.push(groupId);
        }, `SELECT friend_id, group_id FROM ${linkTable}`);
        await sqliteService.execute((dbRow) => {
            const groupId = dbRow[0];
            if (!groupId) {
                return;
            }
            snapshot.groups.set(groupId, {
                name: dbRow[1] || '',
                shortCode: dbRow[2] || '',
                discriminator: dbRow[3] || '',
                iconUrl: dbRow[4] || '',
                bannerUrl: dbRow[5] || '',
                memberCount: Number(dbRow[6]) || 0,
                ownerId: dbRow[7] || '',
                updatedAt: dbRow[8] || ''
            });
        }, `SELECT group_id, name, short_code, discriminator, icon_url, banner_url, member_count, owner_id, updated_at FROM ${infoTable}`);
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            if (!friendId) {
                return;
            }
            snapshot.meta.set(friendId, {
                lastFetchedAt: dbRow[1] || null,
                unavailable: dbRow[2] === 1
            });
        }, `SELECT friend_id, last_fetched_at, unavailable FROM ${metaTable}`);
        return snapshot;
    },

    async saveFriendGroupsSnapshot(linkEntries, groupInfoEntries) {
        if (!dbVars.userPrefix) {
            return;
        }
        const linkTable = `${dbVars.userPrefix}_friend_groups_links`;
        const infoTable = `${dbVars.userPrefix}_friend_groups_info`;
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        const links = linkEntries instanceof Map ? linkEntries : new Map();
        const groupInfos =
            groupInfoEntries instanceof Map ? groupInfoEntries : new Map();
        await sqliteService.executeNonQuery('BEGIN');
        try {
            // Keep links for friends we know are currently unavailable (private/blocked),
            // remove everything else so stale links don't linger.
            await sqliteService.executeNonQuery(
                `DELETE FROM ${linkTable} WHERE friend_id NOT IN (SELECT friend_id FROM ${metaTable} WHERE unavailable = 1)`
            );
            if (links.size === 0 && groupInfos.size === 0) {
                await sqliteService.executeNonQuery('COMMIT');
                return;
            }
            // Also clean links for friends in the new entries even if they were
            // previously marked unavailable - we have fresh data for them now.
            const friendIdsToClean = Array.from(links.keys()).filter(Boolean);
            if (friendIdsToClean.length > 0) {
                const args = {};
                const placeholders = friendIdsToClean.map((friendId, i) => {
                    const paramName = `@f${i}`;
                    args[paramName] = friendId;
                    return paramName;
                });
                await sqliteService.executeNonQuery(
                    `DELETE FROM ${linkTable} WHERE friend_id IN (${placeholders.join(', ')})`,
                    args
                );
            }
            const linkRows = [];
            links.forEach((groupIds, friendId) => {
                if (!friendId) {
                    return;
                }
                const collection = Array.isArray(groupIds) ? groupIds : [];
                for (const groupId of collection) {
                    if (!groupId) {
                        continue;
                    }
                    linkRows.push([friendId, groupId]);
                }
            });
            await insertRowsParameterized(
                linkTable,
                ['friend_id', 'group_id'],
                linkRows
            );
            if (groupInfos.size > 0) {
                const now = new Date().toISOString();
                const infoRows = [];
                groupInfos.forEach((info, groupId) => {
                    if (!groupId) {
                        return;
                    }
                    const memberCount = Number.isFinite(info?.memberCount)
                        ? info.memberCount
                        : 0;
                    infoRows.push([
                        groupId,
                        info?.name || '',
                        info?.shortCode || '',
                        info?.discriminator || '',
                        info?.iconUrl || '',
                        info?.bannerUrl || '',
                        memberCount,
                        info?.ownerId || '',
                        now
                    ]);
                });
                await insertRowsParameterized(
                    infoTable,
                    [
                        'group_id',
                        'name',
                        'short_code',
                        'discriminator',
                        'icon_url',
                        'banner_url',
                        'member_count',
                        'owner_id',
                        'updated_at'
                    ],
                    infoRows
                );
            }
            await sqliteService.executeNonQuery('COMMIT');
        } catch (err) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw err;
        }
    },

    async upsertFriendGroupsMeta(friendId, { lastFetchedAt, unavailable }) {
        if (!dbVars.userPrefix || !friendId) {
            return;
        }
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${metaTable} (friend_id, last_fetched_at, unavailable) VALUES (@friend_id, @last_fetched_at, @unavailable)`,
            {
                '@friend_id': friendId,
                '@last_fetched_at': lastFetchedAt || new Date().toISOString(),
                '@unavailable': unavailable ? 1 : 0
            }
        );
    },

    async bulkUpsertFriendGroupsMeta(entries) {
        if (!dbVars.userPrefix || !entries || entries.size === 0) {
            return;
        }
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        const now = new Date().toISOString();
        const rows = [];
        entries.forEach(({ unavailable }, friendId) => {
            if (!friendId) return;
            rows.push([friendId, now, unavailable ? 1 : 0]);
        });
        await insertRowsParameterized(
            metaTable,
            ['friend_id', 'last_fetched_at', 'unavailable'],
            rows
        );
    },

    async getFriendGroupsMeta() {
        const metaMap = new Map();
        if (!dbVars.userPrefix) {
            return metaMap;
        }
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            if (friendId) {
                metaMap.set(friendId, {
                    lastFetchedAt: dbRow[1] || null,
                    unavailable: dbRow[2] === 1
                });
            }
        }, `SELECT friend_id, last_fetched_at, unavailable FROM ${metaTable}`);
        return metaMap;
    }
};

export { friendGroups };
