import sqliteService from '../sqlite.js';
import { dbVars } from '../database';

const memos = {
    // user memos

    async getUserMemo(userId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    userId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM memos WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
        return row;
    },

    async getAllUserMemos() {
        var memos = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                userId: dbRow[0],
                memo: dbRow[1]
            };
            memos.push(row);
        }, 'SELECT user_id, memo FROM memos');
        return memos;
    },

    async setUserMemo(entry) {
        await sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO memos (user_id, edited_at, memo) VALUES (@user_id, @edited_at, @memo)`,
            {
                '@user_id': entry.userId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    },

    async deleteUserMemo(userId) {
        await sqliteService.executeNonQuery(
            `DELETE FROM memos WHERE user_id = @user_id`,
            {
                '@user_id': userId
            }
        );
    },

    // world memos

    async getWorldMemo(worldId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    worldId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM world_memos WHERE world_id = @world_id`,
            {
                '@world_id': worldId
            }
        );
        return row;
    },

    setWorldMemo(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO world_memos (world_id, edited_at, memo) VALUES (@world_id, @edited_at, @memo)`,
            {
                '@world_id': entry.worldId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    },

    deleteWorldMemo(worldId) {
        sqliteService.executeNonQuery(
            `DELETE FROM world_memos WHERE world_id = @world_id`,
            {
                '@world_id': worldId
            }
        );
    },

    // Avatar memos

    async getAvatarMemoDB(avatarId) {
        var row = {};
        await sqliteService.execute(
            (dbRow) => {
                row = {
                    avatarId: dbRow[0],
                    editedAt: dbRow[1],
                    memo: dbRow[2]
                };
            },
            `SELECT * FROM avatar_memos WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
        return row;
    },

    setAvatarMemo(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO avatar_memos (avatar_id, edited_at, memo) VALUES (@avatar_id, @edited_at, @memo)`,
            {
                '@avatar_id': entry.avatarId,
                '@edited_at': entry.editedAt,
                '@memo': entry.memo
            }
        );
    },

    deleteAvatarMemo(avatarId) {
        sqliteService.executeNonQuery(
            `DELETE FROM avatar_memos WHERE avatar_id = @avatar_id`,
            {
                '@avatar_id': avatarId
            }
        );
    },

    // user notes

    async addUserNote(note) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO ${dbVars.userPrefix}_notes (user_id, display_name, note, created_at) VALUES (@user_id, @display_name, @note, @created_at)`,
            {
                '@user_id': note.userId,
                '@display_name': note.displayName,
                '@note': note.note,
                '@created_at': note.createdAt
            }
        );
    },

    async getAllUserNotes() {
        var data = [];
        await sqliteService.execute((dbRow) => {
            var row = {
                userId: dbRow[0],
                displayName: dbRow[1],
                note: dbRow[2],
                createdAt: dbRow[3]
            };
            data.push(row);
        }, `SELECT user_id, display_name, note, created_at FROM ${dbVars.userPrefix}_notes`);
        return data;
    },

    async deleteUserNote(userId) {
        sqliteService.executeNonQuery(
            `DELETE FROM ${dbVars.userPrefix}_notes WHERE user_id = @userId`,
            {
                '@userId': userId
            }
        );
    }
};

export { memos };
