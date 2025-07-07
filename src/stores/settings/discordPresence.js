import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { userRequest, worldRequest } from '../../api';
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
import { useWorldStore } from '../world';
import { useAdvancedSettingsStore } from './advanced';
import { ActivityType } from '../../shared/constants/discord';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const locationStore = useLocationStore();
        const gameStore = useGameStore();
        const advancedSettingsStore = useAdvancedSettingsStore();
        const worldStore = useWorldStore();
        const gameLogStore = useGameLogStore();
        const userStore = useUserStore();
        const updateLoopStore = useUpdateLoopStore();

        const state = reactive({
            discordActive: false,
            discordInstance: true,
            discordHideInvite: true,
            discordJoinButton: false,
            discordHideImage: false,
            isDiscordActive: false
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

        function updateDiscord() {
            let platform;
            let currentLocation = locationStore.lastLocation.location;
            let timeStamp = locationStore.lastLocation.date;
            if (locationStore.lastLocation.location === 'traveling') {
                currentLocation = locationStore.lastLocationDestination;
                timeStamp = locationStore.lastLocationDestinationTime;
            }
            if (
                !state.discordActive ||
                (!gameStore.isGameRunning &&
                    !advancedSettingsStore.gameLogDisabled) ||
                (!currentLocation && !locationStore.lastLocation$.tag)
            ) {
                setIsDiscordActive(false);
                return;
            }
            setIsDiscordActive(true);
            let L = locationStore.lastLocation$;
            if (currentLocation !== locationStore.lastLocation$.tag) {
                Discord.SetTimestamps(timeStamp, 0);
                L = parseLocation(currentLocation);
                L.worldName = '';
                L.thumbnailImageUrl = '';
                L.worldCapacity = 0;
                L.joinUrl = '';
                L.accessName = '';
                if (L.worldId) {
                    const ref = worldStore.cachedWorlds.get(L.worldId);
                    if (ref) {
                        L.worldName = ref.name;
                        L.thumbnailImageUrl = ref.thumbnailImageUrl;
                        L.worldCapacity = ref.capacity;
                    } else {
                        worldRequest
                            .getWorld({
                                worldId: L.worldId
                            })
                            .then((args) => {
                                L.worldName = args.ref.name;
                                L.thumbnailImageUrl =
                                    args.ref.thumbnailImageUrl;
                                L.worldCapacity = args.ref.capacity;
                                return args;
                            });
                    }
                    if (gameStore.isGameNoVR) {
                        platform = 'Desktop';
                    } else {
                        platform = 'VR';
                    }
                    let groupAccessType = '';
                    if (L.groupAccessType) {
                        if (L.groupAccessType === 'public') {
                            groupAccessType = 'Public';
                        } else if (L.groupAccessType === 'plus') {
                            groupAccessType = 'Plus';
                        }
                    }
                    switch (L.accessType) {
                        case 'public':
                            L.joinUrl = getLaunchURL(L);
                            L.accessName = `Public #${L.instanceName} (${platform})`;
                            break;
                        case 'invite+':
                            L.accessName = `Invite+ #${L.instanceName} (${platform})`;
                            break;
                        case 'invite':
                            L.accessName = `Invite #${L.instanceName} (${platform})`;
                            break;
                        case 'friends':
                            L.accessName = `Friends #${L.instanceName} (${platform})`;
                            break;
                        case 'friends+':
                            L.accessName = `Friends+ #${L.instanceName} (${platform})`;
                            break;
                        case 'group':
                            L.accessName = `Group #${L.instanceName} (${platform})`;
                            getGroupName(L.groupId).then((groupName) => {
                                if (groupName) {
                                    L.accessName = `Group${groupAccessType}(${groupName}) #${L.instanceName} (${platform})`;
                                }
                            });
                            break;
                    }
                }
                locationStore.lastLocation$ = L;
            }
            let hidePrivate = false;
            if (
                state.discordHideInvite &&
                (L.accessType === 'invite' ||
                    L.accessType === 'invite+' ||
                    L.groupAccessType === 'members')
            ) {
                hidePrivate = true;
            }
            switch (userStore.currentUser.status) {
                case 'active':
                    L.statusName = 'Online';
                    L.statusImage = 'active';
                    break;
                case 'join me':
                    L.statusName = 'Join Me';
                    L.statusImage = 'joinme';
                    break;
                case 'ask me':
                    L.statusName = 'Ask Me';
                    L.statusImage = 'askme';
                    if (state.discordHideInvite) {
                        hidePrivate = true;
                    }
                    break;
                case 'busy':
                    L.statusName = 'Do Not Disturb';
                    L.statusImage = 'busy';
                    hidePrivate = true;
                    break;
            }
            let activityType = ActivityType.Playing;
            let appId = '883308884863901717';
            let bigIcon = 'vrchat';
            let partyId = `${L.worldId}:${L.instanceName}`;
            let partySize = locationStore.lastLocation.playerList.size;
            let partyMaxSize = L.worldCapacity;
            if (partySize > partyMaxSize) {
                partyMaxSize = partySize;
            }
            let buttonText = 'Join';
            let buttonUrl = L.joinUrl;
            if (!state.discordJoinButton) {
                buttonText = '';
                buttonUrl = '';
            }
            if (!state.discordInstance) {
                partySize = 0;
                partyMaxSize = 0;
            }
            if (hidePrivate) {
                partyId = '';
                partySize = 0;
                partyMaxSize = 0;
                buttonText = '';
                buttonUrl = '';
            } else if (isRpcWorld(L.tag)) {
                // custom world rpc
                if (
                    L.worldId === 'wrld_f20326da-f1ac-45fc-a062-609723b097b1' ||
                    L.worldId === 'wrld_10e5e467-fc65-42ed-8957-f02cace1398c' ||
                    L.worldId === 'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '784094509008551956';
                    bigIcon = 'pypy';
                } else if (
                    L.worldId === 'wrld_42377cf1-c54f-45ed-8996-5875b0573a83' ||
                    L.worldId === 'wrld_dd6d2888-dbdc-47c2-bc98-3d631b2acd7c'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '846232616054030376';
                    bigIcon = 'vr_dancing';
                } else if (
                    L.worldId === 'wrld_52bdcdab-11cd-4325-9655-0fb120846945' ||
                    L.worldId === 'wrld_2d40da63-8f1f-4011-8a9e-414eb8530acd'
                ) {
                    activityType = ActivityType.Listening;
                    appId = '939473404808007731';
                    bigIcon = 'zuwa_zuwa_dance';
                } else if (
                    L.worldId === 'wrld_74970324-58e8-4239-a17b-2c59dfdf00db' ||
                    L.worldId === 'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445' ||
                    L.worldId === 'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e' ||
                    L.worldId === 'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8'
                ) {
                    activityType = ActivityType.Watching;
                    appId = '968292722391785512';
                    bigIcon = 'ls_media';
                } else if (
                    L.worldId === 'wrld_266523e8-9161-40da-acd0-6bd82e075833' ||
                    L.worldId === 'wrld_27c7e6b2-d938-447e-a270-3d1a873e2cf3'
                ) {
                    activityType = ActivityType.Watching;
                    appId = '1095440531821170820';
                    bigIcon = 'popcorn_palace';
                }
                if (gameLogStore.nowPlaying.name) {
                    L.worldName = gameLogStore.nowPlaying.name;
                }
                if (gameLogStore.nowPlaying.playing) {
                    Discord.SetTimestamps(
                        gameLogStore.nowPlaying.startTime * 1000,
                        (gameLogStore.nowPlaying.startTime +
                            gameLogStore.nowPlaying.length) *
                            1000
                    );
                }
            } else if (!state.discordHideImage && L.thumbnailImageUrl) {
                bigIcon = L.thumbnailImageUrl;
            }
            Discord.SetAssets(
                bigIcon, // big icon
                'Powered by VRCX', // big icon hover text
                L.statusImage, // small icon
                L.statusName, // small icon hover text
                partyId, // party id
                partySize, // party size
                partyMaxSize, // party max size
                buttonText, // button text
                buttonUrl, // button url
                appId, // app id
                activityType // activity type
            );
            // NOTE
            // 글자 수가 짧으면 업데이트가 안된다..
            if (L.worldName.length < 2) {
                L.worldName += '\uFFA0'.repeat(2 - L.worldName.length);
            }
            if (hidePrivate) {
                Discord.SetText('Private', '');
                Discord.SetTimestamps(0, 0);
            } else if (state.discordInstance) {
                Discord.SetText(L.worldName, L.accessName);
            } else {
                Discord.SetText(L.worldName, '');
            }
        }

        async function setIsDiscordActive(active) {
            if (active !== state.isDiscordActive) {
                state.isDiscordActive = await Discord.SetActive(active);
            }
        }

        async function saveDiscordOption(configLabel = '') {
            locationStore.lastLocation$.tag = '';
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
