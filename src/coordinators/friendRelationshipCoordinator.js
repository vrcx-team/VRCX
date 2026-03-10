import { database } from '../service/database';
import { friendRequest } from '../api';
import { handleFavoriteDelete } from './favoriteCoordinator';
import { useAppearanceSettingsStore } from '../stores/settings/appearance';
import { useFavoriteStore } from '../stores/favorite';
import { useFriendStore } from '../stores/friend';
import { useNotificationStore } from '../stores/notification';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUiStore } from '../stores/ui';
import { useUserStore } from '../stores/user';

/**
 * Validates and applies unfriend transition side effects.
 * @param {string} id User id.
 * @param {object} [options] Test seams.
 * @param {function} [options.nowIso] ISO timestamp provider.
 */
export function runDeleteFriendshipFlow(
    id,
    { nowIso = () => new Date().toJSON() } = {}
) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    const sharedFeedStore = useSharedFeedStore();
    const favoriteStore = useFavoriteStore();
    const uiStore = useUiStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();

    const { friendLog, friendLogTable } = friendStore;

    const ctx = friendLog.get(id);
    if (typeof ctx === 'undefined') {
        return;
    }
    friendRequest
        .getFriendStatus({
            userId: id,
            currentUserId: userStore.currentUser.id
        })
        .then((args) => {
            if (args.params.currentUserId !== userStore.currentUser.id) {
                // safety check for delayed response
                return;
            }
            friendStore.handleFriendStatus(args);
            if (!args.json.isFriend && friendLog.has(id)) {
                const friendLogHistory = {
                    created_at: nowIso(),
                    type: 'Unfriend',
                    userId: id,
                    displayName: ctx.displayName || id
                };
                friendLogTable.data.push(friendLogHistory);
                database.addFriendLogHistory(friendLogHistory);
                notificationStore.queueFriendLogNoty(friendLogHistory);
                sharedFeedStore.addEntry(friendLogHistory);
                friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
                handleFavoriteDelete(id);
                if (!appearanceSettingsStore.hideUnfriends) {
                    uiStore.notifyMenu('friend-log');
                }
                friendStore.deleteFriend(id);
            }
        });
}

/**
 * Reconciles current friend list against local friend log.
 * @param {object} ref Current user reference.
 * @param {object} [options] Test seams.
 * @param {function} [options.nowIso] ISO timestamp provider.
 */
export function runUpdateFriendshipsFlow(
    ref,
    { nowIso = () => new Date().toJSON() } = {}
) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const { friendLog } = friendStore;

    let id;
    const set = new Set();
    for (id of ref.friends) {
        set.add(id);
        friendStore.addFriendship(id);
    }
    for (id of friendLog.keys()) {
        if (id === userStore.currentUser.id) {
            friendLog.delete(id);
            database.deleteFriendLogCurrent(id);
        } else if (!set.has(id)) {
            runDeleteFriendshipFlow(id, { nowIso });
        }
    }
}
