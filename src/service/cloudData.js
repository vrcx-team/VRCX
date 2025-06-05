import { Database } from './database';
import memo from '../api/cloud/memo';
import gamelogJoinLeave from '../api/cloud/gamelogJoinLeave';

class CloudData extends Database {
    setmaxTableSize(limit) {
        super.setmaxTableSize(limit);
    }

    async initUserTables(userId) {
        super.initUserTables(userId);
    }
    async initTables() {
        super.initTables();
    }
    async getFeedDatabase() {
        return super.getFeedDatabase();
    }

    begin() {
        super.begin();
    }

    commit() {
        super.commit();
    }

    async getUserMemo(userId) {
        return super.getUserMemo(userId);
    }

    async getAllUserMemos() {
        return super.getAllUserMemos();
    }

    async setUserMemo(entry) {
        super.setUserMemo(entry);
        memo.insert(entry);
    }

    async deleteUserMemo(userId) {
        super.deleteUserMemo(userId);
    }

    async getWorldMemo(worldId) {
        return super.getWorldMemo(worldId);
    }

    setWorldMemo(entry) {
        super.setWorldMemo(entry);
    }

    deleteWorldMemo(worldId) {
        super.deleteWorldMemo(worldId);
    }

    async getAvatarMemoDB(avatarId) {
        return super.getAvatarMemoDB(avatarId);
    }

    setAvatarMemo(entry) {
        super.setAvatarMemo(entry);
    }

    deleteAvatarMemo(avatarId) {
        super.deleteAvatarMemo(avatarId);
    }

    async getFriendLogCurrent() {
        return super.getFriendLogCurrent();
    }

    setFriendLogCurrent(entry) {
        super.setFriendLogCurrent(entry);
    }

    setFriendLogCurrentArray(inputData) {
        super.setFriendLogCurrentArray(inputData);
    }

    deleteFriendLogCurrent(userId) {
        super.deleteFriendLogCurrent(userId);
    }

    async getMaxFriendLogNumber() {
        return super.getMaxFriendLogNumber();
    }

    async getFriendLogHistory() {
        return super.getFriendLogHistory();
    }

    addFriendLogHistory(entry) {
        super.addFriendLogHistory(entry);
    }

    addFriendLogHistoryArray(inputData) {
        super.addFriendLogHistoryArray(inputData);
    }

    deleteFriendLogHistory(rowId) {
        super.deleteFriendLogHistory(rowId);
    }

    addGPSToDatabase(entry) {
        super.addGPSToDatabase(entry);
    }

    addStatusToDatabase(entry) {
        super.addStatusToDatabase(entry);
    }

    addBioToDatabase(entry) {
        super.addBioToDatabase(entry);
    }

    addAvatarToDatabase(entry) {
        super.addAvatarToDatabase(entry);
    }

    addOnlineOfflineToDatabase(entry) {
        super.addOnlineOfflineToDatabase(entry);
    }

    async getGamelogDatabase() {
        return super.getGamelogDatabase();
    }

    addGamelogLocationToDatabase(entry) {
        super.addGamelogLocationToDatabase(entry);
    }

    updateGamelogLocationTimeToDatabase(entry) {
        super.updateGamelogLocationTimeToDatabase(entry);
    }

    addGamelogJoinLeaveToDatabase(entry) {
        super.addGamelogJoinLeaveToDatabase(entry);
        console.log('Adding gamelog join/leave entry:', entry);
        gamelogJoinLeave.insert(entry);
    }

    addGamelogJoinLeaveBulk(inputData) {
        super.addGamelogJoinLeaveBulk(inputData);
        gamelogJoinLeave.batchInsert(inputData);
    }

    addGamelogPortalSpawnToDatabase(entry) {
        super.addGamelogPortalSpawnToDatabase(entry);
    }

    addGamelogVideoPlayToDatabase(entry) {
        super.addGamelogVideoPlayToDatabase(entry);
    }

    addGamelogResourceLoadToDatabase(entry) {
        super.addGamelogResourceLoadToDatabase(entry);
    }

    addGamelogEventToDatabase(entry) {
        super.addGamelogEventToDatabase(entry);
    }

    addGamelogExternalToDatabase(entry) {
        super.addGamelogExternalToDatabase(entry);
    }

    async getNotifications() {
        return super.getNotifications();
    }

    addNotificationToDatabase(row) {
        super.addNotificationToDatabase(row);
    }

