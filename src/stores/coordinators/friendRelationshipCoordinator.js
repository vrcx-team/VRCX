/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Friend relationship coordinator methods.
 */
export function createFriendRelationshipCoordinator(deps) {
    const {
        friendLog,
        friendLogTable,
        getCurrentUserId,
        requestFriendStatus,
        handleFriendStatus,
        addFriendship,
        deleteFriend,
        database,
        notificationStore,
        sharedFeedStore,
        favoriteStore,
        uiStore,
        shouldNotifyUnfriend,
        nowIso
    } = deps;

    /**
     * Validates and applies unfriend transition side effects.
     * @param {string} id User id.
     */
    function runDeleteFriendshipFlow(id) {
        const ctx = friendLog.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        requestFriendStatus({
            userId: id,
            currentUserId: getCurrentUserId()
        }).then((args) => {
            if (args.params.currentUserId !== getCurrentUserId()) {
                // safety check for delayed response
                return;
            }
            handleFriendStatus(args);
            if (!args.json.isFriend && friendLog.has(id)) {
                const friendLogHistory = {
                    created_at: nowIso(),
                    type: 'Unfriend',
                    userId: id,
                    displayName: ctx.displayName || id
                };
                friendLogTable.value.data.push(friendLogHistory);
                database.addFriendLogHistory(friendLogHistory);
                notificationStore.queueFriendLogNoty(friendLogHistory);
                sharedFeedStore.addEntry(friendLogHistory);
                friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
                favoriteStore.handleFavoriteDelete(id);
                if (shouldNotifyUnfriend()) {
                    uiStore.notifyMenu('friend-log');
                }
                deleteFriend(id);
            }
        });
    }

    /**
     * Reconciles current friend list against local friend log.
     * @param {object} ref Current user reference.
     */
    function runUpdateFriendshipsFlow(ref) {
        let id;
        const set = new Set();
        for (id of ref.friends) {
            set.add(id);
            addFriendship(id);
        }
        for (id of friendLog.keys()) {
            if (id === getCurrentUserId()) {
                friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
            } else if (!set.has(id)) {
                runDeleteFriendshipFlow(id);
            }
        }
    }

    return {
        runDeleteFriendshipFlow,
        runUpdateFriendshipsFlow
    };
}
