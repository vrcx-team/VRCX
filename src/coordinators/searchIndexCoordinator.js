import { watch } from 'vue';

import { useSearchIndexStore } from '../stores/searchIndex';
import { watchState } from '../services/watchState';


/**
 * @param {object} ctx
 */
export function syncFriendSearchIndex(ctx) {
    useSearchIndexStore().syncFriend(ctx);
}

/**
 * @param {string} id
 */
export function removeFriendSearchIndex(id) {
    useSearchIndexStore().removeFriend(id);
}

export function clearFriendSearchIndex() {
    useSearchIndexStore().clearFriends();
}


/**
 * @param {object} ref
 */
export function syncAvatarSearchIndex(ref) {
    useSearchIndexStore().upsertAvatar(ref);
}

/**
 * @param {string} id
 */
export function removeAvatarSearchIndex(id) {
    useSearchIndexStore().removeAvatar(id);
}

export function clearAvatarSearchIndex() {
    useSearchIndexStore().clearAvatars();
}

/**
 * @param {object} ref
 */
export function syncWorldSearchIndex(ref) {
    useSearchIndexStore().upsertWorld(ref);
}

/**
 * @param {string} id
 */
export function removeWorldSearchIndex(id) {
    useSearchIndexStore().removeWorld(id);
}

export function clearWorldSearchIndex() {
    useSearchIndexStore().clearWorlds();
}

/**
 * @param {object} ref
 */
export function syncGroupSearchIndex(ref) {
    useSearchIndexStore().upsertGroup(ref);
}

/**
 * @param {string} id
 */
export function removeGroupSearchIndex(id) {
    useSearchIndexStore().removeGroup(id);
}

export function clearGroupSearchIndex() {
    useSearchIndexStore().clearGroups();
}


export function rebuildFavoriteSearchIndex() {
    useSearchIndexStore().rebuildFavoritesFromStore();
}

export function clearFavoriteSearchIndex() {
    useSearchIndexStore().clearFavorites();
}

/**
 * Registers a single login-state watcher that clears the entire search index
 * on every login/logout transition, so individual stores don't need to.
 */
export function resetSearchIndexOnLogin() {
    const searchIndexStore = useSearchIndexStore();
    watch(
        () => watchState.isLoggedIn,
        () => {
            searchIndexStore.clearFriends();
            searchIndexStore.clearAvatars();
            searchIndexStore.clearWorlds();
            searchIndexStore.clearGroups();
            searchIndexStore.clearFavorites();
        },
        { flush: 'sync' }
    );
}