    deleteNotification(rowId) {
        super.deleteNotification(rowId);
    }

    updateNotificationExpired(entry) {
        super.updateNotificationExpired(entry);
    }

    async getGpsTableSize() {
        return super.getGpsTableSize();
    }

    async getStatusTableSize() {
        return super.getStatusTableSize();
    }

    async getBioTableSize() {
        return super.getBioTableSize();
    }

    async getAvatarTableSize() {
        return super.getAvatarTableSize();
    }

    async getOnlineOfflineTableSize() {
        return super.getOnlineOfflineTableSize();
    }

    async getFriendLogHistoryTableSize() {
        return super.getFriendLogHistoryTableSize();
    }

    async getNotificationTableSize() {
        return super.getNotificationTableSize();
    }

    async getLocationTableSize() {
        return super.getLocationTableSize();
    }

    async getJoinLeaveTableSize() {
        return super.getJoinLeaveTableSize();
    }

    async getPortalSpawnTableSize() {
        return super.getPortalSpawnTableSize();
    }

    async getVideoPlayTableSize() {
        return super.getVideoPlayTableSize();
    }

    async getResourceLoadTableSize() {
        return super.getResourceLoadTableSize();
    }

    async getEventTableSize() {
        return super.getEventTableSize();
    }

    async getExternalTableSize() {
        return super.getExternalTableSize();
    }

    async getLastVisit(worldId, currentWorldMatch) {
        return super.getLastVisit(worldId, currentWorldMatch);
    }

    async getVisitCount(worldId) {
        return super.getVisitCount(worldId);
    }

    async getWorldVisitCount(worldId) {
        return super.getWorldVisitCount(worldId);
    }

    async getLastSeen(input, inCurrentWorld) {
        return super.getLastSeen(input, inCurrentWorld);
    }

    async getJoinCount(input) {
        return super.getJoinCount(input);
    }

    async getTimeSpent(input) {
        return super.getTimeSpent(input);
    }

    async getUserStats(input, inCurrentWorld) {
        return super.getUserStats(input, inCurrentWorld);
    }

    async getAllUserStats(userIds, displayNames) {
        return super.getAllUserStats(userIds, displayNames);
    }

    static async getFeedByInstanceId(instanceId, filters, vipList) {
        return await super.getFeedByInstanceId(instanceId, filters, vipList);
    }

    async lookupFeedDatabase(search, filters, vipList) {
        return super.lookupFeedDatabase(search, filters, vipList);
    }

    static async getGameLogByLocation(instanceId, filters) {
        return await super.getGameLogByLocation(instanceId, filters);
    }

    async lookupGameLogDatabase(search, filters, vipList = []) {
        return super.lookupGameLogDatabase(search, filters, vipList);
    }

    async getLastDateGameLogDatabase() {
        return super.getLastDateGameLogDatabase();
    }

    async getGameLogWorldNameByWorldId(worldId) {
        return super.getGameLogWorldNameByWorldId(worldId);
    }

    async getModeration(userId) {
        return super.getModeration(userId);
    }

    setModeration(entry) {
        super.setModeration(entry);
    }

    deleteModeration(userId) {
        super.deleteModeration(userId);
    }

    async getpreviousInstancesByUserId(input) {
        return super.getpreviousInstancesByUserId(input);
    }

    deleteGameLogInstance(input) {
        super.deleteGameLogInstance(input);
    }

    deleteGameLogEntry(input) {
        super.deleteGameLogEntry(input);
    }

    deleteGameLogVideoPlay(input) {
        super.deleteGameLogVideoPlay(input);
    }

    deleteGameLogEvent(input) {
        super.deleteGameLogEvent(input);
    }

    deleteGameLogExternal(input) {
        super.deleteGameLogExternal(input);
    }

    deleteGameLogResourceLoad(input) {
        super.deleteGameLogResourceLoad(input);
    }

    async getpreviousInstancesByWorldId(input) {
        return super.getpreviousInstancesByWorldId(input);
    }

    deleteGameLogInstanceByInstanceId(input) {
        super.deleteGameLogInstanceByInstanceId(input);
    }

    async getPlayersFromInstance(location) {
        return super.getPlayersFromInstance(location);
    }

    async getpreviousDisplayNamesByUserId(ref) {
        return super.getpreviousDisplayNamesByUserId(ref);
    }

    async cleanLegendFromFriendLog() {
        return super.cleanLegendFromFriendLog();
    }

