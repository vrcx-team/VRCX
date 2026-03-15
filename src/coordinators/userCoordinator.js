import { reactive } from 'vue';
import { toast } from 'vue-sonner';
import { i18n } from '../plugins/i18n';

import {
    arraysMatch,
    computeUserPlatform,
    createDefaultUserRef,
    diffObjectProps,
    evictMapCache,
    extractFileId,
    findUserByDisplayName,
    getWorldName,
    isRealInstance,
    parseLocation,
    sanitizeUserJson
} from '../shared/utils';
import { getUserMemo } from './memoCoordinator';
import {
    avatarRequest,
    instanceRequest,
    queryRequest,
    userRequest
} from '../api';
import { processBulk, request } from '../services/request';
import { AppDebug } from '../services/appConfig';
import { database } from '../services/database';
import { patchUserFromEvent } from '../queries';
import { watchState } from '../services/watchState';
import { applyAvatar, showAvatarDialog } from './avatarCoordinator';
import { applyFavorite } from './favoriteCoordinator';
import {
    runAvatarSwapFlow,
    runFirstLoginFlow,
    runHomeLocationSyncFlow,
    runPostApplySyncFlow
} from './userSessionCoordinator';
import { runHandleUserUpdateFlow } from './userEventCoordinator';
import { runUpdateCurrentUserLocationFlow } from './locationCoordinator';
import { runUpdateFriendFlow } from './friendPresenceCoordinator';
import { userOnFriend } from './friendRelationshipCoordinator';
import { handleGroupRepresented } from './groupCoordinator';
import { useAppearanceSettingsStore } from '../stores/settings/appearance';
import { useAuthStore } from '../stores/auth';
import { useAvatarStore } from '../stores/avatar';
import { useFavoriteStore } from '../stores/favorite';
import { useFriendStore } from '../stores/friend';
import { useGameStore } from '../stores/game';
import { useGeneralSettingsStore } from '../stores/settings/general';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useModerationStore } from '../stores/moderation';
import { useNotificationStore } from '../stores/notification';
import { usePhotonStore } from '../stores/photon';
import { useSearchStore } from '../stores/search';
import { syncFriendSearchIndex } from './searchIndexCoordinator';
import { removeAvatarFromCache } from './avatarCoordinator';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUiStore } from '../stores/ui';
import { useUserStore } from '../stores/user';

const getRobotUrl = () =>
    `${AppDebug.endpointDomain}/file/file_0e8c4e32-7444-44ea-ade4-313c010d4bae/1/file`;

/**
 * @param {import('../types/api/user').GetUserResponse} json
 * @returns {import('../types/api/user').VrcxUser}
 */
