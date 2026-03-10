import { isRealInstance } from './instance.js';

export {
    parseLocation,
    displayLocation,
    resolveRegion,
    translateAccessType
} from './locationParser.js';

/**
 *
 * @param {Array} friendsArr
 * @param {object} lastLocation - last location from location store
 * @param {Set} lastLocation.friendList
 * @param {string} lastLocation.location
 */
function getFriendsLocations(friendsArr, lastLocation) {
    // prevent the instance title display as "Traveling".
    if (!friendsArr?.length) {
        return '';
    }
    for (const friend of friendsArr) {
        if (isRealInstance(friend.ref?.location)) {
            return friend.ref.location;
        }
    }
    for (const friend of friendsArr) {
        if (isRealInstance(friend.ref?.travelingToLocation)) {
            return friend.ref.travelingToLocation;
        }
    }
    if (lastLocation) {
        for (const friend of friendsArr) {
            if (lastLocation.friendList.has(friend.id)) {
                return lastLocation.location;
            }
        }
    }
    return friendsArr[0].ref?.location;
}

export { getFriendsLocations };

/**
 * Get the display text for a location — synchronous, pure function.
 * Does NOT handle async world name lookups (those stay in the component).
 * @param {object} L - Parsed location object from parseLocation()
 * @param {object} options
 * @param {string} [options.hint] - Hint string (e.g. from props)
 * @param {string|undefined} [options.worldName] - Cached world name, if available
 * @param {string} options.accessTypeLabel - Translated access type label
 * @param {Function} options.t - i18n translate function
 * @returns {string} Display text for the location
 */
function getLocationText(L, { hint, worldName, accessTypeLabel, t }) {
    if (L.isOffline) {
        return t('location.offline');
    }
    if (L.isPrivate) {
        return t('location.private');
    }
    if (L.isTraveling) {
        return t('location.traveling');
    }
    if (typeof hint === 'string' && hint !== '') {
        return L.instanceId ? `${hint} · ${accessTypeLabel}` : hint;
    }
    if (L.worldId) {
        const name = worldName || L.worldId;
        return L.instanceId ? `${name} · ${accessTypeLabel}` : name;
    }
    return '';
}

export { getLocationText };
