import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';

import configRepository from '../services/config.js';

export const useGameStore = defineStore('Game', () => {
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

    const lastSessionDurationMs = ref(0);

    const lastOfflineAt = ref(0);

    /**
     *
     */
    async function init() {
        isGameNoVR.value = await configRepository.getBool('isGameNoVR');
        const [savedMs, savedAt] = await Promise.all([
            configRepository.getString('VRCX_lastGameSessionMs', null),
            configRepository.getString('VRCX_lastGameOfflineAt', null)
        ]);
        if (savedMs) lastSessionDurationMs.value = Number(savedMs) || 0;
        if (savedAt) lastOfflineAt.value = Number(savedAt) || 0;
    }

    init();

    /**
     * @param {boolean} value Game running flag.
     */
    function setIsGameRunning(value) {
        isGameRunning.value = value;
    }

    /**
     * @param {boolean} value Whether game was launched in non-VR mode.
     */
    function setIsGameNoVR(value) {
        isGameNoVR.value = value;
    }

    /**
     * @param {boolean} value SteamVR running flag.
     */
    function setIsSteamVRRunning(value) {
        isSteamVRRunning.value = value;
    }

    /**
     * @param {boolean} value HMD AFK flag.
     */
    function setIsHmdAfk(value) {
        isHmdAfk.value = value;
    }

    /**
     * @param {number} durationMs Session duration in milliseconds.
     * @param {number} offlineTimestamp Timestamp when game stopped.
     */
    function setLastSession(durationMs, offlineTimestamp) {
        lastSessionDurationMs.value = durationMs;
        lastOfflineAt.value = offlineTimestamp;
    }

    /**
     * @param {Date | null} value Last crashed time.
     */
    function setLastCrashedTime(value) {
        state.lastCrashedTime = value;
    }

    /**
     * Fetches VRChat cache size from AssetBundleManager.
     */
    async function getVRChatCacheSize() {
        VRChatCacheSizeLoading.value = true;
        const totalCacheSize = 30;
        VRChatTotalCacheSize.value = totalCacheSize;
        const usedCacheSize = await AssetBundleManager.GetCacheSize();
        VRChatUsedCacheSize.value = (usedCacheSize / 1073741824).toFixed(2);
        VRChatCacheSizeLoading.value = false;
    }

    /**
     * @param {string} key VRChat registry key.
     * @returns {Promise<unknown>} Registry key value.
     */
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
        lastSessionDurationMs,
        lastOfflineAt,

        setIsGameRunning,
        setIsGameNoVR,
        setIsSteamVRRunning,
        setIsHmdAfk,
        setLastSession,
        setLastCrashedTime,
        getVRChatCacheSize,
        getVRChatRegistryKey
    };
});
