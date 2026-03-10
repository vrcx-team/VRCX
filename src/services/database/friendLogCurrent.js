import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const friendLogCurrent = {
    async getFriendLogCurrent() {
        var friendLogCurrent = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                userId: dbRow[0],
                displayName: dbRow[1],
                trustLevel: dbRow[2],
                friendNumber: dbRow[3]
            };
            friendLogCurrent.unshift(row);
        }, `SELECT * FROM ${dbVars.userPrefix}_friend_log_current`);
        return friendLogCurrent;
    },

    setFriendLogCurrent(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${dbVars.userPrefix}_friend_log_current (user_id, display_name, trust_level, friend_number) VALUES (@user_id, @display_name, @trust_level, @friend_number)`,
            {
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@trust_level': entry.trustLevel,
                '@friend_number': entry.friendNumber
            }
        );
    },

    setFriendLogCurrentArray(inputData) {
        if (inputData.length === 0) {
            return;
        }
        var sqlValues = '';
        var items = ['userId', 'displayName', 'trustLevel'];
        for (var line of inputData) {
            var field = {};
            for (var item of items) {
                if (typeof line[item] === 'string') {
                    field[item] = line[item].replace(/'/g, "''");
                } else {
                    field[item] = '';
                }
            }
            sqlValues += `('${field.userId}', '${field.displayName}', '${field.trustLevel}', ${line.friendNumber}), `;
        }
        sqlValues = sqlValues.slice(0, -2);
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${dbVars.userPrefix}_friend_log_current (user_id, display_name, trust_level, friend_number) VALUES ${sqlValues}`
        );
    },

    deleteFriendLogCurrent(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${dbVars.userPrefix}_friend_log_current WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
    }
};

export { friendLogCurrent };
