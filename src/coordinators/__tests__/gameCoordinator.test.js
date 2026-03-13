import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    userStore: {
        currentUser: {
            $online_for: 1000,
            currentAvatar: 'avtr_test'
        },
        markCurrentUserGameStarted: vi.fn(),
        markCurrentUserGameStopped: vi.fn()
    },
    gameStore: {
        isGameNoVR: false,
        setLastSession: vi.fn(),
        setIsGameRunning: vi.fn(),
        isGameRunning: false,
        setIsSteamVRRunning: vi.fn(),
        isSteamVRRunning: false
    },
    instanceStore: {
        removeAllQueuedInstances: vi.fn()
    },
    updateLoopStore: {
        setIpcTimeout: vi.fn(),
        setNextDiscordUpdate: vi.fn()
    },
    gameLogStore: {
        clearNowPlaying: vi.fn()
    },
    vrStore: {
        updateVRLastLocation: vi.fn(),
        updateOpenVR: vi.fn()
    },
    advancedSettingsStore: {
        autoSweepVRChatCache: false,
        relaunchVRChatAfterCrash: false,
        gameLogDisabled: false
    },
    configRepository: {
        setBool: vi.fn().mockResolvedValue(undefined),
        setString: vi.fn().mockResolvedValue(undefined)
    },
    addAvatarWearTime: vi.fn(),
    runLastLocationResetFlow: vi.fn()
}));

vi.mock('vue-sonner', () => ({
    toast: vi.fn()
}));

vi.mock('../../shared/utils', () => ({
    deleteVRChatCache: vi.fn(),
    isRealInstance: vi.fn(() => false)
}));

vi.mock('../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(null);
            }
        }
    )
}));

vi.mock('../../stores/settings/advanced', () => ({
    useAdvancedSettingsStore: () => mocks.advancedSettingsStore
}));

vi.mock('../../stores/avatar', () => ({
    useAvatarStore: () => ({})
}));

vi.mock('../avatarCoordinator', () => ({
    addAvatarWearTime: (...args) => mocks.addAvatarWearTime(...args)
}));

vi.mock('../../stores/gameLog', () => ({
    useGameLogStore: () => mocks.gameLogStore
}));

vi.mock('../../stores/game', () => ({
    useGameStore: () => mocks.gameStore
}));

vi.mock('../../stores/instance', () => ({
    useInstanceStore: () => mocks.instanceStore
}));

vi.mock('../../stores/launch', () => ({
    useLaunchStore: () => ({})
}));

vi.mock('../../stores/location', () => ({
    useLocationStore: () => ({ lastLocation: { location: '', playerList: { size: 0 } } })
}));

vi.mock('../locationCoordinator', () => ({
    runLastLocationResetFlow: (...args) => mocks.runLastLocationResetFlow(...args)
}));

vi.mock('../../stores/modal', () => ({
    useModalStore: () => ({})
}));

vi.mock('../../stores/notification', () => ({
    useNotificationStore: () => ({ queueGameLogNoty: vi.fn() })
}));

vi.mock('../../stores/updateLoop', () => ({
    useUpdateLoopStore: () => mocks.updateLoopStore
}));

vi.mock('../../stores/user', () => ({
    useUserStore: () => mocks.userStore
}));

vi.mock('../../stores/vr', () => ({
    useVrStore: () => mocks.vrStore
}));

vi.mock('../../stores/world', () => ({
    useWorldStore: () => ({ updateVRChatWorldCache: vi.fn() })
}));

vi.mock('../../services/config', () => ({
    default: mocks.configRepository
}));

vi.mock('worker-timers', () => ({
    setTimeout: vi.fn()
}));

import { runGameRunningChangedFlow } from '../gameCoordinator';

describe('runGameRunningChangedFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.userStore.currentUser.$online_for = 1000;
        mocks.gameStore.isGameNoVR = false;
    });

    test('persists and stores last game session when game stops', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(5000);

        await runGameRunningChangedFlow(false);

        expect(mocks.gameStore.setLastSession).toHaveBeenCalledWith(4000, 5000);
        expect(mocks.configRepository.setString).toHaveBeenCalledWith('VRCX_lastGameSessionMs', '4000');
        expect(mocks.configRepository.setString).toHaveBeenCalledWith('VRCX_lastGameOfflineAt', '5000');
        expect(mocks.userStore.markCurrentUserGameStopped).toHaveBeenCalled();
    });

    test('skips persisting last game session when no valid session start exists', async () => {
        mocks.userStore.currentUser.$online_for = 0;

        await runGameRunningChangedFlow(false);

        expect(mocks.gameStore.setLastSession).not.toHaveBeenCalled();
        expect(mocks.configRepository.setString).not.toHaveBeenCalledWith('VRCX_lastGameSessionMs', expect.any(String));
        expect(mocks.configRepository.setString).not.toHaveBeenCalledWith('VRCX_lastGameOfflineAt', expect.any(String));
    });
});
