import { parseLocation } from './location';

/**
 *
 * @param {string} location
 * @param {object} deps
 * @param {string} deps.currentUserId - current user's id
 * @param {string} deps.lastLocationStr - last location string from location store
 * @param {Map} deps.cachedInstances - instance cache map
 * @returns {boolean}
 */
function checkCanInvite(location, deps) {
    if (!location) {
        return false;
    }
    const L = parseLocation(location);
    const instance = deps.cachedInstances?.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (
        L.accessType === 'public' ||
        L.accessType === 'group' ||
        L.userId === deps.currentUserId
    ) {
        return true;
    }
    if (L.accessType === 'invite' || L.accessType === 'friends') {
        return false;
    }
    if (deps.lastLocationStr === location) {
        return true;
    }
    return false;
}

/**
 *
 * @param {string} location
 * @param {object} deps
 * @param {string} deps.currentUserId - current user's id
 * @param {Map} deps.cachedInstances - instance cache map
 * @param {Map} deps.friends - friends map
 * @returns {boolean}
 */
function checkCanInviteSelf(location, deps) {
    if (!location) {
        return false;
    }
    const L = parseLocation(location);
    const instance = deps.cachedInstances?.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (L.userId === deps.currentUserId) {
        return true;
    }
    if (L.accessType === 'friends' && !deps.friends?.has(L.userId)) {
        return false;
    }
    return true;
}

export { checkCanInvite, checkCanInviteSelf };
