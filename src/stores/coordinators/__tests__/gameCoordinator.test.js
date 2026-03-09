import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createGameCoordinator } from '../gameCoordinator';

/**
 *
 * @returns {object} Mock dependencies for game coordinator.
 */
function makeDeps() {
    return {
        userStore: {
            currentUser: {
                currentAvatar: 'avtr_1'
            },
            markCurrentUserGameStarted: vi.fn(),
            markCurrentUserGameStopped: vi.fn()
        },
        instanceStore: {
            removeAllQueuedInstances: vi.fn()
        },
        updateLoopStore: {
            setIpcTimeout: vi.fn(),
            setNextDiscordUpdate: vi.fn()
        },
        locationStore: {
            lastLocationReset: vi.fn()
        },
        gameLogStore: {
            clearNowPlaying: vi.fn()
        },
        vrStore: {
            updateVRLastLocation: vi.fn()
        },
        avatarStore: {
            addAvatarWearTime: vi.fn()
        },
        configRepository: {
            setBool: vi.fn().mockResolvedValue(undefined)
        },
        workerTimers: {
            setTimeout: vi.fn()
        },
        checkVRChatDebugLogging: vi.fn(),
        autoVRChatCacheManagement: vi.fn(),
        checkIfGameCrashed: vi.fn(),
        getIsGameNoVR: vi.fn(() => true)
    };
}

describe('createGameCoordinator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('runGameRunningChangedFlow(true) runs start + shared side effects', async () => {
        const deps = makeDeps();
        const coordinator = createGameCoordinator(deps);

        await coordinator.runGameRunningChangedFlow(true);

        expect(deps.userStore.markCurrentUserGameStarted).toHaveBeenCalledTimes(
            1
        );
        expect(deps.configRepository.setBool).not.toHaveBeenCalled();
        expect(
            deps.userStore.markCurrentUserGameStopped
        ).not.toHaveBeenCalled();
        expect(
            deps.instanceStore.removeAllQueuedInstances
        ).not.toHaveBeenCalled();
        expect(deps.autoVRChatCacheManagement).not.toHaveBeenCalled();
        expect(deps.checkIfGameCrashed).not.toHaveBeenCalled();
        expect(deps.updateLoopStore.setIpcTimeout).not.toHaveBeenCalled();
        expect(deps.avatarStore.addAvatarWearTime).not.toHaveBeenCalled();

        expect(deps.locationStore.lastLocationReset).toHaveBeenCalledTimes(1);
        expect(deps.gameLogStore.clearNowPlaying).toHaveBeenCalledTimes(1);
        expect(deps.vrStore.updateVRLastLocation).toHaveBeenCalledTimes(1);
        expect(deps.updateLoopStore.setNextDiscordUpdate).toHaveBeenCalledWith(
            0
        );

        expect(deps.workerTimers.setTimeout).toHaveBeenCalledTimes(1);
        expect(deps.workerTimers.setTimeout.mock.calls[0][1]).toBe(60000);
        const timeoutCb = deps.workerTimers.setTimeout.mock.calls[0][0];
        timeoutCb();
        expect(deps.checkVRChatDebugLogging).toHaveBeenCalledTimes(1);
    });

    test('runGameRunningChangedFlow(false) runs stop + shared side effects', async () => {
        const deps = makeDeps();
        deps.getIsGameNoVR.mockReturnValue(false);
        const coordinator = createGameCoordinator(deps);

        await coordinator.runGameRunningChangedFlow(false);

        expect(deps.getIsGameNoVR).toHaveBeenCalledTimes(1);
        expect(deps.configRepository.setBool).toHaveBeenCalledWith(
            'isGameNoVR',
            false
        );
        expect(deps.userStore.markCurrentUserGameStopped).toHaveBeenCalledTimes(
            1
        );
        expect(
            deps.instanceStore.removeAllQueuedInstances
        ).toHaveBeenCalledTimes(1);
        expect(deps.autoVRChatCacheManagement).toHaveBeenCalledTimes(1);
        expect(deps.checkIfGameCrashed).toHaveBeenCalledTimes(1);
        expect(deps.updateLoopStore.setIpcTimeout).toHaveBeenCalledWith(0);
        expect(deps.avatarStore.addAvatarWearTime).toHaveBeenCalledWith(
            'avtr_1'
        );

        expect(deps.locationStore.lastLocationReset).toHaveBeenCalledTimes(1);
        expect(deps.gameLogStore.clearNowPlaying).toHaveBeenCalledTimes(1);
        expect(deps.vrStore.updateVRLastLocation).toHaveBeenCalledTimes(1);
        expect(deps.updateLoopStore.setNextDiscordUpdate).toHaveBeenCalledWith(
            0
        );

        expect(deps.workerTimers.setTimeout).toHaveBeenCalledTimes(1);
        expect(deps.workerTimers.setTimeout.mock.calls[0][1]).toBe(60000);
    });
});
