import { ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFriendStore } from '../friend';
import { useVRCXUpdaterStore } from '../vrcxUpdater';
import { useVrcxStore } from '../vrcx';

import configRepository from '../../service/config';

import * as workerTimers from 'worker-timers';

export const useGeneralSettingsStore = defineStore('GeneralSettings', () => {
    const vrcxStore = useVrcxStore();
    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const friendStore = useFriendStore();

    const { t } = useI18n();

    const isStartAtWindowsStartup = ref(false);
    const isStartAsMinimizedState = ref(false);
    const disableGpuAcceleration = ref(false);
    const isCloseToTray = ref(false);
    const disableVrOverlayGpuAcceleration = ref(false);
    const localFavoriteFriendsGroups = ref([]);
    const udonExceptionLogging = ref(false);
    const logResourceLoad = ref(false);
    const logEmptyAvatars = ref(false);
    const autoStateChangeEnabled = ref(false);
    const autoStateChangeAloneStatus = ref('join me');
    const autoStateChangeCompanyStatus = ref('busy');
    const autoStateChangeInstanceTypes = ref([]);
    const autoStateChangeNoFriends = ref(false);
    const autoAcceptInviteRequests = ref('Off');

    async function initGeneralSettings() {
        const [
            isStartAtWindowsStartupConfig,
            isStartAsMinimizedStateConfig,
            isCloseToTrayConfig,
            isCloseToTrayConfigBoolConfig,
            disableGpuAccelerationStrConfig,
            disableVrOverlayGpuAccelerationStrConfig,
            localFavoriteFriendsGroupsStrConfig,
            udonExceptionLoggingConfig,
            logResourceLoadConfig,
            logEmptyAvatarsConfig,
            autoStateChangeEnabledConfig,
            autoStateChangeAloneStatusConfig,
            autoStateChangeCompanyStatusConfig,
            autoStateChangeInstanceTypesStrConfig,
            autoStateChangeNoFriendsConfig,
            autoAcceptInviteRequestsConfig
        ] = await Promise.all([
            configRepository.getBool('VRCX_StartAtWindowsStartup', false),
            VRCXStorage.Get('VRCX_StartAsMinimizedState'),
            VRCXStorage.Get('VRCX_CloseToTray'),
            configRepository.getBool('VRCX_CloseToTray'),
            VRCXStorage.Get('VRCX_DisableGpuAcceleration'),
            VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration'),
            configRepository.getString('VRCX_localFavoriteFriendsGroups', '[]'),
            configRepository.getBool('VRCX_udonExceptionLogging', false),
            configRepository.getBool('VRCX_logResourceLoad', false),
            configRepository.getBool('VRCX_logEmptyAvatars', false),
            configRepository.getBool('VRCX_autoStateChangeEnabled', false),
            configRepository.getString(
                'VRCX_autoStateChangeAloneStatus',
                'join me'
            ),
            configRepository.getString(
                'VRCX_autoStateChangeCompanyStatus',
                'busy'
            ),
            configRepository.getString(
                'VRCX_autoStateChangeInstanceTypes',
                '[]'
            ),
            configRepository.getBool('VRCX_autoStateChangeNoFriends', false),
            configRepository.getString('VRCX_autoAcceptInviteRequests', 'Off')
        ]);

        isStartAtWindowsStartup.value = isStartAtWindowsStartupConfig;
        isStartAsMinimizedState.value =
            isStartAsMinimizedStateConfig === 'true';

        if (isCloseToTrayConfigBoolConfig) {
            isCloseToTray.value = isCloseToTrayConfigBoolConfig;

            await VRCXStorage.Set(
                'VRCX_CloseToTray',
                isCloseToTray.value.toString()
            );
            await configRepository.remove('VRCX_CloseToTray');
        } else {
            isCloseToTray.value = isCloseToTrayConfig === 'true';
        }

        disableGpuAcceleration.value =
            disableGpuAccelerationStrConfig === 'true';
        disableVrOverlayGpuAcceleration.value =
            disableVrOverlayGpuAccelerationStrConfig === 'true';
        localFavoriteFriendsGroups.value = JSON.parse(
            localFavoriteFriendsGroupsStrConfig
        );
        udonExceptionLogging.value = udonExceptionLoggingConfig;
        logResourceLoad.value = logResourceLoadConfig;
        logEmptyAvatars.value = logEmptyAvatarsConfig;
        autoStateChangeEnabled.value = autoStateChangeEnabledConfig;
        autoStateChangeAloneStatus.value = autoStateChangeAloneStatusConfig;
        autoStateChangeCompanyStatus.value = autoStateChangeCompanyStatusConfig;
        autoStateChangeInstanceTypes.value = JSON.parse(
            autoStateChangeInstanceTypesStrConfig
        );
        autoStateChangeNoFriends.value = autoStateChangeNoFriendsConfig;
        autoAcceptInviteRequests.value = autoAcceptInviteRequestsConfig;
    }

    initGeneralSettings();

    function setIsStartAtWindowsStartup() {
        isStartAtWindowsStartup.value = !isStartAtWindowsStartup.value;
        configRepository.setBool(
            'VRCX_StartAtWindowsStartup',
            isStartAtWindowsStartup.value
        );
        AppApi.SetStartup(isStartAtWindowsStartup.value);
    }
    function setIsStartAsMinimizedState() {
        isStartAsMinimizedState.value = !isStartAsMinimizedState.value;
        VRCXStorage.Set(
            'VRCX_StartAsMinimizedState',
            isStartAsMinimizedState.value.toString()
        );
    }
    function setIsCloseToTray() {
        isCloseToTray.value = !isCloseToTray.value;
        VRCXStorage.Set('VRCX_CloseToTray', isCloseToTray.value.toString());
    }
    function setDisableGpuAcceleration() {
        disableGpuAcceleration.value = !disableGpuAcceleration.value;
        VRCXStorage.Set(
            'VRCX_DisableGpuAcceleration',
            disableGpuAcceleration.value.toString()
        );
    }
    function setDisableVrOverlayGpuAcceleration() {
        disableVrOverlayGpuAcceleration.value =
            !disableVrOverlayGpuAcceleration.value;
        VRCXStorage.Set(
            'VRCX_DisableVrOverlayGpuAcceleration',
            disableVrOverlayGpuAcceleration.value.toString()
        );
    }
    /**
     * @param {string[]} value
     */
    function setLocalFavoriteFriendsGroups(value) {
        localFavoriteFriendsGroups.value = value;
        configRepository.setString(
            'VRCX_localFavoriteFriendsGroups',
            JSON.stringify(value)
        );
        friendStore.updateLocalFavoriteFriends();
    }
    function setUdonExceptionLogging() {
        udonExceptionLogging.value = !udonExceptionLogging.value;
        configRepository.setBool(
            'VRCX_udonExceptionLogging',
            udonExceptionLogging.value
        );
    }
    function setLogResourceLoad() {
        logResourceLoad.value = !logResourceLoad.value;
        configRepository.setBool('VRCX_logResourceLoad', logResourceLoad.value);
    }
    function setLogEmptyAvatars() {
        logEmptyAvatars.value = !logEmptyAvatars.value;
        configRepository.setBool('VRCX_logEmptyAvatars', logEmptyAvatars.value);
    }
    function setAutoStateChangeEnabled() {
        autoStateChangeEnabled.value = !autoStateChangeEnabled.value;
        configRepository.setBool(
            'VRCX_autoStateChangeEnabled',
            autoStateChangeEnabled.value
        );
    }
    /**
     * @param {string} value
     */
    function setAutoStateChangeAloneStatus(value) {
        autoStateChangeAloneStatus.value = value;
        configRepository.setString(
            'VRCX_autoStateChangeAloneStatus',
            autoStateChangeAloneStatus.value
        );
    }
    /**
     * @param {string} value
     */
    function setAutoStateChangeCompanyStatus(value) {
        autoStateChangeCompanyStatus.value = value;
        configRepository.setString(
            'VRCX_autoStateChangeCompanyStatus',
            autoStateChangeCompanyStatus.value
        );
    }
    function setAutoStateChangeInstanceTypes(value) {
        autoStateChangeInstanceTypes.value = value;
        configRepository.setString(
            'VRCX_autoStateChangeInstanceTypes',
            JSON.stringify(autoStateChangeInstanceTypes.value)
        );
    }
    function setAutoStateChangeNoFriends() {
        autoStateChangeNoFriends.value = !autoStateChangeNoFriends.value;
        configRepository.setBool(
            'VRCX_autoStateChangeNoFriends',
            autoStateChangeNoFriends.value
        );
    }
    /**
     * @param {string} value
     */
    function setAutoAcceptInviteRequests(value) {
        autoAcceptInviteRequests.value = value;
        configRepository.setString(
            'VRCX_autoAcceptInviteRequests',
            autoAcceptInviteRequests.value
        );
    }

    function promptProxySettings() {
        ElMessageBox.prompt(
            t('prompt.proxy_settings.description'),
            t('prompt.proxy_settings.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.proxy_settings.restart'),
                cancelButtonText: t('prompt.proxy_settings.close'),
                inputValue: vrcxStore.proxyServer,
                inputPlaceholder: t('prompt.proxy_settings.placeholder')
            }
        )
            .then(async ({ value }) => {
                vrcxStore.proxyServer = value;
                await VRCXStorage.Set(
                    'VRCX_ProxyServer',
                    vrcxStore.proxyServer
                );
                await VRCXStorage.Save();
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 100);
                });
                const { restartVRCX } = VRCXUpdaterStore;
                const isUpgrade = false;
                restartVRCX(isUpgrade);
            })
            .catch(async () => {
                // User clicked close/cancel, still save the value but don't restart
                if (vrcxStore.proxyServer !== undefined) {
                    await VRCXStorage.Set(
                        'VRCX_ProxyServer',
                        vrcxStore.proxyServer
                    );
                    await VRCXStorage.Save();
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 100);
                    });
                }
            });
    }

    return {
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration,
        localFavoriteFriendsGroups,
        udonExceptionLogging,
        logResourceLoad,
        logEmptyAvatars,
        autoStateChangeEnabled,
        autoStateChangeAloneStatus,
        autoStateChangeCompanyStatus,
        autoStateChangeInstanceTypes,
        autoStateChangeNoFriends,
        autoAcceptInviteRequests,

        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        setLocalFavoriteFriendsGroups,
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars,
        setAutoStateChangeEnabled,
        setAutoStateChangeAloneStatus,
        setAutoStateChangeCompanyStatus,
        setAutoStateChangeInstanceTypes,
        setAutoStateChangeNoFriends,
        setAutoAcceptInviteRequests,
        promptProxySettings
    };
});
