import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        sharedFeed: {
            gameLog: {
                wrist: [],
                lastEntryDate: ''
            },
            feedTable: {
                wrist: [],
                lastEntryDate: ''
            },
            notificationTable: {
                wrist: [],
                lastEntryDate: ''
            },
            friendLogTable: {
                wrist: [],
                lastEntryDate: ''
            },
            moderationAgainstTable: {
                wrist: [],
                lastEntryDate: ''
            },
            pendingUpdate: false
        },
        updateSharedFeedTimer: null,
        updateSharedFeedPending: false,
        updateSharedFeedPendingForceUpdate: false
    };

    _methods = {
        updateSharedFeed(forceUpdate) {
            if (!this.friendLogInitStatus) {
                return;
            }
            if (this.updateSharedFeedTimer) {
                if (forceUpdate) {
                    this.updateSharedFeedPendingForceUpdate = true;
                }
                this.updateSharedFeedPending = true;
            } else {
                this.updateSharedExecute(forceUpdate);
                this.updateSharedFeedTimer = setTimeout(() => {
                    if (this.updateSharedFeedPending) {
                        this.updateSharedExecute(
                            this.updateSharedFeedPendingForceUpdate
                        );
                    }
                    this.updateSharedFeedTimer = null;
                }, 150);
            }
        },

        updateSharedExecute(forceUpdate) {
            try {
                this.updateSharedFeedDebounce(forceUpdate);
            } catch (err) {
                console.error(err);
            }
            this.updateSharedFeedTimer = null;
            this.updateSharedFeedPending = false;
            this.updateSharedFeedPendingForceUpdate = false;
        },

        updateSharedFeedDebounce(forceUpdate) {
            this.updateSharedFeedGameLog(forceUpdate);
            this.updateSharedFeedFeedTable(forceUpdate);
            this.updateSharedFeedNotificationTable(forceUpdate);
            this.updateSharedFeedFriendLogTable(forceUpdate);
            this.updateSharedFeedModerationAgainstTable(forceUpdate);
            var feeds = this.sharedFeed;
            if (!feeds.pendingUpdate) {
                return;
            }
            var wristFeed = [];
            wristFeed = wristFeed.concat(
                feeds.gameLog.wrist,
                feeds.feedTable.wrist,
                feeds.notificationTable.wrist,
                feeds.friendLogTable.wrist,
                feeds.moderationAgainstTable.wrist
            );
            // OnPlayerJoining/Traveling
            API.currentTravelers.forEach((ref) => {
                var isFavorite = this.localFavoriteFriends.has(ref.id);
                if (
                    (this.sharedFeedFilters.wrist.OnPlayerJoining ===
                        'Friends' ||
                        (this.sharedFeedFilters.wrist.OnPlayerJoining ===
                            'VIP' &&
                            isFavorite)) &&
                    !$app.lastLocation.playerList.has(ref.id)
                ) {
                    if (ref.$location.tag === $app.lastLocation.location) {
                        var feedEntry = {
                            ...ref,
                            isFavorite,
                            isFriend: true,
                            type: 'OnPlayerJoining'
                        };
                        wristFeed.unshift(feedEntry);
                    } else {
                        var worldRef = API.cachedWorlds.get(
                            ref.$location.worldId
                        );
                        var groupName = '';
                        if (ref.$location.groupId) {
                            var groupRef = API.cachedGroups.get(
                                ref.$location.groupId
                            );
                            if (typeof groupRef !== 'undefined') {
                                groupName = groupRef.name;
                            } else {
                                // no group cache, fetch group and try again
                                API.getGroup({
                                    groupId: ref.$location.groupId
                                })
                                    .then((args) => {
                                        workerTimers.setTimeout(() => {
                                            // delay to allow for group cache to update
                                            $app.sharedFeed.pendingUpdate = true;
                                            $app.updateSharedFeed(false);
                                        }, 100);
                                        return args;
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                    });
                            }
                        }
                        if (typeof worldRef !== 'undefined') {
                            var feedEntry = {
                                created_at: ref.created_at,
                                type: 'GPS',
                                userId: ref.id,
                                displayName: ref.displayName,
                                location: ref.$location.tag,
                                worldName: worldRef.name,
                                groupName,
                                previousLocation: '',
                                isFavorite,
                                time: 0,
                                isFriend: true,
                                isTraveling: true
                            };
                            wristFeed.unshift(feedEntry);
                        } else {
                            // no world cache, fetch world and try again
                            API.getWorld({
                                worldId: ref.$location.worldId
                            })
                                .then((args) => {
                                    workerTimers.setTimeout(() => {
                                        // delay to allow for world cache to update
                                        $app.sharedFeed.pendingUpdate = true;
                                        $app.updateSharedFeed(false);
                                    }, 100);
                                    return args;
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }
                    }
                }
            });
            wristFeed.sort(function (a, b) {
                if (a.created_at < b.created_at) {
                    return 1;
                }
                if (a.created_at > b.created_at) {
                    return -1;
                }
                return 0;
            });
            wristFeed.splice(16);
            AppApi.ExecuteVrFeedFunction(
                'wristFeedUpdate',
                JSON.stringify(wristFeed)
            );
            this.applyUserDialogLocation();
            this.applyWorldDialogInstances();
            this.applyGroupDialogInstances();
            feeds.pendingUpdate = false;
        },

        updateSharedFeedGameLog(forceUpdate) {
            // Location, OnPlayerJoined, OnPlayerLeft
            var sessionTable = this.gameLogSessionTable;
            var i = sessionTable.length;
            if (i > 0) {
                if (
                    sessionTable[i - 1].created_at ===
                        this.sharedFeed.gameLog.lastEntryDate &&
                    forceUpdate === false
                ) {
                    return;
                }
                this.sharedFeed.gameLog.lastEntryDate =
                    sessionTable[i - 1].created_at;
            } else {
                return;
            }
            var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
            var wristArr = [];
            var w = 0;
            var wristFilter = this.sharedFeedFilters.wrist;
            var currentUserLeaveTime = 0;
            var locationJoinTime = 0;
            for (var i = sessionTable.length - 1; i > -1; i--) {
                var ctx = sessionTable[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if (ctx.type === 'Notification') {
                    continue;
                }
                // on Location change remove OnPlayerLeft
                if (ctx.type === 'LocationDestination') {
                    currentUserLeaveTime = Date.parse(ctx.created_at);
                    var currentUserLeaveTimeOffset =
                        currentUserLeaveTime + 5 * 1000;
                    for (var k = w - 1; k > -1; k--) {
                        var feedItem = wristArr[k];
                        if (
                            (feedItem.type === 'OnPlayerLeft' ||
                                feedItem.type === 'BlockedOnPlayerLeft' ||
                                feedItem.type === 'MutedOnPlayerLeft') &&
                            Date.parse(feedItem.created_at) >=
                                currentUserLeaveTime &&
                            Date.parse(feedItem.created_at) <=
                                currentUserLeaveTimeOffset
                        ) {
                            wristArr.splice(k, 1);
                            w--;
                        }
                    }
                }
                // on Location change remove OnPlayerJoined
                if (ctx.type === 'Location') {
                    locationJoinTime = Date.parse(ctx.created_at);
                    var locationJoinTimeOffset = locationJoinTime + 20 * 1000;
                    for (var k = w - 1; k > -1; k--) {
                        var feedItem = wristArr[k];
                        if (
                            (feedItem.type === 'OnPlayerJoined' ||
                                feedItem.type === 'BlockedOnPlayerJoined' ||
                                feedItem.type === 'MutedOnPlayerJoined') &&
                            Date.parse(feedItem.created_at) >=
                                locationJoinTime &&
                            Date.parse(feedItem.created_at) <=
                                locationJoinTimeOffset
                        ) {
                            wristArr.splice(k, 1);
                            w--;
                        }
                    }
                }
                // remove current user
                if (
                    (ctx.type === 'OnPlayerJoined' ||
                        ctx.type === 'OnPlayerLeft' ||
                        ctx.type === 'PortalSpawn') &&
                    ctx.displayName === API.currentUser.displayName
                ) {
                    continue;
                }
                var isFriend = false;
                var isFavorite = false;
                if (ctx.userId) {
                    isFriend = this.friends.has(ctx.userId);
                    isFavorite = this.localFavoriteFriends.has(ctx.userId);
                } else if (ctx.displayName) {
                    for (var ref of API.cachedUsers.values()) {
                        if (ref.displayName === ctx.displayName) {
                            isFriend = this.friends.has(ref.id);
                            isFavorite = this.localFavoriteFriends.has(ref.id);
                            break;
                        }
                    }
                }
                // add tag colour
                var tagColour = '';
                if (ctx.userId) {
                    var tagRef = this.customUserTags.get(ctx.userId);
                    if (typeof tagRef !== 'undefined') {
                        tagColour = tagRef.colour;
                    }
                }
                // BlockedOnPlayerJoined, BlockedOnPlayerLeft, MutedOnPlayerJoined, MutedOnPlayerLeft
                if (
                    ctx.type === 'OnPlayerJoined' ||
                    ctx.type === 'OnPlayerLeft'
                ) {
                    for (var ref of API.cachedPlayerModerations.values()) {
                        if (
                            ref.targetDisplayName !== ctx.displayName &&
                            ref.sourceUserId !== ctx.userId
                        ) {
                            continue;
                        }

                        if (ref.type === 'block') {
                            var type = `Blocked${ctx.type}`;
                        } else if (ref.type === 'mute') {
                            var type = `Muted${ctx.type}`;
                        } else {
                            continue;
                        }

                        var entry = {
                            created_at: ctx.created_at,
                            type,
                            displayName: ref.targetDisplayName,
                            userId: ref.targetUserId,
                            isFriend,
                            isFavorite
                        };
                        if (
                            wristFilter[type] &&
                            (wristFilter[type] === 'Everyone' ||
                                (wristFilter[type] === 'Friends' && isFriend) ||
                                (wristFilter[type] === 'VIP' && isFavorite))
                        ) {
                            wristArr.unshift(entry);
                        }
                        this.queueGameLogNoty(entry);
                    }
                }
                // when too many user joins happen at once when switching instances
                // the "w" counter maxes out and wont add any more entries
                // until the onJoins are cleared by "Location"
                // e.g. if a "VideoPlay" occurs between "OnPlayerJoined" and "Location" it wont be added
                if (
                    w < 50 &&
                    wristFilter[ctx.type] &&
                    (wristFilter[ctx.type] === 'On' ||
                        wristFilter[ctx.type] === 'Everyone' ||
                        (wristFilter[ctx.type] === 'Friends' && isFriend) ||
                        (wristFilter[ctx.type] === 'VIP' && isFavorite))
                ) {
                    wristArr.push({
                        ...ctx,
                        tagColour,
                        isFriend,
                        isFavorite
                    });
                    ++w;
                }
            }
            this.sharedFeed.gameLog.wrist = wristArr;
            this.sharedFeed.pendingUpdate = true;
        },

        updateSharedFeedFeedTable(forceUpdate) {
            // GPS, Online, Offline, Status, Avatar
            var feedSession = this.feedSessionTable;
            var i = feedSession.length;
            if (i > 0) {
                if (
                    feedSession[i - 1].created_at ===
                        this.sharedFeed.feedTable.lastEntryDate &&
                    forceUpdate === false
                ) {
                    return;
                }
                this.sharedFeed.feedTable.lastEntryDate =
                    feedSession[i - 1].created_at;
            } else {
                return;
            }
            var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
            var wristArr = [];
            var w = 0;
            var wristFilter = this.sharedFeedFilters.wrist;
            for (var i = feedSession.length - 1; i > -1; i--) {
                var ctx = feedSession[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if (ctx.type === 'Avatar') {
                    continue;
                }
                // hide private worlds from feed
                if (
                    this.hidePrivateFromFeed &&
                    ctx.type === 'GPS' &&
                    ctx.location === 'private'
                ) {
                    continue;
                }
                var isFriend = this.friends.has(ctx.userId);
                var isFavorite = this.localFavoriteFriends.has(ctx.userId);
                if (
                    w < 20 &&
                    wristFilter[ctx.type] &&
                    (wristFilter[ctx.type] === 'Friends' ||
                        (wristFilter[ctx.type] === 'VIP' && isFavorite))
                ) {
                    wristArr.push({
                        ...ctx,
                        isFriend,
                        isFavorite
                    });
                    ++w;
                }
            }
            this.sharedFeed.feedTable.wrist = wristArr;
            this.sharedFeed.pendingUpdate = true;
        },

        updateSharedFeedNotificationTable(forceUpdate) {
            // invite, requestInvite, requestInviteResponse, inviteResponse, friendRequest
            var notificationTable = this.notificationTable;
            var i = notificationTable.length;
            if (i > 0) {
                if (
                    notificationTable[i - 1].created_at ===
                        this.sharedFeed.notificationTable.lastEntryDate &&
                    forceUpdate === false
                ) {
                    return;
                }
                this.sharedFeed.notificationTable.lastEntryDate =
                    notificationTable[i - 1].created_at;
            } else {
                return;
            }
            var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
            var wristArr = [];
            var w = 0;
            var wristFilter = this.sharedFeedFilters.wrist;
            for (var i = notificationTable.length - 1; i > -1; i--) {
                var ctx = notificationTable[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if (ctx.senderUserId === API.currentUser.id) {
                    continue;
                }
                var isFriend = this.friends.has(ctx.senderUserId);
                var isFavorite = this.localFavoriteFriends.has(
                    ctx.senderUserId
                );
                if (
                    w < 20 &&
                    wristFilter[ctx.type] &&
                    (wristFilter[ctx.type] === 'On' ||
                        wristFilter[ctx.type] === 'Friends' ||
                        (wristFilter[ctx.type] === 'VIP' && isFavorite))
                ) {
                    wristArr.push({
                        ...ctx,
                        isFriend,
                        isFavorite
                    });
                    ++w;
                }
            }
            this.sharedFeed.notificationTable.wrist = wristArr;
            this.sharedFeed.pendingUpdate = true;
        },

        updateSharedFeedFriendLogTable(forceUpdate) {
            // TrustLevel, Friend, FriendRequest, Unfriend, DisplayName
            var friendLog = this.friendLogTable;
            var i = friendLog.length;
            if (i > 0) {
                if (
                    friendLog[i - 1].created_at ===
                        this.sharedFeed.friendLogTable.lastEntryDate &&
                    forceUpdate === false
                ) {
                    return;
                }
                this.sharedFeed.friendLogTable.lastEntryDate =
                    friendLog[i - 1].created_at;
            } else {
                return;
            }
            var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
            var wristArr = [];
            var w = 0;
            var wristFilter = this.sharedFeedFilters.wrist;
            for (var i = friendLog.length - 1; i > -1; i--) {
                var ctx = friendLog[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if (ctx.type === 'FriendRequest') {
                    continue;
                }
                var isFriend = this.friends.has(ctx.userId);
                var isFavorite = this.localFavoriteFriends.has(ctx.userId);
                if (
                    w < 20 &&
                    wristFilter[ctx.type] &&
                    (wristFilter[ctx.type] === 'On' ||
                        wristFilter[ctx.type] === 'Friends' ||
                        (wristFilter[ctx.type] === 'VIP' && isFavorite))
                ) {
                    wristArr.push({
                        ...ctx,
                        isFriend,
                        isFavorite
                    });
                    ++w;
                }
            }
            this.sharedFeed.friendLogTable.wrist = wristArr;
            this.sharedFeed.pendingUpdate = true;
        },

        updateSharedFeedModerationAgainstTable(forceUpdate) {
            // Unblocked, Blocked, Muted, Unmuted
            var moderationAgainst = this.moderationAgainstTable;
            var i = moderationAgainst.length;
            if (i > 0) {
                if (
                    moderationAgainst[i - 1].created_at ===
                        this.sharedFeed.moderationAgainstTable.lastEntryDate &&
                    forceUpdate === false
                ) {
                    return;
                }
                this.sharedFeed.moderationAgainstTable.lastEntryDate =
                    moderationAgainst[i - 1].created_at;
            } else {
                return;
            }
            var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
            var wristArr = [];
            var w = 0;
            var wristFilter = this.sharedFeedFilters.wrist;
            for (var i = moderationAgainst.length - 1; i > -1; i--) {
                var ctx = moderationAgainst[i];
                if (ctx.created_at < bias) {
                    break;
                }
                var isFriend = this.friends.has(ctx.userId);
                var isFavorite = this.localFavoriteFriends.has(ctx.userId);
                // add tag colour
                var tagColour = '';
                var tagRef = this.customUserTags.get(ctx.userId);
                if (typeof tagRef !== 'undefined') {
                    tagColour = tagRef.colour;
                }
                if (
                    w < 20 &&
                    wristFilter[ctx.type] &&
                    wristFilter[ctx.type] === 'On'
                ) {
                    wristArr.push({
                        ...ctx,
                        isFriend,
                        isFavorite,
                        tagColour
                    });
                    ++w;
                }
            }
            this.sharedFeed.moderationAgainstTable.wrist = wristArr;
            this.sharedFeed.pendingUpdate = true;
        },

        saveSharedFeedFilters() {
            configRepository.setString(
                'sharedFeedFilters',
                JSON.stringify(this.sharedFeedFilters)
            );
            this.updateSharedFeed(true);
        },

        async resetSharedFeedFilters() {
            if (await configRepository.getString('sharedFeedFilters')) {
                this.sharedFeedFilters = JSON.parse(
                    await configRepository.getString(
                        'sharedFeedFilters',
                        JSON.stringify(this.sharedFeedFiltersDefaults)
                    )
                );
            } else {
                this.sharedFeedFilters = this.sharedFeedFiltersDefaults;
            }
        }
    };
}
