import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app } from '../../app';
import { t } from '../../plugin';
import configRepository from '../../service/config';
import { useVrcxStore } from '../vrcx';
import { useVRCXUpdaterStore } from '../vrcxUpdater';
import { useFriendStore } from '../friend';

export const useGeneralSettingsStore = defineStore('GeneralSettings', () => {
    const vrcxStore = useVrcxStore();
    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const friendStore = useFriendStore();
    const state = reactive({
        isStartAtWindowsStartup: false,
        isStartAsMinimizedState: false,
        isCloseToTray: false,
        disableGpuAcceleration: false,
        disableVrOverlayGpuAcceleration: false,
        localFavoriteFriendsGroups: [],
        udonExceptionLogging: false,
        logResourceLoad: false,
        logEmptyAvatars: false,
        autoStateChangeEnabled: false,
        autoStateChangeAloneStatus: 'join me',
        autoStateChangeCompanyStatus: 'busy',
        autoStateChangeInstanceTypes: [],
        autoStateChangeNoFriends: false,
        autoAcceptInviteRequests: 'Off'
    });

    async function initGeneralSettings() {
        const [
            isStartAtWindowsStartup,
            isStartAsMinimizedState,
            isCloseToTray,
            isCloseToTrayConfigBool,
            disableGpuAccelerationStr,
            disableVrOverlayGpuAccelerationStr,
            localFavoriteFriendsGroupsStr,
            udonExceptionLogging,
            logResourceLoad,
            logEmptyAvatars,
            autoStateChangeEnabled,
            autoStateChangeAloneStatus,
            autoStateChangeCompanyStatus,
            autoStateChangeInstanceTypesStr,
            autoStateChangeNoFriends,
            autoAcceptInviteRequests
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

        state.isStartAtWindowsStartup = isStartAtWindowsStartup;
        state.isStartAsMinimizedState = isStartAsMinimizedState === 'true';

        if (isCloseToTrayConfigBool) {
            state.isCloseToTray = isCloseToTrayConfigBool;

            await VRCXStorage.Set(
                'VRCX_CloseToTray',
                state.isCloseToTray.toString()
            );
            await configRepository.remove('VRCX_CloseToTray');
        } else {
            state.isCloseToTray = isCloseToTray === 'true';
        }

        state.disableGpuAcceleration = disableGpuAccelerationStr === 'true';
        state.disableVrOverlayGpuAcceleration =
            disableVrOverlayGpuAccelerationStr === 'true';
        state.localFavoriteFriendsGroups = JSON.parse(
            localFavoriteFriendsGroupsStr
        );
        state.udonExceptionLogging = udonExceptionLogging;
        state.logResourceLoad = logResourceLoad;
        state.logEmptyAvatars = logEmptyAvatars;
        state.autoStateChangeEnabled = autoStateChangeEnabled;
        state.autoStateChangeAloneStatus = autoStateChangeAloneStatus;
        state.autoStateChangeCompanyStatus = autoStateChangeCompanyStatus;
        state.autoStateChangeInstanceTypes = JSON.parse(
            autoStateChangeInstanceTypesStr
        );
        state.autoStateChangeNoFriends = autoStateChangeNoFriends;
        state.autoAcceptInviteRequests = autoAcceptInviteRequests;
    }

    initGeneralSettings();

    const isStartAtWindowsStartup = computed(
        () => state.isStartAtWindowsStartup
    );
    const isStartAsMinimizedState = computed(
        () => state.isStartAsMinimizedState
    );
    const disableGpuAcceleration = computed(() => state.disableGpuAcceleration);
    const isCloseToTray = computed(() => state.isCloseToTray);
    const disableVrOverlayGpuAcceleration = computed(
        () => state.disableVrOverlayGpuAcceleration
    );
    const localFavoriteFriendsGroups = computed(
        () => state.localFavoriteFriendsGroups
    );
    const udonExceptionLogging = computed(() => state.udonExceptionLogging);
    const logResourceLoad = computed(() => state.logResourceLoad);
    const logEmptyAvatars = computed(() => state.logEmptyAvatars);
    const autoStateChangeEnabled = computed(() => state.autoStateChangeEnabled);
    const autoStateChangeAloneStatus = computed(
        () => state.autoStateChangeAloneStatus
    );
    const autoStateChangeCompanyStatus = computed(
        () => state.autoStateChangeCompanyStatus
    );
    const autoStateChangeInstanceTypes = computed(
        () => state.autoStateChangeInstanceTypes
    );
    const autoStateChangeNoFriends = computed(
        () => state.autoStateChangeNoFriends
    );
    const autoAcceptInviteRequests = computed(
        () => state.autoAcceptInviteRequests
    );

    function setIsStartAtWindowsStartup() {
        state.isStartAtWindowsStartup = !state.isStartAtWindowsStartup;
        configRepository.setBool(
            'VRCX_StartAtWindowsStartup',
            state.isStartAtWindowsStartup
        );
        AppApi.SetStartup(state.isStartAtWindowsStartup);
    }
    function setIsStartAsMinimizedState() {
        state.isStartAsMinimizedState = !state.isStartAsMinimizedState;
        VRCXStorage.Set(
            'VRCX_StartAsMinimizedState',
            state.isStartAsMinimizedState.toString()
        );
    }
    function setIsCloseToTray() {
        state.isCloseToTray = !state.isCloseToTray;
        VRCXStorage.Set('VRCX_CloseToTray', state.isCloseToTray.toString());
    }
    function setDisableGpuAcceleration() {
        state.disableGpuAcceleration = !state.disableGpuAcceleration;
        VRCXStorage.Set(
            'VRCX_DisableGpuAcceleration',
            state.disableGpuAcceleration.toString()
        );
    }
    function setDisableVrOverlayGpuAcceleration() {
        state.disableVrOverlayGpuAcceleration =
            !state.disableVrOverlayGpuAcceleration;
        VRCXStorage.Set(
            'VRCX_DisableVrOverlayGpuAcceleration',
            state.disableVrOverlayGpuAcceleration.toString()
        );
    }
    /**
     * @param {string[]} value
     */
    function setLocalFavoriteFriendsGroups(value) {
        state.localFavoriteFriendsGroups = value;
        configRepository.setString(
            'VRCX_localFavoriteFriendsGroups',
            JSON.stringify(value)
        );
        friendStore.updateLocalFavoriteFriends();
    }
    function setUdonExceptionLogging() {
        state.udonExceptionLogging = !state.udonExceptionLogging;
        configRepository.setBool(
            'VRCX_udonExceptionLogging',
            state.udonExceptionLogging
        );
    }
    function setLogResourceLoad() {
        state.logResourceLoad = !state.logResourceLoad;
        configRepository.setBool('VRCX_logResourceLoad', state.logResourceLoad);
    }
    function setLogEmptyAvatars() {
        state.logEmptyAvatars = !state.logEmptyAvatars;
        configRepository.setBool('VRCX_logEmptyAvatars', state.logEmptyAvatars);
    }
    function setAutoStateChangeEnabled() {
        state.autoStateChangeEnabled = !state.autoStateChangeEnabled;
        configRepository.setBool(
            'VRCX_autoStateChangeEnabled',
            state.autoStateChangeEnabled
        );
    }
    /**
     * @param {string} value
     */
    function setAutoStateChangeAloneStatus(value) {
        state.autoStateChangeAloneStatus = value;
        configRepository.setString(
            'VRCX_autoStateChangeAloneStatus',
            state.autoStateChangeAloneStatus
        );
    }
    /**
     * @param {string} value
     */
    function setAutoStateChangeCompanyStatus(value) {
        state.autoStateChangeCompanyStatus = value;
        configRepository.setString(
            'VRCX_autoStateChangeCompanyStatus',
            state.autoStateChangeCompanyStatus
        );
    }
    function setAutoStateChangeInstanceTypes(value) {
        state.autoStateChangeInstanceTypes = value;
        configRepository.setString(
            'VRCX_autoStateChangeInstanceTypes',
            JSON.stringify(state.autoStateChangeInstanceTypes)
        );
    }
    function setAutoStateChangeNoFriends() {
        state.autoStateChangeNoFriends = !state.autoStateChangeNoFriends;
        configRepository.setBool(
            'VRCX_autoStateChangeNoFriends',
            state.autoStateChangeNoFriends
        );
    }
    /**
     * @param {string} value
     */
    function setAutoAcceptInviteRequests(value) {
        state.autoAcceptInviteRequests = value;
        configRepository.setString(
            'VRCX_autoAcceptInviteRequests',
            state.autoAcceptInviteRequests
        );
    }

    function promptProxySettings() {
        $app.$prompt(
            t('prompt.proxy_settings.description'),
            t('prompt.proxy_settings.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.proxy_settings.restart'),
                cancelButtonText: t('prompt.proxy_settings.close'),
                inputValue: vrcxStore.proxyServer,
                inputPlaceholder: t('prompt.proxy_settings.placeholder'),
                callback: async (action, instance) => {
                    vrcxStore.proxyServer = instance.inputValue;
                    await VRCXStorage.Set(
                        'VRCX_ProxyServer',
                        vrcxStore.proxyServer
                    );
                    await VRCXStorage.Flush();
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 100);
                    });
                    if (action === 'confirm') {
                        const { restartVRCX } = VRCXUpdaterStore;
                        const isUpgrade = false;
                        restartVRCX(isUpgrade);
                    }
                }
            }
        );
    }

    return {
        state,

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
