import { worldRequest } from '../../api';
import { parseLocation } from './location';
import { rpcWorlds } from '../constants';
/**
 *
 * @param {string} location
 * @returns {Promise<string>}
 */
async function getWorldName(location) {
    let worldName = '';

    const L = parseLocation(location);
    if (L.isRealInstance && L.worldId) {
        const args = await worldRequest.getCachedWorld({
            worldId: L.worldId
        });
        worldName = args.ref.name;
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
