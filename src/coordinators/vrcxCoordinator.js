import { useAvatarStore } from '../stores/avatar';
import { useFavoriteStore } from '../stores/favorite';
import { useFriendStore } from '../stores/friend';
import { useGalleryStore } from '../stores/gallery';
import { useGroupStore } from '../stores/group';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';
import { failedGetRequests } from '../services/request';

/**
 * Clears caches across multiple stores while preserving data that is
 * still needed (friends, current user, favorites, active instances).
 */
export function clearVRCXCache() {
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const locationStore = useLocationStore();
    const galleryStore = useGalleryStore();

    console.log('Clearing VRCX cache...');
    failedGetRequests.clear();
    userStore.cachedUsers.forEach((ref, id) => {
        if (
            !friendStore.friends.has(id) &&
            !locationStore.lastLocation.playerList.has(ref.id) &&
            id !== userStore.currentUser.id
        ) {
            userStore.cachedUsers.delete(id);
        }
    });
    worldStore.cachedWorlds.forEach((ref, id) => {
        if (
            !favoriteStore.getCachedFavoritesByObjectId(id) &&
            ref.authorId !== userStore.currentUser.id &&
            !favoriteStore.localWorldFavoritesList.includes(id)
        ) {
            worldStore.cachedWorlds.delete(id);
        }
    });
    avatarStore.cachedAvatars.forEach((ref, id) => {
        if (
            !favoriteStore.getCachedFavoritesByObjectId(id) &&
            ref.authorId !== userStore.currentUser.id &&
            !favoriteStore.localAvatarFavoritesList.includes(id) &&
            !avatarStore.avatarHistory.includes(id)
        ) {
            avatarStore.cachedAvatars.delete(id);
        }
    });
    groupStore.cachedGroups.forEach((ref, id) => {
        if (!groupStore.currentUserGroups.has(id)) {
            groupStore.cachedGroups.delete(id);
        }
    });
    instanceStore.cachedInstances.forEach((ref, id) => {
        if (
            [...friendStore.friends.values()].some(
                (f) => f.$location?.tag === id
            )
        ) {
            return;
        }
        // delete instances over an hour old
        if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
            instanceStore.cachedInstances.delete(id);
        }
    });
    avatarStore.cachedAvatarNames.clear();
    userStore.customUserTags.clear();
    galleryStore.cachedEmoji.clear();
}
