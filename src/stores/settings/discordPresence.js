import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { worldRequest } from '../../api';
import configRepository from '../../service/config';
import {
    getGroupName,
    getLaunchURL,
    isRealInstance,
    isRpcWorld,
    parseLocation
} from '../../shared/utils';
import { useGameStore } from '../game';
import { useGameLogStore } from '../gameLog';
import { useLocationStore } from '../location';
import { useUpdateLoopStore } from '../updateLoop';
import { useUserStore } from '../user';
import { ActivityType } from '../../shared/constants/discord';
import { useI18n } from 'vue-i18n-bridge';

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
            discordActive: false,
            discordInstance: true,
            discordHideInvite: true,
            discordJoinButton: false,
            discordHideImage: false,
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
                groupAccessType: ''
            }
        });

        async function initDiscordPresenceSettings() {
            const [
                discordActive,
                discordInstance,
                discordHideInvite,
                discordJoinButton,
                discordHideImage
            ] = await Promise.all([
                configRepository.getBool('discordActive', false),
                configRepository.getBool('discordInstance', true),
                configRepository.getBool('discordHideInvite', true),
                configRepository.getBool('discordJoinButton', false),
                configRepository.getBool('discordHideImage', false)
            ]);

            state.discordActive = discordActive;
            state.discordInstance = discordInstance;
            state.discordHideInvite = discordHideInvite;
            state.discordJoinButton = discordJoinButton;
            state.discordHideImage = discordHideImage;
        }

        const discordActive = computed(() => state.discordActive);
        const discordInstance = computed(() => state.discordInstance);
        const discordHideInvite = computed(() => state.discordHideInvite);
        const discordJoinButton = computed(() => state.discordJoinButton);
        const discordHideImage = computed(() => state.discordHideImage);

        function setDiscordActive() {
            state.discordActive = !state.discordActive;
            configRepository.setBool('discordActive', state.discordActive);
        }
        function setDiscordInstance() {
            state.discordInstance = !state.discordInstance;
            configRepository.setBool('discordInstance', state.discordInstance);
        }
        function setDiscordHideInvite() {
            state.discordHideInvite = !state.discordHideInvite;
            configRepository.setBool(
                'discordHideInvite',
                state.discordHideInvite
            );
        }
        function setDiscordJoinButton() {
            state.discordJoinButton = !state.discordJoinButton;
            configRepository.setBool(
                'discordJoinButton',
                state.discordJoinButton
            );
        }
        function setDiscordHideImage() {
            state.discordHideImage = !state.discordHideImage;
            configRepository.setBool(
                'discordHideImage',
                state.discordHideImage
            );
        }

        initDiscordPresenceSettings();

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
            if (!state.discordActive || !isRealInstance(currentLocation)) {
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
                    groupAccessType: ''
                };
                try {
                    const args = await worldRequest.getCachedWorld({
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

                let platform = gameStore.isGameNoVR
                    ? t('view.settings.discord_presence.rpc.desktop')
                    : t('view.settings.discord_presence.rpc.vr');
                if (L.groupAccessType) {
                    if (L.groupAccessType === 'public') {
                        state.lastLocationDetails.groupAccessType = t(
                            'dialog.new_instance.group_access_type_public'
                        );
                    } else if (L.groupAccessType === 'plus') {
                        state.lastLocationDetails.groupAccessType = t(
                            'dialog.new_instance.group_access_type_plus'
                        );
                    }
                }
                switch (L.accessType) {
                    case 'public':
                        state.lastLocationDetails.joinUrl = getLaunchURL(L);
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_public')} #${L.instanceName} (${platform})`;
                        break;
                    case 'invite+':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_invite_plus')} #${L.instanceName} (${platform})`;
                        break;
                    case 'invite':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_invite')} #${L.instanceName} (${platform})`;
                        break;
                    case 'friends':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_friend')} #${L.instanceName} (${platform})`;
                        break;
                    case 'friends+':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_friend_plus')} #${L.instanceName} (${platform})`;
                        break;
                    case 'group':
                        state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_group')} #${L.instanceName} (${platform})`;
                        try {
                            const groupName = await getGroupName(L.groupId);
                            if (groupName) {
                                state.lastLocationDetails.accessName = `${t('dialog.new_instance.access_type_group')}${state.lastLocationDetails.groupAccessType}(${groupName}) #${L.instanceName} (${platform})`;
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
                state.discordHideInvite &&
                (state.lastLocationDetails.accessType === 'invite' ||
                    state.lastLocationDetails.accessType === 'invite+' ||
                    state.lastLocationDetails.groupAccessType === 'members')
            ) {
                hidePrivate = true;
            }
            let statusName = '';
            let statusImage = '';
            switch (userStore.currentUser.status) {
                case 'active':
                    statusName = t('dialog.user.status.active');
                    statusImage = 'active';
                    break;
                case 'join me':
                    statusName = t('dialog.user.status.join_me');
                    statusImage = 'joinme';
                    break;
                case 'ask me':
                    statusName = t('dialog.user.status.ask_me');
                    statusImage = 'askme';
                    if (state.discordHideInvite) {
                        hidePrivate = true;
                    }
                    break;
                case 'busy':
                    statusName = t('dialog.user.status.busy');
                    statusImage = 'busy';
                    hidePrivate = true;
                    break;
                default:
                    statusName = t('dialog.user.status.offline');
                    statusImage = 'offline';
                    hidePrivate = true;
                    break;
            }
            let details = state.lastLocationDetails.worldName;
            let stateText = state.lastLocationDetails.accessName;
            let endTime = 0;
            let activityType = ActivityType.Playing;
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
            if (!state.discordInstance) {
                partySize = 0;
                partyMaxSize = 0;
                stateText = '';
            }
            let buttonText = t(
                'view.settings.discord_presence.rpc.join_button'
            );
            let buttonUrl = state.lastLocationDetails.joinUrl;
            if (!state.discordJoinButton) {
                buttonText = '';
                buttonUrl = '';
            }

            if (isRpcWorld(state.lastLocationDetails.tag)) {
                // custom world rpc
                if (
                    state.lastLocationDetails.worldId ===
                        'wrld_f20326da-f1ac-45fc-a062-609723b097b1' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_10e5e467-fc65-42ed-8957-f02cace1398c' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '784094509008551956';
                    bigIcon = 'pypy';
                } else if (
                    state.lastLocationDetails.worldId ===
                        'wrld_42377cf1-c54f-45ed-8996-5875b0573a83' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_dd6d2888-dbdc-47c2-bc98-3d631b2acd7c'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '846232616054030376';
                    bigIcon = 'vr_dancing';
                } else if (
                    state.lastLocationDetails.worldId ===
                        'wrld_52bdcdab-11cd-4325-9655-0fb120846945' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_2d40da63-8f1f-4011-8a9e-414eb8530acd'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '939473404808007731';
                    bigIcon = 'zuwa_zuwa_dance';
                } else if (
                    state.lastLocationDetails.worldId ===
                        'wrld_74970324-58e8-4239-a17b-2c59dfdf00db' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8'
                ) {
                    activityType = ActivityType.Watching;
                    appId = '968292722391785512';
                    bigIcon = 'ls_media';
                } else if (
                    state.lastLocationDetails.worldId ===
                        'wrld_266523e8-9161-40da-acd0-6bd82e075833' ||
                    state.lastLocationDetails.worldId ===
                        'wrld_27c7e6b2-d938-447e-a270-3d1a873e2cf3'
                ) {
                    activityType = ActivityType.Watching;
                    appId = '1095440531821170820';
                    if (
                        !state.discordHideImage &&
                        gameLogStore.nowPlaying.thumbnailUrl
                    ) {
                        bigIcon = gameLogStore.nowPlaying.thumbnailUrl;
                    } else {
                        bigIcon = 'popcorn_palace';
                    }
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
                !state.discordHideImage &&
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
                activityType // activity type
            );
        }

        async function setIsDiscordActive(active) {
            if (active !== state.isDiscordActive) {
                state.isDiscordActive = await Discord.SetActive(active);
            }
        }

        async function saveDiscordOption(configLabel = '') {
            state.lastLocationDetails.tag = '';
            updateLoopStore.nextDiscordUpdate = 3;
            updateDiscord();
        }

        return {
            state,

            discordActive,
            discordInstance,
            discordHideInvite,
            discordJoinButton,
            discordHideImage,

            setDiscordActive,
            setDiscordInstance,
            setDiscordHideInvite,
            setDiscordJoinButton,
            setDiscordHideImage,
            updateDiscord,
            saveDiscordOption
        };
    }
);
