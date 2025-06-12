import { LocalDatabase } from './localDatabase';
import { insert as memoInsert, del as memoDelete } from '../api/cloud/memo';
import {
    insert as gamelogJoinLeaveInsert,
    batchInsert as gamelogJoinLeaveBatchInsert,
    gameLogInstanceDelete
} from '../api/cloud/gamelogJoinLeave';
import {
    deleteWorldMemoByWorldId,
    insertWorldMemo
} from '../api/cloud/worldMemo';
import {
    deleteAvatarMemoByAvatarId,
    insertAvatarMemo
} from '../api/cloud/avatarMemo';
import {
    friendLogCurrentDeleteByUserId,
    friendLogCurrentInsert,
    friendLogCurrentInsertBatch
} from '../api/cloud/FriendLogCurrent';
import {
    friendLogHistoryDeleteById,
    friendLogHistoryInsert,
    friendLogHistoryInsertBatch
} from '../api/cloud/friendLogHistory';
import { insertFeedGps } from '../api/cloud/feedGps';
import { insertFeedStatus } from '../api/cloud/feedStatus';
import { insertFeedBio } from '../api/cloud/feedBio';
import { insertFeedAvatar } from '../api/cloud/feedAvatar';
import { insertFeedOnlineOffline } from '../api/cloud/feedOnlineOffline';
import { insertGameLogLocation, updateGameLogLocation } from '../api/cloud/gameLogLocation';
import { gameLogPortalSpawnInsert } from '../api/cloud/gameLogPortalSpawn';
import { gameLogVideoPlayDelete, gameLogVideoPlayInsert } from '../api/cloud/gameLogVideoPlay';
import { gamelogResourceLoadDelete, gamelogResourceLoadInsert } from '../api/cloud/gamelogResourceLoad';
import { gameLogEventDelete, gameLogEventInsert } from '../api/cloud/gameLogEvent';
import { gameLogExternalDelete, gameLogExternalInsert } from '../api/cloud/gamelogExternal';
import { notificationExpiredUpdate, notificationsDel, notificationsInsert } from '../api/cloud/notification';
import { moderationDel, moderationInsert } from '../api/cloud/moderation';
import { cacheAvatarDelete, cacheAvatarInsert } from '../api/cloud/cacheAvatar';
import { avatarHistoryAddTime, avatarHistoryClear, avatarHistoryInsert } from '../api/cloud/avatarHistory';
import { favoriteAvatarDeleteByAvatarAndGroupName, favoriteAvatarDeleteByGroupName, favoriteAvatarInsert, favoriteAvatarRename } from '../api/cloud/favoriteAvatar';
import { cacheWorldDeleteById, cacheWorldInsert } from '../api/cloud/cacheWorld';
import { favoriteWorldDelete, favoriteWorldDeleteByGroupName, favoriteWorldInsert, favoriteWorldRename } from '../api/cloud/favoriteWorld';

