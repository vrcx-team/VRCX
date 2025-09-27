import { instanceRequest } from '../../api';
import { parseLocation } from './location';

/**
 *
 * @param {object} instance
 */
function refreshInstancePlayerCount(instance) {
    const L = parseLocation(instance);
    if (L.isRealInstance) {
        instanceRequest.getInstance({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
    }
}

/**
 *
 * @param {string} instanceId
 * @returns
 */
function isRealInstance(instanceId) {
    if (!instanceId) {
        return false;
    }
    switch (instanceId) {
        case ':':
        case 'offline':
        case 'offline:offline':
        case 'private':
        case 'private:private':
        case 'traveling':
        case 'traveling:traveling':
            return false;
    }
    if (instanceId.startsWith('local')) {
        return false;
    }
    return true;
}

/**
 *
 * @param {object} instance
 * @returns {string}
 */
function getLaunchURL(instance) {
    const L = instance;
    if (L.instanceId) {
        if (L.shortName) {
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                L.worldId
            )}&instanceId=${encodeURIComponent(
                L.instanceId
            )}&shortName=${encodeURIComponent(L.shortName)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            L.worldId
        )}&instanceId=${encodeURIComponent(L.instanceId)}`;
    }
    return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
        L.worldId
    )}`;
}

export { refreshInstancePlayerCount, isRealInstance, getLaunchURL };
