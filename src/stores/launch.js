import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { instanceRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { watchState } from '../service/watchState';
import { parseLocation } from '../shared/utils';

export const useLaunchStore = defineStore('Launch', () => {
    const state = reactive({
        isLaunchOptionsDialogVisible: false,
        launchDialogData: {
            visible: false,
            loading: false,
            tag: '',
            shortName: ''
        }
    });

    const isLaunchOptionsDialogVisible = computed({
        get: () => state.isLaunchOptionsDialogVisible,
        set: (value) => {
            state.isLaunchOptionsDialogVisible = value;
        }
    });

    const launchDialogData = computed({
        get: () => state.launchDialogData,
        set: (value) => {
            state.launchDialogData = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.isLaunchOptionsDialogVisible = false;
        },
        { flush: 'sync' }
    );

    function showLaunchOptions() {
        state.isLaunchOptionsDialogVisible = true;
    }

    /**
     *
     * @param {string} tag
     * @param {string} shortName
     * @returns {Promise<void>}
     */
    async function showLaunchDialog(tag, shortName = null) {
        state.launchDialogData = {
            visible: true,
            // flag, use for trigger adjustDialogZ
            loading: true,
            tag,
            shortName
        };
        $app.$nextTick(() => (state.launchDialogData.loading = false));
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
        const launchUrl = await getLaunchUrl(location, shortName);
        let result = false;
        try {
            result = await AppApi.TryOpenInstanceInVrc(launchUrl);
        } catch (e) {
            console.error(e);
        }
        console.log('Attach Game', launchUrl, result);
        if (!result) {
            $app.$message({
                message:
                    'Failed open instance in VRChat, falling back to self invite',
                type: 'warning'
            });
            // self invite fallback
            const L = parseLocation(location);
            await instanceRequest.selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId,
                shortName
            });
            $app.$message({
                message: 'Self invite sent',
                type: 'success'
            });
        }
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
                    $app.$message({
                        message:
                            'Failed to launch VRChat, invalid custom path set',
                        type: 'error'
                    });
                } else {
                    $app.$message({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        } else {
            AppApi.StartGame(args.join(' ')).then((result) => {
                if (!result) {
                    $app.$message({
                        message:
                            'Failed to find VRChat, set a custom path in launch options',
                        type: 'error'
                    });
                } else {
                    $app.$message({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        }
        console.log('Launch Game', args.join(' '), desktopMode);
    }

    return {
        state,
        isLaunchOptionsDialogVisible,
        launchDialogData,
        showLaunchOptions,
        showLaunchDialog,
        launchGame,
        tryOpenInstanceInVrc
    };
});