export function applyUser(json) {
    const userStore = useUserStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const moderationStore = useModerationStore();
    const photonStore = usePhotonStore();

    const {
        currentUser,
        cachedUsers,
        currentTravelers,
        customUserTags,
        rebuildCachedUserDisplayNameIndex,
        setCachedUser,
        state,
        userDialog
    } = userStore;

    let ref = cachedUsers.get(json.id);
    let previousDisplayName = '';
    let hasPropChanged = false;
    let changedProps = {};
    sanitizeUserJson(json, getRobotUrl());
    if (typeof ref === 'undefined') {
        ref = reactive(createDefaultUserRef(json));
        if (locationStore.lastLocation.playerList.has(json.id)) {
            const player = locationStore.lastLocation.playerList.get(json.id);
            ref.$location_at = player.joinTime;
            ref.$online_for = player.joinTime;
        }
        if (ref.isFriend || ref.id === currentUser.id) {
            let newCount = state.instancePlayerCount.get(ref.location);
            if (typeof newCount === 'undefined') {
                newCount = 0;
            }
            newCount++;
            state.instancePlayerCount.set(ref.location, newCount);
        }
        const tag = customUserTags.get(json.id);
        if (tag) {
            ref.$customTag = tag.tag;
            ref.$customTagColour = tag.colour;
        } else if (ref.$customTag) {
            ref.$customTag = '';
            ref.$customTagColour = '';
        }
        const { deletedCount } = evictMapCache(
            cachedUsers,
            friendStore.friends.size + 300,
            (_value, key) => friendStore.friends.has(key),
            { logLabel: 'User cache cleanup' }
        );
        if (deletedCount > 0) {
            setCachedUser(ref, '', { skipIndex: true });
            rebuildCachedUserDisplayNameIndex();
        } else {
            setCachedUser(ref);
        }
        runUpdateFriendFlow(ref.id);
    } else {
        if (json.state !== 'online') {
            runUpdateFriendFlow(ref.id, json.state);
        }
        previousDisplayName = ref.displayName;
        const { hasPropChanged: _hasPropChanged, changedProps: _changedProps } =
            diffObjectProps(ref, json, arraysMatch);
        for (const prop in json) {
            if (typeof json[prop] !== 'undefined') {
                ref[prop] = json[prop];
            }
        }
        setCachedUser(ref, previousDisplayName);
        hasPropChanged = _hasPropChanged;
        changedProps = _changedProps;
    }
    ref.$moderations = moderationStore.getUserModerations(ref.id);
    ref.$isVRCPlus = ref.tags.includes('system_supporter');
    appearanceSettingsStore.applyUserTrustLevel(ref);
    userStore.applyUserLanguage(ref);
    ref.$platform = computeUserPlatform(ref.platform, ref.last_platform);
    // traveling
    if (ref.location === 'traveling') {
        ref.$location = parseLocation(ref.travelingToLocation);
        if (!currentTravelers.has(ref.id) && ref.travelingToLocation) {
            const travelRef = reactive({
                created_at: new Date().toJSON(),
                ...ref
            });
            currentTravelers.set(ref.id, travelRef);
            onPlayerTraveling(travelRef);
        }
    } else {
        ref.$location = parseLocation(ref.location);
        currentTravelers.delete(ref.id);
    }
    if (
        !instanceStore.cachedInstances.has(ref.$location.tag) &&
        isRealInstance(ref.location)
    ) {
        instanceRequest.getInstance({
            worldId: ref.$location.worldId,
            instanceId: ref.$location.instanceId
        });
    }
    if (
        ref.$isVRCPlus &&
        ref.badges &&
        ref.badges.every(
            (x) => x.badgeId !== 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa'
        )
    ) {
        ref.badges.unshift({
            badgeId: 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa',
            badgeName: 'Supporter',
            badgeDescription: 'Supports VRChat through VRC+',
            badgeImageUrl:
                'https://assets.vrchat.com/badges/fa/bdgai_583f6b13-91ab-4e1b-974e-ab91600b06cb.png',
            hidden: true,
            showcased: false
        });
    }
    const friendCtx = friendStore.friends.get(ref.id);
    if (friendCtx) {
        friendCtx.ref = ref;
        friendCtx.name = ref.displayName;
        syncFriendSearchIndex(friendCtx);
        friendStore.reindexSortedFriend(friendCtx);
    }
    if (ref.id === currentUser.id) {
        if (ref.status) {
            currentUser.status = ref.status;
        }
        runUpdateCurrentUserLocationFlow();
    }
    // add user ref to playerList, friendList, photonLobby, photonLobbyCurrent
    const playerListRef = locationStore.lastLocation.playerList.get(ref.id);
    if (playerListRef) {
        if (
            !locationStore.lastLocation.friendList.has(ref.id) &&
            friendStore.friends.has(ref.id)
        ) {
            const userMap = {
                displayName: ref.displayName,
                userId: ref.id,
                joinTime: playerListRef.joinTime
            };
            locationStore.lastLocation.friendList.set(ref.id, userMap);
        }
        if (
            locationStore.lastLocation.friendList.has(ref.id) &&
            !friendStore.friends.has(ref.id)
        ) {
            locationStore.lastLocation.friendList.delete(ref.id);
        }
        photonStore.photonLobby.forEach((ref1, id) => {
            if (
                typeof ref1 !== 'undefined' &&
                ref1.displayName === ref.displayName &&
                ref1 !== ref
            ) {
                photonStore.photonLobby.set(id, ref);
                if (photonStore.photonLobbyCurrent.has(id)) {
                    photonStore.photonLobbyCurrent.set(id, ref);
                }
            }
        });
        instanceStore.getCurrentInstanceUserList();
    }
    if (ref.state === 'online') {
        runUpdateFriendFlow(ref.id, ref.state);
    }
    applyFavorite('friend', ref.id);
    userOnFriend(ref);
    const D = userDialog;
    if (D.visible && D.id === ref.id) {
        D.ref = ref;
        D.note = String(ref.note || '');
        D.incomingRequest = false;
        D.outgoingRequest = false;
        if (D.ref.friendRequestStatus === 'incoming') {
            D.incomingRequest = true;
        } else if (D.ref.friendRequestStatus === 'outgoing') {
            D.outgoingRequest = true;
        }
    }
    if (hasPropChanged) {
        if (changedProps.location && changedProps.location[0] !== 'traveling') {
            const ts = Date.now();
            changedProps.location.push(ts - ref.$location_at);
            ref.$location_at = ts;
        }
        handleUserUpdate(ref, changedProps);
        if (AppDebug.debugUserDiff) {
            delete changedProps.last_login;
            delete changedProps.last_activity;
            if (Object.keys(changedProps).length !== 0) {
                console.log('>', ref.displayName, changedProps);
            }
        }
    }
    patchUserFromEvent(ref);
    return ref;
}

