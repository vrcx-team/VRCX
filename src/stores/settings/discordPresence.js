import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import {
    getGroupName,
    getLaunchURL,
    isRealInstance,
    isRpcWorld,
    parseLocation
} from '../../shared/utils';
import {
    getPlatformLabel,
    getRpcWorldConfig,
    getStatusInfo,
    isPopcornPalaceWorld
} from '../../shared/utils/discordPresence';
import {
    ActivityType,
    StatusDisplayType
} from '../../shared/constants/discord';
import { queryRequest } from '../../api';
import { useGameLogStore } from '../gameLog';
import { useGameStore } from '../game';
import { useLocationStore } from '../location';
import { useUpdateLoopStore } from '../updateLoop';
import { useUserStore } from '../user';

import configRepository from '../../services/config';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const locationStore = useLocationStore();
        const gameStore = useGameStore();
        const gameLogStore = useGameLogStore();
        const userStore = useUserStore();
        const updateLoopStore = useUpdateLoopStore();
        const { t } = useI18n();

        const state = reactive({
            isDiscordActive: false,
            lastLocationDetails: {
                tag: '',
                instanceName: '',
                accessType: '',
                worldId: '',
                worldName: '',
                thumbnailImageUrl: '',
                worldCapacity: 0,
                joinUrl: '',
                worldLink: '',
                accessName: '',
                groupAccessType: '',
                groupAccessName: ''
            }
        });

        const discordActive = ref(false);
        const discordInstance = ref(true);
        const discordHideInvite = ref(true);
        const discordJoinButton = ref(false);
        const discordHideImage = ref(false);
        const discordShowPlatform = ref(true);
        const discordWorldIntegration = ref(true);
        const discordWorldNameAsDiscordStatus = ref(false);

        /**
         *
         */
        function setDiscordActive() {
            discordActive.value = !discordActive.value;
            configRepository.setBool('discordActive', discordActive.value);
        }
        /**
         *
         */
        function setDiscordInstance() {
            discordInstance.value = !discordInstance.value;
            configRepository.setBool('discordInstance', discordInstance.value);
        }
        /**
         *
         */
        function setDiscordHideInvite() {
            discordHideInvite.value = !discordHideInvite.value;
            configRepository.setBool(
                'discordHideInvite',
                discordHideInvite.value
            );
        }
        /**
         *
         */
        function setDiscordJoinButton() {
            discordJoinButton.value = !discordJoinButton.value;
            configRepository.setBool(
                'discordJoinButton',
                discordJoinButton.value
            );
        }
        /**
         *
         */
        function setDiscordHideImage() {
            discordHideImage.value = !discordHideImage.value;
            configRepository.setBool(
                'discordHideImage',
                discordHideImage.value
            );
        }
        /**
         *
         */
        function setDiscordShowPlatform() {
            discordShowPlatform.value = !discordShowPlatform.value;
            configRepository.setBool(
                'discordShowPlatform',
                discordShowPlatform.value
            );
        }
        /**
         *
         */
        function setDiscordWorldIntegration() {
            discordWorldIntegration.value = !discordWorldIntegration.value;
            configRepository.setBool(
                'discordWorldIntegration',
                discordWorldIntegration.value
            );
        }
        /**
         *
         */
        function setDiscordWorldNameAsDiscordStatus() {
            discordWorldNameAsDiscordStatus.value =
                !discordWorldNameAsDiscordStatus.value;
            configRepository.setBool(
                'discordWorldNameAsDiscordStatus',
                discordWorldNameAsDiscordStatus.value
            );
        }

        /**
         *
         */
        async function initDiscordPresenceSettings() {
            const [
                discordActiveConfig,
                discordInstanceConfig,
                discordHideInviteConfig,
                discordJoinButtonConfig,
                discordHideImageConfig,
                discordShowPlatformConfig,
                discordWorldIntegrationConfig,
                discordWorldNameAsDiscordStatusConfig
            ] = await Promise.all([
                configRepository.getBool('discordActive', false),
                configRepository.getBool('discordInstance', true),
                configRepository.getBool('discordHideInvite', true),
                configRepository.getBool('discordJoinButton', false),
                configRepository.getBool('discordHideImage', false),
                configRepository.getBool('discordShowPlatform', true),
                configRepository.getBool('discordWorldIntegration', true),
                configRepository.getBool(
                    'discordWorldNameAsDiscordStatus',
                    false
                )
            ]);

            discordActive.value = discordActiveConfig;
            discordInstance.value = discordInstanceConfig;
            discordHideInvite.value = discordHideInviteConfig;
            discordJoinButton.value = discordJoinButtonConfig;
            discordHideImage.value = discordHideImageConfig;
            discordShowPlatform.value = discordShowPlatformConfig;
            discordWorldIntegration.value = discordWorldIntegrationConfig;
            discordWorldNameAsDiscordStatus.value =
                discordWorldNameAsDiscordStatusConfig;
        }

        initDiscordPresenceSettings();

        /**
         *
         */
        async function updateDiscord() {
            let currentLocation = locationStore.lastLocation.location;
            let startTime = locationStore.lastLocation.date;
            if (locationStore.lastLocation.location === 'traveling') {
                currentLocation = locationStore.lastLocationDestination;
                startTime = locationStore.lastLocationDestinationTime;
            }
            if (!currentLocation) {
                // game log disabled, use API location
                currentLocation = userStore.currentUser.$locationTag;
                startTime = userStore.currentUser.$location_at;
                if (userStore.currentUser.$travelingToLocation) {
                    currentLocation =
                        userStore.currentUser.$travelingToLocation;
                }
            }
            if (!discordActive.value || !isRealInstance(currentLocation)) {
                setIsDiscordActive(false);
                return;
            }
            if (currentLocation !== state.lastLocationDetails.tag) {
                const L = parseLocation(currentLocation);
                state.lastLocationDetails = {
                    tag: L.tag,
                    instanceName: L.instanceName,
                    accessType: L.accessType,
                    worldId: L.worldId,
                    worldName: '',
                    thumbnailImageUrl: '',
                    worldCapacity: 0,
                    joinUrl: '',
                    worldLink: '',
                    accessName: '',
                    groupAccessType: '',
                    groupAccessName: ''
                };
                try {
                    const args = await queryRequest.fetch('world.location', {
                        worldId: L.worldId
                    });
                    state.lastLocationDetails.worldName = args.ref.name;
                    state.lastLocationDetails.thumbnailImageUrl =
                        args.ref.thumbnailImageUrl;
                    state.lastLocationDetails.worldCapacity = args.ref.capacity;
                    if (args.ref.releaseStatus === 'public') {
                        state.lastLocationDetails.worldLink = `https://vrchat.com/home/world/${L.worldId}`;
                    }
                } catch (e) {
                    console.error(
                        `Failed to get world details for ${L.worldId}`,
                        e
                    );
                }

                let platform = '';
                if (discordShowPlatform.value) {
                    platform = getPlatformLabel(
                        userStore.currentUser.presence.platform,
                        gameStore.isGameRunning,
                        gameStore.isGameNoVR,
                        t
                    );
                }
                state.lastLocationDetails.groupAccessType = L.groupAccessType;
                if (L.groupAccessType) {
                    if (L.groupAccessType === 'public') {
                        state.lastLocationDetails.groupAccessName = t(
                            'dialog.new_instance.group_access_type_public'
                        );
                    } else if (L.groupAccessType === 'plus') {
                        state.lastLocationDetails.groupAccessName = t(
                            'dialog.new_instance.group_access_type_plus'
                        );
                    }
                }
                switch (L.accessType) {
                    case 'public':
                        state.lastLocationDetails.joinUrl = getLaunchURL(L);
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_public')} #${L.instanceName}${platform}`;
                        break;
                    case 'invite+':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_invite_plus')} #${L.instanceName}${platform}`;
                        break;
                    case 'invite':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_invite')} #${L.instanceName}${platform}`;
                        break;
                    case 'friends':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_friend')} #${L.instanceName}${platform}`;
                        break;
                    case 'friends+':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_friend_plus')} #${L.instanceName}${platform}`;
                        break;
                    case 'group':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_group')} #${L.instanceName}${platform}`;
                        try {
                            const groupName = await getGroupName(L.groupId);
                            if (groupName) {
                                state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_group')}${state.lastLocationDetails.groupAccessName}(${groupName}) #${L.instanceName}${platform}`;
                            }
                        } catch (e) {
                            console.error(
                                `Failed to get group name for ${L.groupId}`,
                                e
                            );
                        }
                        break;
                }
            }
            setIsDiscordActive(true);
            let hidePrivate = false;
            if (
                discordHideInvite.value &&
                (state.lastLocationDetails.accessType === 'invite' ||
                    state.lastLocationDetails.accessType === 'invite+' ||
                    state.lastLocationDetails.groupAccessType === 'members')
            ) {
                hidePrivate = true;
            }
            const statusInfo = getStatusInfo(
                userStore.currentUser.status,
                discordHideInvite.value,
                t
            );
            const { statusName, statusImage } = statusInfo;
            if (statusInfo.hidePrivate) {
                hidePrivate = true;
            }
            let details = state.lastLocationDetails.worldName;
            let stateText = state.lastLocationDetails.accessName;
            let endTime = 0;
            let activityType = ActivityType.Playing;
            let statusDisplayType = discordWorldNameAsDiscordStatus.value
                ? StatusDisplayType.Details
                : StatusDisplayType.Name;
            let appId = '883308884863901717';
            let bigIcon = 'vrchat';
            let detailsUrl = state.lastLocationDetails.worldLink;
            let poweredBy = t(
                'view.settings.discord_presence.rpc.powered_by_vrcx'
            );

            let partyId = `${state.lastLocationDetails.worldId}:${state.lastLocationDetails.instanceName}`;
            let partySize = locationStore.lastLocation.playerList.size;
            let partyMaxSize = state.lastLocationDetails.worldCapacity;
            if (partySize > partyMaxSize) {
                partyMaxSize = partySize;
            }
            if (partySize === 0) {
                partyMaxSize = 0;
            }
            if (!discordInstance.value) {
                partySize = 0;
                partyMaxSize = 0;
                stateText = '';
            }
            let buttonText = 'Join';
            let buttonUrl = state.lastLocationDetails.joinUrl;
            if (!discordJoinButton.value) {
                buttonText = '';
                buttonUrl = '';
            }

            const rpcConfig =
                isRpcWorld(state.lastLocationDetails.tag) &&
                discordWorldIntegration.value
                    ? getRpcWorldConfig(state.lastLocationDetails.worldId)
                    : null;

            if (rpcConfig) {
                activityType = rpcConfig.activityType;
                statusDisplayType = rpcConfig.statusDisplayType;
                appId = rpcConfig.appId;
                bigIcon = rpcConfig.bigIcon;
                if (
                    isPopcornPalaceWorld(state.lastLocationDetails.worldId) &&
                    !discordHideImage.value &&
                    gameLogStore.nowPlaying.thumbnailUrl
                ) {
                    bigIcon = gameLogStore.nowPlaying.thumbnailUrl;
                }
                if (gameLogStore.nowPlaying.name) {
                    details = gameLogStore.nowPlaying.name;
                }
                if (gameLogStore.nowPlaying.playing) {
                    startTime = gameLogStore.nowPlaying.startTime * 1000;
                    endTime =
                        (gameLogStore.nowPlaying.startTime +
                            gameLogStore.nowPlaying.length) *
                        1000;
                }
            } else if (
                !discordHideImage.value &&
                state.lastLocationDetails.thumbnailImageUrl
            ) {
                bigIcon = state.lastLocationDetails.thumbnailImageUrl;
            }

            if (hidePrivate) {
                partyId = '';
                partySize = 0;
                partyMaxSize = 0;
                buttonText = '';
                buttonUrl = '';
                detailsUrl = '';
                details = t('view.settings.discord_presence.rpc.private_world');
                stateText = '';
                startTime = 0;
                endTime = 0;
                appId = '883308884863901717'; // default VRChat app id
                bigIcon = 'vrchat';
                activityType = ActivityType.Playing;
                statusDisplayType = StatusDisplayType.Name;
            }
            if (details.length < 2) {
                // 글자 수가 짧으면 업데이트가 안된다..
                details += '\uFFA0'.repeat(2 - details.length);
            }
            Discord.SetAssets(
                details, // main text
                stateText, // secondary text
                detailsUrl, // details url

                bigIcon, // big icon
                poweredBy, // big icon hover text

                statusImage, // small icon
                statusName, // small icon hover text

                startTime,
                endTime,

                partyId, // party id
                partySize, // party size
                partyMaxSize, // party max size
                buttonText, // button text
                buttonUrl, // button url
                appId, // app id
                activityType, // activity type
                statusDisplayType // status display type
            );
        }

        /**
         *
         * @param active
         */
        async function setIsDiscordActive(active) {
            if (active !== state.isDiscordActive) {
                state.isDiscordActive = await Discord.SetActive(active);
            }
        }

        /**
         *
         * @param configLabel
         */
        async function saveDiscordOption(configLabel = '') {
            state.lastLocationDetails.tag = '';
            updateLoopStore.setNextDiscordUpdate(3);
            updateDiscord();
        }

        return {
            state,

            discordActive,
            discordInstance,
            discordHideInvite,
            discordJoinButton,
            discordHideImage,
            discordShowPlatform,
            discordWorldIntegration,
            discordWorldNameAsDiscordStatus,

            setDiscordActive,
            setDiscordInstance,
            setDiscordHideInvite,
            setDiscordJoinButton,
            setDiscordHideImage,
            setDiscordShowPlatform,
            setDiscordWorldIntegration,
            setDiscordWorldNameAsDiscordStatus,
            updateDiscord,
            saveDiscordOption
        };
    }
);
