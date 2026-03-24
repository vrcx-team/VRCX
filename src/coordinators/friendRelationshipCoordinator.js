import { i18n } from '../plugins/i18n';

import { database } from '../services/database';
import { friendRequest, userRequest } from '../api';
import { getNameColour } from '../shared/utils';
import { handleFavoriteDelete } from './favoriteCoordinator';
import { useAppearanceSettingsStore } from '../stores/settings/appearance';
import { useFriendStore } from '../stores/friend';
import { useModalStore } from '../stores/modal';
import { useNotificationStore } from '../stores/notification';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUiStore } from '../stores/ui';
import { useUserStore } from '../stores/user';
import {
    removeFriendSearchIndex,
    syncFriendSearchIndex
} from './searchIndexCoordinator';
import { watchState } from '../services/watchState';

import configRepository from '../services/config';
import { storeToRefs } from 'pinia';

/**
 * @param {object} args
 */
export function handleFriendStatus(args) {
    const userStore = useUserStore();
    const D = userStore.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    const { json } = args;
    D.isFriend = json.isFriend;
    D.incomingRequest = json.incomingRequest;
    D.outgoingRequest = json.outgoingRequest;
}

/**
 * @param {object} args
 */
export function handleFriendDelete(args) {
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const D = userStore.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    D.isFriend = false;
    runDeleteFriendshipFlow(args.params.userId);
    friendStore.deleteFriend(args.params.userId);
    removeFriendSearchIndex(args.params.userId);
}

/**
 * @param {object} args
 */
export function handleFriendAdd(args) {
    const friendStore = useFriendStore();
    addFriendship(args.params.userId);
    friendStore.addFriend(args.params.userId);
    const ctx = friendStore.friends.get(args.params.userId);
    if (ctx) {
        syncFriendSearchIndex(ctx);
    }
}

/**
 * @param {string} userId
 * @returns {string}
 */
export function getFriendRequest(userId) {
    const notificationStore = useNotificationStore();
    const array = notificationStore.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].type === 'friendRequest' &&
            array[i].senderUserId === userId
        ) {
            return array[i].id;
        }
    }
    return '';
}

/**
 * @param {string} userId
 */
function deleteFriendRequest(userId) {
    const notificationStore = useNotificationStore();
    const array = notificationStore.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].type === 'friendRequest' &&
            array[i].senderUserId === userId
        ) {
            array.splice(i, 1);
            return;
        }
    }
}

/**
 * @param {string} id
 */
export function addFriendship(id) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    const sharedFeedStore = useSharedFeedStore();
    const uiStore = useUiStore();

    const { friendLogTable } = storeToRefs(friendStore);
    const { friendLog, state } = friendStore;

    if (
        !watchState.isFriendsLoaded ||
        friendLog.has(id) ||
        id === userStore.currentUser.id
    ) {
        return;
    }
    const ref = userStore.cachedUsers.get(id);
    if (typeof ref === 'undefined') {
        // deleted account on friends list
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
            handleFriendStatus(args);
            if (args.json.isFriend && !friendLog.has(id)) {
                if (state.friendNumber === 0) {
                    state.friendNumber = friendStore.friends.size;
                }
                ref.$friendNumber = ++state.friendNumber;
                configRepository.setInt(
                    `VRCX_friendNumber_${userStore.currentUser.id}`,
                    state.friendNumber
                );
                friendStore.addFriend(id, ref.state);
                const friendCtx = friendStore.friends.get(id);
                if (friendCtx) {
                    syncFriendSearchIndex(friendCtx);
                }
                const friendLogHistory = {
                    created_at: new Date().toJSON(),
                    type: 'Friend',
                    userId: id,
                    displayName: ref.displayName,
                    friendNumber: ref.$friendNumber
                };
                friendLogTable.value.data.push(friendLogHistory);
                database.addFriendLogHistory(friendLogHistory);
                notificationStore.queueFriendLogNoty(friendLogHistory);
                sharedFeedStore.addEntry(friendLogHistory);
                const friendLogCurrent = {
                    userId: id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                friendLog.set(id, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                uiStore.notifyMenu('friend-log');
                deleteFriendRequest(id);
                userRequest
                    .getUser({
                        userId: id
                    })
                    .then(() => {
                        if (
                            userStore.userDialog.visible &&
                            id === userStore.userDialog.id
                        ) {
                            userStore.applyUserDialogLocation(true);
                        }
                    });
            }
        });
}

/**
 * @param {object} ref
 */