/**
 * @param {string} userId
 */
export function showUserDialog(userId) {
    if (
        !userId ||
        typeof userId !== 'string' ||
        userId === 'usr_00000000-0000-0000-0000-000000000000'
    ) {
        return;
    }
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const friendStore = useFriendStore();
    const moderationStore = useModerationStore();
    const favoriteStore = useFavoriteStore();
    const locationStore = useLocationStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const t = i18n.global.t;

    const { currentUser, userDialog, showUserDialogHistory } = userStore;

    const isMainDialogOpen = uiStore.openDialog({
        type: 'user',
        id: userId
    });
    const D = userDialog;
    D.visible = true;
    if (isMainDialogOpen && D.id === userId) {
        uiStore.setDialogCrumbLabel('user', D.id, D.ref?.displayName || D.id);
        userStore.applyUserDialogLocation(true);
        return;
    }
    D.id = userId;
    D.memo = '';
    D.note = '';
    getUserMemo(userId).then((memo) => {
        if (memo.userId === userId) {
            D.memo = memo.memo;
            const ref = friendStore.friends.get(userId);
            if (ref) {
                ref.memo = String(memo.memo || '');
                if (memo.memo) {
                    ref.$nickName = memo.memo.split('\n')[0];
                } else {
                    ref.$nickName = '';
                }
                syncFriendSearchIndex(ref);
            }
        }
    });

    D.loading = true;
    D.avatars = [];
    D.worlds = [];
    D.instance = {
        id: '',
        tag: '',
        $location: {},
        friendCount: 0,
        users: [],
        shortName: '',
        ref: {}
    };
    D.isRepresentedGroupLoading = true;
    D.representedGroup = {
        bannerId: '',
        bannerUrl: '',
        description: '',
        discriminator: '',
        groupId: '',
        id: '',
        iconUrl: '',
        isRepresenting: false,
        memberCount: 0,
        memberVisibility: '',
        name: '',
        ownerId: '',
        privacy: '',
        shortCode: '',
        $thumbnailUrl: '',
        $memberId: ''
    };
    D.lastSeen = '';
    D.joinCount = 0;
    D.timeSpent = 0;
    D.avatarModeration = 0;
    D.isHideAvatar = false;
    D.isShowAvatar = false;
    D.previousDisplayNames = [];
    D.dateFriended = '';
    D.unFriended = false;
    D.dateFriendedInfo = [];
    D.mutualFriendCount = 0;
    D.mutualGroupCount = 0;
    if (userId === currentUser.id) {
        getWorldName(currentUser.homeLocation).then((worldName) => {
            D.$homeLocationName = worldName;
        });
    }
    AppApi.SendIpc('ShowUserDialog', userId);
    queryRequest
        .fetch('user', {
            userId
        })
        .catch((err) => {
            D.loading = false;
            D.id = null;
            D.visible = false;
            uiStore.jumpBackDialogCrumb();
            toast.error(t('message.user.load_failed'));
            throw err;
        })
        .then((args) => {
            if (args.ref.id === D.id) {
                D.loading = false;

                D.ref = args.ref;
                uiStore.setDialogCrumbLabel(
                    'user',
                    D.id,
                    D.ref?.displayName || D.id
                );
                D.friend = friendStore.friends.get(D.id);
                D.isFriend = Boolean(D.friend);
                D.note = String(D.ref.note || '');
                D.incomingRequest = false;
                D.outgoingRequest = false;
                D.isBlock = false;
                D.isMute = false;
                D.isInteractOff = false;
                D.isMuteChat = false;
                for (const ref of moderationStore.cachedPlayerModerations.values()) {
                    if (
                        ref.targetUserId === D.id &&
                        ref.sourceUserId === currentUser.id
                    ) {
                        if (ref.type === 'block') {
                            D.isBlock = true;
                        } else if (ref.type === 'mute') {
                            D.isMute = true;
                        } else if (ref.type === 'interactOff') {
                            D.isInteractOff = true;
                        } else if (ref.type === 'muteChat') {
                            D.isMuteChat = true;
                        }
                    }
                }
                D.isFavorite =
                    favoriteStore.getCachedFavoritesByObjectId(D.id) ||
                    favoriteStore.isInAnyLocalFriendGroup(D.id);
                if (D.ref.friendRequestStatus === 'incoming') {
                    D.incomingRequest = true;
                } else if (D.ref.friendRequestStatus === 'outgoing') {
                    D.outgoingRequest = true;
                }
                let inCurrentWorld = false;
                if (locationStore.lastLocation.playerList.has(D.ref.id)) {
                    inCurrentWorld = true;
                }
                if (userId !== currentUser.id) {
                    database
                        .getUserStats(D.ref, inCurrentWorld)
                        .then(async (ref1) => {
                            if (ref1.userId === D.id) {
                                D.lastSeen = ref1.lastSeen;
                                D.joinCount = ref1.joinCount;
                                D.timeSpent = ref1.timeSpent;
                            }
                            const displayNameMap = ref1.previousDisplayNames;
                            const userNotifications =
                                await database.getFriendLogHistoryForUserId(
                                    D.id,
                                    ['DisplayName', 'Friend', 'Unfriend']
                                );
                            const dateFriendedInfo = [];
                            for (const notification of userNotifications) {
                                if (notification.userId !== D.id) {
                                    continue;
                                }
                                if (notification.type === 'DisplayName') {
                                    displayNameMap.set(
                                        notification.previousDisplayName,
                                        notification.created_at
                                    );
                                }
                                if (
                                    notification.type === 'Friend' ||
                                    (notification.type === 'Unfriend' &&
                                        !appearanceSettingsStore.hideUnfriends)
                                ) {
                                    dateFriendedInfo.unshift(notification);
                                }
                            }
                            D.dateFriendedInfo = dateFriendedInfo;
                            if (dateFriendedInfo.length > 0) {
                                const latestFriendedInfo = dateFriendedInfo[0];
                                D.unFriended =
                                    latestFriendedInfo.type === 'Unfriend';
                                D.dateFriended = latestFriendedInfo.created_at;
                            }
                            displayNameMap.forEach(
                                (updated_at, displayName) => {
                                    D.previousDisplayNames.push({
                                        displayName,
                                        updated_at
                                    });
                                }
                            );
                        });
                    AppApi.GetVRChatUserModeration(currentUser.id, userId).then(
                        (result) => {
                            D.avatarModeration = result;
                            if (result === 4) {
                                D.isHideAvatar = true;
                            } else if (result === 5) {
                                D.isShowAvatar = true;
                            }
                        }
                    );
                    if (!currentUser.hasSharedConnectionsOptOut) {
                        try {
                            queryRequest
                                .fetch('mutualCounts', { userId })
                                .then((args) => {
                                    if (args.params.userId === D.id) {
                                        D.mutualFriendCount = args.json.friends;
                                        D.mutualGroupCount = args.json.groups;
                                    }
                                });
                        } catch (error) {
                            console.error(error);
                        }
                    }
                } else {
                    D.previousDisplayNames = currentUser.pastDisplayNames;
                    database
                        .getUserStats(D.ref, inCurrentWorld)
                        .then((ref1) => {
                            if (ref1.userId === D.id) {
                                D.lastSeen = ref1.lastSeen;
                                D.joinCount = ref1.joinCount;
                                D.timeSpent = ref1.timeSpent;
                            }
                        });
                }
                queryRequest
                    .fetch('representedGroup', { userId })
                    .then((args1) => {
                        handleGroupRepresented(args1);
                    });
                D.visible = true;
                userStore.applyUserDialogLocation(true);
            }
        });
    showUserDialogHistory.delete(userId);
    showUserDialogHistory.add(userId);
}

