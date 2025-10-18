import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';

import { groupRequest, worldRequest } from '../api';
import { useFeedStore } from './feed';
import { useFriendStore } from './friend';
import { useGameLogStore } from './gameLog';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { useNotificationsSettingsStore } from './settings/notifications';
import { usePhotonStore } from './photon';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { watchState } from '../service/watchState';

import * as workerTimers from 'worker-timers';

export const useSharedFeedStore = defineStore('SharedFeed', () => {
    const friendStore = useFriendStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const locationStore = useLocationStore();
    const groupStore = useGroupStore();
    const userStore = useUserStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const instanceStore = useInstanceStore();
    const gameLogStore = useGameLogStore();
    const moderationStore = useModerationStore();
    const notificationStore = useNotificationStore();
    const feedStore = useFeedStore();
    const worldStore = useWorldStore();
    const photonStore = usePhotonStore();

    const state = reactive({
        updateSharedFeedTimer: null,
        updateSharedFeedPending: false,
        updateSharedFeedPendingForceUpdate: false
    });

    const sharedFeed = ref({
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
    });

    function updateSharedFeed(forceUpdate) {
        if (!watchState.isFriendsLoaded) {
            return;
        }
        if (state.updateSharedFeedTimer) {
            if (forceUpdate) {
                state.updateSharedFeedPendingForceUpdate = true;
            }
            state.updateSharedFeedPending = true;
        } else {
            updateSharedExecute(forceUpdate);
            state.updateSharedFeedTimer = setTimeout(() => {
                if (state.updateSharedFeedPending) {
                    updateSharedExecute(
                        state.updateSharedFeedPendingForceUpdate
                    );
                }
                state.updateSharedFeedTimer = null;
            }, 150);
        }
    }

    function updateSharedExecute(forceUpdate) {
        try {
            updateSharedFeedDebounce(forceUpdate);
        } catch (err) {
            console.error(err);
        }
        state.updateSharedFeedTimer = null;
        state.updateSharedFeedPending = false;
        state.updateSharedFeedPendingForceUpdate = false;
    }

    function updateSharedFeedDebounce(forceUpdate) {
        updateSharedFeedGameLog(forceUpdate);
        updateSharedFeedFeedTable(forceUpdate);
        updateSharedFeedNotificationTable(forceUpdate);
        updateSharedFeedFriendLogTable(forceUpdate);
        updateSharedFeedModerationAgainstTable(forceUpdate);
        const feeds = sharedFeed.value;
        if (!feeds.pendingUpdate) {
            return;
        }
        let wristFeed = [];
        wristFeed = wristFeed.concat(
            feeds.gameLog.wrist,
            feeds.feedTable.wrist,
            feeds.notificationTable.wrist,
            feeds.friendLogTable.wrist,
            feeds.moderationAgainstTable.wrist
        );
        // OnPlayerJoining/Traveling
        userStore.currentTravelers.forEach((ref) => {
            const isFavorite = friendStore.localFavoriteFriends.has(ref.id);
            if (
                (notificationsSettingsStore.sharedFeedFilters.wrist
                    .OnPlayerJoining === 'Friends' ||
                    (notificationsSettingsStore.sharedFeedFilters.wrist
                        .OnPlayerJoining === 'VIP' &&
                        isFavorite)) &&
                !locationStore.lastLocation.playerList.has(ref.id)
            ) {
                if (ref.$location.tag === locationStore.lastLocation.location) {
                    var feedEntry = {
                        ...ref,
                        isFavorite,
                        isFriend: true,
                        type: 'OnPlayerJoining'
                    };
                    wristFeed.unshift(feedEntry);
                } else {
                    const worldRef = worldStore.cachedWorlds.get(
                        ref.$location.worldId
                    );
                    let groupName = '';
                    if (ref.$location.groupId) {
                        const groupRef = groupStore.cachedGroups.get(
                            ref.$location.groupId
                        );
                        if (typeof groupRef !== 'undefined') {
                            groupName = groupRef.name;
                        } else {
                            // no group cache, fetch group and try again
                            groupRequest
                                .getGroup({
                                    groupId: ref.$location.groupId
                                })
                                .then((args) => {
                                    args.ref = groupStore.applyGroup(args.json);
                                    workerTimers.setTimeout(() => {
                                        // delay to allow for group cache to update
                                        sharedFeed.value.pendingUpdate = true;
                                        updateSharedFeed(false);
                                    }, 100);
                                    return args;
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }
                    }
                    if (typeof worldRef !== 'undefined') {
                        let feedEntry = {
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
                        worldRequest
                            .getWorld({
                                worldId: ref.$location.worldId
                            })
                            .then((args) => {
                                workerTimers.setTimeout(() => {
                                    // delay to allow for world cache to update
                                    sharedFeed.value.pendingUpdate = true;
                                    updateSharedFeed(false);
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
        // temp fix, tack on instance names in the worst way possible
        for (let feedEntry of wristFeed) {
            if (feedEntry.location) {
                const instanceRef = instanceStore.cachedInstances.get(
                    feedEntry.location
                );
                if (instanceRef?.displayName) {
                    feedEntry.instanceDisplayName = instanceRef.displayName;
                }
            }
            // invites
            if (feedEntry.details?.worldId) {
                const instanceRef = instanceStore.cachedInstances.get(
                    feedEntry.details.worldId
                );
                if (instanceRef?.displayName) {
                    feedEntry.instanceDisplayName = instanceRef.displayName;
                }
            }
        }
        AppApi.ExecuteVrFeedFunction(
            'wristFeedUpdate',
            JSON.stringify(wristFeed)
        );
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
        feeds.pendingUpdate = false;
    }

    function updateSharedFeedGameLog(forceUpdate) {
        // Location, OnPlayerJoined, OnPlayerLeft
        const sessionTable = gameLogStore.gameLogSessionTable;
        let i = sessionTable.length;
        if (i > 0) {
            if (
                sessionTable[i - 1].created_at ===
                    sharedFeed.value.gameLog.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            sharedFeed.value.gameLog.lastEntryDate =
                sessionTable[i - 1].created_at;
        } else {
            return;
        }
        const bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        const wristArr = [];
        let w = 0;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        let currentUserLeaveTime = 0;
        let locationJoinTime = 0;
        for (i = sessionTable.length - 1; i > -1; i--) {
            const ctx = sessionTable[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Notification') {
                continue;
            }
            // on Location change remove OnPlayerLeft
            if (ctx.type === 'LocationDestination') {
                currentUserLeaveTime = Date.parse(ctx.created_at);
                const currentUserLeaveTimeOffset =
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
                const locationJoinTimeOffset = locationJoinTime + 20 * 1000;
                for (let k = w - 1; k > -1; k--) {
                    let feedItem = wristArr[k];
                    if (
                        (feedItem.type === 'OnPlayerJoined' ||
                            feedItem.type === 'BlockedOnPlayerJoined' ||
                            feedItem.type === 'MutedOnPlayerJoined') &&
                        Date.parse(feedItem.created_at) >= locationJoinTime &&
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
                ctx.displayName === userStore.currentUser.displayName
            ) {
                continue;
            }
            let isFriend = false;
            let isFavorite = false;
            if (ctx.userId) {
                isFriend = friendStore.friends.has(ctx.userId);
                isFavorite = friendStore.localFavoriteFriends.has(ctx.userId);
            } else if (ctx.displayName) {
                for (let ref of userStore.cachedUsers.values()) {
                    if (ref.displayName === ctx.displayName) {
                        isFriend = friendStore.friends.has(ref.id);
                        isFavorite = friendStore.localFavoriteFriends.has(
                            ref.id
                        );
                        break;
                    }
                }
            }
            // add tag colour
            let tagColour = '';
            if (ctx.userId) {
                const tagRef = userStore.customUserTags.get(ctx.userId);
                if (typeof tagRef !== 'undefined') {
                    tagColour = tagRef.colour;
                }
            }
            // BlockedOnPlayerJoined, BlockedOnPlayerLeft, MutedOnPlayerJoined, MutedOnPlayerLeft
            if (ctx.type === 'OnPlayerJoined' || ctx.type === 'OnPlayerLeft') {
                for (var ref of moderationStore.cachedPlayerModerations.values()) {
                    if (
                        ref.targetDisplayName !== ctx.displayName &&
                        ref.sourceUserId !== ctx.userId
                    ) {
                        continue;
                    }

                    let type = '';
                    if (ref.type === 'block') {
                        type = `Blocked${ctx.type}`;
                    } else if (ref.type === 'mute') {
                        type = `Muted${ctx.type}`;
                    } else {
                        continue;
                    }

                    const entry = {
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
                    notificationStore.queueGameLogNoty(entry);
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
        sharedFeed.value.gameLog.wrist = wristArr;
        sharedFeed.value.pendingUpdate = true;
    }

    function updateSharedFeedFeedTable(forceUpdate) {
        // GPS, Online, Offline, Status, Avatar
        const feedSession = feedStore.feedSessionTable;
        var i = feedSession.length;
        if (i > 0) {
            if (
                feedSession[i - 1].created_at ===
                    sharedFeed.value.feedTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            sharedFeed.value.feedTable.lastEntryDate =
                feedSession[i - 1].created_at;
        } else {
            return;
        }
        const bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        const wristArr = [];
        let w = 0;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        for (let i = feedSession.length - 1; i > -1; i--) {
            const ctx = feedSession[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Avatar') {
                continue;
            }
            // hide private worlds from feed
            if (
                wristOverlaySettingsStore.hidePrivateFromFeed &&
                ctx.type === 'GPS' &&
                ctx.location === 'private'
            ) {
                continue;
            }
            const isFriend = friendStore.friends.has(ctx.userId);
            const isFavorite = friendStore.localFavoriteFriends.has(ctx.userId);
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
        sharedFeed.value.feedTable.wrist = wristArr;
        sharedFeed.value.pendingUpdate = true;
    }

    function updateSharedFeedNotificationTable(forceUpdate) {
        // invite, requestInvite, requestInviteResponse, inviteResponse, friendRequest
        const notificationTable = notificationStore.notificationTable.data;
        let i = notificationTable.length;
        if (i > 0) {
            if (
                notificationTable[i - 1].created_at ===
                    sharedFeed.value.notificationTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            sharedFeed.value.notificationTable.lastEntryDate =
                notificationTable[i - 1].created_at;
        } else {
            return;
        }
        const bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        const wristArr = [];
        let w = 0;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        for (i = notificationTable.length - 1; i > -1; i--) {
            const ctx = notificationTable[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.senderUserId === userStore.currentUser.id) {
                continue;
            }
            const isFriend = friendStore.friends.has(ctx.senderUserId);
            const isFavorite = friendStore.localFavoriteFriends.has(
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
        sharedFeed.value.notificationTable.wrist = wristArr;
        sharedFeed.value.pendingUpdate = true;
    }

    function updateSharedFeedFriendLogTable(forceUpdate) {
        // TrustLevel, Friend, FriendRequest, Unfriend, DisplayName
        const friendLog = friendStore.friendLogTable.data;
        var i = friendLog.length;
        if (i > 0) {
            if (
                friendLog[i - 1].created_at ===
                    sharedFeed.value.friendLogTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            sharedFeed.value.friendLogTable.lastEntryDate =
                friendLog[i - 1].created_at;
        } else {
            return;
        }
        const bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        const wristArr = [];
        let w = 0;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        for (let i = friendLog.length - 1; i > -1; i--) {
            const ctx = friendLog[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'FriendRequest') {
                continue;
            }
            const isFriend = friendStore.friends.has(ctx.userId);
            const isFavorite = friendStore.localFavoriteFriends.has(ctx.userId);
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
        sharedFeed.value.friendLogTable.wrist = wristArr;
        sharedFeed.value.pendingUpdate = true;
    }

    function updateSharedFeedModerationAgainstTable(forceUpdate) {
        // Unblocked, Blocked, Muted, Unmuted
        const moderationAgainst = photonStore.moderationAgainstTable;
        var i = moderationAgainst.length;
        if (i > 0) {
            if (
                moderationAgainst[i - 1].created_at ===
                    sharedFeed.value.moderationAgainstTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            sharedFeed.value.moderationAgainstTable.lastEntryDate =
                moderationAgainst[i - 1].created_at;
        } else {
            return;
        }
        const bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        const wristArr = [];
        let w = 0;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        for (let i = moderationAgainst.length - 1; i > -1; i--) {
            const ctx = moderationAgainst[i];
            if (ctx.created_at < bias) {
                break;
            }
            const isFriend = friendStore.friends.has(ctx.userId);
            const isFavorite = friendStore.localFavoriteFriends.has(ctx.userId);
            // add tag colour
            let tagColour = '';
            const tagRef = userStore.customUserTags.get(ctx.userId);
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
        sharedFeed.value.moderationAgainstTable.wrist = wristArr;
        sharedFeed.value.pendingUpdate = true;
    }

    return {
        state,
        sharedFeed,
        updateSharedFeed
    };
});
