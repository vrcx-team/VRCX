import { defineStore } from 'pinia';
import { ref } from 'vue';
import configRepository from '../../service/config';

export const useWristOverlaySettingsStore = defineStore(
    'WristOverlaySettings',
    () => {
        const overlayWrist = ref(true);
        const hidePrivateFromFeed = ref(false);
        const openVRAlways = ref(false);
        const overlaybutton = ref(false);
        const overlayHand = ref('0');
        const vrBackgroundEnabled = ref(false);
        const minimalFeed = ref(true);
        const hideDevicesFromFeed = ref(false);
        const vrOverlayCpuUsage = ref(false);
        const hideUptimeFromFeed = ref(false);
        const pcUptimeOnFeed = ref(false);

        async function initWristOverlaySettings() {
            const [
                overlayWristConfig,
                hidePrivateFromFeedConfig,
                openVRAlwaysConfig,
                overlaybuttonConfig,
                overlayHandConfig,
                vrBackgroundEnabledConfig,
                minimalFeedConfig,
                hideDevicesFromFeedConfig,
                vrOverlayCpuUsageConfig,
                hideUptimeFromFeedConfig,
                pcUptimeOnFeedConfig
            ] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false),
                configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                configRepository.getBool('openVRAlways', false),
                configRepository.getBool('VRCX_overlaybutton', false),
                configRepository.getInt('VRCX_overlayHand', 0),
                configRepository.getBool('VRCX_vrBackgroundEnabled', false),
                configRepository.getBool('VRCX_minimalFeed', true),
                configRepository.getBool('VRCX_hideDevicesFromFeed', false),
                configRepository.getBool('VRCX_vrOverlayCpuUsage', false),
                configRepository.getBool('VRCX_hideUptimeFromFeed', false),
                configRepository.getBool('VRCX_pcUptimeOnFeed', false)
            ]);

            overlayWrist.value = overlayWristConfig;
            hidePrivateFromFeed.value = hidePrivateFromFeedConfig;
            openVRAlways.value = openVRAlwaysConfig;
            overlaybutton.value = overlaybuttonConfig;
            overlayHand.value = String(overlayHandConfig);
            vrBackgroundEnabled.value = vrBackgroundEnabledConfig;
            minimalFeed.value = minimalFeedConfig;
            hideDevicesFromFeed.value = hideDevicesFromFeedConfig;
            vrOverlayCpuUsage.value = vrOverlayCpuUsageConfig;
            hideUptimeFromFeed.value = hideUptimeFromFeedConfig;
            pcUptimeOnFeed.value = pcUptimeOnFeedConfig;
        }

        function setOverlayWrist() {
            overlayWrist.value = !overlayWrist.value;
            configRepository.setBool('VRCX_overlayWrist', overlayWrist.value);
        }
        function setHidePrivateFromFeed() {
            hidePrivateFromFeed.value = !hidePrivateFromFeed.value;
            configRepository.setBool(
                'VRCX_hidePrivateFromFeed',
                hidePrivateFromFeed.value
            );
        }
        function setOpenVRAlways() {
            openVRAlways.value = !openVRAlways.value;
            configRepository.setBool('openVRAlways', openVRAlways.value);
        }
        function setOverlaybutton() {
            overlaybutton.value = !overlaybutton.value;
            configRepository.setBool('VRCX_overlaybutton', overlaybutton.value);
        }
        /**
         * @param {string} value
         */
        function setOverlayHand(value) {
            overlayHand.value = value;
            let overlayHandInt = parseInt(value, 10);
            if (isNaN(overlayHandInt)) {
                overlayHandInt = 0;
            }
            configRepository.setInt('VRCX_overlayHand', overlayHandInt);
        }
        function setVrBackgroundEnabled() {
            vrBackgroundEnabled.value = !vrBackgroundEnabled.value;
            configRepository.setBool(
                'VRCX_vrBackgroundEnabled',
                vrBackgroundEnabled.value
            );
        }
        function setMinimalFeed() {
            minimalFeed.value = !minimalFeed.value;
            configRepository.setBool('VRCX_minimalFeed', minimalFeed.value);
        }
        function setHideDevicesFromFeed() {
            hideDevicesFromFeed.value = !hideDevicesFromFeed.value;
            configRepository.setBool(
                'VRCX_hideDevicesFromFeed',
                hideDevicesFromFeed.value
            );
        }
        function setVrOverlayCpuUsage() {
            vrOverlayCpuUsage.value = !vrOverlayCpuUsage.value;
            configRepository.setBool(
                'VRCX_vrOverlayCpuUsage',
                vrOverlayCpuUsage.value
            );
        }
        function setHideUptimeFromFeed() {
            hideUptimeFromFeed.value = !hideUptimeFromFeed.value;
            configRepository.setBool(
                'VRCX_hideUptimeFromFeed',
                hideUptimeFromFeed.value
            );
        }
        function setPcUptimeOnFeed() {
            pcUptimeOnFeed.value = !pcUptimeOnFeed.value;
            configRepository.setBool(
                'VRCX_pcUptimeOnFeed',
                pcUptimeOnFeed.value
            );
        }

        initWristOverlaySettings();

        return {
            overlayWrist,
            hidePrivateFromFeed,
            openVRAlways,
            overlaybutton,
            overlayHand,
            vrBackgroundEnabled,
            minimalFeed,
            hideDevicesFromFeed,
            vrOverlayCpuUsage,
            hideUptimeFromFeed,
            pcUptimeOnFeed,

            setOverlayWrist,
            setHidePrivateFromFeed,
            setOpenVRAlways,
            setOverlaybutton,
            setOverlayHand,
            setVrBackgroundEnabled,
            setMinimalFeed,
            setHideDevicesFromFeed,
            setVrOverlayCpuUsage,
            setHideUptimeFromFeed,
            setPcUptimeOnFeed
        };
    }
);
