import { toast } from 'vue-sonner';
import { i18n } from '../plugins/i18n';

import { instanceRequest } from '../api';
import { parseLocation } from '../shared/utils';
import { useInstanceStore } from '../stores/instance';
import { useInviteStore } from '../stores/invite';
import { useLaunchStore } from '../stores/launch';

/**
 * Creates a new instance for the given world and either opens it in-game
 * or sends a self-invite, depending on game state.
 * @param {string} worldId
 */
export function runNewInstanceSelfInviteFlow(worldId) {
    const instanceStore = useInstanceStore();
    const launchStore = useLaunchStore();
    const inviteStore = useInviteStore();
    const t = i18n.global.t;

    instanceStore.createNewInstance(worldId).then((args) => {
        const location = args?.json?.location;
        if (!location) {
            toast.error(t('message.instance.create_failed'));
            return;
        }
        // self invite
        const L = parseLocation(location);
        if (!L.isRealInstance) {
            return;
        }
        if (inviteStore.canOpenInstanceInGame) {
            const secureOrShortName =
                args.json.shortName || args.json.secureName;
            launchStore.tryOpenInstanceInVrc(location, secureOrShortName);
            return;
        }
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId
            })
            .then((args) => {
                toast.success(t('message.invite.self_sent'));
                return args;
            });
    });
}
