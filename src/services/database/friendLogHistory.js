import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const friendLogHistory = {
    async getFriendLogHistory() {
        var friendLogHistory = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                rowId: dbRow[0],
                created_at: dbRow[1],
                type: dbRow[2],
                userId: dbRow[3],
                displayName: dbRow[4],
                friendNumber: dbRow[8]
            };
            if (row.type === 'DisplayName') {
                row.previousDisplayName = dbRow[5];
            } else if (row.type === 'TrustLevel') {
                row.trustLevel = dbRow[6];
                row.previousTrustLevel = dbRow[7];
            }
            friendLogHistory.unshift(row);
        }, `SELECT * FROM ${dbVars.userPrefix}_friend_log_history`);
        return friendLogHistory;
    },

    addFriendLogHistory(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_friend_log_history (created_at, type, user_id, display_name, previous_display_name, trust_level, previous_trust_level, friend_number) VALUES (@created_at, @type, @user_id, @display_name, @previous_display_name, @trust_level, @previous_trust_level, @friend_number)`,
            {
                '@created_at': entry.created_at,
                '@type': entry.type,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@previous_display_name': entry.previousDisplayName,
                '@trust_level': entry.trustLevel,
                '@previous_trust_level': entry.previousTrustLevel,
                '@friend_number': entry.friendNumber
            }
        );
    },

    addFriendLogHistoryArray(inputData) {
        if (inputData.length === 0) {
            return;
        }
        var sqlValues = '';
        var items = [
            'created_at',
            'type',
            'userId',
            'displayName',
            'previousDisplayName',
            'trustLevel',
            'previousTrustLevel',
            'friendNumber'
        ];
        for (var i = 0; i < inputData.length; ++i) {
            var line = inputData[i];
            sqlValues += '(';
            for (var k = 0; k < items.length; ++k) {
                var item = items[k];
                var field = '';
                if (typeof line[item] === 'string') {
                    field = `'${line[item].replace(/'/g, "''")}'`;
                } else {
                    field = null;
                }
                sqlValues += field;
                if (k < items.length - 1) {
                    sqlValues += ', ';
                }
            }
            sqlValues += ')';
            if (i < inputData.length - 1) {
                sqlValues += ', ';
            }
            // sqlValues `('${line.created_at}', '${line.type}', '${line.userId}', '${line.displayName}', '${line.previousDisplayName}', '${line.trustLevel}', '${line.previousTrustLevel}'), `
        }
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_friend_log_history (created_at, type, user_id, display_name, previous_display_name, trust_level, previous_trust_level, friend_number) VALUES ${sqlValues}`
        );
    },

    async getFriendLogHistoryForUserId(userId, types) {
        let friendLogHistory = [];
        let typeFilter = '';
        if (types && types.length > 0) {
            const escapedTypes = types.map((t) => `'${t.replace(/'/g, "''")}'`);
            typeFilter = ` AND type IN (${escapedTypes.join(', ')})`;
        }
        await sqliteService.execute(
            (dbRow) => {
                const row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    type: dbRow[2],
                    userId: dbRow[3],
                    displayName: dbRow[4],
                    friendNumber: dbRow[8]
                };
                if (row.type === 'DisplayName') {
                    row.previousDisplayName = dbRow[5];
                } else if (row.type === 'TrustLevel') {
                    row.trustLevel = dbRow[6];
                    row.previousTrustLevel = dbRow[7];
                }
                friendLogHistory.push(row);
            },
            `SELECT * FROM ${dbVars.userPrefix}_friend_log_history WHERE user_id = @user_id${typeFilter}`,
            {
                '@user_id': userId
            }
        );
        return friendLogHistory;
    },

    // https://github.com/vrcx-team/VRCX/issues/1262
    deleteFriendLogHistory(entry) {
        if (entry.rowId != null) {
            sqliteService.executeNonQuery(
                `DELETE FROM ${dbVars.userPrefix}_friend_log_history WHERE id = @row_id`,
                {
                    '@row_id': entry.rowId
                }
            );
        } else {
            // Entries created in-session don't have a rowId yet;
            // fall back to composite key so the DB row is still removed.
            sqliteService.executeNonQuery(
                `DELETE FROM ${dbVars.userPrefix}_friend_log_history WHERE created_at = @created_at AND type = @type AND user_id = @user_id`,
                {
                    '@created_at': entry.created_at,
                    '@type': entry.type,
                    '@user_id': entry.userId
                }
            );
        }
    }
};

export { friendLogHistory };