/**
 * @param {object} ref
 */
function onPlayerTraveling(ref) {
    const userStore = useUserStore();
    const gameStore = useGameStore();
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();

    if (
        !gameStore.isGameRunning ||
        !locationStore.lastLocation.location ||
        locationStore.lastLocation.location !== ref.travelingToLocation ||
        ref.id === userStore.currentUser.id ||
        locationStore.lastLocation.playerList.has(ref.id)
    ) {
        return;
    }

    const onPlayerJoining = {
        created_at: new Date(ref.created_at).toJSON(),
        userId: ref.id,
        displayName: ref.displayName,
        type: 'OnPlayerJoining'
    };
    notificationStore.queueFeedNoty(onPlayerJoining);
}

/**
 * @param {object} ref
 * @param {object} props
 */
async function handleUserUpdate(ref, props) {
    await runHandleUserUpdateFlow(ref, props);
}

/**
 * @param fileId
 */
export async function refreshUserDialogAvatars(fileId) {
    const userStore = useUserStore();
    const avatarStore = useAvatarStore();
    const t = i18n.global.t;

    const D = userStore.userDialog;
    const userId = D.id;
    if (D.isAvatarsLoading) {
        return;
    }
    D.isAvatarsLoading = true;
    if (fileId) {
        D.loading = true;
    }
    D.avatarSorting = 'update';
    D.avatarReleaseStatus = 'all';
    const params = {
        n: 50,
        offset: 0,
        sort: 'updated',
        order: 'descending',
        releaseStatus: 'all',
        user: 'me'
    };
    for (const ref of avatarStore.cachedAvatars.values()) {
        if (ref.authorId === D.id) {
            removeAvatarFromCache(ref.id);
        }
    }
    const map = new Map();
    await processBulk({
        fn: avatarRequest.getAvatars,
        N: -1,
        params,
        handle: (args) => {
            for (const json of args.json) {
                const ref = applyAvatar(json);
                map.set(ref.id, ref);
            }
        },
        done: () => {
            const array = Array.from(map.values());
            if (userId === D.id) {
                userStore.sortUserDialogAvatars(array);
            }
            D.isAvatarsLoading = false;
            if (fileId) {
                D.loading = false;
                for (const ref of array) {
                    if (extractFileId(ref.imageUrl) === fileId) {
                        showAvatarDialog(ref.id);
                        return;
                    }
                }
                toast.error('Own avatar not found');
            }
        }
    });
}

