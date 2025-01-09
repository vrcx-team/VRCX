import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        isDiscordActive: false,
        discordActive: false,
        discordInstance: true,
        discordJoinButton: false,
        discordHideInvite: true,
        discordHideImage: false
    };

    _methods = {
        updateDiscord() {
            var currentLocation = this.lastLocation.location;
            var timeStamp = this.lastLocation.date;
            if (this.lastLocation.location === 'traveling') {
                currentLocation = this.lastLocationDestination;
                timeStamp = this.lastLocationDestinationTime;
            }
            if (
                !this.discordActive ||
                (!this.isGameRunning && !this.gameLogDisabled) ||
                (!currentLocation && !this.lastLocation$.tag)
            ) {
                this.setDiscordActive(false);
                return;
            }
            this.setDiscordActive(true);
            var L = this.lastLocation$;
            if (currentLocation !== this.lastLocation$.tag) {
                Discord.SetTimestamps(timeStamp, 0);
                L = $app.parseLocation(currentLocation);
                L.worldName = '';
                L.thumbnailImageUrl = '';
                L.worldCapacity = 0;
                L.joinUrl = '';
                L.accessName = '';
                if (L.worldId) {
                    var ref = API.cachedWorlds.get(L.worldId);
                    if (ref) {
                        L.worldName = ref.name;
                        L.thumbnailImageUrl = ref.thumbnailImageUrl;
                        L.worldCapacity = ref.capacity;
                    } else {
                        API.getWorld({
                            worldId: L.worldId
                        }).then((args) => {
                            L.worldName = args.ref.name;
                            L.thumbnailImageUrl = args.ref.thumbnailImageUrl;
                            L.worldCapacity = args.ref.capacity;
                            return args;
                        });
                    }
                    if (this.isGameNoVR) {
                        var platform = 'Desktop';
                    } else {
                        var platform = 'VR';
                    }
                    var groupAccessType = '';
                    if (L.groupAccessType) {
                        if (L.groupAccessType === 'public') {
                            groupAccessType = 'Public';
                        } else if (L.groupAccessType === 'plus') {
                            groupAccessType = 'Plus';
                        }
                    }
                    switch (L.accessType) {
                        case 'public':
                            L.joinUrl = this.getLaunchURL(L);
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
                            this.getGroupName(L.groupId).then((groupName) => {
                                if (groupName) {
                                    L.accessName = `Group${groupAccessType}(${groupName}) #${L.instanceName} (${platform})`;
                                }
                            });
                            break;
                    }
                }
                this.lastLocation$ = L;
            }
            var hidePrivate = false;
            if (
                this.discordHideInvite &&
                (L.accessType === 'invite' ||
                    L.accessType === 'invite+' ||
                    L.groupAccessType === 'members')
            ) {
                hidePrivate = true;
            }
            switch (API.currentUser.status) {
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
                    if (this.discordHideInvite) {
                        hidePrivate = true;
                    }
                    break;
                case 'busy':
                    L.statusName = 'Do Not Disturb';
                    L.statusImage = 'busy';
                    hidePrivate = true;
                    break;
            }
            var appId = '883308884863901717';
            var bigIcon = 'vrchat';
            var partyId = `${L.worldId}:${L.instanceName}`;
            var partySize = this.lastLocation.playerList.size;
            var partyMaxSize = L.worldCapacity;
            if (partySize > partyMaxSize) {
                partyMaxSize = partySize;
            }
            var buttonText = 'Join';
            var buttonUrl = L.joinUrl;
            if (!this.discordJoinButton) {
                buttonText = '';
                buttonUrl = '';
            }
            if (!this.discordInstance) {
                partySize = 0;
                partyMaxSize = 0;
            }
            if (hidePrivate) {
                partyId = '';
                partySize = 0;
                partyMaxSize = 0;
                buttonText = '';
                buttonUrl = '';
            } else if (this.isRpcWorld(L.tag)) {
                // custom world rpc
                if (
                    L.worldId === 'wrld_f20326da-f1ac-45fc-a062-609723b097b1' ||
                    L.worldId === 'wrld_10e5e467-fc65-42ed-8957-f02cace1398c' ||
                    L.worldId === 'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534'
                ) {
                    appId = '784094509008551956';
                    bigIcon = 'pypy';
                } else if (
                    L.worldId === 'wrld_42377cf1-c54f-45ed-8996-5875b0573a83' ||
                    L.worldId === 'wrld_dd6d2888-dbdc-47c2-bc98-3d631b2acd7c'
                ) {
                    appId = '846232616054030376';
                    bigIcon = 'vr_dancing';
                } else if (
                    L.worldId === 'wrld_52bdcdab-11cd-4325-9655-0fb120846945' ||
                    L.worldId === 'wrld_2d40da63-8f1f-4011-8a9e-414eb8530acd'
                ) {
                    appId = '939473404808007731';
                    bigIcon = 'zuwa_zuwa_dance';
                } else if (
                    L.worldId === 'wrld_74970324-58e8-4239-a17b-2c59dfdf00db' ||
                    L.worldId === 'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445' ||
                    L.worldId === 'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e' ||
                    L.worldId === 'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8'
                ) {
                    appId = '968292722391785512';
                    bigIcon = 'ls_media';
                } else if (
                    L.worldId === 'wrld_266523e8-9161-40da-acd0-6bd82e075833'
                ) {
                    appId = '1095440531821170820';
                    bigIcon = 'movie_and_chill';
                }
                if (this.nowPlaying.name) {
                    L.worldName = this.nowPlaying.name;
                }
                if (this.nowPlaying.playing) {
                    Discord.SetTimestamps(
                        Date.now(),
                        (this.nowPlaying.startTime -
                            this.nowPlaying.offset +
                            this.nowPlaying.length) *
                            1000
                    );
                }
            } else if (!this.discordHideImage && L.thumbnailImageUrl) {
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
                appId // app id
            );
            // NOTE
            // 글자 수가 짧으면 업데이트가 안된다..
            if (L.worldName.length < 2) {
                L.worldName += '\uFFA0'.repeat(2 - L.worldName.length);
            }
            if (hidePrivate) {
                Discord.SetText('Private', '');
                Discord.SetTimestamps(0, 0);
            } else if (this.discordInstance) {
                Discord.SetText(L.worldName, L.accessName);
            } else {
                Discord.SetText(L.worldName, '');
            }
        },

        async setDiscordActive(active) {
            if (active !== this.isDiscordActive) {
                this.isDiscordActive = await Discord.SetActive(active);
            }
        },

        async saveDiscordOption(configLabel = '') {
            if (configLabel === 'discordActive') {
                this.discordActive = !this.discordActive;
                await configRepository.setBool(
                    'discordActive',
                    this.discordActive
                );
            }

            if (configLabel === 'discordInstance') {
                this.discordInstance = !this.discordInstance;
                await configRepository.setBool(
                    'discordInstance',
                    this.discordInstance
                );
            }

            if (configLabel === 'discordJoinButton') {
                this.discordJoinButton = !this.discordJoinButton;
                await configRepository.setBool(
                    'discordJoinButton',
                    this.discordJoinButton
                );
            }

            if (configLabel === 'discordHideInvite') {
                this.discordHideInvite = !this.discordHideInvite;
                await configRepository.setBool(
                    'discordHideInvite',
                    this.discordHideInvite
                );
            }
            if (configLabel === 'discordHideImage') {
                this.discordHideImage = !this.discordHideImage;
                await configRepository.setBool(
                    'discordHideImage',
                    this.discordHideImage
                );
            }

            this.lastLocation$.tag = '';
            this.nextDiscordUpdate = 3;
            this.updateDiscord();
        }
    };
}
