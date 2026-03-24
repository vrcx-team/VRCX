import {
    useFriendStore,
    useInstanceStore,
    useLocationStore,
    useUserStore
} from '../stores';
import {
    checkCanInvite as checkCanInvitePure,
    checkCanInviteSelf as checkCanInviteSelfPure
} from '../shared/utils/invite';

/**
 * Composable that provides store-aware invite check functions.
 * Delegates to the pure utility functions after resolving store data.
 */
export function useInviteChecks() {
    const userStore = useUserStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();

    function checkCanInvite(location) {
        return checkCanInvitePure(location, {
            currentUserId: userStore.currentUser.id,
            lastLocationStr: locationStore.lastLocation.location,
            cachedInstances: instanceStore.cachedInstances
        });
    }

    function checkCanInviteSelf(location) {
        return checkCanInviteSelfPure(location, {
            currentUserId: userStore.currentUser.id,
            cachedInstances: instanceStore.cachedInstances,
            friends: friendStore.friends
        });
    }

    return { checkCanInvite, checkCanInviteSelf };
}
