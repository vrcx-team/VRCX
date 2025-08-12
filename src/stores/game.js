import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app } from '../app';
import configRepository from '../service/config.js';
import { database } from '../service/database';
import {
    deleteVRChatCache as _deleteVRChatCache,
    isRealInstance
} from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useGameLogStore } from './gameLog';
import { useInstanceStore } from './instance';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useWorldStore } from './world';

export const useGameStore = defineStore('Game', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();
    const avatarStore = useAvatarStore();
    const launchStore = useLaunchStore();
    const worldStore = useWorldStore();
    const instanceStore = useInstanceStore();
    const gameLogStore = useGameLogStore();
    const vrStore = useVrStore();
    const userStore = useUserStore();
    const updateLoopStore = useUpdateLoopStore();

    const state = reactive({
        lastCrashedTime: null,
        VRChatUsedCacheSize: '',
        VRChatTotalCacheSize: 0,
        VRChatCacheSizeLoading: false,
        isGameRunning: false,
        isGameNoVR: true,
        isSteamVRRunning: false,
        isHmdAfk: false
    });

    async function init() {
        state.isGameNoVR = await configRepository.getBool('isGameNoVR');
    }

    init();

    const VRChatUsedCacheSize = computed({
        get: () => state.VRChatUsedCacheSize,
        set: (value) => {
            state.VRChatUsedCacheSize = value;
        }
    });

    const VRChatTotalCacheSize = computed({
        get: () => state.VRChatTotalCacheSize,
        set: (value) => {
            state.VRChatTotalCacheSize = value;
        }
    });

    const VRChatCacheSizeLoading = computed({
        get: () => state.VRChatCacheSizeLoading,
        set: (value) => {
            state.VRChatCacheSizeLoading = value;
        }
    });

    const isGameRunning = computed({
        get: () => state.isGameRunning,
        set: (value) => {
            state.isGameRunning = value;
        }
    });

    const isGameNoVR = computed({
        get: () => state.isGameNoVR,
        set: (value) => {
            state.isGameNoVR = value;
        }
    });

    const isSteamVRRunning = computed({
        get: () => state.isSteamVRRunning,
        set: (value) => {
            state.isSteamVRRunning = value;
        }
    });

    const isHmdAfk = computed({
        get: () => state.isHmdAfk,
        set: (value) => {
            state.isHmdAfk = value;
        }
    });

    async function deleteVRChatCache(ref) {
        await _deleteVRChatCache(ref);
        getVRChatCacheSize();
        worldStore.updateVRChatWorldCache();
        avatarStore.updateVRChatAvatarCache();
    }

    function autoVRChatCacheManagement() {
        if (advancedSettingsStore.autoSweepVRChatCache) {
            sweepVRChatCache();
        }
    }

    async function sweepVRChatCache() {
        const output = await AssetBundleManager.SweepCache();
        console.log('SweepCache', output);
        if (advancedSettingsStore.isVRChatConfigDialogVisible) {
            getVRChatCacheSize();
        }
    }

    function checkIfGameCrashed() {
        if (!advancedSettingsStore.relaunchVRChatAfterCrash) {
            return;
        }
        const { location } = locationStore.lastLocation;
        AppApi.VrcClosedGracefully().then((result) => {
            if (result || !isRealInstance(location)) {
                return;
            }
            // check if relaunched less than 2mins ago (prvent crash loop)
            if (
                state.lastCrashedTime &&
                new Date().getTime() - state.lastCrashedTime.getTime() < 120_000
            ) {
                console.log('VRChat was recently crashed, not relaunching');
                return;
            }
            state.lastCrashedTime = new Date();
            // wait a bit for SteamVR to potentially close before deciding to relaunch
            let restartDelay = 8000;
            if (state.isGameNoVR) {
                // wait for game to close before relaunching
                restartDelay = 2000;
            }
            workerTimers.setTimeout(
                () => restartCrashedGame(location),
                restartDelay
            );
        });
    }

    function restartCrashedGame(location) {
        if (!state.isGameNoVR && !state.isSteamVRRunning) {
            console.log("SteamVR isn't running, not relaunching VRChat");
            return;
        }
        AppApi.FocusWindow();
        const message = 'VRChat crashed, attempting to rejoin last instance';
        $app.$message({
            message,
            type: 'info'
        });
        const entry = {
            created_at: new Date().toJSON(),
            type: 'Event',
            data: message
        };
        database.addGamelogEventToDatabase(entry);
        notificationStore.queueGameLogNoty(entry);
        gameLogStore.addGameLog(entry);
        launchStore.launchGame(location, '', state.isGameNoVR);
    }

    async function getVRChatCacheSize() {
        state.VRChatCacheSizeLoading = true;
        const totalCacheSize = 30;
        state.VRChatTotalCacheSize = totalCacheSize;
        const usedCacheSize = await AssetBundleManager.GetCacheSize();
        state.VRChatUsedCacheSize = (usedCacheSize / 1073741824).toFixed(2);
        state.VRChatCacheSizeLoading = false;
    }

    // use in C#
    async function updateIsGameRunning(
        isGameRunning,
        isSteamVRRunning,
        isHmdAfk
    ) {
        const avatarStore = useAvatarStore();
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        if (isGameRunning !== state.isGameRunning) {
            state.isGameRunning = isGameRunning;
            if (isGameRunning) {
                userStore.currentUser.$online_for = Date.now();
                userStore.currentUser.$offline_for = '';
                userStore.currentUser.$previousAvatarSwapTime = Date.now();
            } else {
                await configRepository.setBool('isGameNoVR', state.isGameNoVR);
                userStore.currentUser.$online_for = 0;
                userStore.currentUser.$offline_for = Date.now();
                instanceStore.removeAllQueuedInstances();
                autoVRChatCacheManagement();
                checkIfGameCrashed();
                updateLoopStore.ipcTimeout = 0;
                avatarStore.addAvatarWearTime(
                    userStore.currentUser.currentAvatar
                );
                userStore.currentUser.$previousAvatarSwapTime = '';
            }
            locationStore.lastLocationReset();
            gameLogStore.clearNowPlaying();
            vrStore.updateVRLastLocation();
            workerTimers.setTimeout(() => checkVRChatDebugLogging(), 60000);
            updateLoopStore.nextDiscordUpdate = 0;
            console.log(new Date(), 'isGameRunning', isGameRunning);
        }

        if (isSteamVRRunning !== state.isSteamVRRunning) {
            state.isSteamVRRunning = isSteamVRRunning;
            console.log('isSteamVRRunning:', isSteamVRRunning);
        }
        if (isHmdAfk !== state.isHmdAfk) {
            state.isHmdAfk = isHmdAfk;
            console.log('isHmdAfk:', isHmdAfk);
        }
        vrStore.updateOpenVR();
    }

    async function checkVRChatDebugLogging() {
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        try {
            const loggingEnabled =
                await getVRChatRegistryKey('LOGGING_ENABLED');
            if (
                loggingEnabled === null ||
                typeof loggingEnabled === 'undefined'
            ) {
                // key not found
                return;
            }
            if (parseInt(loggingEnabled, 10) === 1) {
                // already enabled
                return;
            }
            const result = await AppApi.SetVRChatRegistryKey(
                'LOGGING_ENABLED',
                '1',
                4
            );
            if (!result) {
                // failed to set key
                $app.$alert(
                    'VRCX has noticed VRChat debug logging is disabled. VRCX requires debug logging in order to function correctly. Please enable debug logging in VRChat quick menu settings > debug > enable debug logging, then rejoin the instance or restart VRChat.',
                    'Enable debug logging'
                );
                console.error('Failed to enable debug logging', result);
                return;
            }
            $app.$alert(
                'VRCX has noticed VRChat debug logging is disabled and automatically re-enabled it. VRCX requires debug logging in order to function correctly.',
                'Enabled debug logging'
            );
            console.log('Enabled debug logging');
        } catch (e) {
            console.error(e);
        }
    }

    async function getVRChatRegistryKey(key) {
        if (LINUX) {
            return AppApi.GetVRChatRegistryKeyString(key);
        }
        return AppApi.GetVRChatRegistryKey(key);
    }

    return {
        state,
        VRChatUsedCacheSize,
        VRChatTotalCacheSize,
        VRChatCacheSizeLoading,
        isGameRunning,
        isGameNoVR,
        isSteamVRRunning,
        isHmdAfk,

        deleteVRChatCache,
        sweepVRChatCache,
        getVRChatCacheSize,
        updateIsGameRunning,
        getVRChatRegistryKey,
        checkVRChatDebugLogging
    };
});
