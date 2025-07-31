import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';
import { isRpcWorld } from '../shared/utils';
import { watchState } from '../service/watchState';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useGameLogStore } from './gameLog';
import { useLocationStore } from './location';
import { usePhotonStore } from './photon';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { useSharedFeedStore } from './sharedFeed';
import { useUserStore } from './user';

export const useVrStore = defineStore('Vr', () => {
    const friendStore = useFriendStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const locationStore = useLocationStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const photonStore = usePhotonStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const gameStore = useGameStore();
    const gameLogStore = useGameLogStore();
    const userStore = useUserStore();
    const sharedFeedStore = useSharedFeedStore();

    const state = reactive({});

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                vrInit();
            }
        },
        { flush: 'sync' }
    );

    // also runs from CEF C# on overlay browser startup
    function vrInit() {
        updateVRConfigVars();
        updateVRLastLocation();
        updateVrNowPlaying();
        // run these methods again to send data to the overlay
        sharedFeedStore.updateSharedFeed(true);
        friendStore.onlineFriendCount = 0; // force an update
        friendStore.updateOnlineFriendCoutner();
    }

    async function saveOpenVROption() {
        sharedFeedStore.updateSharedFeed(true);
        updateVRConfigVars();
        updateVRLastLocation();
        AppApi.ExecuteVrOverlayFunction('notyClear', '');
        updateOpenVR();
    }

    function updateVrNowPlaying() {
        const json = JSON.stringify(gameLogStore.nowPlaying);
        AppApi.ExecuteVrFeedFunction('nowPlayingUpdate', json);
        AppApi.ExecuteVrOverlayFunction('nowPlayingUpdate', json);
    }

    function updateVRLastLocation() {
        let progressPie = false;
        if (advancedSettingsStore.progressPie) {
            progressPie = true;
            if (advancedSettingsStore.progressPieFilter) {
                if (!isRpcWorld(locationStore.lastLocation.location)) {
                    progressPie = false;
                }
            }
        }
        let onlineFor = null;
        if (!wristOverlaySettingsStore.hideUptimeFromFeed) {
            onlineFor = userStore.currentUser.$online_for;
        }
        const lastLocation = {
            date: locationStore.lastLocation.date,
            location: locationStore.lastLocation.location,
            name: locationStore.lastLocation.name,
            playerList: Array.from(
                locationStore.lastLocation.playerList.values()
            ),
            friendList: Array.from(
                locationStore.lastLocation.friendList.values()
            ),
            progressPie,
            onlineFor
        };
        const json = JSON.stringify(lastLocation);
        AppApi.ExecuteVrFeedFunction('lastLocationUpdate', json);
        AppApi.ExecuteVrOverlayFunction('lastLocationUpdate', json);
    }

    function updateVRConfigVars() {
        let notificationTheme = 'relax';
        if (appearanceSettingsStore.isDarkMode) {
            notificationTheme = 'sunset';
        }
        const VRConfigVars = {
            overlayNotifications:
                notificationsSettingsStore.overlayNotifications,
            hideDevicesFromFeed: wristOverlaySettingsStore.hideDevicesFromFeed,
            vrOverlayCpuUsage: wristOverlaySettingsStore.vrOverlayCpuUsage,
            minimalFeed: wristOverlaySettingsStore.minimalFeed,
            notificationPosition:
                notificationsSettingsStore.notificationPosition,
            notificationTimeout: notificationsSettingsStore.notificationTimeout,
            photonOverlayMessageTimeout:
                photonStore.photonOverlayMessageTimeout,
            notificationTheme,
            backgroundEnabled: wristOverlaySettingsStore.vrBackgroundEnabled,
            dtHour12: appearanceSettingsStore.dtHour12,
            pcUptimeOnFeed: wristOverlaySettingsStore.pcUptimeOnFeed,
            appLanguage: appearanceSettingsStore.appLanguage,
            notificationOpacity: advancedSettingsStore.notificationOpacity
        };
        const json = JSON.stringify(VRConfigVars);
        AppApi.ExecuteVrFeedFunction('configUpdate', json);
        AppApi.ExecuteVrOverlayFunction('configUpdate', json);
    }

    function updateOpenVR() {
        let newState = {
            active: false,
            hmdOverlay: false,
            wristOverlay: false,
            menuButton: false,
            overlayHand: 0
        };
        if (
            notificationsSettingsStore.openVR &&
            gameStore.isSteamVRRunning &&
            ((gameStore.isGameRunning && !gameStore.isGameNoVR) ||
                wristOverlaySettingsStore.openVRAlways)
        ) {
            let hmdOverlay = false;
            if (
                notificationsSettingsStore.overlayNotifications ||
                advancedSettingsStore.progressPie ||
                photonStore.photonEventOverlay ||
                photonStore.timeoutHudOverlay
            ) {
                hmdOverlay = true;
            }
            newState = {
                active: true,
                hmdOverlay,
                wristOverlay: wristOverlaySettingsStore.overlayWrist,
                menuButton: wristOverlaySettingsStore.overlaybutton,
                overlayHand: wristOverlaySettingsStore.overlayHand
            };
        }

        AppApi.SetVR(
            newState.active,
            newState.hmdOverlay,
            newState.wristOverlay,
            newState.menuButton,
            newState.overlayHand
        );

        if (LINUX) {
            window.electron.updateVr(
                newState.active,
                newState.hmdOverlay,
                newState.wristOverlay,
                newState.menuButton,
                newState.overlayHand
            );

            vrInit(); // sometimes this runs before the overlay is ready
        }
    }

    return {
        state,
        vrInit,
        saveOpenVROption,
        updateVrNowPlaying,
        updateVRLastLocation,
        updateVRConfigVars,
        updateOpenVR
    };
});
