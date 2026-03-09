/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Friend sync coordinator methods.
 */
export function createFriendSyncCoordinator(deps) {
    const {
        getNextCurrentUserRefresh,
        getCurrentUser,
        refreshFriends,
        reconnectWebSocket,
        getCurrentUserId,
        getCurrentUserRef,
        setRefreshFriendsLoading,
        setFriendsLoaded,
        resetFriendLog,
        isFriendLogInitialized,
        getFriendLog,
        initFriendLog,
        isDontLogMeOut,
        showLoadFailedToast,
        handleLogoutEvent,
        tryApplyFriendOrder,
        getAllUserStats,
        hasLegacyFriendLogData,
        removeLegacyFeedTable,
        migrateMemos,
        migrateFriendLog
    } = deps;

    /**
     * Runs friend list refresh orchestration.
     */
    async function runRefreshFriendsListFlow() {
        // If we just got user less then 2 min before code call, don't call it again
        if (getNextCurrentUserRefresh() < 300) {
            await getCurrentUser();
        }
        await refreshFriends();
        reconnectWebSocket();
    }

    /**
     * Runs full friend list initialization orchestration.
     */
    async function runInitFriendsListFlow() {
        const userId = getCurrentUserId();
        setRefreshFriendsLoading(true);
        setFriendsLoaded(false);
        resetFriendLog();

        try {
            const currentUser = getCurrentUserRef();
            if (await isFriendLogInitialized(userId)) {
                await getFriendLog(currentUser);
            } else {
                await initFriendLog(currentUser);
            }
        } catch (err) {
            if (!isDontLogMeOut()) {
                showLoadFailedToast();
                handleLogoutEvent();
                throw err;
            }
        }

        tryApplyFriendOrder(); // once again
        getAllUserStats(); // joinCount, lastSeen, timeSpent

        // remove old data from json file and migrate to SQLite (July 2021)
        if (await hasLegacyFriendLogData(userId)) {
            removeLegacyFeedTable(userId);
            migrateMemos();
            migrateFriendLog(userId);
        }
    }

    return {
        runRefreshFriendsListFlow,
        runInitFriendsListFlow
    };
}
