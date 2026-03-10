/**
 * @param {object} deps Coordinator dependencies.
 * @returns {object} Game flow coordinator methods.
 */
export function createGameCoordinator(deps) {
    const {
        userStore,
        instanceStore,
        updateLoopStore,
        locationStore,
        gameLogStore,
        vrStore,
        avatarStore,
        configRepository,
        workerTimers,
        checkVRChatDebugLogging,
        autoVRChatCacheManagement,
        checkIfGameCrashed,
        getIsGameNoVR
    } = deps;

    /**
     * Runs shared side effects when game running state changes.
     * @param {boolean} isGameRunning Whether VRChat is running.
     */
    async function runGameRunningChangedFlow(isGameRunning) {
        if (isGameRunning) {
            userStore.markCurrentUserGameStarted();
        } else {
            await configRepository.setBool('isGameNoVR', getIsGameNoVR());
            userStore.markCurrentUserGameStopped();
            instanceStore.removeAllQueuedInstances();
            autoVRChatCacheManagement();
            checkIfGameCrashed();
            updateLoopStore.setIpcTimeout(0);
            avatarStore.addAvatarWearTime(userStore.currentUser.currentAvatar);
        }

        locationStore.lastLocationReset();
        gameLogStore.clearNowPlaying();
        vrStore.updateVRLastLocation();
        workerTimers.setTimeout(() => checkVRChatDebugLogging(), 60000);
        updateLoopStore.setNextDiscordUpdate(0);
    }

    return {
        runGameRunningChangedFlow
    };
}
