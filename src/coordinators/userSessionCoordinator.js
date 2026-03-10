/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} User session coordinator methods.
 */
export function createUserSessionCoordinator(deps) {
    const {
        avatarStore,
        gameStore,
        groupStore,
        instanceStore,
        friendStore,
        authStore,
        cachedUsers,
        currentUser,
        userDialog,
        getWorldName,
        parseLocation,
        now
    } = deps;

    /**
     * Runs avatar transition side effects for current user updates.
     * @param {object} args Avatar transition context.
     * @param {object} args.json Current user payload.
     * @param {object} args.ref Current user state reference.
     * @param {boolean} args.isLoggedIn Whether current user is already logged in.
     */
    function runAvatarSwapFlow({ json, ref, isLoggedIn }) {
        if (!isLoggedIn) {
            return;
        }
        if (json.currentAvatar !== ref.currentAvatar) {
            avatarStore.addAvatarToHistory(json.currentAvatar);
            if (gameStore.isGameRunning) {
                avatarStore.addAvatarWearTime(ref.currentAvatar);
                ref.$previousAvatarSwapTime = now();
            }
        }
    }

    /**
     * Runs one-time side effects for first current-user hydration after login.
     * @param {object} ref Current user state reference.
     */
    function runFirstLoginFlow(ref) {
        if (gameStore.isGameRunning) {
            ref.$previousAvatarSwapTime = now();
        }
        cachedUsers.clear(); // clear before running applyUser
        currentUser.value = ref;
        authStore.loginComplete();
    }

    /**
     * Runs cross-store synchronization after current-user data is applied.
     * @param {object} ref Current user state reference.
     */
    function runPostApplySyncFlow(ref) {
        groupStore.applyPresenceGroups(ref);
        instanceStore.applyQueuedInstance(ref.queuedInstance);
        friendStore.updateUserCurrentStatus(ref);
        friendStore.updateFriendships(ref);
    }

    /**
     * Syncs home location derived state and visible dialog display name.
     * @param {object} ref Current user state reference.
     */
    function runHomeLocationSyncFlow(ref) {
        if (ref.homeLocation === ref.$homeLocation?.tag) {
            return;
        }
        ref.$homeLocation = parseLocation(ref.homeLocation);
        // apply home location name to user dialog
        if (userDialog.value.visible && userDialog.value.id === ref.id) {
            getWorldName(currentUser.value.homeLocation).then((worldName) => {
                userDialog.value.$homeLocationName = worldName;
            });
        }
    }

    return {
        runAvatarSwapFlow,
        runFirstLoginFlow,
        runPostApplySyncFlow,
        runHomeLocationSyncFlow
    };
}
