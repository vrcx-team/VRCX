import { nextTick, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { instanceRequest } from '../api';
import { parseLocation } from '../shared/utils';
import { watchState } from '../services/watchState';

export const useLaunchStore = defineStore('Launch', () => {
    const isLaunchOptionsDialogVisible = ref(false);
    const isOpeningInstance = ref(false);
    const { t } = useI18n();
    const launchDialogData = ref({
        visible: false,
        loading: false,
        tag: '',
        shortName: ''
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            isLaunchOptionsDialogVisible.value = false;
        },
        { flush: 'sync' }
    );

    function showLaunchOptions() {
        isLaunchOptionsDialogVisible.value = true;
    }

    /**
     * @param {string} tag
     * @param {string} shortName
     * @returns {Promise<void>}
     */
    async function showLaunchDialog(tag, shortName = null) {
        launchDialogData.value = {
            visible: true,
            // flag, use for trigger adjustDialogZ
            loading: true,
            tag,
            shortName
        };
        nextTick(() => (launchDialogData.value.loading = false));
    }

    /**
     * @param {string} location
     * @param {string} _shortName Unused: NexVR has no short names
     * @returns {Promise<string>} LaunchUrl
     */
    async function getLaunchUrl(location, _shortName) {
        return `nexvr://instances/${encodeURIComponent(parseLocation(location).instanceName)}/join`;
    }

    /**
     * @param {string} location
     * @returns {Promise<boolean>} Whether the nexvr:// link was handed to the OS
     */
    function joinInstance(location) {
        return AppApi.JoinNexvrInstance(parseLocation(location).instanceName);
    }

    /**
     * Launch.exe &attach=1
     *
     * @param {string} location
     * @param {string} shortName
     * @returns {Promise<void>}
     */
    async function tryOpenInstanceInVrc(location, shortName) {
        if (isOpeningInstance.value) {
            return;
        }
        isOpeningInstance.value = true;
        let launchUrl = '';
        let result = false;
        try {
            launchUrl = await getLaunchUrl(location, shortName);
            result = await joinInstance(location);
        } catch (e) {
            console.error(e);
        }
        console.log('Attach Game', launchUrl, result);
        if (!result) {
            toast.warning('Failed to open instance in NexVR, falling back to self invite');
            // self invite fallback
            try {
                const L = parseLocation(location);
                await instanceRequest.selfInvite({
                    instanceId: L.instanceId,
                    worldId: L.worldId,
                    shortName
                });
                toast.success(t('message.invite.self_sent'));
            } catch (e) {
                console.error(e);
            }
        }
        setTimeout(() => {
            isOpeningInstance.value = false;
        }, 1000);
    }

    /**
     * @param {string} location
     * @param {string} shortName
     * @param {boolean} desktopMode
     * @returns {Promise<void>}
     */
    async function launchGame(location, shortName, desktopMode) {
        // The nexvr:// link has no VR/desktop switch; the NexVR client decides
        const launchUrl = await getLaunchUrl(location, shortName);
        try {
            if (await joinInstance(location)) {
                toast.success('Opening instance in NexVR');
            } else {
                toast.error('Failed to open NexVR, is the NexVR client installed?');
            }
        } catch (e) {
            console.error(e);
            toast.error(`Failed to launch NexVR: ${e.message}`);
        }
        console.log('Launch Game', launchUrl, desktopMode);
    }

    return {
        isLaunchOptionsDialogVisible,
        isOpeningInstance,
        launchDialogData,
        showLaunchOptions,
        showLaunchDialog,
        getLaunchUrl,
        launchGame,
        tryOpenInstanceInVrc
    };
});