    addAvatarToCache(entry) {
        super.addAvatarToCache(entry);
    }

    addAvatarToHistory(avatarId) {
        super.addAvatarToHistory(avatarId);
    }

    async getAvatarTimeSpent(avatarId) {
        return super.getAvatarTimeSpent(avatarId);
    }

    addAvatarTimeSpent(avatarId, timeSpent) {
        super.addAvatarTimeSpent(avatarId, timeSpent);
    }

    async getAvatarHistory(currentUserId, limit = 100) {
        return super.getAvatarHistory(currentUserId, limit);
    }

    async getCachedAvatarById(id) {
        return super.getCachedAvatarById(id);
    }

    clearAvatarHistory() {
        super.clearAvatarHistory();
    }

    addAvatarToFavorites(avatarId, groupName) {
        super.addAvatarToFavorites(avatarId, groupName);
    }

    renameAvatarFavoriteGroup(newGroupName, groupName) {
        super.renameAvatarFavoriteGroup(newGroupName, groupName);
    }

    deleteAvatarFavoriteGroup(groupName) {
        super.deleteAvatarFavoriteGroup(groupName);
    }

    removeAvatarFromFavorites(avatarId, groupName) {
        super.removeAvatarFromFavorites(avatarId, groupName);
    }

    async getAvatarFavorites() {
        return super.getAvatarFavorites();
    }

    removeAvatarFromCache(avatarId) {
        super.removeAvatarFromCache(avatarId);
    }

    async getAvatarCache() {
        return super.getAvatarCache();
    }

    addWorldToCache(entry) {
        super.addWorldToCache(entry);
    }

    addWorldToFavorites(worldId, groupName) {
        super.addWorldToFavorites(worldId, groupName);
    }

    renameWorldFavoriteGroup(newGroupName, groupName) {
        super.renameWorldFavoriteGroup(newGroupName, groupName);
    }

    deleteWorldFavoriteGroup(groupName) {
        super.deleteWorldFavoriteGroup(groupName);
    }

    removeWorldFromFavorites(worldId, groupName) {
        super.removeWorldFromFavorites(worldId, groupName);
    }

    async getWorldFavorites() {
        return super.getWorldFavorites();
    }

    removeWorldFromCache(worldId) {
        super.removeWorldFromCache(worldId);
    }

    async getWorldCache() {
        return super.getWorldCache();
    }

    async getCachedWorldById(id) {
        return super.getCachedWorldById(id);
    }

    async fixGameLogTraveling() {
        return super.fixGameLogTraveling();
    }

    async fixNegativeGPS() {
        return super.fixNegativeGPS();
    }

    async getGameLogInstancesTime() {
        return super.getGameLogInstancesTime();
    }

    async getBrokenLeaveEntries() {
        return super.getBrokenLeaveEntries();
    }

    async fixBrokenLeaveEntries() {
        super.fixBrokenLeaveEntries();
    }

    async getUserIdFromDisplayName(displayName) {
        return super.getUserIdFromDisplayName(displayName);
    }

    async fixBrokenGroupInvites() {
        super.fixBrokenGroupInvites();
    }

    async fixBrokenNotifications() {
        super.fixBrokenNotifications();
    }

    async fixBrokenGroupChange() {
        super.fixBrokenGroupChange();
    }

    async upgradeDatabaseVersion() {
        return super.upgradeDatabaseVersion();
    }

    async addFriendLogFriendNumber() {
        return super.addFriendLogFriendNumber();
    }

    async updateTableForGroupNames() {
        return super.updateTableForGroupNames();
    }

    async updateTableForAvatarHistory() {
        return super.updateTableForAvatarHistory();
    }

    async fixCancelFriendRequestTypo() {
        return super.fixCancelFriendRequestTypo();
    }

    async getBrokenGameLogDisplayNames() {
        return super.getBrokenGameLogDisplayNames();
    }

    async fixBrokenGameLogDisplayNames() {
        return super.fixBrokenGameLogDisplayNames();
    }

    async vacuum() {
        super.vacuum();
    }

    async optimize() {
        super.optimize();
    }

    async getInstanceJoinHistory() {
        return super.getInstanceJoinHistory();
    }

    async getInstanceActivity(startDate, endDate) {
        return super.getInstanceActivity(startDate, endDate);
    }

    async getDateOfInstanceActivity() {
        return super.getDateOfInstanceActivity();
    }
}

var self = new CloudData();
export { self as default, CloudData };
