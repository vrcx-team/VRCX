import { instanceRequest } from '../../api';
import utils from '../../classes/utils';

// TODO: launch, invite, refresh, etc. buttons, better to split into one component
function refreshInstancePlayerCount(instance) {
    const L = utils.parseLocation(instance);
    if (L.isRealInstance) {
        instanceRequest.getInstance({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
    }
}

export { refreshInstancePlayerCount };