/**
 * @param ref
 */
export async function lookupUser(ref) {
    const userStore = useUserStore();
    const searchStore = useSearchStore();

    let ctx;
    if (ref.userId) {
        showUserDialog(ref.userId);
        return;
    }
    if (!ref.displayName || ref.displayName.substring(0, 3) === 'ID:') {
        return;
    }
    const found = findUserByDisplayName(
        userStore.cachedUsers,
        ref.displayName,
        userStore.cachedUserIdsByDisplayName
    );
    if (found) {
        showUserDialog(found.id);
        return;
    }
    searchStore.setSearchText(ref.displayName);
    await searchStore.searchUserByDisplayName(ref.displayName);
    for (ctx of searchStore.searchUserResults) {
        if (ctx.displayName === ref.displayName) {
            searchStore.setSearchText('');
            searchStore.clearSearch();
            showUserDialog(ctx.id);
            return;
        }
    }
}

/**
 * @param {object} args
 */
export function handleConfig(args) {
    const authStore = useAuthStore();
    const userStore = useUserStore();

    const ref = {
        ...args.json
    };
    args.ref = ref;
    authStore.setCachedConfig(ref);
    if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
        console.error('Invalid config whiteListedAssetUrls');
    }
    AppApi.PopulateImageHosts(JSON.stringify(args.ref.whiteListedAssetUrls));
    const languages = args.ref?.constants?.LANGUAGE?.SPOKEN_LANGUAGE_OPTIONS;
    if (!languages) {
        return;
    }
    userStore.setSubsetOfLanguages(languages);
    const data = [];
    for (const key in languages) {
        const value = languages[key];
        data.push({
            key,
            value
        });
    }
    userStore.setLanguageDialogLanguages(data);
}

