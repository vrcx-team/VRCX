const INIT_BLOCKED_FAVORITE_EVENTS = new Set(['favorite.avatar.added']);
const INIT_BLOCKED_FRIEND_EVENTS = new Set([
    'friend.time_together_updated',
    'friend.note_updated',
    'friend.avatar_changed'
]);

/**
 * Runtime gate to suppress selected high-volume webhook events during
 * initial data bootstrap after login.
 *
 * @param {string} event
 * @param {{ isFavoritesLoaded?: boolean, isFriendsLoaded?: boolean }} state
 * @returns {boolean}
 */
export function shouldEmitWebhookEventRuntime(event, state) {
    if (!event || typeof event !== 'string') {
        return false;
    }

    if (
        INIT_BLOCKED_FAVORITE_EVENTS.has(event) &&
        state?.isFavoritesLoaded !== true
    ) {
        return false;
    }

    if (
        INIT_BLOCKED_FRIEND_EVENTS.has(event) &&
        state?.isFriendsLoaded !== true
    ) {
        return false;
    }

    return true;
}
