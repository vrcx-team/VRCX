import { useAvatarStore } from '../stores/avatar';
import { useGameLogStore } from '../stores/gameLog';
import { useGameStore } from '../stores/game';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useUpdateLoopStore } from '../stores/updateLoop';
import { useUserStore } from '../stores/user';
import { useVrStore } from '../stores/vr';

import configRepository from '../service/config';

import * as workerTimers from 'worker-timers';

/**
 * Runs shared side effects when game running state changes.
 * @param {boolean} isGameRunning Whether VRChat is running.
 */
export async function runGameRunningChangedFlow(isGameRunning) {
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const updateLoopStore = useUpdateLoopStore();
    const locationStore = useLocationStore();
    const gameLogStore = useGameLogStore();
    const vrStore = useVrStore();
    const avatarStore = useAvatarStore();
    const gameStore = useGameStore();

    if (isGameRunning) {
        userStore.markCurrentUserGameStarted();
    } else {
        await configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
        userStore.markCurrentUserGameStopped();
        instanceStore.removeAllQueuedInstances();
        gameStore.autoVRChatCacheManagement();
        gameStore.checkIfGameCrashed();
        updateLoopStore.setIpcTimeout(0);
        avatarStore.addAvatarWearTime(userStore.currentUser.currentAvatar);
    }

    locationStore.lastLocationReset();
    gameLogStore.clearNowPlaying();
    vrStore.updateVRLastLocation();
    workerTimers.setTimeout(() => gameStore.checkVRChatDebugLogging(), 60000);
    updateLoopStore.setNextDiscordUpdate(0);
}