/**
 * @param {import('../types/api/user').GetCurrentUserResponse} json
 * @returns {import('../types/api/user').GetCurrentUserResponse}
 */
export function applyCurrentUser(json) {
    const userStore = useUserStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const authStore = useAuthStore();
    const gameStore = useGameStore();
    const locationStore = useLocationStore();

    authStore.setAttemptingAutoLogin(false);
    let ref = userStore.currentUser;
    runAvatarSwapFlow({
        json,
        ref,
        isLoggedIn: watchState.isLoggedIn
    });
    if (watchState.isLoggedIn) {
        for (const prop in json) {
            if (typeof json[prop] !== 'undefined') {
                ref[prop] = json[prop];
            }
        }
    } else {
        ref = {
            acceptedPrivacyVersion: 0,
            acceptedTOSVersion: 0,
            accountDeletionDate: null,
            accountDeletionLog: null,
            activeFriends: [],
            ageVerificationStatus: '',
            ageVerified: false,
            allowAvatarCopying: false,
            badges: [],
            bio: '',
            bioLinks: [],
            currentAvatar: '',
            currentAvatarImageUrl: '',
            currentAvatarTags: [],
            currentAvatarThumbnailImageUrl: '',
            date_joined: '',
            developerType: '',
            discordDetails: {
                global_name: '',
                id: ''
            },
            discordId: '',
            displayName: '',
            emailVerified: false,
            fallbackAvatar: '',
            friendGroupNames: [],
            friendKey: '',
            friends: [],
            googleId: '',
            hasBirthday: false,
            hasDiscordFriendsOptOut: false,
            hasEmail: false,
            hasLoggedInFromClient: false,
            hasPendingEmail: false,
            hasSharedConnectionsOptOut: false,
            hideContentFilterSettings: false,
            homeLocation: '',
            id: '',
            isAdult: true,
            isBoopingEnabled: false,
            isFriend: false,
            last_activity: '',
            last_login: '',
            last_mobile: null,
            last_platform: '',
            obfuscatedEmail: '',
            obfuscatedPendingEmail: '',
            oculusId: '',
            offlineFriends: [],
            onlineFriends: [],
            pastDisplayNames: [],
            picoId: '',
            presence: {
                avatarThumbnail: '',
                currentAvatarTags: '',
                debugflag: '',
                displayName: '',
                groups: [],
                id: '',
                instance: '',
                instanceType: '',
                platform: '',
                profilePicOverride: '',
                status: '',
                travelingToInstance: '',
                travelingToWorld: '',
                userIcon: '',
                world: '',
                ...json.presence
            },
            profilePicOverride: '',
            profilePicOverrideThumbnail: '',
            pronouns: '',
            queuedInstance: '',
            state: '',
            status: '',
            statusDescription: '',
            statusFirstTime: false,
            statusHistory: [],
            steamDetails: {},
            steamId: '',
            tags: [],
            twoFactorAuthEnabled: false,
            twoFactorAuthEnabledDate: null,
            unsubscribe: false,
            updated_at: '',
            userIcon: '',
            userLanguage: '',
            userLanguageCode: '',
            username: '',
            viveId: '',
            // VRCX
            $online_for: null,
            $offline_for: null,
            $location_at: Date.now(),
            $travelingToTime: Date.now(),
            $previousAvatarSwapTime: null,
            $homeLocation: {},
            $isVRCPlus: false,
            $isModerator: false,
            $isTroll: false,
            $isProbableTroll: false,
            $trustLevel: 'Visitor',
            $trustClass: 'x-tag-untrusted',
            $userColour: '',
            $trustSortNum: 1,
            $languages: [],
            $locationTag: '',
            $travelingToLocation: '',
            ...json
        };
        runFirstLoginFlow(ref);
    }

    ref.$isVRCPlus = ref.tags.includes('system_supporter');
    appearanceSettingsStore.applyUserTrustLevel(ref);
    userStore.applyUserLanguage(ref);
    userStore.applyPresenceLocation(ref);
    runPostApplySyncFlow(ref);
    runHomeLocationSyncFlow(ref);

    // when isGameRunning use gameLog instead of API
    const $location = parseLocation(locationStore.lastLocation.location);
    const $travelingLocation = parseLocation(
        locationStore.lastLocationDestination
    );
    let location = locationStore.lastLocation.location;
    let instanceId = $location.instanceId;
    let worldId = $location.worldId;
    let travelingToLocation = locationStore.lastLocationDestination;
    let travelingToWorld = $travelingLocation.worldId;
    let travelingToInstance = $travelingLocation.instanceId;
    if (!gameStore.isGameRunning && json.presence) {
        if (isRealInstance(json.presence.world)) {
            location = `${json.presence.world}:${json.presence.instance}`;
        } else {
            location = json.presence.world;
        }
        if (isRealInstance(json.presence.travelingToWorld)) {
            travelingToLocation = `${json.presence.travelingToWorld}:${json.presence.travelingToInstance}`;
        } else {
            travelingToLocation = json.presence.travelingToWorld;
        }
        instanceId = json.presence.instance;
        worldId = json.presence.world;
        travelingToInstance = json.presence.travelingToInstance;
        travelingToWorld = json.presence.travelingToWorld;
    }
    const userRef = applyUser({
        ageVerificationStatus: json.ageVerificationStatus,
        ageVerified: json.ageVerified,
        allowAvatarCopying: json.allowAvatarCopying,
        badges: json.badges,
        bio: json.bio,
        bioLinks: json.bioLinks,
        currentAvatarImageUrl: json.currentAvatarImageUrl,
        currentAvatarTags: json.currentAvatarTags,
        currentAvatarThumbnailImageUrl: json.currentAvatarThumbnailImageUrl,
        date_joined: json.date_joined,
        developerType: json.developerType,
        discordId: json.discordId,
        displayName: json.displayName,
        friendKey: json.friendKey,
        id: json.id,
        isFriend: json.isFriend,
        last_activity: json.last_activity,
        last_login: json.last_login,
        last_mobile: json.last_mobile,
        last_platform: json.last_platform,
        profilePicOverride: json.profilePicOverride,
        profilePicOverrideThumbnail: json.profilePicOverrideThumbnail,
        pronouns: json.pronouns,
        state: json.state,
        status: json.status,
        statusDescription: json.statusDescription,
        tags: json.tags,
        userIcon: json.userIcon,
        location,
        instanceId,
        worldId,
        travelingToLocation,
        travelingToInstance,
        travelingToWorld
    });
    // set VRCX online/offline timers
    userRef.$online_for = userStore.currentUser.$online_for;
    userRef.$offline_for = userStore.currentUser.$offline_for;
    userRef.$location_at = userStore.currentUser.$location_at;
    userRef.$travelingToTime = userStore.currentUser.$travelingToTime;
    if (json.presence?.platform) {
        userRef.platform = json.presence.platform;
    }

    return ref;
}

