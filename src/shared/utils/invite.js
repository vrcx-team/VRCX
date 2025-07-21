import {
    useFriendStore,
    useInstanceStore,
    useLocationStore,
    useUserStore
} from '../../stores';
import { parseLocation } from './location';

/**
 *
 * @param {string} location
 * @returns
 */
function checkCanInvite(location) {
    if (!location) {
        return false;
    }
    const userStore = useUserStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const L = parseLocation(location);
    const instance = instanceStore.cachedInstances.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (
        L.accessType === 'public' ||
        L.accessType === 'group' ||
        L.userId === userStore.currentUser.id
    ) {
        return true;
    }
    if (L.accessType === 'invite' || L.accessType === 'friends') {
        return false;
    }
    if (locationStore.lastLocation.location === location) {
        return true;
    }
    return false;
}

/**
 *
 * @param {string} location
 * @returns
 */
function checkCanInviteSelf(location) {
    if (!location) {
        return false;
    }
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();
    const L = parseLocation(location);
    const instance = instanceStore.cachedInstances.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (L.userId === userStore.currentUser.id) {
        return true;
    }
    if (L.accessType === 'friends' && !friendStore.friends.has(L.userId)) {
        return false;
    }
    return true;
}

export { checkCanInvite, checkCanInviteSelf };
