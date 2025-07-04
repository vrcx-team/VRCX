import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useWristOverlaySettingsStore = defineStore(
    'WristOverlaySettings',
    () => {
        const state = reactive({
            overlayWrist: true,
            hidePrivateFromFeed: false,
            openVRAlways: false,
            overlaybutton: false,
            overlayHand: 0,
            vrBackgroundEnabled: false,
            minimalFeed: false,
            hideDevicesFromFeed: false,
            vrOverlayCpuUsage: false,
            hideUptimeFromFeed: false,
            pcUptimeOnFeed: false
        });

        async function initWristOverlaySettings() {
            const [
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
                pcUptimeOnFeed
            ] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false),
                configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                configRepository.getBool('openVRAlways', false),
                configRepository.getBool('VRCX_overlaybutton', false),
                configRepository.getInt('VRCX_overlayHand', 0),
                configRepository.getBool('VRCX_vrBackgroundEnabled', false),
                configRepository.getBool('VRCX_minimalFeed', false),
                configRepository.getBool('VRCX_hideDevicesFromFeed', false),
                configRepository.getBool('VRCX_vrOverlayCpuUsage', false),
                configRepository.getBool('VRCX_hideUptimeFromFeed', false),
                configRepository.getBool('VRCX_pcUptimeOnFeed', false)
            ]);

            state.overlayWrist = overlayWrist;
            state.hidePrivateFromFeed = hidePrivateFromFeed;
            state.openVRAlways = openVRAlways;
            state.overlaybutton = overlaybutton;
            state.overlayHand = overlayHand;
            state.vrBackgroundEnabled = vrBackgroundEnabled;
            state.minimalFeed = minimalFeed;
            state.hideDevicesFromFeed = hideDevicesFromFeed;
            state.vrOverlayCpuUsage = vrOverlayCpuUsage;
            state.hideUptimeFromFeed = hideUptimeFromFeed;
            state.pcUptimeOnFeed = pcUptimeOnFeed;
        }

        const overlayWrist = computed(() => state.overlayWrist);
        const hidePrivateFromFeed = computed(() => state.hidePrivateFromFeed);
        const openVRAlways = computed(() => state.openVRAlways);
        const overlaybutton = computed(() => state.overlaybutton);
        const overlayHand = computed(() => state.overlayHand);
        const vrBackgroundEnabled = computed(() => state.vrBackgroundEnabled);
        const minimalFeed = computed(() => state.minimalFeed);
        const hideDevicesFromFeed = computed(() => state.hideDevicesFromFeed);
        const vrOverlayCpuUsage = computed(() => state.vrOverlayCpuUsage);
        const hideUptimeFromFeed = computed(() => state.hideUptimeFromFeed);
        const pcUptimeOnFeed = computed(() => state.pcUptimeOnFeed);

        function setOverlayWrist() {
            state.overlayWrist = !state.overlayWrist;
            configRepository.setBool('VRCX_overlayWrist', state.overlayWrist);
        }
        function setHidePrivateFromFeed() {
            state.hidePrivateFromFeed = !state.hidePrivateFromFeed;
            configRepository.setBool(
                'VRCX_hidePrivateFromFeed',
                state.hidePrivateFromFeed
            );
        }
        function setOpenVRAlways() {
            state.openVRAlways = !state.openVRAlways;
            configRepository.setBool('openVRAlways', state.openVRAlways);
        }
        function setOverlaybutton() {
            state.overlaybutton = !state.overlaybutton;
            configRepository.setBool('VRCX_overlaybutton', state.overlaybutton);
        }
        /**
         * @param {string} value
         */
        function setOverlayHand(value) {
            state.overlayHand = parseInt(value, 10);
            if (isNaN(state.overlayHand)) {
                state.overlayHand = 0;
            }
            configRepository.setInt('VRCX_overlayHand', value);
        }
        function setVrBackgroundEnabled() {
            state.vrBackgroundEnabled = !state.vrBackgroundEnabled;
            configRepository.setBool(
                'VRCX_vrBackgroundEnabled',
                state.vrBackgroundEnabled
            );
        }
        function setMinimalFeed() {
            state.minimalFeed = !state.minimalFeed;
            configRepository.setBool('VRCX_minimalFeed', state.minimalFeed);
        }
        function setHideDevicesFromFeed() {
            state.hideDevicesFromFeed = !state.hideDevicesFromFeed;
            configRepository.setBool(
                'VRCX_hideDevicesFromFeed',
                state.hideDevicesFromFeed
            );
        }
        function setVrOverlayCpuUsage() {
            state.vrOverlayCpuUsage = !state.vrOverlayCpuUsage;
            configRepository.setBool(
                'VRCX_vrOverlayCpuUsage',
                state.vrOverlayCpuUsage
            );
        }
        function setHideUptimeFromFeed() {
            state.hideUptimeFromFeed = !state.hideUptimeFromFeed;
            configRepository.setBool(
                'VRCX_hideUptimeFromFeed',
                state.hideUptimeFromFeed
            );
        }
        function setPcUptimeOnFeed() {
            state.pcUptimeOnFeed = !state.pcUptimeOnFeed;
            configRepository.setBool(
                'VRCX_pcUptimeOnFeed',
                state.pcUptimeOnFeed
            );
        }

        initWristOverlaySettings();

        return {
            state,

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