/**
 */
export function getCurrentUser() {
    const authStore = useAuthStore();
    return request('auth/user', {
        method: 'GET'
    }).then((json) => {
        const args = {
            json
        };
        authStore.handleCurrentUserUpdate(json);
        return args;
    });
}

/**
 * @param data
 */
export function addCustomTag(data) {
    const userStore = useUserStore();
    const sharedFeedStore = useSharedFeedStore();

    if (data.Tag) {
        userStore.customUserTags.set(data.UserId, {
            tag: data.Tag,
            colour: data.TagColour
        });
    } else {
        userStore.customUserTags.delete(data.UserId);
    }
    const feedUpdate = {
        userId: data.UserId,
        colour: data.TagColour
    };
    AppApi.ExecuteVrOverlayFunction(
        'updateHudFeedTag',
        JSON.stringify(feedUpdate)
    );
    const ref = userStore.cachedUsers.get(data.UserId);
    if (typeof ref !== 'undefined') {
        ref.$customTag = data.Tag;
        ref.$customTagColour = data.TagColour;
    }
    sharedFeedStore.addTag(data.UserId, data.TagColour);
}

/**
 */
export function updateAutoStateChange() {
    const userStore = useUserStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const gameStore = useGameStore();
    const locationStore = useLocationStore();
    const favoriteStore = useFavoriteStore();

    if (
        !generalSettingsStore.autoStateChangeEnabled ||
        !gameStore.isGameRunning ||
        !locationStore.lastLocation.playerList.size ||
        locationStore.lastLocation.location === '' ||
        locationStore.lastLocation.location === 'traveling'
    ) {
        return;
    }

    const $location = parseLocation(locationStore.lastLocation.location);
    let instanceType = $location.accessType;
    if (instanceType === 'group') {
        if ($location.groupAccessType === 'members') {
            instanceType = 'groupOnly';
        } else if ($location.groupAccessType === 'plus') {
            instanceType = 'groupPlus';
        } else {
            instanceType = 'groupPublic';
        }
    }
    if (
        generalSettingsStore.autoStateChangeInstanceTypes.length > 0 &&
        !generalSettingsStore.autoStateChangeInstanceTypes.includes(
            instanceType
        )
    ) {
        return;
    }

    let withCompany = locationStore.lastLocation.playerList.size > 1;
    if (generalSettingsStore.autoStateChangeNoFriends) {
        const selectedGroups = generalSettingsStore.autoStateChangeGroups;
        if (selectedGroups.length > 0) {
            const groupFriendIds = new Set();
            for (const ref of favoriteStore.cachedFavorites.values()) {
                if (
                    ref.type === 'friend' &&
                    selectedGroups.includes(ref.$groupKey)
                ) {
                    groupFriendIds.add(ref.favoriteId);
                }
            }
            for (const selectedKey of selectedGroups) {
                if (selectedKey.startsWith('local:')) {
                    const groupName = selectedKey.slice(6);
                    const userIds =
                        favoriteStore.localFriendFavorites[groupName];
                    if (userIds) {
                        for (let i = 0; i < userIds.length; ++i) {
                            groupFriendIds.add(userIds[i]);
                        }
                    }
                }
            }
            withCompany = false;
            for (const friendId of locationStore.lastLocation.friendList.keys()) {
                if (groupFriendIds.has(friendId)) {
                    withCompany = true;
                    break;
                }
            }
        } else {
            withCompany = locationStore.lastLocation.friendList.size >= 1;
        }
    }

    const currentStatus = userStore.currentUser.status;
    const newStatus = withCompany
        ? generalSettingsStore.autoStateChangeCompanyStatus
        : generalSettingsStore.autoStateChangeAloneStatus;

    if (currentStatus === newStatus) {
        return;
    }

    const params = { status: newStatus };
    if (withCompany && generalSettingsStore.autoStateChangeCompanyDescEnabled) {
        params.statusDescription =
            generalSettingsStore.autoStateChangeCompanyDesc;
    } else if (
        !withCompany &&
        generalSettingsStore.autoStateChangeAloneDescEnabled
    ) {
        params.statusDescription =
            generalSettingsStore.autoStateChangeAloneDesc;
    }

    userRequest.saveCurrentUser(params).then(() => {
        const text = `Status automatically changed to ${newStatus}`;
        if (AppDebug.errorNoty) {
            toast.dismiss(AppDebug.errorNoty);
        }
        AppDebug.errorNoty = toast.info(text);
        console.log(text);
    });
}