class CloudDatabase extends LocalDatabase {
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
        memoInsert(entry);
    }

    async deleteUserMemo(userId) {
        super.deleteUserMemo(userId);
        memoDelete(userId);
    }

    async getWorldMemo(worldId) {
        return super.getWorldMemo(worldId);
    }

    setWorldMemo(entry) {
        super.setWorldMemo(entry);
        insertWorldMemo(entry);
    }

    deleteWorldMemo(worldId) {
        super.deleteWorldMemo(worldId);
        deleteWorldMemoByWorldId(worldId);
    }

    async getAvatarMemoDB(avatarId) {
        return super.getAvatarMemoDB(avatarId);
    }

    setAvatarMemo(entry) {
        super.setAvatarMemo(entry);
        insertAvatarMemo(entry);
    }

    deleteAvatarMemo(avatarId) {
        super.deleteAvatarMemo(avatarId);
        deleteAvatarMemoByAvatarId(avatarId);
    }

    async getFriendLogCurrent() {
        return super.getFriendLogCurrent();
    }

    setFriendLogCurrent(entry) {
        super.setFriendLogCurrent(entry);
        friendLogCurrentInsert({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    setFriendLogCurrentArray(inputData) {
        super.setFriendLogCurrentArray(inputData);
        friendLogCurrentInsertBatch(
            inputData.map((e) => {
                return {
                    ...e,
                    currentUser: LocalDatabase.userPrefix
                };
            })
        );
    }

    deleteFriendLogCurrent(userId) {
        super.deleteFriendLogCurrent(userId);
        friendLogCurrentDeleteByUserId(userId);
    }

    async getMaxFriendLogNumber() {
        return super.getMaxFriendLogNumber();
    }

    async getFriendLogHistory() {
        return super.getFriendLogHistory();
    }

    addFriendLogHistory(entry) {
        super.addFriendLogHistory(entry);
        friendLogHistoryInsert({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    addFriendLogHistoryArray(inputData) {
        super.addFriendLogHistoryArray(
            inputData.map((e) => {
                return {
                    ...e,
                    currentUser: LocalDatabase.userPrefix
                };
            })
        );
        friendLogHistoryInsertBatch();
    }

    deleteFriendLogHistory(rowId) {
        super.deleteFriendLogHistory(rowId);
        friendLogHistoryDeleteById(rowId);
    }

    addGPSToDatabase(entry) {
        super.addGPSToDatabase(entry);
        insertFeedGps({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    addStatusToDatabase(entry) {
        super.addStatusToDatabase(entry);
        insertFeedStatus({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    addBioToDatabase(entry) {
        super.addBioToDatabase(entry);
        insertFeedBio({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    addAvatarToDatabase(entry) {
        super.addAvatarToDatabase(entry);
        insertFeedAvatar({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    addOnlineOfflineToDatabase(entry) {
        super.addOnlineOfflineToDatabase(entry);
        insertFeedOnlineOffline({
            ...entry,
            currentUser: LocalDatabase.userPrefix
        });
    }

    async getGamelogDatabase() {
        return super.getGamelogDatabase();
    }

    addGamelogLocationToDatabase(entry) {
        super.addGamelogLocationToDatabase(entry);
        insertGameLogLocation(entry);
    }

    updateGamelogLocationTimeToDatabase(entry) {
        super.updateGamelogLocationTimeToDatabase(entry);
        updateGameLogLocation(entry);
    }

    addGamelogJoinLeaveToDatabase(entry) {
        super.addGamelogJoinLeaveToDatabase(entry);
        gamelogJoinLeaveInsert(entry);
    }

    addGamelogJoinLeaveBulk(inputData) {
        super.addGamelogJoinLeaveBulk(inputData);
        gamelogJoinLeaveBatchInsert(inputData);
    }

    addGamelogPortalSpawnToDatabase(entry) {
        super.addGamelogPortalSpawnToDatabase(entry);
        gameLogPortalSpawnInsert(entry)
    }

    addGamelogVideoPlayToDatabase(entry) {
        super.addGamelogVideoPlayToDatabase(entry);
        gameLogVideoPlayInsert(entry)
    }

    addGamelogResourceLoadToDatabase(entry) {
        super.addGamelogResourceLoadToDatabase(entry);
        gamelogResourceLoadInsert(entry)
    }

    addGamelogEventToDatabase(entry) {
        super.addGamelogEventToDatabase(entry);
        gameLogEventInsert(entry);
    }

    addGamelogExternalToDatabase(entry) {
        super.addGamelogExternalToDatabase(entry);
        gameLogExternalInsert(entry)
    }

    async getNotifications() {
        return super.getNotifications();
    }

    addNotificationToDatabase(row) {
        super.addNotificationToDatabase(row);
        notificationsInsert({
            ...row,
            id: null,
            notId: row.id,
            currentUser: LocalDatabase.userPrefix
        });
    }

    deleteNotification(rowId) {
        super.deleteNotification(rowId);
        notificationsDel(rowId)
    }

    updateNotificationExpired(entry) {
        super.updateNotificationExpired(entry);
        notificationExpiredUpdate(entry)
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
        moderationInsert(entry)
    }

    deleteModeration(userId) {
        super.deleteModeration(userId);
        moderationDel(userId)
    }

    async getpreviousInstancesByUserId(input) {
        return super.getpreviousInstancesByUserId(input);
    }

    deleteGameLogInstance(input) {
        super.deleteGameLogInstance(input);
        gameLogInstanceDelete(input)
    }

    deleteGameLogEntry(input) {
        super.deleteGameLogEntry(input);
    }

    deleteGameLogVideoPlay(input) {
        super.deleteGameLogVideoPlay(input);
        gameLogVideoPlayDelete(input)
    }

    deleteGameLogEvent(input) {
        super.deleteGameLogEvent(input);
        gameLogEventDelete(input)
    }

    deleteGameLogExternal(input) {
        super.deleteGameLogExternal(input);
        gameLogExternalDelete(input)
    }

    deleteGameLogResourceLoad(input) {
        super.deleteGameLogResourceLoad(input);
        gamelogResourceLoadDelete(input)
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
        cacheAvatarInsert({
            ...entry,
            addedAt: new Date().toJSON()
        });
    }

    addAvatarToHistory(avatarId) {
        super.addAvatarToHistory(avatarId);
        avatarHistoryInsert({
            avatarId: avatarId,
            created_at: new Date().toJSON(),
            time: 0,
            currentUser: LocalDatabase.userPrefix
        });
    }

    async getAvatarTimeSpent(avatarId) {
        return super.getAvatarTimeSpent(avatarId);
    }

    addAvatarTimeSpent(avatarId, timeSpent) {
        super.addAvatarTimeSpent(avatarId, timeSpent);
        avatarHistoryAddTime({
            avatarId,
            time: timeSpent
        });
    }

    async getAvatarHistory(currentUserId, limit = 100) {
        return super.getAvatarHistory(currentUserId, limit);
    }

    async getCachedAvatarById(id) {
        return super.getCachedAvatarById(id);
    }

    clearAvatarHistory() {
        super.clearAvatarHistory();
        avatarHistoryClear(LocalDatabase.userPrefix);
    }

    addAvatarToFavorites(avatarId, groupName) {
        super.addAvatarToFavorites(avatarId, groupName);
        favoriteAvatarInsert({
            avatarId,
            groupName,
            created_at: new Date().toJSON()
        });
    }

    renameAvatarFavoriteGroup(newGroupName, groupName) {
        super.renameAvatarFavoriteGroup(newGroupName, groupName);
        favoriteAvatarRename({
            newGroupName,
            groupName
        });
    }

    deleteAvatarFavoriteGroup(groupName) {
        super.deleteAvatarFavoriteGroup(groupName);
        favoriteAvatarDeleteByGroupName(groupName);
    }

    removeAvatarFromFavorites(avatarId, groupName) {
        super.removeAvatarFromFavorites(avatarId, groupName);
        favoriteAvatarDeleteByAvatarAndGroupName({
            avatarId,
            groupName
        });
    }

    async getAvatarFavorites() {
        return super.getAvatarFavorites();
    }

    removeAvatarFromCache(avatarId) {
        super.removeAvatarFromCache(avatarId);
        cacheAvatarDelete(avatarId);
    }

    async getAvatarCache() {
        return super.getAvatarCache();
    }

    addWorldToCache(entry) {
        super.addWorldToCache(entry);
        cacheWorldInsert(entry)
    }

    addWorldToFavorites(worldId, groupName) {
        super.addWorldToFavorites(worldId, groupName);
        favoriteWorldInsert({
            worldId,
            groupName,
            createdAt: new Date().toJSON()
        });
    }

    renameWorldFavoriteGroup(newGroupName, groupName) {
        super.renameWorldFavoriteGroup(newGroupName, groupName);
        favoriteWorldRename({
            newGroupName,
            groupName
        });
    }

    deleteWorldFavoriteGroup(groupName) {
        super.deleteWorldFavoriteGroup(groupName);
        favoriteWorldDelete(groupName);
    }

    removeWorldFromFavorites(worldId, groupName) {
        super.removeWorldFromFavorites(worldId, groupName);
        favoriteWorldDeleteByGroupName({
            worldId,
            groupName
        })
    }

    async getWorldFavorites() {
        return super.getWorldFavorites();
    }

    removeWorldFromCache(worldId) {
        super.removeWorldFromCache(worldId);
        cacheWorldDeleteById(worldId)
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

var self = new CloudDatabase();
export { self as default, CloudDatabase };
