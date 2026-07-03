import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

function escapeSql(value) {
    return String(value ?? '').replace(/'/g, "''");
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
            let idsToClean = '';
            links.forEach((_, friendId) => {
                if (!friendId) return;
                idsToClean += `'${escapeSql(friendId)}',`;
            });
            if (idsToClean) {
                idsToClean = idsToClean.slice(0, -1);
                await sqliteService.executeNonQuery(
                    `DELETE FROM ${linkTable} WHERE friend_id IN (${idsToClean})`
                );
            }
            let linkValues = '';
            links.forEach((groupIds, friendId) => {
                if (!friendId) {
                    return;
                }
                const safeFriendId = escapeSql(friendId);
                const collection = Array.isArray(groupIds) ? groupIds : [];
                for (const groupId of collection) {
                    if (!groupId) {
                        continue;
                    }
                    linkValues += `('${safeFriendId}', '${escapeSql(groupId)}'),`;
                }
            });
            if (linkValues) {
                linkValues = linkValues.slice(0, -1);
                await sqliteService.executeNonQuery(
                    `INSERT OR REPLACE INTO ${linkTable} (friend_id, group_id) VALUES ${linkValues}`
                );
            }
            if (groupInfos.size > 0) {
                const now = new Date().toISOString();
                let infoValues = '';
                groupInfos.forEach((info, groupId) => {
                    if (!groupId) {
                        return;
                    }
                    const memberCount = Number.isFinite(info?.memberCount)
                        ? info.memberCount
                        : 0;
                    infoValues +=
                        `('${escapeSql(groupId)}', '${escapeSql(info?.name)}', ` +
                        `'${escapeSql(info?.shortCode)}', '${escapeSql(info?.discriminator)}', ` +
                        `'${escapeSql(info?.iconUrl)}', '${escapeSql(info?.bannerUrl)}', ` +
                        `${memberCount}, '${escapeSql(info?.ownerId)}', '${escapeSql(now)}'),`;
                });
                if (infoValues) {
                    infoValues = infoValues.slice(0, -1);
                    await sqliteService.executeNonQuery(
                        `INSERT OR REPLACE INTO ${infoTable} (group_id, name, short_code, discriminator, icon_url, banner_url, member_count, owner_id, updated_at) VALUES ${infoValues}`
                    );
                }
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
        const time = escapeSql(lastFetchedAt || new Date().toISOString());
        const unavailableInt = unavailable ? 1 : 0;
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${metaTable} (friend_id, last_fetched_at, unavailable) VALUES ('${escapeSql(friendId)}', '${time}', ${unavailableInt})`
        );
    },

    async bulkUpsertFriendGroupsMeta(entries) {
        if (!dbVars.userPrefix || !entries || entries.size === 0) {
            return;
        }
        const metaTable = `${dbVars.userPrefix}_friend_groups_meta`;
        let values = '';
        const now = new Date().toISOString();
        entries.forEach(({ unavailable }, friendId) => {
            if (!friendId) return;
            const unavailableInt = unavailable ? 1 : 0;
            values += `('${escapeSql(friendId)}', '${escapeSql(now)}', ${unavailableInt}),`;
        });
        if (values) {
            values = values.slice(0, -1);
            await sqliteService.executeNonQuery(
                `INSERT OR REPLACE INTO ${metaTable} (friend_id, last_fetched_at, unavailable) VALUES ${values}`
            );
        }
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
