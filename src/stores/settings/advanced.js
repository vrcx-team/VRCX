import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { $app } from '../../app';
import { t } from '../../plugin';
import configRepository from '../../service/config';
import { database } from '../../service/database';
import webApiService from '../../service/webapi';
import { watchState } from '../../service/watchState';
import { useGameStore } from '../game';
import { useVrcxStore } from '../vrcx';
import { AppGlobal } from '../../service/appConfig';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
    const gameStore = useGameStore();
    const vrcxStore = useVrcxStore();

    const state = reactive({
        enablePrimaryPassword: false,
        relaunchVRChatAfterCrash: false,
        vrcQuitFix: true,
        autoSweepVRChatCache: false,
        saveInstancePrints: false,
        cropInstancePrints: false,
        saveInstanceStickers: false,
        avatarRemoteDatabase: true,
        enableAppLauncher: true,
        enableAppLauncherAutoClose: true,
        screenshotHelper: true,
        screenshotHelperModifyFilename: false,
        screenshotHelperCopyToClipboard: false,
        youTubeApi: false,
        youTubeApiKey: '',
        progressPie: false,
        progressPieFilter: true,
        showConfirmationOnSwitchAvatar: false,
        gameLogDisabled: false,
        sqliteTableSizes: {},
        ugcFolderPath: '',
        currentUserInventory: new Map(),
        autoDeleteOldPrints: false,
        notificationOpacity: 100,
        folderSelectorDialogVisible: false,
        isVRChatConfigDialogVisible: false,
        saveInstanceEmoji: false,
        vrcRegistryAutoBackup: true
    });

    async function initAdvancedSettings() {
        const [
            enablePrimaryPassword,
            relaunchVRChatAfterCrash,
            vrcQuitFix,
            autoSweepVRChatCache,
            saveInstancePrints,
            cropInstancePrints,
            saveInstanceStickers,
            avatarRemoteDatabase,
            enableAppLauncher,
            enableAppLauncherAutoClose,
            screenshotHelper,
            screenshotHelperModifyFilename,
            screenshotHelperCopyToClipboard,
            youTubeApi,
            youTubeApiKey,
            progressPie,
            progressPieFilter,
            showConfirmationOnSwitchAvatar,
            gameLogDisabled,
            ugcFolderPath,
            autoDeleteOldPrints,
            notificationOpacity,
            saveInstanceEmoji,
            vrcRegistryAutoBackup
        ] = await Promise.all([
            configRepository.getBool('enablePrimaryPassword', false),
            configRepository.getBool('VRCX_relaunchVRChatAfterCrash', false),
            configRepository.getBool('VRCX_vrcQuitFix', true),
            configRepository.getBool('VRCX_autoSweepVRChatCache', false),
            configRepository.getBool('VRCX_saveInstancePrints', false),
            configRepository.getBool('VRCX_cropInstancePrints', false),
            configRepository.getBool('VRCX_saveInstanceStickers', false),
            configRepository.getBool('VRCX_avatarRemoteDatabase', true),
            configRepository.getBool('VRCX_enableAppLauncher', true),
            configRepository.getBool('VRCX_enableAppLauncherAutoClose', true),
            configRepository.getBool('VRCX_screenshotHelper', true),
            configRepository.getBool(
                'VRCX_screenshotHelperModifyFilename',
                false
            ),
            configRepository.getBool(
                'VRCX_screenshotHelperCopyToClipboard',
                false
            ),
            configRepository.getBool('VRCX_youtubeAPI', false),
            configRepository.getString('VRCX_youtubeAPIKey', ''),
            configRepository.getBool('VRCX_progressPie', false),
            configRepository.getBool('VRCX_progressPieFilter', true),
            configRepository.getBool(
                'VRCX_showConfirmationOnSwitchAvatar',
                false
            ),
            configRepository.getBool('VRCX_gameLogDisabled', false),
            configRepository.getString('VRCX_userGeneratedContentPath', ''),
            configRepository.getBool('VRCX_autoDeleteOldPrints', false),
            configRepository.getFloat('VRCX_notificationOpacity', 100),
            configRepository.getBool('VRCX_saveInstanceEmoji', false),
            configRepository.getBool('VRCX_vrcRegistryAutoBackup', true)
        ]);

        state.enablePrimaryPassword = enablePrimaryPassword;
        state.relaunchVRChatAfterCrash = relaunchVRChatAfterCrash;
        state.vrcQuitFix = vrcQuitFix;
        state.autoSweepVRChatCache = autoSweepVRChatCache;
        state.saveInstancePrints = saveInstancePrints;
        state.cropInstancePrints = cropInstancePrints;
        state.saveInstanceStickers = saveInstanceStickers;
        state.avatarRemoteDatabase = avatarRemoteDatabase;
        state.enableAppLauncher = enableAppLauncher;
        state.enableAppLauncherAutoClose = enableAppLauncherAutoClose;
        state.screenshotHelper = screenshotHelper;
        state.screenshotHelperModifyFilename = screenshotHelperModifyFilename;
        state.screenshotHelperCopyToClipboard = screenshotHelperCopyToClipboard;
        state.youTubeApi = youTubeApi;
        state.youTubeApiKey = youTubeApiKey;
        state.progressPie = progressPie;
        state.progressPieFilter = progressPieFilter;
        state.showConfirmationOnSwitchAvatar = showConfirmationOnSwitchAvatar;
        state.gameLogDisabled = gameLogDisabled;
        state.ugcFolderPath = ugcFolderPath;
        state.autoDeleteOldPrints = autoDeleteOldPrints;
        state.notificationOpacity = notificationOpacity;
        state.saveInstanceEmoji = saveInstanceEmoji;
        state.vrcRegistryAutoBackup = vrcRegistryAutoBackup;

        handleSetAppLauncherSettings();
    }

    initAdvancedSettings();

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.currentUserInventory.clear();
            state.isVRChatConfigDialogVisible = false;
        },
        { flush: 'sync' }
    );

    const enablePrimaryPassword = computed({
        get: () => state.enablePrimaryPassword,
        set: (value) => (state.enablePrimaryPassword = value)
    });
    const relaunchVRChatAfterCrash = computed(
        () => state.relaunchVRChatAfterCrash
    );
    const vrcQuitFix = computed(() => state.vrcQuitFix);
    const autoSweepVRChatCache = computed(() => state.autoSweepVRChatCache);
    const saveInstancePrints = computed(() => state.saveInstancePrints);
    const cropInstancePrints = computed(() => state.cropInstancePrints);
    const saveInstanceStickers = computed(() => state.saveInstanceStickers);
    const avatarRemoteDatabase = computed(() => state.avatarRemoteDatabase);
    const enableAppLauncher = computed(() => state.enableAppLauncher);
    const enableAppLauncherAutoClose = computed(
        () => state.enableAppLauncherAutoClose
    );
    const screenshotHelper = computed(() => state.screenshotHelper);
    ``;
    const screenshotHelperModifyFilename = computed(
        () => state.screenshotHelperModifyFilename
    );
    const screenshotHelperCopyToClipboard = computed(
        () => state.screenshotHelperCopyToClipboard
    );
    const youTubeApi = computed(() => state.youTubeApi);
    const youTubeApiKey = computed({
        get: () => state.youTubeApiKey,
        set: (value) => (state.youTubeApiKey = value)
    });
    const progressPie = computed(() => state.progressPie);
    const progressPieFilter = computed(() => state.progressPieFilter);
    const showConfirmationOnSwitchAvatar = computed(
        () => state.showConfirmationOnSwitchAvatar
    );
    const gameLogDisabled = computed(() => state.gameLogDisabled);
    const sqliteTableSizes = computed(() => state.sqliteTableSizes);
    const ugcFolderPath = computed(() => state.ugcFolderPath);
    const autoDeleteOldPrints = computed(() => state.autoDeleteOldPrints);
    const notificationOpacity = computed(() => state.notificationOpacity);

    const currentUserInventory = computed({
        get: () => state.currentUserInventory,
        set: (value) => {
            state.currentUserInventory = value;
        }
    });
    const isVRChatConfigDialogVisible = computed({
        get: () => state.isVRChatConfigDialogVisible,
        set: (value) => (state.isVRChatConfigDialogVisible = value)
    });

    const saveInstanceEmoji = computed({
        get: () => state.saveInstanceEmoji,
        set: (value) => (state.saveInstanceEmoji = value)
    });
    const vrcRegistryAutoBackup = computed(() => state.vrcRegistryAutoBackup);

    /**
     * @param {boolean} value
     */
    function setEnablePrimaryPasswordConfigRepository(value) {
        configRepository.setBool('enablePrimaryPassword', value);
    }
    function setRelaunchVRChatAfterCrash() {
        state.relaunchVRChatAfterCrash = !state.relaunchVRChatAfterCrash;
        configRepository.setBool(
            'VRCX_relaunchVRChatAfterCrash',
            state.relaunchVRChatAfterCrash
        );
    }
    function setVrcQuitFix() {
        state.vrcQuitFix = !state.vrcQuitFix;
        configRepository.setBool('VRCX_vrcQuitFix', state.vrcQuitFix);
    }
    function setAutoSweepVRChatCache() {
        state.autoSweepVRChatCache = !state.autoSweepVRChatCache;
        configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            state.autoSweepVRChatCache
        );
    }
    function setSaveInstancePrints() {
        state.saveInstancePrints = !state.saveInstancePrints;
        configRepository.setBool(
            'VRCX_saveInstancePrints',
            state.saveInstancePrints
        );
    }
    function setCropInstancePrints() {
        state.cropInstancePrints = !state.cropInstancePrints;
        configRepository.setBool(
            'VRCX_cropInstancePrints',
            state.cropInstancePrints
        );
    }
    function setSaveInstanceStickers() {
        state.saveInstanceStickers = !state.saveInstanceStickers;
        configRepository.setBool(
            'VRCX_saveInstanceStickers',
            state.saveInstanceStickers
        );
    }
    /**
     * @param {boolean} value
     */
    function setAvatarRemoteDatabase(value) {
        state.avatarRemoteDatabase = value;
        configRepository.setBool(
            'VRCX_avatarRemoteDatabase',
            state.avatarRemoteDatabase
        );
    }
    async function setEnableAppLauncher() {
        state.enableAppLauncher = !state.enableAppLauncher;
        await configRepository.setBool(
            'VRCX_enableAppLauncher',
            state.enableAppLauncher
        );
        handleSetAppLauncherSettings();
    }
    async function setEnableAppLauncherAutoClose() {
        state.enableAppLauncherAutoClose = !state.enableAppLauncherAutoClose;
        await configRepository.setBool(
            'VRCX_enableAppLauncherAutoClose',
            state.enableAppLauncherAutoClose
        );
        handleSetAppLauncherSettings();
    }
    async function setScreenshotHelper() {
        state.screenshotHelper = !state.screenshotHelper;
        await configRepository.setBool(
            'VRCX_screenshotHelper',
            state.screenshotHelper
        );
    }
    async function setScreenshotHelperModifyFilename() {
        state.screenshotHelperModifyFilename =
            !state.screenshotHelperModifyFilename;
        await configRepository.setBool(
            'VRCX_screenshotHelperModifyFilename',
            state.screenshotHelperModifyFilename
        );
    }
    async function setScreenshotHelperCopyToClipboard() {
        state.screenshotHelperCopyToClipboard =
            !state.screenshotHelperCopyToClipboard;
        await configRepository.setBool(
            'VRCX_screenshotHelperCopyToClipboard',
            state.screenshotHelperCopyToClipboard
        );
    }
    async function setYouTubeApi() {
        state.youTubeApi = !state.youTubeApi;
        await configRepository.setBool('VRCX_youtubeAPI', state.youTubeApi);
    }
    /**
     * @param {string} value
     */
    async function setYouTubeApiKey(value) {
        state.youTubeApiKey = value;
        await configRepository.setString(
            'VRCX_youtubeAPIKey',
            state.youTubeApiKey
        );
    }
    async function setProgressPie() {
        state.progressPie = !state.progressPie;
        await configRepository.setBool('VRCX_progressPie', state.progressPie);
    }
    async function setProgressPieFilter() {
        state.progressPieFilter = !state.progressPieFilter;
        await configRepository.setBool(
            'VRCX_progressPieFilter',
            state.progressPieFilter
        );
    }
    async function setShowConfirmationOnSwitchAvatar() {
        state.showConfirmationOnSwitchAvatar =
            !state.showConfirmationOnSwitchAvatar;
        await configRepository.setBool(
            'VRCX_showConfirmationOnSwitchAvatar',
            state.showConfirmationOnSwitchAvatar
        );
    }
    async function setGameLogDisabled() {
        state.gameLogDisabled = !state.gameLogDisabled;
        await configRepository.setBool(
            'VRCX_gameLogDisabled',
            state.gameLogDisabled
        );
    }

    async function setSaveInstanceEmoji() {
        state.saveInstanceEmoji = !state.saveInstanceEmoji;
        await configRepository.setBool(
            'VRCX_saveInstanceEmoji',
            state.saveInstanceEmoji
        );
    }

    async function setUGCFolderPath(path) {
        if (typeof path !== 'string') {
            path = '';
        }
        state.ugcFolderPath = path;
        await configRepository.setString('VRCX_userGeneratedContentPath', path);
    }

    async function setAutoDeleteOldPrints() {
        state.autoDeleteOldPrints = !state.autoDeleteOldPrints;
        await configRepository.setBool(
            'VRCX_autoDeleteOldPrints',
            state.autoDeleteOldPrints
        );
    }

    async function setNotificationOpacity(value) {
        state.notificationOpacity = value;
        await configRepository.setInt('VRCX_notificationOpacity', value);
    }

    async function setVrcRegistryAutoBackup() {
        state.vrcRegistryAutoBackup = !state.vrcRegistryAutoBackup;
        await configRepository.setBool(
            'VRCX_vrcRegistryAutoBackup',
            state.vrcRegistryAutoBackup
        );
    }

    async function getSqliteTableSizes() {
        const [
            gps,
            status,
            bio,
            avatar,
            onlineOffline,
            friendLogHistory,
            notification,
            location,
            joinLeave,
            portalSpawn,
            videoPlay,
            event,
            external
        ] = await Promise.all([
            database.getGpsTableSize(),
            database.getStatusTableSize(),
            database.getBioTableSize(),
            database.getAvatarTableSize(),
            database.getOnlineOfflineTableSize(),
            database.getFriendLogHistoryTableSize(),
            database.getNotificationTableSize(),
            database.getLocationTableSize(),
            database.getJoinLeaveTableSize(),
            database.getPortalSpawnTableSize(),
            database.getVideoPlayTableSize(),
            database.getEventTableSize(),
            database.getExternalTableSize()
        ]);

        state.sqliteTableSizes = {
            gps,
            status,
            bio,
            avatar,
            onlineOffline,
            friendLogHistory,
            notification,
            location,
            joinLeave,
            portalSpawn,
            videoPlay,
            event,
            external
        };
    }

    function handleSetAppLauncherSettings() {
        AppApi.SetAppLauncherSettings(
            state.enableAppLauncher,
            state.enableAppLauncherAutoClose
        );
    }

    /**
     * @param {string} videoId
     */
    async function lookupYouTubeVideo(videoId) {
        if (!state.youTubeApi) {
            console.warn('no Youtube API key configured');
            return null;
        }
        let data = null;
        let apiKey = '';
        if (state.youTubeApiKey) {
            apiKey = state.youTubeApiKey;
        }
        try {
            const response = await webApiService.execute({
                url: `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
                    videoId
                )}&part=snippet,contentDetails&key=${apiKey}`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app'
                }
            });
            const json = JSON.parse(response.data);
            if (AppGlobal.debugWebRequests) {
                console.log(json, response);
            }
            if (response.status === 200) {
                data = json;
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch {
            console.error(`YouTube video lookup failed for ${videoId}`);
        }
        return data;
    }

    function cropPrintsChanged() {
        if (!state.cropInstancePrints) return;
        $app.$confirm(
            t(
                'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old'
            ),
            {
                confirmButtonText: t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_confirm'
                ),
                cancelButtonText: t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_cancel'
                ),
                type: 'info',
                showInput: false,
                callback: async (action) => {
                    if (action === 'confirm') {
                        const msgBox = $app.$message({
                            message: 'Batch print cropping in progress...',
                            type: 'warning',
                            duration: 0
                        });
                        try {
                            await AppApi.CropAllPrints(state.ugcFolderPath);
                            $app.$message({
                                message: 'Batch print cropping complete',
                                type: 'success'
                            });
                        } catch (err) {
                            console.error(err);
                            $app.$message({
                                message: `Batch print cropping failed: ${err}`,
                                type: 'error'
                            });
                        } finally {
                            msgBox.close();
                        }
                    }
                }
            }
        );
    }

    function resetUGCFolder() {
        setUGCFolderPath('');
    }

    async function openUGCFolder() {
        if (LINUX && state.ugcFolderPath == null) {
            resetUGCFolder();
        }
        await AppApi.OpenUGCPhotosFolder(state.ugcFolderPath);
    }

    async function folderSelectorDialog(oldPath) {
        if (state.folderSelectorDialogVisible) return;
        if (!oldPath) {
            oldPath = '';
        }

        state.folderSelectorDialogVisible = true;
        let newFolder = '';
        if (WINDOWS) {
            newFolder = await AppApi.OpenFolderSelectorDialog(oldPath);
        } else {
            newFolder = await window.electron.openDirectoryDialog();
        }

        state.folderSelectorDialogVisible = false;
        return newFolder;
    }

    async function openUGCFolderSelector() {
        const path = await folderSelectorDialog(state.ugcFolderPath);
        await setUGCFolderPath(path);
    }

    async function showVRChatConfig() {
        state.isVRChatConfigDialogVisible = true;
        if (!gameStore.VRChatUsedCacheSize) {
            gameStore.getVRChatCacheSize();
        }
    }

    function promptAutoClearVRCXCacheFrequency() {
        $app.$prompt(
            t('prompt.auto_clear_cache.description'),
            t('prompt.auto_clear_cache.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.auto_clear_cache.ok'),
                cancelButtonText: t('prompt.auto_clear_cache.cancel'),
                inputValue: vrcxStore.clearVRCXCacheFrequency / 3600 / 2,
                inputPattern: /\d+$/,
                inputErrorMessage: t('prompt.auto_clear_cache.input_error'),
                callback: async (action, instance) => {
                    if (
                        action === 'confirm' &&
                        instance.inputValue &&
                        !isNaN(instance.inputValue)
                    ) {
                        vrcxStore.clearVRCXCacheFrequency = Math.trunc(
                            Number(instance.inputValue) * 3600 * 2
                        );
                        await configRepository.setString(
                            'VRCX_clearVRCXCacheFrequency',
                            vrcxStore.clearVRCXCacheFrequency
                        );
                    }
                }
            }
        );
    }

    return {
        state,

        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        saveInstancePrints,
        cropInstancePrints,
        saveInstanceStickers,
        avatarRemoteDatabase,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        screenshotHelper,
        screenshotHelperModifyFilename,
        screenshotHelperCopyToClipboard,
        youTubeApi,
        youTubeApiKey,
        progressPie,
        progressPieFilter,
        showConfirmationOnSwitchAvatar,
        gameLogDisabled,
        sqliteTableSizes,
        ugcFolderPath,
        currentUserInventory,
        autoDeleteOldPrints,
        notificationOpacity,
        isVRChatConfigDialogVisible,
        saveInstanceEmoji,
        vrcRegistryAutoBackup,

        setEnablePrimaryPasswordConfigRepository,
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setSaveInstancePrints,
        setCropInstancePrints,
        setSaveInstanceStickers,
        setAvatarRemoteDatabase,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setScreenshotHelper,
        setScreenshotHelperModifyFilename,
        setScreenshotHelperCopyToClipboard,
        setYouTubeApi,
        setYouTubeApiKey,
        setProgressPie,
        setProgressPieFilter,
        setShowConfirmationOnSwitchAvatar,
        setGameLogDisabled,
        setUGCFolderPath,
        cropPrintsChanged,
        setAutoDeleteOldPrints,
        setNotificationOpacity,
        getSqliteTableSizes,
        handleSetAppLauncherSettings,
        lookupYouTubeVideo,
        resetUGCFolder,
        openUGCFolder,
        openUGCFolderSelector,
        folderSelectorDialog,
        showVRChatConfig,
        promptAutoClearVRCXCacheFrequency,
        setSaveInstanceEmoji,
        setVrcRegistryAutoBackup
    };
});
