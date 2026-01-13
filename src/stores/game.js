import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

import {
    deleteVRChatCache as _deleteVRChatCache,
    isRealInstance
} from '../shared/utils';
import { database } from '../service/database';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAvatarStore } from './avatar';
import { useGameLogStore } from './gameLog';
import { useInstanceStore } from './instance';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useModalStore } from './modal';
import { useNotificationStore } from './notification';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useWorldStore } from './world';

import configRepository from '../service/config.js';

import * as workerTimers from 'worker-timers';

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
    const modalStore = useModalStore();

    const state = reactive({
        lastCrashedTime: null
    });

    const VRChatUsedCacheSize = ref('');

    const VRChatTotalCacheSize = ref(0);

    const VRChatCacheSizeLoading = ref(false);

    const isGameRunning = ref(false);

    const isGameNoVR = ref(true);

    const isSteamVRRunning = ref(false);

    const isHmdAfk = ref(false);

    async function init() {
        isGameNoVR.value = await configRepository.getBool('isGameNoVR');
    }

    init();

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
        try {
            const output = await AssetBundleManager.SweepCache();
            console.log('SweepCache', output);
        } catch (e) {
            console.error('SweepCache failed', e);
        }
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
            if (isGameNoVR.value) {
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
        if (!isGameNoVR.value && !isSteamVRRunning.value) {
            console.log("SteamVR isn't running, not relaunching VRChat");
            return;
        }
        AppApi.FocusWindow();
        const message = 'VRChat crashed, attempting to rejoin last instance';
        toast(message);
        const entry = {
            created_at: new Date().toJSON(),
            type: 'Event',
            data: message
        };
        database.addGamelogEventToDatabase(entry);
        notificationStore.queueGameLogNoty(entry);
        gameLogStore.addGameLog(entry);
        launchStore.launchGame(location, '', isGameNoVR.value);
    }

    async function getVRChatCacheSize() {
        VRChatCacheSizeLoading.value = true;
        const totalCacheSize = 30;
        VRChatTotalCacheSize.value = totalCacheSize;
        const usedCacheSize = await AssetBundleManager.GetCacheSize();
        VRChatUsedCacheSize.value = (usedCacheSize / 1073741824).toFixed(2);
        VRChatCacheSizeLoading.value = false;
    }

    // use in C#
    async function updateIsGameRunning(isGameRunningArg, isSteamVRRunningArg) {
        const avatarStore = useAvatarStore();
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        if (isGameRunningArg !== isGameRunning.value) {
            isGameRunning.value = isGameRunningArg;
            if (isGameRunningArg) {
                userStore.currentUser.$online_for = Date.now();
                userStore.currentUser.$offline_for = '';
                userStore.currentUser.$previousAvatarSwapTime = Date.now();
            } else {
                await configRepository.setBool('isGameNoVR', isGameNoVR.value);
                userStore.currentUser.$online_for = 0;
                userStore.currentUser.$offline_for = Date.now();
                instanceStore.removeAllQueuedInstances();
                autoVRChatCacheManagement();
                checkIfGameCrashed();
                updateLoopStore.ipcTimeout = 0;
                avatarStore.addAvatarWearTime(
                    userStore.currentUser.currentAvatar
                );
                userStore.currentUser.$previousAvatarSwapTime = null;
            }
            locationStore.lastLocationReset();
            gameLogStore.clearNowPlaying();
            vrStore.updateVRLastLocation();
            workerTimers.setTimeout(() => checkVRChatDebugLogging(), 60000);
            updateLoopStore.nextDiscordUpdate = 0;
            console.log(new Date(), 'isGameRunning', isGameRunningArg);
        }

        if (isSteamVRRunningArg !== isSteamVRRunning.value) {
            isSteamVRRunning.value = isSteamVRRunningArg;
            console.log('isSteamVRRunning:', isSteamVRRunningArg);
        }
        vrStore.updateOpenVR();
    }

    // use in C#
    function updateIsHmdAfk(isHmdAfkArg) {
        if (isHmdAfkArg !== isHmdAfk.value) {
            isHmdAfk.value = isHmdAfkArg;
            console.log('isHmdAfk', isHmdAfkArg);
        }
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
                modalStore.alert({
                    description:
                        'VRCX has noticed VRChat debug logging is disabled. VRCX requires debug logging in order to function correctly. Please enable debug logging in VRChat quick menu settings > debug > enable debug logging, then rejoin the instance or restart VRChat.',
                    title: 'Enable debug logging'
                });
                console.error('Failed to enable debug logging', result);
                return;
            }
            modalStore.alert({
                description:
                    'VRCX has noticed VRChat debug logging is disabled and automatically re-enabled it. VRCX requires debug logging in order to function correctly.',
                title: 'Enabled debug logging'
            });
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
        checkVRChatDebugLogging,
        updateIsHmdAfk
    };
});