export function updateFriendship(ref) {
    const friendStore = useFriendStore();
    const notificationStore = useNotificationStore();
    const sharedFeedStore = useSharedFeedStore();
    const uiStore = useUiStore();

    const { friendLogTable } = storeToRefs(friendStore);
    const { friendLog } = friendStore;

    const ctx = friendLog.get(ref.id);
    if (!watchState.isFriendsLoaded || typeof ctx === 'undefined') {
        return;
    }
    if (ctx.friendNumber) {
        ref.$friendNumber = ctx.friendNumber;
    }
    if (!ref.$friendNumber) {
        ref.$friendNumber = 0; // no null
    }
    if (ctx.displayName !== ref.displayName) {
        if (ctx.displayName) {
            const friendLogHistoryDisplayName = {
                created_at: new Date().toJSON(),
                type: 'DisplayName',
                userId: ref.id,
                displayName: ref.displayName,
                previousDisplayName: ctx.displayName,
                friendNumber: ref.$friendNumber
            };
            friendLogTable.value.data.push(friendLogHistoryDisplayName);
            database.addFriendLogHistory(friendLogHistoryDisplayName);
            notificationStore.queueFriendLogNoty(friendLogHistoryDisplayName);
            sharedFeedStore.addEntry(friendLogHistoryDisplayName);
            const friendLogCurrent = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            friendLog.set(ref.id, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            ctx.displayName = ref.displayName;
            uiStore.notifyMenu('friend-log');
        }
    }
    if (
        ref.$trustLevel &&
        ctx.trustLevel &&
        ctx.trustLevel !== ref.$trustLevel
    ) {
        if (
            (ctx.trustLevel === 'Trusted User' &&
                ref.$trustLevel === 'Veteran User') ||
            (ctx.trustLevel === 'Veteran User' &&
                ref.$trustLevel === 'Trusted User')
        ) {
            const friendLogCurrent3 = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            friendLog.set(ref.id, friendLogCurrent3);
            database.setFriendLogCurrent(friendLogCurrent3);
            return;
        }
        const friendLogHistoryTrustLevel = {
            created_at: new Date().toJSON(),
            type: 'TrustLevel',
            userId: ref.id,
            displayName: ref.displayName,
            trustLevel: ref.$trustLevel,
            previousTrustLevel: ctx.trustLevel,
            friendNumber: ref.$friendNumber
        };
        friendLogTable.value.data.push(friendLogHistoryTrustLevel);
        database.addFriendLogHistory(friendLogHistoryTrustLevel);
        notificationStore.queueFriendLogNoty(friendLogHistoryTrustLevel);
        sharedFeedStore.addEntry(friendLogHistoryTrustLevel);
        const friendLogCurrent2 = {
            userId: ref.id,
            displayName: ref.displayName,
            trustLevel: ref.$trustLevel,
            friendNumber: ref.$friendNumber
        };
        friendLog.set(ref.id, friendLogCurrent2);
        database.setFriendLogCurrent(friendLogCurrent2);
        uiStore.notifyMenu('friend-log');
    }
    ctx.trustLevel = ref.$trustLevel;
}

/**
 * @param {string} id
 */
export function confirmDeleteFriend(id) {
    const t = i18n.global.t;
    const modalStore = useModalStore();
    modalStore
        .confirm({
            description: t('confirm.unfriend'),
            title: t('confirm.title')
        })
        .then(async ({ ok }) => {
            if (!ok) return;
            const args = await friendRequest.deleteFriend({
                userId: id
            });
            handleFriendDelete(args);
        })
        .catch(() => {});
}

/**
 * @param {object} ref
 */
export function userOnFriend(ref) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();

    updateFriendship(ref);
    if (
        watchState.isFriendsLoaded &&
        ref.isFriend &&
        !friendStore.friendLog.has(ref.id) &&
        ref.id !== userStore.currentUser.id
    ) {
        addFriendship(ref.id);
    }
}

/**
 * @param {object} ref
 */
export function updateUserCurrentStatus(ref) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();

    if (watchState.isFriendsLoaded) {
        const { added, removed } = friendStore.refreshFriendsStatus(ref);
        for (const id of added) {
            const ctx = friendStore.friends.get(id);
            if (ctx) {
                syncFriendSearchIndex(ctx);
            }
        }
        for (const id of removed) {
            removeFriendSearchIndex(id);
        }
    }
    friendStore.updateOnlineFriendCounter();

    if (appearanceSettingsStore.randomUserColours) {
        getNameColour(
            userStore.currentUser.id,
            appearanceSettingsStore.isDarkMode
        ).then((colour) => {
            userStore.setCurrentUserColour(colour);
        });
    }
}

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
    const uiStore = useUiStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();

    const { friendLogTable } = storeToRefs(friendStore);
    const { friendLog } = friendStore;

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
                handleFavoriteDelete(id);
                if (!appearanceSettingsStore.hideUnfriends) {
                    uiStore.notifyMenu('friend-log');
                }
                friendStore.deleteFriend(id);
                removeFriendSearchIndex(id);
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
        addFriendship(id);
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
