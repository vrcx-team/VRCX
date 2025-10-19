import { reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import { AppDebug } from '../../service/appConfig';
import { database } from '../../service/database';
import { useGameStore } from '../game';
import { useVRCXUpdaterStore } from '../vrcxUpdater';
import { useVrcxStore } from '../vrcx';
import { watchState } from '../../service/watchState';

import configRepository from '../../service/config';
import webApiService from '../../service/webapi';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
    const gameStore = useGameStore();
    const vrcxStore = useVrcxStore();
    const VRCXUpdaterStore = useVRCXUpdaterStore();

    const { availableLocales, t } = useI18n();

    const state = reactive({
        folderSelectorDialogVisible: false
    });

    const enablePrimaryPassword = ref(false);
    const bioLanguage = ref('en');
    const relaunchVRChatAfterCrash = ref(false);
    const vrcQuitFix = ref(true);
    const autoSweepVRChatCache = ref(false);
    const selfInviteOverride = ref(false);
    const saveInstancePrints = ref(false);
    const cropInstancePrints = ref(false);
    const saveInstanceStickers = ref(false);
    const avatarRemoteDatabase = ref(true);
    const enableAppLauncher = ref(true);
    const enableAppLauncherAutoClose = ref(true);
    const enableAppLauncherRunProcessOnce = ref(true);
    const screenshotHelper = ref(true);
    const screenshotHelperModifyFilename = ref(false);
    const screenshotHelperCopyToClipboard = ref(false);
    const youTubeApi = ref(false);
    const youTubeApiKey = ref('');
    const translationApi = ref(false);
    const translationApiKey = ref('');
    const progressPie = ref(false);
    const progressPieFilter = ref(true);
    const showConfirmationOnSwitchAvatar = ref(false);
    const gameLogDisabled = ref(false);
    const sqliteTableSizes = ref({});
    const ugcFolderPath = ref('');
    const autoDeleteOldPrints = ref(false);
    const notificationOpacity = ref(100);
    const currentUserInventory = ref(new Map());
    const isVRChatConfigDialogVisible = ref(false);
    const saveInstanceEmoji = ref(false);
    const vrcRegistryAutoBackup = ref(true);
    const vrcRegistryAskRestore = ref(true);
    const sentryErrorReporting = ref(false);

    watch(
        () => watchState.isLoggedIn,
        () => {
            currentUserInventory.value.clear();
            isVRChatConfigDialogVisible.value = false;
        },
        { flush: 'sync' }
    );

    async function initAdvancedSettings() {
        const [
            enablePrimaryPasswordConfig,
            bioLanguageConfig,
            relaunchVRChatAfterCrashConfig,
            vrcQuitFixConfig,
            autoSweepVRChatCacheConfig,
            selfInviteOverrideConfig,
            saveInstancePrintsConfig,
            cropInstancePrintsConfig,
            saveInstanceStickersConfig,
            avatarRemoteDatabaseConfig,
            enableAppLauncherConfig,
            enableAppLauncherAutoCloseConfig,
            enableAppLauncherRunProcessOnceConfig,
            screenshotHelperConfig,
            screenshotHelperModifyFilenameConfig,
            screenshotHelperCopyToClipboardConfig,
            youTubeApiConfig,
            youTubeApiKeyConfig,
            translationApiConfig,
            translationApiKeyConfig,
            progressPieConfig,
            progressPieFilterConfig,
            showConfirmationOnSwitchAvatarConfig,
            gameLogDisabledConfig,
            ugcFolderPathConfig,
            autoDeleteOldPrintsConfig,
            notificationOpacityConfig,
            saveInstanceEmojiConfig,
            vrcRegistryAutoBackupConfig,
            vrcRegistryAskRestoreConfig,
            sentryErrorReportingConfig
        ] = await Promise.all([
            configRepository.getBool('enablePrimaryPassword', false),
            configRepository.getString('VRCX_bioLanguage'),
            configRepository.getBool('VRCX_relaunchVRChatAfterCrash', false),
            configRepository.getBool('VRCX_vrcQuitFix', true),
            configRepository.getBool('VRCX_autoSweepVRChatCache', false),
            configRepository.getBool('VRCX_selfInviteOverride', false),
            configRepository.getBool('VRCX_saveInstancePrints', false),
            configRepository.getBool('VRCX_cropInstancePrints', false),
            configRepository.getBool('VRCX_saveInstanceStickers', false),
            configRepository.getBool('VRCX_avatarRemoteDatabase', true),
            configRepository.getBool('VRCX_enableAppLauncher', true),
            configRepository.getBool('VRCX_enableAppLauncherAutoClose', true),
            configRepository.getBool(
                'VRCX_enableAppLauncherRunProcessOnce',
                true
            ),
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
            configRepository.getBool('VRCX_translationAPI', false),
            configRepository.getString('VRCX_translationAPIKey', ''),
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
            configRepository.getBool('VRCX_vrcRegistryAutoBackup', true),
            configRepository.getBool('VRCX_vrcRegistryAskRestore', true),
            configRepository.getString('VRCX_SentryEnabled', '')
        ]);

        if (
            !bioLanguageConfig ||
            !availableLocales.includes(bioLanguageConfig)
        ) {
            bioLanguage.value = 'en';
        } else {
            bioLanguage.value = bioLanguageConfig;
        }

        enablePrimaryPassword.value = enablePrimaryPasswordConfig;
        relaunchVRChatAfterCrash.value = relaunchVRChatAfterCrashConfig;
        vrcQuitFix.value = vrcQuitFixConfig;
        autoSweepVRChatCache.value = autoSweepVRChatCacheConfig;
        selfInviteOverride.value = selfInviteOverrideConfig;
        saveInstancePrints.value = saveInstancePrintsConfig;
        cropInstancePrints.value = cropInstancePrintsConfig;
        saveInstanceStickers.value = saveInstanceStickersConfig;
        avatarRemoteDatabase.value = avatarRemoteDatabaseConfig;
        enableAppLauncher.value = enableAppLauncherConfig;
        enableAppLauncherAutoClose.value = enableAppLauncherAutoCloseConfig;
        enableAppLauncherRunProcessOnce.value =
            enableAppLauncherRunProcessOnceConfig;
        screenshotHelper.value = screenshotHelperConfig;
        screenshotHelperModifyFilename.value =
            screenshotHelperModifyFilenameConfig;
        screenshotHelperCopyToClipboard.value =
            screenshotHelperCopyToClipboardConfig;
        youTubeApi.value = youTubeApiConfig;
        youTubeApiKey.value = youTubeApiKeyConfig;
        translationApi.value = translationApiConfig;
        translationApiKey.value = translationApiKeyConfig;
        progressPie.value = progressPieConfig;
        progressPieFilter.value = progressPieFilterConfig;
        showConfirmationOnSwitchAvatar.value =
            showConfirmationOnSwitchAvatarConfig;
        gameLogDisabled.value = gameLogDisabledConfig;
        ugcFolderPath.value = ugcFolderPathConfig;
        autoDeleteOldPrints.value = autoDeleteOldPrintsConfig;
        notificationOpacity.value = notificationOpacityConfig;
        saveInstanceEmoji.value = saveInstanceEmojiConfig;
        vrcRegistryAutoBackup.value = vrcRegistryAutoBackupConfig;
        vrcRegistryAskRestore.value = vrcRegistryAskRestoreConfig;
        sentryErrorReporting.value = sentryErrorReportingConfig === 'true';

        handleSetAppLauncherSettings();

        setTimeout(() => {
            if (
                VRCXUpdaterStore.branch === 'Nightly' &&
                sentryErrorReportingConfig === ''
            ) {
                checkSentryConsent();
            }
        }, 2000);
    }

    initAdvancedSettings();

    /**
     * @param {boolean} value
     */
    function setEnablePrimaryPasswordConfigRepository(value) {
        configRepository.setBool('enablePrimaryPassword', value);
    }
    function setRelaunchVRChatAfterCrash() {
        relaunchVRChatAfterCrash.value = !relaunchVRChatAfterCrash.value;
        configRepository.setBool(
            'VRCX_relaunchVRChatAfterCrash',
            relaunchVRChatAfterCrash.value
        );
    }
    function setVrcQuitFix() {
        vrcQuitFix.value = !vrcQuitFix.value;
        configRepository.setBool('VRCX_vrcQuitFix', vrcQuitFix.value);
    }
    function setAutoSweepVRChatCache() {
        autoSweepVRChatCache.value = !autoSweepVRChatCache.value;
        configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            autoSweepVRChatCache.value
        );
    }
    function setSelfInviteOverride() {
        selfInviteOverride.value = !selfInviteOverride.value;
        configRepository.setBool(
            'VRCX_selfInviteOverride',
            selfInviteOverride.value
        );
    }
    function setSaveInstancePrints() {
        saveInstancePrints.value = !saveInstancePrints.value;
        configRepository.setBool(
            'VRCX_saveInstancePrints',
            saveInstancePrints.value
        );
    }
    function setCropInstancePrints() {
        cropInstancePrints.value = !cropInstancePrints.value;
        configRepository.setBool(
            'VRCX_cropInstancePrints',
            cropInstancePrints.value
        );
    }
    function setSaveInstanceStickers() {
        saveInstanceStickers.value = !saveInstanceStickers.value;
        configRepository.setBool(
            'VRCX_saveInstanceStickers',
            saveInstanceStickers.value
        );
    }
    /**
     * @param {boolean} value
     */
    function setAvatarRemoteDatabase(value) {
        avatarRemoteDatabase.value = value;
        configRepository.setBool(
            'VRCX_avatarRemoteDatabase',
            avatarRemoteDatabase.value
        );
    }
    async function setEnableAppLauncher() {
        enableAppLauncher.value = !enableAppLauncher.value;
        await configRepository.setBool(
            'VRCX_enableAppLauncher',
            enableAppLauncher.value
        );
        handleSetAppLauncherSettings();
    }
    async function setEnableAppLauncherAutoClose() {
        enableAppLauncherAutoClose.value = !enableAppLauncherAutoClose.value;
        await configRepository.setBool(
            'VRCX_enableAppLauncherAutoClose',
            enableAppLauncherAutoClose.value
        );
        handleSetAppLauncherSettings();
    }
    async function setEnableAppLauncherRunProcessOnce() {
        enableAppLauncherRunProcessOnce.value =
            !enableAppLauncherRunProcessOnce.value;
        await configRepository.setBool(
            'VRCX_enableAppLauncherRunProcessOnce',
            enableAppLauncherRunProcessOnce.value
        );
        handleSetAppLauncherSettings();
    }
    async function setScreenshotHelper() {
        screenshotHelper.value = !screenshotHelper.value;
        await configRepository.setBool(
            'VRCX_screenshotHelper',
            screenshotHelper.value
        );
    }
    async function setScreenshotHelperModifyFilename() {
        screenshotHelperModifyFilename.value =
            !screenshotHelperModifyFilename.value;
        await configRepository.setBool(
            'VRCX_screenshotHelperModifyFilename',
            screenshotHelperModifyFilename.value
        );
    }
    async function setScreenshotHelperCopyToClipboard() {
        screenshotHelperCopyToClipboard.value =
            !screenshotHelperCopyToClipboard.value;
        await configRepository.setBool(
            'VRCX_screenshotHelperCopyToClipboard',
            screenshotHelperCopyToClipboard.value
        );
    }
    async function setYouTubeApi() {
        youTubeApi.value = !youTubeApi.value;
        await configRepository.setBool('VRCX_youtubeAPI', youTubeApi.value);
    }
    async function setTranslationApi() {
        translationApi.value = !translationApi.value;
        await configRepository.setBool('VRCX_translationAPI', youTubeApi.value);
    }
    /**
     * @param {string} value
     */
    async function setYouTubeApiKey(value) {
        youTubeApiKey.value = value;
        await configRepository.setString(
            'VRCX_youtubeAPIKey',
            youTubeApiKey.value
        );
    }
    async function setTranslationApiKey(value) {
        translationApiKey.value = value;
        await configRepository.setString(
            'VRCX_translationAPIKey',
            translationApiKey.value
        );
    }
    function setBioLanguage(language) {
        bioLanguage.value = language;
        configRepository.setString('VRCX_bioLanguage', language);
    }
    async function setProgressPie() {
        progressPie.value = !progressPie.value;
        await configRepository.setBool('VRCX_progressPie', progressPie.value);
    }
    async function setProgressPieFilter() {
        progressPieFilter.value = !progressPieFilter.value;
        await configRepository.setBool(
            'VRCX_progressPieFilter',
            progressPieFilter.value
        );
    }
    async function setShowConfirmationOnSwitchAvatar() {
        showConfirmationOnSwitchAvatar.value =
            !showConfirmationOnSwitchAvatar.value;
        await configRepository.setBool(
            'VRCX_showConfirmationOnSwitchAvatar',
            showConfirmationOnSwitchAvatar.value
        );
    }
    async function setGameLogDisabled() {
        gameLogDisabled.value = !gameLogDisabled.value;
        await configRepository.setBool(
            'VRCX_gameLogDisabled',
            gameLogDisabled.value
        );
    }

    async function setSaveInstanceEmoji() {
        saveInstanceEmoji.value = !saveInstanceEmoji.value;
        await configRepository.setBool(
            'VRCX_saveInstanceEmoji',
            saveInstanceEmoji.value
        );
    }

    async function setUGCFolderPath(path) {
        if (typeof path !== 'string') {
            path = '';
        }
        ugcFolderPath.value = path;
        await configRepository.setString('VRCX_userGeneratedContentPath', path);
    }

    async function setAutoDeleteOldPrints() {
        autoDeleteOldPrints.value = !autoDeleteOldPrints.value;
        await configRepository.setBool(
            'VRCX_autoDeleteOldPrints',
            autoDeleteOldPrints.value
        );
    }

    async function setNotificationOpacity(value) {
        notificationOpacity.value = value;
        await configRepository.setInt('VRCX_notificationOpacity', value);
    }

    async function setVrcRegistryAutoBackup() {
        vrcRegistryAutoBackup.value = !vrcRegistryAutoBackup.value;
        await configRepository.setBool(
            'VRCX_vrcRegistryAutoBackup',
            vrcRegistryAutoBackup.value
        );
    }

    async function setVrcRegistryAskRestore() {
        vrcRegistryAskRestore.value = !vrcRegistryAskRestore.value;
        await configRepository.setBool(
            'VRCX_vrcRegistryAskRestore',
            vrcRegistryAskRestore.value
        );
    }

    async function checkSentryConsent() {
        ElMessageBox.confirm(
            'Help improve VRCX by allowing anonymous error reporting?</br></br>' +
                '• Only collects crash and error information.</br>' +
                '• No personal data or VRChat information is collected.</br>' +
                '• Only enabled in nightly builds.</br>' +
                '• Can be disabled at anytime in Advanced Settings.',
            'Anonymous Error Reporting',
            {
                type: 'warning',
                center: true,
                dangerouslyUseHTMLString: true,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                distinguishCancelAndClose: true
            }
        )
            .then(() => {
                sentryErrorReporting.value = true;
                configRepository.setString('VRCX_SentryEnabled', 'true');

                ElMessageBox.confirm(
                    'Error reporting setting has been enabled. Would you like to restart VRCX now for the change to take effect?',
                    'Restart Required',
                    {
                        confirmButtonText: 'Restart Now',
                        cancelButtonText: 'Later',
                        type: 'warning',
                        center: true,
                        closeOnClickModal: false,
                        closeOnPressEscape: false
                    }
                ).then(() => {
                    VRCXUpdaterStore.restartVRCX(false);
                });
            })
            .catch((action) => {
                const act =
                    typeof action === 'string' ? action : action?.action;
                if (act === 'cancel') {
                    sentryErrorReporting.value = false;
                    configRepository.setString('VRCX_SentryEnabled', 'false');
                }
            });
    }

    async function setSentryErrorReporting() {
        if (VRCXUpdaterStore.branch !== 'Nightly') {
            return;
        }

        sentryErrorReporting.value = !sentryErrorReporting.value;
        await configRepository.setString(
            'VRCX_SentryEnabled',
            sentryErrorReporting.value ? 'true' : 'false'
        );

        ElMessageBox.confirm(
            'Error reporting setting has been disabled. Would you like to restart VRCX now for the change to take effect?',
            'Restart Required',
            {
                confirmButtonText: 'Restart Now',
                cancelButtonText: 'Later',
                type: 'info',
                center: true
            }
        )
            .then(() => {
                VRCXUpdaterStore.restartVRCX(false);
            })
            .catch(() => {});
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

        sqliteTableSizes.value = {
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
            enableAppLauncher.value,
            enableAppLauncherAutoClose.value,
            enableAppLauncherRunProcessOnce.value
        );
    }

    /**
     * @param {string} videoId
     */
    async function lookupYouTubeVideo(videoId) {
        if (!youTubeApi.value) {
            console.warn('no Youtube API key configured');
            return null;
        }
        let data = null;
        let apiKey = '';
        if (youTubeApiKey.value) {
            apiKey = youTubeApiKey.value;
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
            if (AppDebug.debugWebRequests) {
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

    async function translateText(text, targetLang) {
        if (!translationApiKey.value) {
            ElMessage({
                message: 'No Translation API key configured',
                type: 'warning'
            });
            return null;
        }

        try {
            const response = await webApiService.execute({
                url: `https://translation.googleapis.com/language/translate/v2?key=${translationApiKey.value}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Referer: 'https://vrcx.app'
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    format: 'text'
                })
            });
            if (response.status !== 200) {
                throw new Error(
                    `Translation API error: ${response.status} - ${response.data}`
                );
            }
            const data = JSON.parse(response.data);
            if (AppDebug.debugWebRequests) {
                console.log(data, response);
            }
            return data.data.translations[0].translatedText;
        } catch (err) {
            ElMessage({
                message: `Translation failed: ${err.message}`,
                type: 'error'
            });
            return null;
        }
    }

    function cropPrintsChanged() {
        if (!cropInstancePrints.value) return;
        ElMessageBox.confirm(
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
                showInput: false
            }
        ).then(async ({ action }) => {
            if (action === 'confirm') {
                const msgBox = ElMessage({
                    message: 'Batch print cropping in progress...',
                    type: 'warning',
                    duration: 0
                });
                try {
                    await AppApi.CropAllPrints(ugcFolderPath.value);
                    ElMessage({
                        message: 'Batch print cropping complete',
                        type: 'success'
                    });
                } catch (err) {
                    console.error(err);
                    ElMessage({
                        message: `Batch print cropping failed: ${err}`,
                        type: 'error'
                    });
                } finally {
                    msgBox.close();
                }
            }
        });
    }

    function askDeleteAllScreenshotMetadata() {
        ElMessageBox.confirm(
            t(
                'view.settings.advanced.advanced.delete_all_screenshot_metadata.ask'
            ),
            {
                confirmButtonText: t(
                    'view.settings.advanced.advanced.delete_all_screenshot_metadata.confirm_yes'
                ),
                cancelButtonText: t(
                    'view.settings.advanced.advanced.delete_all_screenshot_metadata.confirm_no'
                ),
                type: 'warning',
                showInput: false
            }
        ).then(({ action }) => {
            if (action === 'confirm') {
                deleteAllScreenshotMetadata();
            }
        });
    }

    function deleteAllScreenshotMetadata() {
        ElMessageBox.confirm(
            t(
                'view.settings.advanced.advanced.delete_all_screenshot_metadata.confirm'
            ),
            {
                confirmButtonText: t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_confirm'
                ),
                cancelButtonText: t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_cancel'
                ),
                type: 'warning',
                showInput: false
            }
        ).then(async ({ action }) => {
            if (action === 'confirm') {
                const msgBox = ElMessage({
                    message: 'Batch metadata removal in progress...',
                    type: 'warning',
                    duration: 0
                });
                try {
                    await AppApi.DeleteAllScreenshotMetadata();
                    ElMessage({
                        message: 'Batch metadata removal complete',
                        type: 'success'
                    });
                } catch (err) {
                    console.error(err);
                    ElMessage({
                        message: `Batch metadata removal failed: ${err}`,
                        type: 'error'
                    });
                } finally {
                    msgBox.close();
                }
            }
        });
    }

    function resetUGCFolder() {
        setUGCFolderPath('');
    }

    async function openUGCFolder() {
        if (LINUX && ugcFolderPath.value == null) {
            resetUGCFolder();
        }
        await AppApi.OpenUGCPhotosFolder(ugcFolderPath.value);
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
        const path = await folderSelectorDialog(ugcFolderPath.value);
        await setUGCFolderPath(path);
    }

    async function showVRChatConfig() {
        isVRChatConfigDialogVisible.value = true;
        if (!gameStore.VRChatUsedCacheSize) {
            gameStore.getVRChatCacheSize();
        }
    }

    function promptAutoClearVRCXCacheFrequency() {
        ElMessageBox.prompt(
            t('prompt.auto_clear_cache.description'),
            t('prompt.auto_clear_cache.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.auto_clear_cache.ok'),
                cancelButtonText: t('prompt.auto_clear_cache.cancel'),
                inputValue: (
                    vrcxStore.clearVRCXCacheFrequency /
                    3600 /
                    2
                ).toString(),
                inputPattern: /\d+$/,
                inputErrorMessage: t('prompt.auto_clear_cache.input_error')
            }
        )
            .then(async ({ value }) => {
                if (value && !isNaN(parseInt(value, 10))) {
                    vrcxStore.clearVRCXCacheFrequency = Math.trunc(
                        parseInt(value, 10) * 3600 * 2
                    );
                    await configRepository.setString(
                        'VRCX_clearVRCXCacheFrequency',
                        vrcxStore.clearVRCXCacheFrequency.toString()
                    );
                }
            })
            .catch(() => {});
    }

    return {
        state,

        bioLanguage,
        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        selfInviteOverride,
        saveInstancePrints,
        cropInstancePrints,
        saveInstanceStickers,
        avatarRemoteDatabase,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        enableAppLauncherRunProcessOnce,
        screenshotHelper,
        screenshotHelperModifyFilename,
        screenshotHelperCopyToClipboard,
        youTubeApi,
        translationApi,
        youTubeApiKey,
        translationApiKey,
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
        vrcRegistryAskRestore,
        sentryErrorReporting,

        setEnablePrimaryPasswordConfigRepository,
        setBioLanguage,
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setSelfInviteOverride,
        setSaveInstancePrints,
        setCropInstancePrints,
        setSaveInstanceStickers,
        setAvatarRemoteDatabase,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setEnableAppLauncherRunProcessOnce,
        setScreenshotHelper,
        setScreenshotHelperModifyFilename,
        setScreenshotHelperCopyToClipboard,
        setYouTubeApi,
        setTranslationApi,
        setYouTubeApiKey,
        setTranslationApiKey,
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
        translateText,
        resetUGCFolder,
        openUGCFolder,
        openUGCFolderSelector,
        folderSelectorDialog,
        showVRChatConfig,
        promptAutoClearVRCXCacheFrequency,
        setSaveInstanceEmoji,
        setVrcRegistryAutoBackup,
        setVrcRegistryAskRestore,
        setSentryErrorReporting,
        checkSentryConsent,
        askDeleteAllScreenshotMetadata
    };
});
