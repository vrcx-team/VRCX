import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import database from '../repository/database.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        photonLoggingEnabled: false,
        moderationEventQueue: new Map(),
        moderationAgainstTable: [],
        photonLobby: new Map(),
        photonLobbyMaster: 0,
        photonLobbyCurrentUser: 0,
        photonLobbyUserData: new Map(),
        photonLobbyCurrent: new Map(),
        photonLobbyAvatars: new Map(),
        photonLobbyLastModeration: new Map(),
        photonLobbyWatcherLoop: false,
        photonLobbyTimeout: [],
        photonLobbyJointime: new Map(),
        photonLobbyActivePortals: new Map(),
        photonEvent7List: new Map(),
        photonLastEvent7List: '',
        photonLastChatBoxMsg: new Map(),

        photonEventTable: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },

        photonEventTablePrevious: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },

        photonEventType: [
            'MeshVisibility',
            'AnimationFloat',
            'AnimationBool',
            'AnimationTrigger',
            'AudioTrigger',
            'PlayAnimation',
            'SendMessage',
            'SetParticlePlaying',
            'TeleportPlayer',
            'RunConsoleCommand',
            'SetGameObjectActive',
            'SetWebPanelURI',
            'SetWebPanelVolume',
            'SpawnObject',
            'SendRPC',
            'ActivateCustomTrigger',
            'DestroyObject',
            'SetLayer',
            'SetMaterial',
            'AddHealth',
            'AddDamage',
            'SetComponentActive',
            'AnimationInt',
            'AnimationIntAdd',
            'AnimationIntSubtract',
            'AnimationIntMultiply',
            'AnimationIntDivide',
            'AddVelocity',
            'SetVelocity',
            'AddAngularVelocity',
            'SetAngularVelocity',
            'AddForce',
            'SetUIText',
            'CallUdonMethod'
        ],

        photonEmojis: [
            'Angry',
            'Blushing',
            'Crying',
            'Frown',
            'Hand Wave',
            'Hang Ten',
            'In Love',
            'Jack O Lantern',
            'Kiss',
            'Laugh',
            'Skull',
            'Smile',
            'Spooky Ghost',
            'Stoic',
            'Sunglasses',
            'Thinking',
            'Thumbs Down',
            'Thumbs Up',
            'Tongue Out',
            'Wow',
            'Arrow Point',
            "Can't see",
            'Hourglass',
            'Keyboard',
            'No Headphones',
            'No Mic',
            'Portal',
            'Shush',
            'Bats',
            'Cloud',
            'Fire',
            'Snow Fall',
            'Snowball',
            'Splash',
            'Web',
            'Beer',
            'Candy',
            'Candy Cane',
            'Candy Corn',
            'Champagne',
            'Drink',
            'Gingerbread',
            'Ice Cream',
            'Pineapple',
            'Pizza',
            'Tomato',
            'Beachball',
            'Coal',
            'Confetti',
            'Gift',
            'Gifts',
            'Life Ring',
            'Mistletoe',
            'Money',
            'Neon Shades',
            'Sun Lotion',
            'Boo',
            'Broken Heart',
            'Exclamation',
            'Go',
            'Heart',
            'Music Note',
            'Question',
            'Stop',
            'Zzz'
        ],

        photonEventTableFilter: '',
        photonEventTableTypeFilter: [],
        photonEventTableTypeOverlayFilter: [],
        photonEventTableTypeFilterList: [
            'Event',
            'OnPlayerJoined',
            'OnPlayerLeft',
            'ChangeAvatar',
            'ChangeStatus',
            'ChangeGroup',
            'PortalSpawn',
            'DeletedPortal',
            'ChatBoxMessage',
            'Moderation',
            'Camera',
            'SpawnEmoji',
            'MasterMigrate'
        ]
    };

    _methods = {
        startLobbyWatcherLoop() {
            if (!this.photonLobbyWatcherLoop) {
                this.photonLobbyWatcherLoop = true;
                this.photonLobbyWatcher();
            }
        },

        photonLobbyWatcherLoopStop() {
            this.photonLobbyWatcherLoop = false;
            this.photonLobbyTimeout = [];
            AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
        },

        photonLobbyWatcher() {
            if (!this.photonLobbyWatcherLoop) {
                return;
            }
            if (this.photonLobbyCurrent.size === 0) {
                this.photonLobbyWatcherLoopStop();
                return;
            }
            var dtNow = Date.now();
            var bias2 = this.photonLastEvent7List + 1.5 * 1000;
            if (dtNow > bias2 || this.lastLocation.playerList.size <= 1) {
                if (this.photonLobbyTimeout.length > 0) {
                    AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
                }
                this.photonLobbyTimeout = [];
                workerTimers.setTimeout(() => this.photonLobbyWatcher(), 500);
                return;
            }
            var hudTimeout = [];
            this.photonEvent7List.forEach((dt, id) => {
                var timeSinceLastEvent = dtNow - Date.parse(dt);
                if (
                    timeSinceLastEvent > this.photonLobbyTimeoutThreshold &&
                    id !== this.photonLobbyCurrentUser
                ) {
                    if (this.photonLobbyJointime.has(id)) {
                        var { joinTime } = this.photonLobbyJointime.get(id);
                    }
                    if (!joinTime) {
                        console.log(`${id} missing join time`);
                    }
                    if (joinTime && joinTime + 70000 < dtNow) {
                        // wait 70secs for user to load in
                        hudTimeout.unshift({
                            userId: this.getUserIdFromPhotonId(id),
                            displayName: this.getDisplayNameFromPhotonId(id),
                            time: Math.round(timeSinceLastEvent / 1000),
                            rawTime: timeSinceLastEvent
                        });
                    }
                }
            });
            if (this.photonLobbyTimeout.length > 0 || hudTimeout.length > 0) {
                hudTimeout.sort(function (a, b) {
                    if (a.rawTime > b.rawTime) {
                        return 1;
                    }
                    if (a.rawTime < b.rawTime) {
                        return -1;
                    }
                    return 0;
                });
                if (this.timeoutHudOverlay) {
                    if (
                        this.timeoutHudOverlayFilter === 'VIP' ||
                        this.timeoutHudOverlayFilter === 'Friends'
                    ) {
                        var filteredHudTimeout = [];
                        hudTimeout.forEach((item) => {
                            if (
                                this.timeoutHudOverlayFilter === 'VIP' &&
                                API.cachedFavoritesByObjectId.has(item.userId)
                            ) {
                                filteredHudTimeout.push(item);
                            } else if (
                                this.timeoutHudOverlayFilter === 'Friends' &&
                                this.friends.has(item.userId)
                            ) {
                                filteredHudTimeout.push(item);
                            }
                        });
                    } else {
                        var filteredHudTimeout = hudTimeout;
                    }
                    AppApi.ExecuteVrOverlayFunction(
                        'updateHudTimeout',
                        JSON.stringify(filteredHudTimeout)
                    );
                }
                this.photonLobbyTimeout = hudTimeout;
                this.getCurrentInstanceUserList();
            }
            workerTimers.setTimeout(() => this.photonLobbyWatcher(), 500);
        },

        addEntryPhotonEvent(input) {
            var isMaster = false;
            if (input.photonId === this.photonLobbyMaster) {
                isMaster = true;
            }
            var joinTimeRef = this.photonLobbyJointime.get(input.photonId);
            var isModerator = joinTimeRef?.canModerateInstance;
            var photonUserRef = this.photonLobby.get(input.photonId);
            var displayName = '';
            var userId = '';
            var isFriend = false;
            if (typeof photonUserRef !== 'undefined') {
                displayName = photonUserRef.displayName;
                userId = photonUserRef.id;
                isFriend = photonUserRef.isFriend;
            }
            var isFavorite = this.localFavoriteFriends.has(userId);
            var colour = '';
            var tagRef = this.customUserTags.get(userId);
            if (typeof tagRef !== 'undefined') {
                colour = tagRef.colour;
            }
            var feed = {
                displayName,
                userId,
                isFavorite,
                isFriend,
                isMaster,
                isModerator,
                colour,
                ...input
            };
            this.photonEventTable.data.unshift(feed);
            if (
                this.photonEventTableTypeOverlayFilter.length > 0 &&
                !this.photonEventTableTypeOverlayFilter.includes(feed.type)
            ) {
                return;
            }
            if (this.photonEventOverlay) {
                if (
                    this.photonEventOverlayFilter === 'VIP' ||
                    this.photonEventOverlayFilter === 'Friends'
                ) {
                    if (
                        feed.userId &&
                        ((this.photonEventOverlayFilter === 'VIP' &&
                            isFavorite) ||
                            (this.photonEventOverlayFilter === 'Friends' &&
                                isFriend))
                    ) {
                        AppApi.ExecuteVrOverlayFunction(
                            'addEntryHudFeed',
                            JSON.stringify(feed)
                        );
                    }
                } else {
                    AppApi.ExecuteVrOverlayFunction(
                        'addEntryHudFeed',
                        JSON.stringify(feed)
                    );
                }
            }
        },

        getDisplayNameFromPhotonId(photonId) {
            var displayName = '';
            if (photonId) {
                var ref = this.photonLobby.get(photonId);
                displayName = `ID:${photonId}`;
                if (
                    typeof ref !== 'undefined' &&
                    typeof ref.displayName !== 'undefined'
                ) {
                    displayName = ref.displayName;
                }
            }
            return displayName;
        },

        getUserIdFromPhotonId(photonId) {
            var userId = '';
            if (photonId) {
                var ref = this.photonLobby.get(photonId);
                if (
                    typeof ref !== 'undefined' &&
                    typeof ref.id !== 'undefined'
                ) {
                    userId = ref.id;
                }
            }
            return userId;
        },

        showUserFromPhotonId(photonId) {
            if (photonId) {
                var ref = this.photonLobby.get(photonId);
                if (typeof ref !== 'undefined') {
                    if (typeof ref.id !== 'undefined') {
                        this.showUserDialog(ref.id);
                    } else if (typeof ref.displayName !== 'undefined') {
                        this.lookupUser(ref);
                    }
                } else {
                    this.$message({
                        message: 'No user info available',
                        type: 'error'
                    });
                }
            }
        },

        getPhotonIdFromDisplayName(displayName) {
            var photonId = '';
            if (displayName) {
                this.photonLobby.forEach((ref, id) => {
                    if (
                        typeof ref !== 'undefined' &&
                        ref.displayName === displayName
                    ) {
                        photonId = id;
                    }
                });
            }
            return photonId;
        },

        getPhotonIdFromUserId(userId) {
            var photonId = '';
            if (userId) {
                this.photonLobby.forEach((ref, id) => {
                    if (typeof ref !== 'undefined' && ref.id === userId) {
                        photonId = id;
                    }
                });
            }
            return photonId;
        },

        sortPhotonId(a, b, field) {
            var id1 = this.getPhotonIdFromDisplayName(a[field]);
            var id2 = this.getPhotonIdFromDisplayName(b[field]);
            if (id1 < id2) {
                return 1;
            }
            if (id1 > id2) {
                return -1;
            }
            return 0;
        },

        parsePhotonEvent(data, gameLogDate) {
            switch (data.Code) {
                case 253:
                    // SetUserProperties
                    if (data.Parameters[253] === -1) {
                        for (var i in data.Parameters[251]) {
                            var id = parseInt(i, 10);
                            var user = data.Parameters[251][i];
                            this.parsePhotonUser(id, user.user, gameLogDate);
                            this.parsePhotonAvatarChange(
                                id,
                                user.user,
                                user.avatarDict,
                                gameLogDate
                            );
                            this.parsePhotonGroupChange(
                                id,
                                user.user,
                                user.groupOnNameplate,
                                gameLogDate
                            );
                            this.parsePhotonAvatar(user.avatarDict);
                            this.parsePhotonAvatar(user.favatarDict);
                            var hasInstantiated = false;
                            var lobbyJointime =
                                this.photonLobbyJointime.get(id);
                            if (typeof lobbyJointime !== 'undefined') {
                                hasInstantiated = lobbyJointime.hasInstantiated;
                            }
                            this.photonLobbyJointime.set(id, {
                                joinTime: Date.parse(gameLogDate),
                                hasInstantiated,
                                inVRMode: user.inVRMode,
                                avatarEyeHeight: user.avatarEyeHeight,
                                canModerateInstance: user.canModerateInstance,
                                groupOnNameplate: user.groupOnNameplate,
                                showGroupBadgeToOthers:
                                    user.showGroupBadgeToOthers,
                                showSocialRank: user.showSocialRank,
                                useImpostorAsFallback:
                                    user.useImpostorAsFallback,
                                platform: user.platform
                            });
                            this.photonUserJoin(id, user, gameLogDate);
                        }
                    } else {
                        console.log('oldSetUserProps', data);
                        var id = parseInt(data.Parameters[253], 10);
                        var user = data.Parameters[251];
                        this.parsePhotonUser(id, user.user, gameLogDate);
                        this.parsePhotonAvatarChange(
                            id,
                            user.user,
                            user.avatarDict,
                            gameLogDate
                        );
                        this.parsePhotonGroupChange(
                            id,
                            user.user,
                            user.groupOnNameplate,
                            gameLogDate
                        );
                        this.parsePhotonAvatar(user.avatarDict);
                        this.parsePhotonAvatar(user.favatarDict);
                        var hasInstantiated = false;
                        var lobbyJointime = this.photonLobbyJointime.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        this.photonLobbyJointime.set(id, {
                            joinTime: Date.parse(gameLogDate),
                            hasInstantiated,
                            inVRMode: user.inVRMode,
                            avatarEyeHeight: user.avatarEyeHeight,
                            canModerateInstance: user.canModerateInstance,
                            groupOnNameplate: user.groupOnNameplate,
                            showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                            showSocialRank: user.showSocialRank,
                            useImpostorAsFallback: user.useImpostorAsFallback,
                            platform: user.platform
                        });
                        this.photonUserJoin(id, user, gameLogDate);
                    }
                    break;
                case 42:
                    // SetUserProperties
                    var id = parseInt(data.Parameters[254], 10);
                    var user = data.Parameters[245];
                    this.parsePhotonUser(id, user.user, gameLogDate);
                    this.parsePhotonAvatarChange(
                        id,
                        user.user,
                        user.avatarDict,
                        gameLogDate
                    );
                    this.parsePhotonGroupChange(
                        id,
                        user.user,
                        user.groupOnNameplate,
                        gameLogDate
                    );
                    this.parsePhotonAvatar(user.avatarDict);
                    this.parsePhotonAvatar(user.favatarDict);
                    var lobbyJointime = this.photonLobbyJointime.get(id);
                    this.photonLobbyJointime.set(id, {
                        hasInstantiated: true,
                        ...lobbyJointime,
                        inVRMode: user.inVRMode,
                        avatarEyeHeight: user.avatarEyeHeight,
                        canModerateInstance: user.canModerateInstance,
                        groupOnNameplate: user.groupOnNameplate,
                        showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                        showSocialRank: user.showSocialRank,
                        useImpostorAsFallback: user.useImpostorAsFallback,
                        platform: user.platform
                    });
                    break;
                case 255:
                    // Join
                    if (typeof data.Parameters[249] !== 'undefined') {
                        this.parsePhotonUser(
                            data.Parameters[254],
                            data.Parameters[249].user,
                            gameLogDate
                        );
                        this.parsePhotonAvatarChange(
                            data.Parameters[254],
                            data.Parameters[249].user,
                            data.Parameters[249].avatarDict,
                            gameLogDate
                        );
                        this.parsePhotonGroupChange(
                            data.Parameters[254],
                            data.Parameters[249].user,
                            data.Parameters[249].groupOnNameplate,
                            gameLogDate
                        );
                        this.parsePhotonAvatar(data.Parameters[249].avatarDict);
                        this.parsePhotonAvatar(
                            data.Parameters[249].favatarDict
                        );
                    }
                    this.parsePhotonLobbyIds(data.Parameters[252]);
                    var hasInstantiated = false;
                    if (this.photonLobbyCurrentUser === data.Parameters[254]) {
                        // fix current user
                        hasInstantiated = true;
                    }
                    var ref = this.photonLobbyCurrent.get(data.Parameters[254]);
                    if (typeof ref !== 'undefined') {
                        // fix for join event firing twice
                        // fix instantiation happening out of order before join event
                        hasInstantiated = ref.hasInstantiated;
                    }
                    this.photonLobbyJointime.set(data.Parameters[254], {
                        joinTime: Date.parse(gameLogDate),
                        hasInstantiated,
                        inVRMode: data.Parameters[249].inVRMode,
                        avatarEyeHeight: data.Parameters[249].avatarEyeHeight,
                        canModerateInstance:
                            data.Parameters[249].canModerateInstance,
                        groupOnNameplate: data.Parameters[249].groupOnNameplate,
                        showGroupBadgeToOthers:
                            data.Parameters[249].showGroupBadgeToOthers,
                        showSocialRank: data.Parameters[249].showSocialRank,
                        useImpostorAsFallback:
                            data.Parameters[249].useImpostorAsFallback,
                        platform: data.Parameters[249].platform
                    });
                    this.photonUserJoin(
                        data.Parameters[254],
                        data.Parameters[249],
                        gameLogDate
                    );
                    this.startLobbyWatcherLoop();
                    break;
                case 254:
                    // Leave
                    var photonId = data.Parameters[254];
                    this.photonUserLeave(photonId, gameLogDate);
                    this.photonLobbyCurrent.delete(photonId);
                    this.photonLobbyLastModeration.delete(photonId);
                    this.photonLobbyJointime.delete(photonId);
                    this.photonEvent7List.delete(photonId);
                    this.parsePhotonLobbyIds(data.Parameters[252]);
                    if (typeof data.Parameters[203] !== 'undefined') {
                        this.setPhotonLobbyMaster(
                            data.Parameters[203],
                            gameLogDate
                        );
                    }
                    break;
                case 4:
                    // Sync
                    this.setPhotonLobbyMaster(
                        data.Parameters[254],
                        gameLogDate
                    );
                    break;
                case 33:
                    // Moderation
                    if (data.Parameters[245]['0'] === 21) {
                        if (data.Parameters[245]['1']) {
                            var photonId = data.Parameters[245]['1'];
                            var block = data.Parameters[245]['10'];
                            var mute = data.Parameters[245]['11'];
                            var ref = this.photonLobby.get(photonId);
                            if (
                                typeof ref !== 'undefined' &&
                                typeof ref.id !== 'undefined'
                            ) {
                                this.photonModerationUpdate(
                                    ref,
                                    photonId,
                                    block,
                                    mute,
                                    gameLogDate
                                );
                            } else {
                                this.moderationEventQueue.set(photonId, {
                                    block,
                                    mute,
                                    gameLogDate
                                });
                            }
                        } else {
                            var blockArray = data.Parameters[245]['10'];
                            var muteArray = data.Parameters[245]['11'];
                            var idList = new Map();
                            blockArray.forEach((photonId1) => {
                                if (muteArray.includes(photonId1)) {
                                    idList.set(photonId1, {
                                        isMute: true,
                                        isBlock: true
                                    });
                                } else {
                                    idList.set(photonId1, {
                                        isMute: false,
                                        isBlock: true
                                    });
                                }
                            });
                            muteArray.forEach((photonId2) => {
                                if (!idList.has(photonId2)) {
                                    idList.set(photonId2, {
                                        isMute: true,
                                        isBlock: false
                                    });
                                }
                            });
                            idList.forEach(({ isMute, isBlock }, photonId3) => {
                                var ref1 = this.photonLobby.get(photonId3);
                                if (
                                    typeof ref1 !== 'undefined' &&
                                    typeof ref1.id !== 'undefined'
                                ) {
                                    this.photonModerationUpdate(
                                        ref1,
                                        photonId3,
                                        isBlock,
                                        isMute,
                                        gameLogDate
                                    );
                                } else {
                                    this.moderationEventQueue.set(photonId3, {
                                        block: isBlock,
                                        mute: isMute,
                                        gameLogDate
                                    });
                                }
                            });
                        }
                    } else if (
                        data.Parameters[245]['0'] === 13 ||
                        data.Parameters[245]['0'] === 25
                    ) {
                        var msg = data.Parameters[245]['2'];
                        if (
                            typeof msg === 'string' &&
                            typeof data.Parameters[245]['14'] === 'object'
                        ) {
                            for (var prop in data.Parameters[245]['14']) {
                                var value = data.Parameters[245]['14'][prop];
                                msg = msg.replace(`{{${prop}}}`, value);
                            }
                        }
                        this.addEntryPhotonEvent({
                            photonId,
                            text: msg,
                            type: 'Moderation',
                            color: 'yellow',
                            created_at: gameLogDate
                        });
                    }
                    break;
                case 202:
                    // Instantiate
                    if (!this.photonLobby.has(data.Parameters[254])) {
                        this.photonLobby.set(data.Parameters[254]);
                    }
                    if (!this.photonLobbyCurrent.has(data.Parameters[254])) {
                        this.photonLobbyCurrent.set(data.Parameters[254]);
                    }
                    var lobbyJointime = this.photonLobbyJointime.get(
                        data.Parameters[254]
                    );
                    if (typeof lobbyJointime !== 'undefined') {
                        this.photonLobbyJointime.set(data.Parameters[254], {
                            ...lobbyJointime,
                            hasInstantiated: true
                        });
                    } else {
                        this.photonLobbyJointime.set(data.Parameters[254], {
                            joinTime: Date.parse(gameLogDate),
                            hasInstantiated: true
                        });
                    }
                    break;
                case 43:
                    // Chatbox Message
                    var photonId = data.Parameters[254];
                    var text = data.Parameters[245];
                    if (this.photonLobbyCurrentUser === photonId) {
                        return;
                    }
                    var lastMsg = this.photonLastChatBoxMsg.get(photonId);
                    if (lastMsg === text) {
                        return;
                    }
                    this.photonLastChatBoxMsg.set(photonId, text);
                    var userId = this.getUserIdFromPhotonId(photonId);
                    if (
                        this.chatboxUserBlacklist.has(userId) ||
                        this.checkChatboxBlacklist(text)
                    ) {
                        return;
                    }
                    this.addEntryPhotonEvent({
                        photonId,
                        text,
                        type: 'ChatBoxMessage',
                        created_at: gameLogDate
                    });
                    var entry = {
                        userId,
                        displayName: this.getDisplayNameFromPhotonId(photonId),
                        created_at: gameLogDate,
                        type: 'ChatBoxMessage',
                        text
                    };
                    this.queueGameLogNoty(entry);
                    this.addGameLog(entry);
                    break;
                case 70:
                    // Portal Spawn
                    if (data.Parameters[245][0] === 20) {
                        var portalId = data.Parameters[245][1];
                        var userId = data.Parameters[245][2];
                        var shortName = data.Parameters[245][5];
                        var worldName = data.Parameters[245][8].name;
                        this.addPhotonPortalSpawn(
                            gameLogDate,
                            userId,
                            shortName,
                            worldName
                        );
                        this.photonLobbyActivePortals.set(portalId, {
                            userId,
                            shortName,
                            worldName,
                            created_at: Date.parse(gameLogDate),
                            playerCount: 0,
                            pendingLeave: 0
                        });
                    } else if (data.Parameters[245][0] === 21) {
                        var portalId = data.Parameters[245][1];
                        var userId = data.Parameters[245][2];
                        var playerCount = data.Parameters[245][3];
                        var shortName = data.Parameters[245][5];
                        var worldName = '';
                        this.addPhotonPortalSpawn(
                            gameLogDate,
                            userId,
                            shortName,
                            worldName
                        );
                        this.photonLobbyActivePortals.set(portalId, {
                            userId,
                            shortName,
                            worldName,
                            created_at: Date.parse(gameLogDate),
                            playerCount: 0,
                            pendingLeave: 0
                        });
                    } else if (data.Parameters[245][0] === 22) {
                        var portalId = data.Parameters[245][1];
                        var text = 'DeletedPortal';
                        var ref = this.photonLobbyActivePortals.get(portalId);
                        if (typeof ref !== 'undefined') {
                            var worldName = ref.worldName;
                            var playerCount = ref.playerCount;
                            var time = $app.timeToText(
                                Date.parse(gameLogDate) - ref.created_at
                            );
                            text = `DeletedPortal after ${time} with ${playerCount} players to "${worldName}"`;
                        }
                        this.addEntryPhotonEvent({
                            text,
                            type: 'DeletedPortal',
                            created_at: gameLogDate
                        });
                        this.photonLobbyActivePortals.delete(portalId);
                    } else if (data.Parameters[245][0] === 23) {
                        var portalId = data.Parameters[245][1];
                        var playerCount = data.Parameters[245][3];
                        var ref = this.photonLobbyActivePortals.get(portalId);
                        if (typeof ref !== 'undefined') {
                            ref.pendingLeave++;
                            ref.playerCount = playerCount;
                        }
                    } else if (data.Parameters[245][0] === 24) {
                        this.addEntryPhotonEvent({
                            text: 'PortalError failed to create portal',
                            type: 'DeletedPortal',
                            created_at: gameLogDate
                        });
                    }
                    break;
                case 71:
                    // Spawn Emoji
                    var photonId = data.Parameters[254];
                    if (photonId === this.photonLobbyCurrentUser) {
                        return;
                    }
                    var type = data.Parameters[245][0];
                    var emojiName = '';
                    var imageUrl = '';
                    if (type === 0) {
                        var emojiId = data.Parameters[245][2];
                        emojiName = this.photonEmojis[emojiId];
                    } else if (type === 1) {
                        emojiName = 'Custom';
                        var fileId = data.Parameters[245][1];
                        imageUrl = `https://api.vrchat.cloud/api/1/file/${fileId}/1/`;
                    }
                    this.addEntryPhotonEvent({
                        photonId,
                        text: emojiName,
                        type: 'SpawnEmoji',
                        created_at: gameLogDate,
                        imageUrl,
                        fileId
                    });
                    break;
            }
        },

        parseVRCEvent(json) {
            // VRC Event
            var datetime = json.dt;
            var eventData = json.VRCEventData;
            var senderId = eventData.Sender;
            if (this.debugPhotonLogging) {
                console.log('VrcEvent:', json);
            }
            if (eventData.EventName === '_SendOnSpawn') {
                return;
            } else if (eventData.EventType > 34) {
                var entry = {
                    created_at: datetime,
                    type: 'Event',
                    data: `${this.getDisplayNameFromPhotonId(
                        senderId
                    )} called non existent RPC ${eventData.EventType}`
                };
                this.addPhotonEventToGameLog(entry);
                return;
            }
            if (eventData.EventType === 14) {
                var type = 'Event';
                if (eventData.EventName === 'ChangeVisibility') {
                    if (eventData.Data[0] === true) {
                        var text = 'EnableCamera';
                    } else if (eventData.Data[0] === false) {
                        var text = 'DisableCamera';
                    }
                    type = 'Camera';
                } else if (eventData.EventName === 'PhotoCapture') {
                    var text = 'PhotoCapture';
                    type = 'Camera';
                } else if (eventData.EventName === 'TimerBloop') {
                    var text = 'TimerBloop';
                    type = 'Camera';
                } else if (eventData.EventName === 'ReloadAvatarNetworkedRPC') {
                    var text = 'AvatarReset';
                } else if (eventData.EventName === 'ReleaseBones') {
                    var text = 'ResetPhysBones';
                } else if (eventData.EventName === 'SpawnEmojiRPC') {
                    var text = this.oldPhotonEmojis[eventData.Data];
                    type = 'SpawnEmoji';
                } else {
                    var eventVrc = '';
                    if (eventData.Data && eventData.Data.length > 0) {
                        eventVrc = ` ${JSON.stringify(eventData.Data).replace(
                            /"([^(")"]+)":/g,
                            '$1:'
                        )}`;
                    }
                    var text = `${eventData.EventName}${eventVrc}`;
                }
                this.addEntryPhotonEvent({
                    photonId: senderId,
                    text,
                    type,
                    created_at: datetime
                });
            } else {
                var eventName = '';
                if (eventData.EventName) {
                    eventName = ` ${JSON.stringify(eventData.EventName).replace(
                        /"([^(")"]+)":/g,
                        '$1:'
                    )}`;
                }
                if (this.debugPhotonLogging) {
                    var displayName = this.getDisplayNameFromPhotonId(senderId);
                    var feed = `RPC ${displayName} ${
                        this.photonEventType[eventData.EventType]
                    }${eventName}`;
                    console.log('VrcRpc:', feed);
                }
            }
        },

        async parsePhotonPortalSpawn(
            created_at,
            instanceId,
            ref,
            portalType,
            shortName,
            photonId
        ) {
            var worldName = shortName;
            if (instanceId) {
                worldName = await this.getWorldName(instanceId);
            }
            this.addEntryPhotonEvent({
                photonId,
                text: `${portalType} PortalSpawn to ${worldName}`,
                type: 'PortalSpawn',
                shortName,
                location: instanceId,
                worldName,
                created_at
            });
            this.addPhotonEventToGameLog({
                created_at,
                type: 'PortalSpawn',
                displayName: ref.displayName,
                location: this.lastLocation.location,
                userId: ref.id,
                instanceId,
                worldName
            });
        },

        async addPhotonPortalSpawn(gameLogDate, userId, shortName, worldName) {
            var instance = await API.getInstanceFromShortName({ shortName });
            var location = instance.json.location;
            var L = $utils.parseLocation(location);
            var groupName = '';
            if (L.groupId) {
                groupName = await this.getGroupName(L.groupId);
            }
            if (!worldName) {
                // eslint-disable-next-line no-param-reassign
                worldName = await this.getWorldName(location);
            }
            // var newShortName = instance.json.shortName;
            // var portalType = 'Secure';
            // if (shortName === newShortName) {
            //     portalType = 'Unlocked';
            // }
            var displayLocation = this.displayLocation(
                location,
                worldName,
                groupName
            );
            this.addEntryPhotonEvent({
                photonId: this.getPhotonIdFromUserId(userId),
                text: `PortalSpawn to ${displayLocation}`,
                type: 'PortalSpawn',
                shortName,
                location,
                worldName,
                groupName,
                created_at: gameLogDate
            });
            this.addPhotonEventToGameLog({
                created_at: gameLogDate,
                type: 'PortalSpawn',
                displayName: this.getDisplayName(userId),
                location: this.lastLocation.location,
                userId,
                instanceId: location,
                worldName,
                groupName
            });
        },

        addPhotonEventToGameLog(entry) {
            this.queueGameLogNoty(entry);
            this.addGameLog(entry);
            if (entry.type === 'PortalSpawn') {
                database.addGamelogPortalSpawnToDatabase(entry);
            } else if (entry.type === 'Event') {
                database.addGamelogEventToDatabase(entry);
            }
        },

        parsePhotonLobbyIds(lobbyIds) {
            lobbyIds.forEach((id) => {
                if (!this.photonLobby.has(id)) {
                    this.photonLobby.set(id);
                }
                if (!this.photonLobbyCurrent.has(id)) {
                    this.photonLobbyCurrent.set(id);
                }
            });
            for (var id of this.photonLobbyCurrent.keys()) {
                if (!lobbyIds.includes(id)) {
                    this.photonLobbyCurrent.delete(id);
                    this.photonEvent7List.delete(id);
                }
            }
        },

        setPhotonLobbyMaster(photonId, gameLogDate) {
            if (this.photonLobbyMaster !== photonId) {
                if (this.photonLobbyMaster !== 0) {
                    this.addEntryPhotonEvent({
                        photonId,
                        text: `Photon Master Migrate`,
                        type: 'MasterMigrate',
                        created_at: gameLogDate
                    });
                }
                this.photonLobbyMaster = photonId;
            }
        },

        async parsePhotonUser(photonId, user, gameLogDate) {
            if (typeof user === 'undefined') {
                console.error('PhotonUser: user is undefined', photonId);
                return;
            }
            var tags = [];
            if (typeof user.tags !== 'undefined') {
                tags = user.tags;
            }
            var ref = API.cachedUsers.get(user.id);
            var photonUser = {
                id: user.id,
                displayName: user.displayName,
                developerType: user.developerType,
                profilePicOverride: user.profilePicOverride,
                currentAvatarImageUrl: user.currentAvatarImageUrl,
                currentAvatarThumbnailImageUrl:
                    user.currentAvatarThumbnailImageUrl,
                userIcon: user.userIcon,
                last_platform: user.last_platform,
                allowAvatarCopying: user.allowAvatarCopying,
                status: user.status,
                statusDescription: user.statusDescription,
                bio: user.bio,
                tags
            };
            this.photonLobby.set(photonId, photonUser);
            this.photonLobbyCurrent.set(photonId, photonUser);
            this.photonLobbyUserDataUpdate(photonId, photonUser, gameLogDate);

            var bias = Date.parse(gameLogDate) + 60 * 1000; // 1min
            if (bias > Date.now()) {
                if (
                    typeof ref === 'undefined' ||
                    typeof ref.id === 'undefined'
                ) {
                    try {
                        var args = await API.getUser({
                            userId: user.id
                        });
                        ref = args.ref;
                    } catch (err) {
                        console.error(err);
                        ref = photonUser;
                    }
                } else if (
                    !ref.isFriend &&
                    this.lastLocation.playerList.has(user.id)
                ) {
                    var { joinTime } = this.lastLocation.playerList.get(
                        user.id
                    );
                    if (!joinTime) {
                        joinTime = Date.parse(gameLogDate);
                    }
                    ref.$location_at = joinTime;
                    ref.$online_for = joinTime;
                }
                if (
                    typeof ref.id !== 'undefined' &&
                    ref.currentAvatarImageUrl !== user.currentAvatarImageUrl
                ) {
                    API.applyUser({
                        ...ref,
                        currentAvatarImageUrl: user.currentAvatarImageUrl,
                        currentAvatarThumbnailImageUrl:
                            user.currentAvatarThumbnailImageUrl
                    });
                }
            }
            if (typeof ref !== 'undefined' && typeof ref.id !== 'undefined') {
                this.photonLobby.set(photonId, ref);
                this.photonLobbyCurrent.set(photonId, ref);
                // check moderation queue
                if (this.moderationEventQueue.has(photonId)) {
                    var { block, mute, gameLogDate } =
                        this.moderationEventQueue.get(photonId);
                    this.moderationEventQueue.delete(photonId);
                    this.photonModerationUpdate(
                        ref,
                        photonId,
                        block,
                        mute,
                        gameLogDate
                    );
                }
            }
        },

        photonLobbyUserDataUpdate(photonId, photonUser, gameLogDate) {
            var ref = this.photonLobbyUserData.get(photonId);
            if (
                typeof ref !== 'undefined' &&
                photonId !== this.photonLobbyCurrentUser &&
                (photonUser.status !== ref.status ||
                    photonUser.statusDescription !== ref.statusDescription)
            ) {
                this.addEntryPhotonEvent({
                    photonId,
                    type: 'ChangeStatus',
                    status: photonUser.status,
                    previousStatus: ref.status,
                    statusDescription: this.replaceBioSymbols(
                        photonUser.statusDescription
                    ),
                    previousStatusDescription: this.replaceBioSymbols(
                        ref.statusDescription
                    ),
                    created_at: Date.parse(gameLogDate)
                });
            }
            this.photonLobbyUserData.set(photonId, photonUser);
        },

        photonUserJoin(photonId, user, gameLogDate) {
            if (photonId === this.photonLobbyCurrentUser) {
                return;
            }
            var avatar = user.avatarDict;
            avatar.name = this.replaceBioSymbols(avatar.name);
            avatar.description = this.replaceBioSymbols(avatar.description);
            var platform = '';
            if (user.last_platform === 'android') {
                platform = 'Android';
            } else if (user.last_platform === 'ios') {
                platform = 'iOS';
            } else if (user.inVRMode) {
                platform = 'VR';
            } else {
                platform = 'Desktop';
            }
            this.photonUserSusieCheck(photonId, user, gameLogDate);
            this.checkVRChatCache(avatar).then((cacheInfo) => {
                var inCache = false;
                if (cacheInfo.Item1 > 0) {
                    inCache = true;
                }
                this.addEntryPhotonEvent({
                    photonId,
                    text: 'has joined',
                    type: 'OnPlayerJoined',
                    created_at: gameLogDate,
                    avatar,
                    inCache,
                    platform
                });
            });
        },

        photonUserSusieCheck(photonId, user, gameLogDate) {
            var text = '';
            if (typeof user.modTag !== 'undefined') {
                text = `Moderator has joined ${user.modTag}`;
            } else if (user.isInvisible) {
                text = 'User joined invisible';
            }
            if (text) {
                this.addEntryPhotonEvent({
                    photonId,
                    text,
                    type: 'Event',
                    color: 'yellow',
                    created_at: gameLogDate
                });
                var entry = {
                    created_at: new Date().toJSON(),
                    type: 'Event',
                    data: `${text} - ${this.getDisplayNameFromPhotonId(
                        photonId
                    )} (${this.getUserIdFromPhotonId(photonId)})`
                };
                this.queueGameLogNoty(entry);
                this.addGameLog(entry);
                database.addGamelogEventToDatabase(entry);
            }
        },

        photonUserLeave(photonId, gameLogDate) {
            if (!this.photonLobbyCurrent.has(photonId)) {
                return;
            }
            var text = 'has left';
            var lastEvent = this.photonEvent7List.get(parseInt(photonId, 10));
            if (typeof lastEvent !== 'undefined') {
                var timeSinceLastEvent = Date.now() - Date.parse(lastEvent);
                if (timeSinceLastEvent > 10 * 1000) {
                    // 10 seconds
                    text = `has timed out after ${$app.timeToText(timeSinceLastEvent)}`;
                }
            }
            this.photonLobbyActivePortals.forEach((portal) => {
                if (portal.pendingLeave > 0) {
                    text = `has left through portal to "${portal.worldName}"`;
                    portal.pendingLeave--;
                }
            });
            this.addEntryPhotonEvent({
                photonId,
                text,
                type: 'OnPlayerLeft',
                created_at: gameLogDate
            });
        },

        photonModerationUpdate(ref, photonId, block, mute, gameLogDate) {
            database.getModeration(ref.id).then((row) => {
                var lastType = this.photonLobbyLastModeration.get(photonId);
                var type = '';
                var text = '';
                if (block) {
                    type = 'Blocked';
                    text = 'Blocked';
                } else if (mute) {
                    type = 'Muted';
                    text = 'Muted';
                }
                if (row.userId) {
                    if (!block && row.block) {
                        type = 'Unblocked';
                        text = 'Unblocked';
                    } else if (!mute && row.mute) {
                        type = 'Unmuted';
                        text = 'Unmuted';
                    }
                    if (block === row.block && mute === row.mute) {
                        // no change
                        if (type && type !== lastType) {
                            this.addEntryPhotonEvent({
                                photonId,
                                text: `Moderation ${text}`,
                                type: 'Moderation',
                                color: 'yellow',
                                created_at: gameLogDate
                            });
                        }
                        this.photonLobbyLastModeration.set(photonId, type);
                        return;
                    }
                }
                this.photonLobbyLastModeration.set(photonId, type);
                this.moderationAgainstTable.forEach((item) => {
                    if (item.userId === ref.id && item.type === type) {
                        $app.removeFromArray(this.moderationAgainstTable, item);
                    }
                });
                if (type) {
                    this.addEntryPhotonEvent({
                        photonId,
                        text: `Moderation ${text}`,
                        type: 'Moderation',
                        color: 'yellow',
                        created_at: gameLogDate
                    });
                    var noty = {
                        created_at: new Date().toJSON(),
                        userId: ref.id,
                        displayName: ref.displayName,
                        type
                    };
                    this.queueModerationNoty(noty);
                    var entry = {
                        created_at: gameLogDate,
                        userId: ref.id,
                        displayName: ref.displayName,
                        type
                    };
                    this.moderationAgainstTable.push(entry);
                }
                if (block || mute || block !== row.block || mute !== row.mute) {
                    this.updateSharedFeed(true);
                }
                if (block || mute) {
                    database.setModeration({
                        userId: ref.id,
                        updatedAt: gameLogDate,
                        displayName: ref.displayName,
                        block,
                        mute
                    });
                } else if (row.block || row.mute) {
                    database.deleteModeration(ref.id);
                }
            });
        },

        parsePhotonAvatarChange(photonId, user, avatar, gameLogDate) {
            if (typeof avatar === 'undefined') {
                return;
            }
            if (typeof user === 'undefined') {
                console.error(
                    'PhotonAvatarChange: user is undefined',
                    photonId
                );
                return;
            }
            var oldAvatarId = this.photonLobbyAvatars.get(user.id);
            if (
                oldAvatarId &&
                oldAvatarId !== avatar.id &&
                photonId !== this.photonLobbyCurrentUser
            ) {
                avatar.name = this.replaceBioSymbols(avatar.name);
                avatar.description = this.replaceBioSymbols(avatar.description);
                this.checkVRChatCache(avatar).then((cacheInfo) => {
                    var inCache = false;
                    if (cacheInfo.Item1 > 0) {
                        inCache = true;
                    }
                    var entry = {
                        created_at: new Date().toJSON(),
                        type: 'AvatarChange',
                        userId: user.id,
                        displayName: user.displayName,
                        name: avatar.name,
                        description: avatar.description,
                        avatarId: avatar.id,
                        authorId: avatar.authorId,
                        releaseStatus: avatar.releaseStatus,
                        imageUrl: avatar.imageUrl,
                        thumbnailImageUrl: avatar.thumbnailImageUrl
                    };
                    this.queueGameLogNoty(entry);
                    this.addGameLog(entry);
                    this.addEntryPhotonEvent({
                        photonId,
                        displayName: user.displayName,
                        userId: user.id,
                        text: `ChangeAvatar ${avatar.name}`,
                        type: 'ChangeAvatar',
                        created_at: gameLogDate,
                        avatar,
                        inCache
                    });
                });
            }
            this.photonLobbyAvatars.set(user.id, avatar.id);
        },

        async parsePhotonGroupChange(photonId, user, groupId, gameLogDate) {
            if (
                typeof user === 'undefined' ||
                !this.photonLobbyJointime.has(photonId)
            ) {
                return;
            }
            var { groupOnNameplate } = this.photonLobbyJointime.get(photonId);
            if (
                typeof groupOnNameplate !== 'undefined' &&
                groupOnNameplate !== groupId &&
                photonId !== this.photonLobbyCurrentUser
            ) {
                var groupName = await this.getGroupName(groupId);
                var previousGroupName =
                    await this.getGroupName(groupOnNameplate);
                this.addEntryPhotonEvent({
                    photonId,
                    displayName: user.displayName,
                    userId: user.id,
                    text: `ChangeGroup ${groupName}`,
                    type: 'ChangeGroup',
                    created_at: gameLogDate,
                    groupId,
                    groupName,
                    previousGroupId: groupOnNameplate,
                    previousGroupName
                });
            }
        },

        parsePhotonAvatar(avatar) {
            if (
                typeof avatar === 'undefined' ||
                typeof avatar.id === 'undefined'
            ) {
                console.error('PhotonAvatar: avatar is undefined');
                return;
            }
            var tags = [];
            var unityPackages = [];
            if (typeof avatar.tags !== 'undefined') {
                tags = avatar.tags;
            }
            if (typeof avatar.unityPackages !== 'undefined') {
                unityPackages = avatar.unityPackages;
            }
            if (!avatar.assetUrl && unityPackages.length > 0) {
                for (var unityPackage of unityPackages) {
                    if (
                        unityPackage.variant &&
                        unityPackage.variant !== 'standard' &&
                        unityPackage.variant !== 'security'
                    ) {
                        continue;
                    }
                    if (unityPackage.platform === 'standalonewindows') {
                        avatar.assetUrl = unityPackage.assetUrl;
                    }
                }
            }
            API.applyAvatar({
                id: avatar.id,
                authorId: avatar.authorId,
                authorName: avatar.authorName,
                updated_at: avatar.updated_at,
                description: avatar.description,
                imageUrl: avatar.imageUrl,
                thumbnailImageUrl: avatar.thumbnailImageUrl,
                name: avatar.name,
                releaseStatus: avatar.releaseStatus,
                version: avatar.version,
                tags,
                unityPackages
            });
        },

        async photonEventTableFilterChange() {
            this.photonEventTable.filters[0].value =
                this.photonEventTableFilter;
            this.photonEventTable.filters[1].value =
                this.photonEventTableTypeFilter;

            this.photonEventTablePrevious.filters[0].value =
                this.photonEventTableFilter;
            this.photonEventTablePrevious.filters[1].value =
                this.photonEventTableTypeFilter;

            await configRepository.setString(
                'VRCX_photonEventTypeFilter',
                JSON.stringify(this.photonEventTableTypeFilter)
            );
            await configRepository.setString(
                'VRCX_photonEventTypeOverlayFilter',
                JSON.stringify(this.photonEventTableTypeOverlayFilter)
            );
        }
    };
}
