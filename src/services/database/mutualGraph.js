import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const mutualGraph = {
    async getMutualGraphSnapshot() {
        const snapshot = new Map();
        if (!dbVars.userPrefix) {
            return snapshot;
        }
        const friendTable = `${dbVars.userPrefix}_mutual_graph_friends`;
        const linkTable = `${dbVars.userPrefix}_mutual_graph_links`;
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            if (friendId && !snapshot.has(friendId)) {
                snapshot.set(friendId, []);
            }
        }, `SELECT friend_id FROM ${friendTable}`);
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            const mutualId = dbRow[1];
            if (!friendId || !mutualId) {
                return;
            }
            let list = snapshot.get(friendId);
            if (!list) {
                list = [];
                snapshot.set(friendId, list);
            }
            list.push(mutualId);
        }, `SELECT friend_id, mutual_id FROM ${linkTable}`);
        return snapshot;
    },

    async saveMutualGraphSnapshot(entries) {
        if (!dbVars.userPrefix) {
            return;
        }
        const friendTable = `${dbVars.userPrefix}_mutual_graph_friends`;
        const linkTable = `${dbVars.userPrefix}_mutual_graph_links`;
        const metaTable = `${dbVars.userPrefix}_mutual_graph_meta`;
        const pairs = entries instanceof Map ? entries : new Map();
        await sqliteService.executeNonQuery('BEGIN');
        try {
            await sqliteService.executeNonQuery(
                `DELETE FROM ${linkTable} WHERE friend_id NOT IN (SELECT friend_id FROM ${metaTable} WHERE opted_out = 1)`
            );
            await sqliteService.executeNonQuery(
                `DELETE FROM ${friendTable} WHERE friend_id NOT IN (SELECT friend_id FROM ${metaTable} WHERE opted_out = 1)`
            );
            if (pairs.size === 0) {
                await sqliteService.executeNonQuery('COMMIT');
                return;
            }
            // Also clean links for friends in the new entries even if they
            // were previously opted_out. We have fresh data for them now so
            // old links must not linger.
            let idsToClean = '';
            pairs.forEach((_, friendId) => {
                if (!friendId) return;
                const safe = friendId.replace(/'/g, "''");
                idsToClean += `'${safe}',`;
            });
            if (idsToClean) {
                idsToClean = idsToClean.slice(0, -1);
                await sqliteService.executeNonQuery(
                    `DELETE FROM ${linkTable} WHERE friend_id IN (${idsToClean})`
                );
            }
            let friendValues = '';
            let edgeValues = '';
            pairs.forEach((mutualIds, friendId) => {
                if (!friendId) {
                    return;
                }
                const safeFriendId = friendId.replace(/'/g, "''");
                friendValues += `('${safeFriendId}'),`;
                let collection = [];
                if (Array.isArray(mutualIds)) {
                    collection = mutualIds;
                } else if (mutualIds instanceof Set) {
                    collection = Array.from(mutualIds);
                }
                for (const mutual of collection) {
                    if (!mutual) {
                        continue;
                    }
                    const safeMutualId = String(mutual).replace(/'/g, "''");
                    edgeValues += `('${safeFriendId}', '${safeMutualId}'),`;
                }
            });
            if (friendValues) {
                friendValues = friendValues.slice(0, -1);
                await sqliteService.executeNonQuery(
                    `INSERT OR REPLACE INTO ${friendTable} (friend_id) VALUES ${friendValues}`
                );
            }
            if (edgeValues) {
                edgeValues = edgeValues.slice(0, -1);
                await sqliteService.executeNonQuery(
                    `INSERT OR REPLACE INTO ${linkTable} (friend_id, mutual_id) VALUES ${edgeValues}`
                );
            }
            await sqliteService.executeNonQuery('COMMIT');
        } catch (err) {
            await sqliteService.executeNonQuery('ROLLBACK');
            throw err;
        }
    },

    async updateMutualsForFriend(friendId, mutualIds) {
        if (!dbVars.userPrefix || !friendId) {
            return;
        }
        const friendTable = `${dbVars.userPrefix}_mutual_graph_friends`;
        const linkTable = `${dbVars.userPrefix}_mutual_graph_links`;
        const safeFriendId = friendId.replace(/'/g, "''");
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${friendTable} (friend_id) VALUES ('${safeFriendId}')`
        );
        await sqliteService.executeNonQuery(
            `DELETE FROM ${linkTable} WHERE friend_id='${safeFriendId}'`
        );
        let edgeValues = '';
        for (const mutual of mutualIds) {
            if (!mutual) {
                continue;
            }
            const safeMutualId = String(mutual).replace(/'/g, "''");
            edgeValues += `('${safeFriendId}', '${safeMutualId}'),`;
        }
        if (edgeValues) {
            edgeValues = edgeValues.slice(0, -1);
            await sqliteService.executeNonQuery(
                `INSERT OR REPLACE INTO ${linkTable} (friend_id, mutual_id) VALUES ${edgeValues}`
            );
        }
    },

    async getMutualCountForAllUsers() {
        const mutualCountMap = new Map();
        if (!dbVars.userPrefix) {
            return mutualCountMap;
        }
        const linkTable = `${dbVars.userPrefix}_mutual_graph_links`;
        await sqliteService.execute((dbRow) => {
            const mutualId = dbRow[0];
            const count = dbRow[1];
            if (mutualId) {
                mutualCountMap.set(mutualId, count);
            }
        }, `SELECT mutual_id, COUNT(*) FROM ${linkTable} GROUP BY mutual_id`);
        return mutualCountMap;
    },

    async upsertMutualGraphMeta(friendId, { lastFetchedAt, optedOut }) {
        if (!dbVars.userPrefix || !friendId) {
            return;
        }
        const metaTable = `${dbVars.userPrefix}_mutual_graph_meta`;
        const escapedId = friendId.replace(/'/g, "''");
        const time = (lastFetchedAt || new Date().toISOString()).replace(
            /'/g,
            "''"
        );
        const optedOutInt = optedOut ? 1 : 0;
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${metaTable} (friend_id, last_fetched_at, opted_out) VALUES ('${escapedId}', '${time}', ${optedOutInt})`
        );
    },

    async bulkUpsertMutualGraphMeta(entries) {
        if (!dbVars.userPrefix || !entries || entries.size === 0) {
            return;
        }
        const metaTable = `${dbVars.userPrefix}_mutual_graph_meta`;
        let values = '';
        const now = new Date().toISOString();
        entries.forEach(({ optedOut }, friendId) => {
            if (!friendId) return;
            const escapedId = friendId.replace(/'/g, "''");
            const optedOutInt = optedOut ? 1 : 0;
            values += `('${escapedId}', '${now}', ${optedOutInt}),`;
        });
        if (values) {
            values = values.slice(0, -1);
            await sqliteService.executeNonQuery(
                `INSERT OR REPLACE INTO ${metaTable} (friend_id, last_fetched_at, opted_out) VALUES ${values}`
            );
        }
    },

    async getMutualGraphMeta() {
        const metaMap = new Map();
        if (!dbVars.userPrefix) {
            return metaMap;
        }
        const metaTable = `${dbVars.userPrefix}_mutual_graph_meta`;
        await sqliteService.execute((dbRow) => {
            const friendId = dbRow[0];
            if (friendId) {
                metaMap.set(friendId, {
                    lastFetchedAt: dbRow[1] || null,
                    optedOut: dbRow[2] === 1
                });
            }
        }, `SELECT friend_id, last_fetched_at, opted_out FROM ${metaTable}`);
        return metaMap;
    }
};

export { mutualGraph };
