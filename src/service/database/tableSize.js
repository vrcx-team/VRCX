import sqliteService from '../sqlite.js';
import { dbVars } from '../database';

const tableSize = {
    async getMaxFriendLogNumber() {
        var friendNumber = 0;
        await sqliteService.execute((dbRow) => {
            friendNumber = dbRow[0];
        }, `SELECT MAX(friend_number) FROM ${dbVars.userPrefix}_friend_log_current`);
        return friendNumber;
    },

    async getGpsTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_feed_gps`);
        return size;
    },

    async getStatusTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_feed_status`);
        return size;
    },

    async getBioTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_feed_bio`);
        return size;
    },

    async getAvatarTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_feed_avatar`);
        return size;
    },

    async getOnlineOfflineTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_feed_online_offline`);
        return size;
    },

    async getFriendLogHistoryTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_friend_log_history`);
        return size;
    },

    async getNotificationTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM ${dbVars.userPrefix}_notifications`);
        return size;
    },

    async getLocationTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_location`);
        return size;
    },

    async getJoinLeaveTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_join_leave`);
        return size;
    },

    async getPortalSpawnTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_portal_spawn`);
        return size;
    },

    async getVideoPlayTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_video_play`);
        return size;
    },

    async getResourceLoadTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_resource_load`);
        return size;
    },

    async getEventTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_event`);
        return size;
    },

    async getExternalTableSize() {
        var size = 0;
        await sqliteService.execute((row) => {
            size = row[0];
        }, `SELECT COUNT(*) FROM gamelog_external`);
        return size;
    }
};

export { tableSize };
