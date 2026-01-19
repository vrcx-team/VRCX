import { defineStore } from 'pinia';
import { ref } from 'vue';
import { watch } from 'vue';

import {
    compareByCreatedAt,
    getGroupName,
    getWorldName
} from '../shared/utils';
import { database } from '../service/database';
import { useFriendStore } from './friend';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useUserStore } from './user';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { watchState } from '../service/watchState';

export const useSharedFeedStore = defineStore('SharedFeed', () => {
    const friendStore = useFriendStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const instanceStore = useInstanceStore();
    const moderationStore = useModerationStore();
    const notificationStore = useNotificationStore();

    const onPlayerJoining = ref([]);

    async function rebuildOnPlayerJoining() {
        let newOnPlayerJoining = [];
        for (const ref of userStore.currentTravelers.values()) {
            const isFavorite = friendStore.localFavoriteFriends.has(ref.id);
            if (
                locationStore.lastLocation.playerList.has(ref.id) ||
                (notificationsSettingsStore.sharedFeedFilters.wrist
                    .OnPlayerJoining === 'VIP' &&
                    !isFavorite)
            ) {
                continue;
            }
            if (ref.$location.tag === locationStore.lastLocation.location) {
                const feedEntry = {
                    ...ref,
                    isFavorite,
                    isFriend: true,
                    type: 'OnPlayerJoining'
                };
                newOnPlayerJoining.unshift(feedEntry);
                continue;
            }
            const worldName = await getWorldName(ref.$location.worldId);
            const groupName = await getGroupName(ref.$location.groupId);
            const feedEntry = {
                created_at: ref.created_at,
                type: 'GPS',
                userId: ref.id,
                displayName: ref.displayName,
                location: ref.$location.tag,
                worldName,
                groupName,
                previousLocation: '',
                isFavorite,
                time: 0,
                isFriend: true,
                isTraveling: true
            };
            newOnPlayerJoining.unshift(feedEntry);
        }
        onPlayerJoining.value = newOnPlayerJoining;

        sharedFeedData.value = sharedFeedData.value.filter(
            (ctx) => ctx.type !== 'OnPlayerJoining' && !ctx.isTraveling
        );
        sharedFeedData.value.unshift(...onPlayerJoining.value);
        if (sharedFeedData.value.length > maxEntries) {
            sharedFeedData.value.splice(maxEntries);
        }
        sendSharedFeed();
    }

    watch(
        () => userStore.currentTravelers,
        () => rebuildOnPlayerJoining(),
        { deep: true }
    );

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                sharedFeedData.value = [];
                loadSharedFeed();
            }
        },
        { flush: 'sync' }
    );

    const sharedFeedData = ref([]);
    const maxEntries = 25;

    async function loadSharedFeed() {
        let newFeed = [];
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        // run after fav and friendlist init
        const vipList = Array.from(friendStore.localFavoriteFriends.values());
        const friendList = Array.from(friendStore.friends.keys());

        // Filters
        const vipFilters = Object.keys(wristFilter).filter(
            (key) => wristFilter[key] === 'VIP'
        );
        const friendsFilters = Object.keys(wristFilter).filter(
            (key) => wristFilter[key] === 'Friends'
        );
        const everyoneFilters = Object.keys(wristFilter).filter(
            (key) =>
                wristFilter[key] === 'On' || wristFilter[key] === 'Everyone'
        );
        const everyoneAndFriendsFilters = Object.keys(wristFilter).filter(
            (key) =>
                wristFilter[key] === 'Friends' ||
                wristFilter[key] === 'On' ||
                wristFilter[key] === 'Everyone'
        );

        // Feed
        if (vipFilters.length) {
            const vipFeedRows = await database.lookupFeedDatabase(
                '',
                vipFilters,
                vipList,
                maxEntries
            );
            newFeed = newFeed.concat(vipFeedRows);
        }
        if (everyoneAndFriendsFilters.length) {
            const friendsFeedRows = await database.lookupFeedDatabase(
                '',
                everyoneAndFriendsFilters,
                [],
                maxEntries
            );
            newFeed = newFeed.concat(friendsFeedRows);
        }

        // GameLog
        if (vipFilters.length) {
            const vipGameLogRows = await database.lookupGameLogDatabase(
                '',
                vipFilters,
                vipList,
                maxEntries
            );
            newFeed = newFeed.concat(vipGameLogRows);
        }
        if (friendsFilters.length) {
            const friendsGameLogRows = await database.lookupGameLogDatabase(
                '',
                friendsFilters,
                friendList,
                maxEntries
            );
            newFeed = newFeed.concat(friendsGameLogRows);
        }
        if (everyoneFilters.length) {
            const everyoneGameLogRows = await database.lookupGameLogDatabase(
                '',
                everyoneFilters,
                [],
                maxEntries
            );
            newFeed = newFeed.concat(everyoneGameLogRows);
        }

        // Notifications
        if (vipFilters.length) {
            const vipNotificationRows =
                await database.lookupNotificationDatabase(
                    '',
                    vipFilters,
                    vipList,
                    maxEntries
                );
            newFeed = newFeed.concat(vipNotificationRows);
        }
        if (everyoneAndFriendsFilters.length) {
            const friendsNotificationRows =
                await database.lookupNotificationDatabase(
                    '',
                    everyoneAndFriendsFilters,
                    [],
                    maxEntries
                );
            newFeed = newFeed.concat(friendsNotificationRows);
        }

        // hide private worlds from feed
        if (wristOverlaySettingsStore.hidePrivateFromFeed) {
            newFeed = newFeed.filter(
                (ctx) => !(ctx.type === 'GPS' && ctx.location === 'private')
            );
        }

        // remove current user
        newFeed = newFeed.filter(
            (ctx) => ctx.userId !== userStore.currentUser.id
        );

        // FriendLog, Moderations Against (nope, not worth it)

        newFeed.sort(compareByCreatedAt);
        newFeed.splice(maxEntries);

        for (const entry of newFeed) {
            const userId = entry.userId || entry.senderUserId;
            entry.isFriend = false;
            entry.isFavorite = false;
            entry.tagColour = '';
            if (userId) {
                entry.isFriend = friendStore.friends.has(userId);
                entry.isFavorite = friendStore.localFavoriteFriends.has(userId);
                entry.tagColour =
                    userStore.customUserTags.get(userId)?.colour ?? '';
            }
            // tack on instance names
            const location = entry.location || entry.details?.location;
            if (location) {
                entry.instanceDisplayName =
                    await instanceStore.getInstanceName(location);
            }
        }
        sharedFeedData.value = newFeed;
        rebuildOnPlayerJoining(); // also sends updated feed
    }

    async function addEntry(ctx) {
        const userId = ctx.userId || ctx.senderUserId;
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        if (userId === userStore.currentUser.id) {
            return;
        }
        if (
            wristOverlaySettingsStore.hidePrivateFromFeed &&
            ctx.type === 'GPS' &&
            ctx.location === 'private'
        ) {
            return;
        }
        if (ctx.type === 'FriendRequest' || ctx.type === 'Avatar') {
            return;
        }

        let isFriend = false;
        let isFavorite = false;
        let tagColour = '';
        if (userId) {
            isFriend = friendStore.friends.has(userId);
            isFavorite = friendStore.localFavoriteFriends.has(userId);
            tagColour = userStore.customUserTags.get(userId)?.colour ?? '';
        }
        // tack on instance names
        const location = ctx.location || ctx.details?.location;
        if (location) {
            ctx.instanceDisplayName =
                await instanceStore.getInstanceName(location);
        }

        // TODO: videoPlay come through before it gets video name

        // TODO: On Location change remove OnPlayerLeft & OnPlayerJoined
        {
            // on Location change remove OnPlayerLeft
            // if (ctx.type === 'LocationDestination') {
            //     if (!ctxTime) {
            //         ctxTime = Date.parse(ctx.created_at);
            //     }
            //     currentUserLeaveTime = ctxTime;
            //     const currentUserLeaveTimeOffset = currentUserLeaveTime + 5 * 1000;
            //     for (var k = w - 1; k > -1; k--) {
            //         var feedItem = wristArr[k];
            //         const feedItemTime = Date.parse(feedItem.created_at);
            //         if (
            //             (feedItem.type === 'OnPlayerLeft' ||
            //                 feedItem.type === 'BlockedOnPlayerLeft' ||
            //                 feedItem.type === 'MutedOnPlayerLeft') &&
            //             feedItemTime >= currentUserLeaveTime &&
            //             feedItemTime <= currentUserLeaveTimeOffset
            //         ) {
            //             wristArr.splice(k, 1);
            //             w--;
            //         }
            //     }
            // }
            // on Location change remove OnPlayerJoined
            // if (ctx.type === 'Location') {
            //     if (!ctxTime) {
            //         ctxTime = Date.parse(ctx.created_at);
            //     }
            //     locationJoinTime = ctxTime;
            //     const locationJoinTimeOffset = locationJoinTime + 20 * 1000;
            //     for (let k = w - 1; k > -1; k--) {
            //         let feedItem = wristArr[k];
            //         const feedItemTime = Date.parse(feedItem.created_at);
            //         if (
            //             (feedItem.type === 'OnPlayerJoined' ||
            //                 feedItem.type === 'BlockedOnPlayerJoined' ||
            //                 feedItem.type === 'MutedOnPlayerJoined') &&
            //             feedItemTime >= locationJoinTime &&
            //             feedItemTime <= locationJoinTimeOffset
            //         ) {
            //             wristArr.splice(k, 1);
            //             w--;
            //         }
            //     }
            // }
        }

        if (ctx.type === 'OnPlayerJoined' || ctx.type === 'OnPlayerLeft') {
            moderationAgainstCheck({
                ...ctx,
                isFavorite,
                isFriend,
                tagColour
            });
        }

        if (
            wristFilter[ctx.type] &&
            (wristFilter[ctx.type] === 'On' ||
                wristFilter[ctx.type] === 'Everyone' ||
                (wristFilter[ctx.type] === 'Friends' && isFriend) ||
                (wristFilter[ctx.type] === 'VIP' && isFavorite))
        ) {
            addToSharedFeed({
                ...ctx,
                isFavorite,
                isFriend,
                tagColour
            });
        }
    }

    function addToSharedFeed(ref) {
        sharedFeedData.value.unshift(ref);
        if (sharedFeedData.value.length > maxEntries) {
            sharedFeedData.value.splice(maxEntries);
        }
        sendSharedFeed();
    }

    function moderationAgainstCheck(ctx) {
        const wristFilter = notificationsSettingsStore.sharedFeedFilters.wrist;
        // BlockedOnPlayerJoined, BlockedOnPlayerLeft, MutedOnPlayerJoined, MutedOnPlayerLeft
        for (const ref of moderationStore.cachedPlayerModerations.values()) {
            if (ref.sourceUserId !== ctx.userId) {
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
                displayName: ctx.displayName,
                userId: ctx.userId,
                isFavorite: ctx.isFavorite,
                isFriend: ctx.isFriend,
                tagColour: ctx.tagColour
            };
            notificationStore.queueGameLogNoty(entry);
            if (
                wristFilter[type] &&
                (wristFilter[type] === 'Everyone' ||
                    (wristFilter[type] === 'Friends' && ctx.isFriend) ||
                    (wristFilter[type] === 'VIP' && ctx.isFavorite))
            ) {
                addToSharedFeed(entry);
            }
        }
    }

    function addTag(userId, colour) {
        let changed = false;
        for (const entry of sharedFeedData.value) {
            if (entry.userId === userId) {
                entry.tagColour = colour;
                changed = true;
            }
        }
        if (changed) {
            sendSharedFeed();
        }
    }

    async function sendSharedFeed() {
        await AppApi.ExecuteVrOverlayFunction(
            'wristFeedUpdate',
            JSON.stringify(sharedFeedData.value)
        );
    }

    return {
        loadSharedFeed,
        sendSharedFeed,
        addEntry,
        addTag
    };
});
