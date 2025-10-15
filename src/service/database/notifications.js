import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

const notifications = {
    async getNotifications() {
        var notifications = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                id: dbRow[0],
                created_at: dbRow[1],
                type: dbRow[2],
                senderUserId: dbRow[3],
                senderUsername: dbRow[4],
                receiverUserId: dbRow[5],
                message: dbRow[6],
                details: {
                    worldId: dbRow[7],
                    worldName: dbRow[8],
                    imageUrl: dbRow[9],
                    inviteMessage: dbRow[10],
                    requestMessage: dbRow[11],
                    responseMessage: dbRow[12]
                }
            };
            row.$isExpired = false;
            if (dbRow[13] === 1) {
                row.$isExpired = true;
            }
            notifications.unshift(row);
        }, `SELECT * FROM ${dbVars.userPrefix}_notifications ORDER BY created_at DESC LIMIT ${dbVars.maxTableSize}`);
        return notifications;
    },

    addNotificationToDatabase(row) {
        var entry = {
            id: '',
            created_at: '',
            type: '',
            senderUserId: '',
            senderUsername: '',
            receiverUserId: '',
            message: '',
            ...row,
            details: {
                worldId: '',
                worldName: '',
                imageUrl: '',
                inviteMessage: '',
                requestMessage: '',
                responseMessage: '',
                ...row.details
            }
        };
        if (entry.imageUrl && !entry.details.imageUrl) {
            entry.details.imageUrl = entry.imageUrl;
        }
        var expired = 0;
        if (row.$isExpired) {
            expired = 1;
        }
        if (!entry.created_at || !entry.type || !entry.id) {
            console.error('Notification is missing required field', entry);
            throw new Error('Notification is missing required field');
        }
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_notifications (id, created_at, type, sender_user_id, sender_username, receiver_user_id, message, world_id, world_name, image_url, invite_message, request_message, response_message, expired) VALUES (@id, @created_at, @type, @sender_user_id, @sender_username, @receiver_user_id, @message, @world_id, @world_name, @image_url, @invite_message, @request_message, @response_message, @expired)`,
            {
                '@id': entry.id,
                '@created_at': entry.created_at,
                '@type': entry.type,
                '@sender_user_id': entry.senderUserId,
                '@sender_username': entry.senderUsername,
                '@receiver_user_id': entry.receiverUserId,
                '@message': entry.message,
                '@world_id': entry.details.worldId,
                '@world_name': entry.details.worldName,
                '@image_url': entry.details.imageUrl,
                '@invite_message': entry.details.inviteMessage,
                '@request_message': entry.details.requestMessage,
                '@response_message': entry.details.responseMessage,
                '@expired': expired
            }
        );
    },

    deleteNotification(rowId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${dbVars.userPrefix}_notifications WHERE id = @row_id`,
            {
                '@row_id': rowId
            }
        );
    },

    updateNotificationExpired(entry) {
        var expired = 0;
        if (entry.$isExpired) {
            expired = 1;
        }
        sqliteService.executeNonQuery(
            `UPDATE ${dbVars.userPrefix}_notifications SET expired = @expired WHERE id = @id`,
            {
                '@id': entry.id,
                '@expired': expired
            }
        );
    }
};

export { notifications };
