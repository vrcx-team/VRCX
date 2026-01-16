import { parseLocation } from './location';
import { rpcWorlds } from '../constants';
import { worldRequest } from '../../api';

/**
 *
 * @param {string} location
 * @returns {Promise<string>}
 */
async function getWorldName(location) {
    let worldName = '';

    const L = parseLocation(location);
    if (L.isRealInstance && L.worldId) {
        try {
            const args = await worldRequest.getCachedWorld({
                worldId: L.worldId
            });
            worldName = args.ref.name;
        } catch (e) {
            console.error('getWorldName failed location', location, e);
        }
    }

    return worldName;
}

/**
 *
 * @param {string} location
 * @returns
 */
function isRpcWorld(location) {
    const L = parseLocation(location);
    if (rpcWorlds.includes(L.worldId)) {
        return true;
    }
    return false;
}

export { getWorldName, isRpcWorld };
