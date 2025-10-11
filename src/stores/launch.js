import { defineStore } from 'pinia';
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { instanceRequest } from '../api';
import configRepository from '../service/config';
import { watchState } from '../service/watchState';
import { parseLocation } from '../shared/utils';

export const useLaunchStore = defineStore('Launch', () => {
    const isLaunchOptionsDialogVisible = ref(false);
    const isOpeningInstance = ref(false);
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
     *
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
     *
     * @param {string} location
     * @param {string} shortName
     * @returns {Promise<string>} launchUrl
     */
    async function getLaunchUrl(location, shortName) {
        const L = parseLocation(location);
        if (
            shortName &&
            L.instanceType !== 'public' &&
            L.groupAccessType !== 'public'
        ) {
            return `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${shortName}`;
        }

        // fetch shortName
        let newShortName = '';
        const response = await instanceRequest.getInstanceShortName({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
        if (response.json) {
            if (response.json.shortName) {
                newShortName = response.json.shortName;
            } else {
                newShortName = response.json.secureName;
            }
        }
        if (newShortName) {
            return `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${newShortName}`;
        }
        return `vrchat://launch?ref=vrcx.app&id=${location}`;
    }

    /**
     * launch.exe &attach=1
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
            result = await AppApi.TryOpenInstanceInVrc(launchUrl);
        } catch (e) {
            console.error(e);
        }
        console.log('Attach Game', launchUrl, result);
        if (!result) {
            ElMessage({
                message:
                    'Failed open instance in VRChat, falling back to self invite',
                type: 'warning'
            });
            // self invite fallback
            try {
                const L = parseLocation(location);
                await instanceRequest.selfInvite({
                    instanceId: L.instanceId,
                    worldId: L.worldId,
                    shortName
                });
                ElMessage({
                    message: 'Self invite sent',
                    type: 'success'
                });
            } catch (e) {
                console.error(e);
            }
        }
        setTimeout(() => {
            isOpeningInstance.value = false;
        }, 1000);
    }

    /**
     *
     * @param {string} location
     * @param {string} shortName
     * @param {boolean} desktopMode
     * @returns {Promise<void>}
     */
    async function launchGame(location, shortName, desktopMode) {
        const launchUrl = await getLaunchUrl(location, shortName);
        const args = [launchUrl];
        const launchArguments =
            await configRepository.getString('launchArguments');
        const vrcLaunchPathOverride = await configRepository.getString(
            'vrcLaunchPathOverride'
        );
        if (launchArguments) {
            args.push(launchArguments);
        }
        if (desktopMode) {
            args.push('--no-vr');
        }
        if (vrcLaunchPathOverride && !LINUX) {
            AppApi.StartGameFromPath(
                vrcLaunchPathOverride,
                args.join(' ')
            ).then((result) => {
                if (!result) {
                    ElMessage({
                        message:
                            'Failed to launch VRChat, invalid custom path set',
                        type: 'error'
                    });
                } else {
                    ElMessage({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        } else {
            AppApi.StartGame(args.join(' ')).then((result) => {
                if (!result) {
                    ElMessage({
                        message:
                            'Failed to find VRChat, set a custom path in launch options',
                        type: 'error'
                    });
                } else {
                    ElMessage({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        }
        console.log('Launch Game', args.join(' '), desktopMode);
    }

    return {
        isLaunchOptionsDialogVisible,
        isOpeningInstance,
        launchDialogData,
        showLaunchOptions,
        showLaunchDialog,
        launchGame,
        tryOpenInstanceInVrc
    };
});
