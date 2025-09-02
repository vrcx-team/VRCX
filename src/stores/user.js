import Noty from 'noty';
import { defineStore } from 'pinia';
import Vue, { computed, reactive, watch } from 'vue';
import * as workerTimers from 'worker-timers';
import {
    avatarRequest,
    groupRequest,
    instanceRequest,
    userRequest
} from '../api';
import { $app } from '../app';
import { database } from '../service/database';
import { AppGlobal } from '../service/appConfig';
import { processBulk, request } from '../service/request';
import { watchState } from '../service/watchState';
import {
    arraysMatch,
    buildTreeData,
    compareByDisplayName,
    compareByLocationAt,
    compareByName,
    compareByUpdatedAt,
    extractFileId,
    getAllUserMemos,
    getGroupName,
    getUserMemo,
    getWorldName,
    isRealInstance,
    parseLocation,
    removeEmojis,
    replaceBioSymbols
} from '../shared/utils';
import { useAuthStore } from './auth';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useSearchStore } from './search';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useSharedFeedStore } from './sharedFeed';
import { useWorldStore } from './world';

export const useUserStore = defineStore('User', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const avatarStore = useAvatarStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const searchStore = useSearchStore();
    const gameStore = useGameStore();
    const notificationStore = useNotificationStore();
    const authStore = useAuthStore();
    const groupStore = useGroupStore();
    const feedStore = useFeedStore();
    const worldStore = useWorldStore();
    const moderationStore = useModerationStore();
    const photonStore = usePhotonStore();
    const sharedFeedStore = useSharedFeedStore();

    const state = reactive({
        currentUser: {
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
            displayName: '',
            emailVerified: false,
            fallbackAvatar: '',
            friendGroupNames: [],
            friendKey: '',
            friends: [],
            googleId: '',
            hasBirthday: false,
            hasEmail: false,
            hasLoggedInFromClient: false,
            hasPendingEmail: false,
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
                world: ''
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
            $online_for: Date.now(),
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
            $travelingToLocation: ''
        },
        currentTravelers: new Map(),
        cachedUsers: new Map(),
        userDialog: {
            visible: false,
            loading: false,
            id: '',
            ref: {},
            friend: {},
            isFriend: false,
            note: '',
            noteSaving: false,
            incomingRequest: false,
            outgoingRequest: false,
            isBlock: false,
            isMute: false,
            isHideAvatar: false,
            isShowAvatar: false,
            isInteractOff: false,
            isMuteChat: false,
            isFavorite: false,
            $location: {},
            $homeLocationName: '',
            users: [],
            instance: {},
            worlds: [],
            avatars: [],
            isWorldsLoading: false,
            isFavoriteWorldsLoading: false,
            isAvatarsLoading: false,
            isGroupsLoading: false,

            worldSorting: {
                name: 'dialog.user.worlds.sorting.updated',
                value: 'updated'
            },
            worldOrder: {
                name: 'dialog.user.worlds.order.descending',
                value: 'descending'
            },
            groupSorting: {
                name: 'dialog.user.groups.sorting.alphabetical',
                value: 'alphabetical'
            },
            avatarSorting: 'update',
            avatarReleaseStatus: 'all',
            treeData: [],
            memo: '',
            $avatarInfo: {
                ownerId: '',
                avatarName: '',
                fileCreatedAt: ''
            },
            representedGroup: {
                bannerId: '',
                bannerUrl: '',
                description: '',
                discriminator: '',
                groupId: '',
                iconUrl: '',
                id: '',
                isRepresenting: false,
                memberCount: 0,
                memberVisibility: '',
                name: '',
                ownerId: '',
                privacy: '',
                shortCode: '',
                $thumbnailUrl: '',
                $memberId: ''
            },
            isRepresentedGroupLoading: false,
            joinCount: 0,
            timeSpent: 0,
            lastSeen: '',
            avatarModeration: 0,
            previousDisplayNames: [],
            dateFriended: '',
            unFriended: false,
            dateFriendedInfo: []
        },
        showUserDialogHistory: new Set(),
        subsetOfLanguages: [],
        languageDialog: {
            visible: false,
            loading: false,
            languageChoice: false,
            languages: []
        },
        pastDisplayNameTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'updated_at',
                    order: 'descending'
                }
            },
            layout: 'table'
        },
        instancePlayerCount: new Map(),
        customUserTags: new Map(),
        lastNoteCheck: null,
        lastDbNoteDate: null,
        notes: new Map()
    });

    const currentUser = computed({
        get: () => state.currentUser,
        set: (value) => {
            state.currentUser = value;
        }
    });

    const currentTravelers = computed({
        get: () => state.currentTravelers,
        set: (value) => {
            state.currentTravelers = value;
        }
    });

    const cachedUsers = computed({
        get: () => state.cachedUsers,
        set: (value) => {
            state.cachedUsers = value;
        }
    });

    const userDialog = computed({
        get: () => state.userDialog,
        set: (value) => {
            state.userDialog = value;
        }
    });

    const subsetOfLanguages = computed({
        get: () => state.subsetOfLanguages,
        set: (value) => {
            state.subsetOfLanguages = value;
        }
    });

    const languageDialog = computed({
        get: () => state.languageDialog,
        set: (value) => {
            state.languageDialog = value;
        }
    });

    const pastDisplayNameTable = computed({
        get: () => state.pastDisplayNameTable,
        set: (value) => {
            state.pastDisplayNameTable = value;
        }
    });

    const showUserDialogHistory = computed({
        get: () => state.showUserDialogHistory,
        set: (value) => {
            state.showUserDialogHistory = value;
        }
    });

    const customUserTags = computed({
        get: () => state.customUserTags,
        set: (value) => {
            state.customUserTags = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.userDialog.visible = false;
            state.languageDialog.visible = false;
        },
        { flush: 'sync' }
    );

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                getAllUserMemos();
                initUserNotes();
            }
        },
        { flush: 'sync' }
    );

    function handleConfig(args) {
        const authStore = useAuthStore();
        const ref = {
            ...args.json
        };
        args.ref = ref;
        authStore.cachedConfig = ref;
        if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
            console.error('Invalid config whiteListedAssetUrls');
        }
        AppApi.PopulateImageHosts(
            JSON.stringify(args.ref.whiteListedAssetUrls)
        );
        const languages =
            args.ref?.constants?.LANGUAGE?.SPOKEN_LANGUAGE_OPTIONS;
        if (!languages) {
            return;
        }
        state.subsetOfLanguages = languages;
        const data = [];
        for (const key in languages) {
            const value = languages[key];
            data.push({
                key,
                value
            });
        }
        state.languageDialog.languages = data;
    }

    /**
     *
     * @param {object} ref
     */
    function applyUserLanguage(ref) {
        if (!ref || !ref.tags || !state.subsetOfLanguages) {
            return;
        }

        ref.$languages = [];
        const languagePrefix = 'language_';
        const prefixLength = languagePrefix.length;

        for (const tag of ref.tags) {
            if (tag.startsWith(languagePrefix)) {
                const key = tag.substring(prefixLength);
                const value = state.subsetOfLanguages[key];

                if (value !== undefined) {
                    ref.$languages.push({ key, value });
                }
            }
        }
    }

    /**
     *
     * @param {object} ref
     */
    function applyPresenceLocation(ref) {
        const presence = ref.presence;
        if (isRealInstance(presence.world)) {
            ref.$locationTag = `${presence.world}:${presence.instance}`;
        } else {
            ref.$locationTag = presence.world;
        }
        if (isRealInstance(presence.travelingToWorld)) {
            ref.$travelingToLocation = `${presence.travelingToWorld}:${presence.travelingToInstance}`;
        } else {
            ref.$travelingToLocation = presence.travelingToWorld;
        }
        locationStore.updateCurrentUserLocation();
    }

    const robotUrl = `${AppGlobal.endpointDomain}/file/file_0e8c4e32-7444-44ea-ade4-313c010d4bae/1/file`;
    /**
     *
     * @param {import('../types/api/user').GetUserResponse} json
     * @returns {import('../types/api/user').VrcxUser}
     */
    function applyUser(json) {
        let hasPropChanged = false;
        const changedProps = {};
        let ref = state.cachedUsers.get(json.id);
        if (json.statusDescription) {
            json.statusDescription = replaceBioSymbols(json.statusDescription);
            json.statusDescription = removeEmojis(json.statusDescription);
        }
        if (json.bio) {
            json.bio = replaceBioSymbols(json.bio);
        }
        if (json.note) {
            json.note = replaceBioSymbols(json.note);
        }
        if (json.currentAvatarImageUrl === robotUrl) {
            delete json.currentAvatarImageUrl;
            delete json.currentAvatarThumbnailImageUrl;
        }
        if (typeof ref === 'undefined') {
            ref = {
                ageVerificationStatus: '',
                ageVerified: false,
                allowAvatarCopying: false,
                badges: [],
                bio: '',
                bioLinks: [],
                currentAvatarImageUrl: '',
                currentAvatarTags: [],
                currentAvatarThumbnailImageUrl: '',
                date_joined: '',
                developerType: '',
                displayName: '',
                friendKey: '',
                friendRequestStatus: '',
                id: '',
                instanceId: '',
                isFriend: false,
                last_activity: '',
                last_login: '',
                last_mobile: null,
                last_platform: '',
                location: '',
                platform: '',
                note: null,
                profilePicOverride: '',
                profilePicOverrideThumbnail: '',
                pronouns: '',
                state: '',
                status: '',
                statusDescription: '',
                tags: [],
                travelingToInstance: '',
                travelingToLocation: '',
                travelingToWorld: '',
                userIcon: '',
                worldId: '',
                // only in bulk request
                fallbackAvatar: '',
                // VRCX
                $location: {},
                $location_at: Date.now(),
                $online_for: Date.now(),
                $travelingToTime: Date.now(),
                $offline_for: null,
                $active_for: Date.now(),
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $isProbableTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $userColour: '',
                $trustSortNum: 1,
                $languages: [],
                $joinCount: 0,
                $timeSpent: 0,
                $lastSeen: '',
                $nickName: '',
                $previousLocation: '',
                $customTag: '',
                $customTagColour: '',
                $friendNumber: 0,
                $platform: '',
                $moderations: {},
                //
                ...json
            };
            if (locationStore.lastLocation.playerList.has(json.id)) {
                // update $location_at from instance join time
                const player = locationStore.lastLocation.playerList.get(
                    json.id
                );
                ref.$location_at = player.joinTime;
                ref.$online_for = player.joinTime;
            }
            if (ref.isFriend || ref.id === state.currentUser.id) {
                // update instancePlayerCount
                let newCount = state.instancePlayerCount.get(ref.location);
                if (typeof newCount === 'undefined') {
                    newCount = 0;
                }
                newCount++;
                state.instancePlayerCount.set(ref.location, newCount);
            }
            const tag = state.customUserTags.get(json.id);
            if (tag) {
                ref.$customTag = tag.tag;
                ref.$customTagColour = tag.colour;
            } else if (ref.$customTag) {
                ref.$customTag = '';
                ref.$customTagColour = '';
            }
            state.cachedUsers.set(ref.id, ref);
        } else {
            if (json.state !== 'online') {
                // offline event before GPS to offline location
                friendStore.updateFriend(ref.id, json.state);
            }
            for (const prop in ref) {
                if (typeof json[prop] === 'undefined') {
                    continue;
                }
                // Only compare primitive values
                if (ref[prop] === null || typeof ref[prop] !== 'object') {
                    changedProps[prop] = true;
                }
            }
            for (const prop in json) {
                if (typeof ref[prop] === 'undefined') {
                    continue;
                }
                if (Array.isArray(json[prop]) && Array.isArray(ref[prop])) {
                    if (!arraysMatch(json[prop], ref[prop])) {
                        changedProps[prop] = true;
                    }
                } else if (
                    json[prop] === null ||
                    typeof json[prop] !== 'object'
                ) {
                    changedProps[prop] = true;
                }
            }
            for (const prop in changedProps) {
                const asIs = ref[prop];
                const toBe = json[prop];
                if (asIs === toBe) {
                    delete changedProps[prop];
                } else {
                    hasPropChanged = true;
                    changedProps[prop] = [toBe, asIs];
                }
            }
            Object.assign(ref, json);
        }
        ref.$moderations = moderationStore.getUserModerations(ref.id);
        ref.$isVRCPlus = ref.tags.includes('system_supporter');
        appearanceSettingsStore.applyUserTrustLevel(ref);
        applyUserLanguage(ref);
        if (
            ref.platform &&
            ref.platform !== 'offline' &&
            ref.platform !== 'web'
        ) {
            ref.$platform = ref.platform;
        } else {
            ref.$platform = ref.last_platform;
        }
        // traveling
        if (ref.location === 'traveling') {
            ref.$location = parseLocation(ref.travelingToLocation);
            if (
                !state.currentTravelers.has(ref.id) &&
                ref.travelingToLocation
            ) {
                const travelRef = {
                    created_at: new Date().toJSON(),
                    ...ref
                };
                state.currentTravelers.set(ref.id, travelRef);
                sharedFeedStore.sharedFeed.pendingUpdate = true;
                sharedFeedStore.updateSharedFeed(false);
                onPlayerTraveling(travelRef);
            }
        } else {
            ref.$location = parseLocation(ref.location);
            if (state.currentTravelers.has(ref.id)) {
                state.currentTravelers.delete(ref.id);
                sharedFeedStore.sharedFeed.pendingUpdate = true;
                sharedFeedStore.updateSharedFeed(false);
            }
        }
        if (
            ref.$isVRCPlus &&
            ref.badges &&
            ref.badges.every(
                (x) => x.badgeId !== 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa'
            )
        ) {
            // I doubt this will last long
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
        }
        if (ref.id === state.currentUser.id) {
            if (ref.status) {
                state.currentUser.status = ref.status;
            }
            locationStore.updateCurrentUserLocation();
        }
        // add user ref to playerList, friendList, photonLobby, photonLobbyCurrent
        const playerListRef = locationStore.lastLocation.playerList.get(ref.id);
        if (playerListRef) {
            // add/remove friends from lastLocation.friendList
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
            friendStore.updateFriend(ref.id, ref.state); // online/offline
        }
        favoriteStore.applyFavorite('friend', ref.id);
        friendStore.userOnFriend(ref);
        const D = state.userDialog;
        if (D.visible && D.id === ref.id) {
            D.ref = ref;
            D.note = String(ref.note || '');
            D.noteSaving = false;
            D.incomingRequest = false;
            D.outgoingRequest = false;
            if (D.ref.friendRequestStatus === 'incoming') {
                D.incomingRequest = true;
            } else if (D.ref.friendRequestStatus === 'outgoing') {
                D.outgoingRequest = true;
            }
            // refresh user dialog JSON tab
            refreshUserDialogTreeData();
        }
        if (hasPropChanged) {
            if (
                changedProps.location &&
                changedProps.location[0] !== 'traveling'
            ) {
                const ts = Date.now();
                changedProps.location.push(ts - ref.$location_at);
                ref.$location_at = ts;
            }
            handleUserUpdate(ref, changedProps);
            if (AppGlobal.debugUserDiff) {
                delete changedProps.last_login;
                delete changedProps.last_activity;
                if (Object.keys(changedProps).length !== 0) {
                    console.log('>', ref.displayName, changedProps);
                }
            }
        }
        return ref;
    }

    /**
     *
     * @param {string} userId
     */
    function showUserDialog(userId) {
        if (!userId) {
            return;
        }
        const D = state.userDialog;
        D.id = userId;
        D.treeData = [];
        D.memo = '';
        D.note = '';
        D.noteSaving = false;
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
                }
            }
        });
        D.visible = true;
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
        if (userId === state.currentUser.id) {
            getWorldName(state.currentUser.homeLocation).then((worldName) => {
                D.$homeLocationName = worldName;
            });
        }
        AppApi.SendIpc('ShowUserDialog', userId);
        userRequest
            .getCachedUser({
                userId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                $app.$message({
                    message: 'Failed to load user',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (args.ref.id === D.id) {
                    requestAnimationFrame(() => {
                        D.ref = args.ref;
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
                                ref.sourceUserId === state.currentUser.id
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
                            favoriteStore.cachedFavoritesByObjectId.has(D.id);
                        if (D.ref.friendRequestStatus === 'incoming') {
                            D.incomingRequest = true;
                        } else if (D.ref.friendRequestStatus === 'outgoing') {
                            D.outgoingRequest = true;
                        }
                        applyUserDialogLocation(true);

                        userRequest.getUser(args.params);
                        let inCurrentWorld = false;
                        if (
                            locationStore.lastLocation.playerList.has(D.ref.id)
                        ) {
                            inCurrentWorld = true;
                        }
                        if (userId !== state.currentUser.id) {
                            database
                                .getUserStats(D.ref, inCurrentWorld)
                                .then((ref1) => {
                                    if (ref1.userId === D.id) {
                                        D.lastSeen = ref1.lastSeen;
                                        D.joinCount = ref1.joinCount;
                                        D.timeSpent = ref1.timeSpent;
                                    }
                                    const displayNameMap =
                                        ref1.previousDisplayNames;
                                    friendStore.friendLogTable.data.forEach(
                                        (ref2) => {
                                            if (ref2.userId === D.id) {
                                                if (
                                                    ref2.type === 'DisplayName'
                                                ) {
                                                    displayNameMap.set(
                                                        ref2.previousDisplayName,
                                                        ref2.created_at
                                                    );
                                                }
                                                if (!D.dateFriended) {
                                                    if (
                                                        ref2.type === 'Unfriend'
                                                    ) {
                                                        D.unFriended = true;
                                                        if (
                                                            !appearanceSettingsStore.hideUnfriends
                                                        ) {
                                                            D.dateFriended =
                                                                ref2.created_at;
                                                        }
                                                    }
                                                    if (
                                                        ref2.type === 'Friend'
                                                    ) {
                                                        D.unFriended = false;
                                                        D.dateFriended =
                                                            ref2.created_at;
                                                    }
                                                }
                                                if (
                                                    ref2.type === 'Friend' ||
                                                    (ref2.type === 'Unfriend' &&
                                                        !appearanceSettingsStore.hideUnfriends)
                                                ) {
                                                    D.dateFriendedInfo.push(
                                                        ref2
                                                    );
                                                }
                                            }
                                        }
                                    );
                                    const displayNameMapSorted = new Map(
                                        [...displayNameMap.entries()].sort(
                                            (a, b) => b[1] - a[1]
                                        )
                                    );
                                    D.previousDisplayNames = Array.from(
                                        displayNameMapSorted.keys()
                                    );
                                });
                            AppApi.GetVRChatUserModeration(
                                state.currentUser.id,
                                userId
                            ).then((result) => {
                                D.avatarModeration = result;
                                if (result === 4) {
                                    D.isHideAvatar = true;
                                } else if (result === 5) {
                                    D.isShowAvatar = true;
                                }
                            });
                        } else {
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
                        groupRequest
                            .getRepresentedGroup({ userId })
                            .then((args1) => {
                                groupStore.handleGroupRepresented(args1);
                            });
                        D.loading = false;
                    });
                }
            });
        state.showUserDialogHistory.delete(userId);
        state.showUserDialogHistory.add(userId);
        searchStore.quickSearchItems = searchStore.quickSearchUserHistory();
    }

    /**
     *
     * @param {object} ref
     */
    function onPlayerTraveling(ref) {
        if (
            !gameStore.isGameRunning ||
            !locationStore.lastLocation.location ||
            locationStore.lastLocation.location !== ref.travelingToLocation ||
            ref.id === state.currentUser.id ||
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
     *
     * @param {boolean} updateInstanceOccupants
     */
    function applyUserDialogLocation(updateInstanceOccupants = false) {
        let addUser;
        let friend;
        let ref;
        const D = state.userDialog;
        if (!D.visible) {
            return;
        }
        const L = parseLocation(D.ref.$location?.tag);
        if (updateInstanceOccupants && L.isRealInstance) {
            instanceRequest.getInstance({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
        }
        D.$location = L;
        if (L.userId) {
            ref = state.cachedUsers.get(L.userId);
            if (typeof ref === 'undefined') {
                userRequest
                    .getUser({
                        userId: L.userId
                    })
                    .then((args) => {
                        Vue.set(L, 'user', args.ref);
                    });
            } else {
                L.user = ref;
            }
        }
        const users = [];
        let friendCount = 0;
        const playersInInstance = locationStore.lastLocation.playerList;
        const cachedCurrentUser = state.cachedUsers.get(state.currentUser.id);
        const currentLocation = cachedCurrentUser.$location.tag;
        if (!L.isOffline && currentLocation === L.tag) {
            ref = state.cachedUsers.get(state.currentUser.id);
            if (typeof ref !== 'undefined') {
                users.push(ref); // add self
            }
        }
        // dont use gamelog when using api location
        if (
            locationStore.lastLocation.location === L.tag &&
            playersInInstance.size > 0
        ) {
            const friendsInInstance = locationStore.lastLocation.friendList;
            for (friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                addUser = !users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = state.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        users.push(ref);
                    }
                }
            }
            friendCount = users.length - 1;
        }
        if (!L.isOffline) {
            for (friend of friendStore.friends.values()) {
                if (typeof friend.ref === 'undefined') {
                    continue;
                }
                if (
                    friend.ref.location === locationStore.lastLocation.location
                ) {
                    // don't add friends to currentUser gameLog instance (except when traveling)
                    continue;
                }
                if (friend.ref.$location.tag === L.tag) {
                    if (
                        friend.state !== 'online' &&
                        friend.ref.location === 'private'
                    ) {
                        // don't add offline friends to private instances
                        continue;
                    }
                    // if friend isn't in instance add them
                    addUser = !users.some(function (user) {
                        return friend.name === user.displayName;
                    });
                    if (addUser) {
                        users.push(friend.ref);
                    }
                }
            }
            friendCount = users.length;
        }
        if (appearanceSettingsStore.instanceUsersSortAlphabetical) {
            users.sort(compareByDisplayName);
        } else {
            users.sort(compareByLocationAt);
        }
        D.users = users;
        if (
            L.worldId &&
            currentLocation === L.tag &&
            playersInInstance.size > 0
        ) {
            D.instance = {
                id: L.instanceId,
                tag: L.tag,
                $location: L,
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
        if (!L.isRealInstance) {
            D.instance = {
                id: L.instanceId,
                tag: L.tag,
                $location: L,
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
        const instanceRef = instanceStore.cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            D.instance.ref = instanceRef;
        }
        D.instance.friendCount = friendCount;
    }

    function sortUserDialogAvatars(array) {
        const D = state.userDialog;
        if (D.avatarSorting === 'update') {
            array.sort(compareByUpdatedAt);
        } else {
            array.sort(compareByName);
        }
        D.avatars = array;
    }

    function refreshUserDialogAvatars(fileId) {
        const D = state.userDialog;
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
                avatarStore.cachedAvatars.delete(ref.id);
            }
        }
        const map = new Map();
        processBulk({
            fn: avatarRequest.getAvatars,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const ref = avatarStore.applyAvatar(json);
                    map.set(ref.id, ref);
                }
            },
            done: () => {
                const array = Array.from(map.values());
                sortUserDialogAvatars(array);
                D.isAvatarsLoading = false;
                if (fileId) {
                    D.loading = false;
                    for (const ref of array) {
                        if (extractFileId(ref.imageUrl) === fileId) {
                            avatarStore.showAvatarDialog(ref.id);
                            return;
                        }
                    }
                    $app.$message({
                        message: 'Own avatar not found',
                        type: 'error'
                    });
                }
            }
        });
    }

    function refreshUserDialogTreeData() {
        const D = state.userDialog;
        if (D.id === state.currentUser.id) {
            const treeData = {
                ...state.currentUser,
                ...D.ref
            };
            D.treeData = buildTreeData(treeData);
            return;
        }
        D.treeData = buildTreeData(D.ref);
    }

    async function lookupUser(ref) {
        let ctx;
        if (ref.userId) {
            showUserDialog(ref.userId);
            return;
        }
        if (!ref.displayName || ref.displayName.substring(0, 3) === 'ID:') {
            return;
        }
        for (ctx of state.cachedUsers.values()) {
            if (ctx.displayName === ref.displayName) {
                showUserDialog(ctx.id);
                return;
            }
        }
        searchStore.searchText = ref.displayName;
        await searchStore.searchUserByDisplayName(ref.displayName);
        for (ctx of searchStore.searchUserResults) {
            if (ctx.displayName === ref.displayName) {
                searchStore.searchText = '';
                searchStore.clearSearch();
                showUserDialog(ctx.id);
                return;
            }
        }
    }

    /**
     * @param {object} ref
     * @param {object} props
     * @returns {Promise<void>}
     */
    async function handleUserUpdate(ref, props) {
        let feed;
        let newLocation;
        let previousLocation;
        const friend = friendStore.friends.get(ref.id);
        if (typeof friend === 'undefined') {
            return;
        }
        if (props.location) {
            // update instancePlayerCount
            previousLocation = props.location[1];
            newLocation = props.location[0];
            let oldCount = state.instancePlayerCount.get(previousLocation);
            if (typeof oldCount !== 'undefined') {
                oldCount--;
                if (oldCount <= 0) {
                    state.instancePlayerCount.delete(previousLocation);
                } else {
                    state.instancePlayerCount.set(previousLocation, oldCount);
                }
            }
            let newCount = state.instancePlayerCount.get(newLocation);
            if (typeof newCount === 'undefined') {
                newCount = 0;
            }
            newCount++;
            state.instancePlayerCount.set(newLocation, newCount);
        }
        if (props.location && ref.id === state.userDialog.id) {
            // update user dialog instance occupants
            applyUserDialogLocation(true);
        }
        if (
            props.location &&
            ref.$location.worldId === worldStore.worldDialog.id
        ) {
            instanceStore.applyWorldDialogInstances();
        }
        if (
            props.location &&
            ref.$location.groupId === groupStore.groupDialog.id
        ) {
            instanceStore.applyGroupDialogInstances();
        }
        if (
            !props.state &&
            props.location &&
            props.location[0] !== 'offline' &&
            props.location[0] !== '' &&
            props.location[1] !== 'offline' &&
            props.location[1] !== '' &&
            props.location[0] !== 'traveling'
        ) {
            // skip GPS if user is offline or traveling
            previousLocation = props.location[1];
            newLocation = props.location[0];
            let time = props.location[2];
            if (previousLocation === 'traveling' && ref.$previousLocation) {
                previousLocation = ref.$previousLocation;
                const travelTime = Date.now() - ref.$travelingToTime;
                time -= travelTime;
                if (time < 0) {
                    time = 0;
                }
            }
            if (AppGlobal.debugFriendState && previousLocation) {
                console.log(
                    `${ref.displayName} GPS ${previousLocation} -> ${newLocation}`
                );
            }
            if (previousLocation === 'offline') {
                previousLocation = '';
            }
            if (!previousLocation) {
                // no previous location
                if (AppGlobal.debugFriendState) {
                    console.log(
                        ref.displayName,
                        'Ignoring GPS, no previous location',
                        newLocation
                    );
                }
            } else if (ref.$previousLocation === newLocation) {
                // location traveled to is the same
                ref.$location_at = Date.now() - time;
            } else {
                const worldName = await getWorldName(newLocation);
                const groupName = await getGroupName(newLocation);
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'GPS',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location: newLocation,
                    worldName,
                    groupName,
                    previousLocation,
                    time
                };
                feedStore.addFeed(feed);
                database.addGPSToDatabase(feed);
                friendStore.updateFriendGPS(ref.id);
                // clear previousLocation after GPS
                ref.$previousLocation = '';
                ref.$travelingToTime = Date.now();
            }
        }
        if (
            props.location &&
            props.location[0] === 'traveling' &&
            props.location[1] !== 'traveling'
        ) {
            // store previous location when user is traveling
            ref.$previousLocation = props.location[1];
            ref.$travelingToTime = Date.now();
            friendStore.updateFriendGPS(ref.id);
        }
        let imageMatches = false;
        if (
            props.currentAvatarThumbnailImageUrl &&
            props.currentAvatarThumbnailImageUrl[0] &&
            props.currentAvatarThumbnailImageUrl[1] &&
            props.currentAvatarThumbnailImageUrl[0] ===
                props.currentAvatarThumbnailImageUrl[1]
        ) {
            imageMatches = true;
        }
        if (
            (((props.currentAvatarImageUrl ||
                props.currentAvatarThumbnailImageUrl) &&
                !ref.profilePicOverride) ||
                props.currentAvatarTags) &&
            !imageMatches
        ) {
            let currentAvatarImageUrl = '';
            let previousCurrentAvatarImageUrl = '';
            let currentAvatarThumbnailImageUrl = '';
            let previousCurrentAvatarThumbnailImageUrl = '';
            let currentAvatarTags = '';
            let previousCurrentAvatarTags = '';
            if (props.currentAvatarImageUrl) {
                currentAvatarImageUrl = props.currentAvatarImageUrl[0];
                previousCurrentAvatarImageUrl = props.currentAvatarImageUrl[1];
            } else {
                currentAvatarImageUrl = ref.currentAvatarImageUrl;
                previousCurrentAvatarImageUrl = ref.currentAvatarImageUrl;
            }
            if (props.currentAvatarThumbnailImageUrl) {
                currentAvatarThumbnailImageUrl =
                    props.currentAvatarThumbnailImageUrl[0];
                previousCurrentAvatarThumbnailImageUrl =
                    props.currentAvatarThumbnailImageUrl[1];
            } else {
                currentAvatarThumbnailImageUrl =
                    ref.currentAvatarThumbnailImageUrl;
                previousCurrentAvatarThumbnailImageUrl =
                    ref.currentAvatarThumbnailImageUrl;
            }
            if (props.currentAvatarTags) {
                currentAvatarTags = props.currentAvatarTags[0];
                previousCurrentAvatarTags = props.currentAvatarTags[1];
                if (
                    ref.profilePicOverride &&
                    !props.currentAvatarThumbnailImageUrl
                ) {
                    // forget last seen avatar
                    ref.currentAvatarImageUrl = '';
                    ref.currentAvatarThumbnailImageUrl = '';
                }
            } else {
                currentAvatarTags = ref.currentAvatarTags;
                previousCurrentAvatarTags = ref.currentAvatarTags;
            }
            if (
                generalSettingsStore.logEmptyAvatars ||
                ref.currentAvatarImageUrl
            ) {
                let avatarInfo = {
                    ownerId: '',
                    avatarName: ''
                };
                try {
                    avatarInfo = await avatarStore.getAvatarName(
                        currentAvatarImageUrl
                    );
                } catch (err) {
                    console.log(err);
                }
                let previousAvatarInfo = {
                    ownerId: '',
                    avatarName: ''
                };
                try {
                    previousAvatarInfo = await avatarStore.getAvatarName(
                        previousCurrentAvatarImageUrl
                    );
                } catch (err) {
                    console.log(err);
                }
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'Avatar',
                    userId: ref.id,
                    displayName: ref.displayName,
                    ownerId: avatarInfo.ownerId,
                    previousOwnerId: previousAvatarInfo.ownerId,
                    avatarName: avatarInfo.avatarName,
                    previousAvatarName: previousAvatarInfo.avatarName,
                    currentAvatarImageUrl,
                    currentAvatarThumbnailImageUrl,
                    previousCurrentAvatarImageUrl,
                    previousCurrentAvatarThumbnailImageUrl,
                    currentAvatarTags,
                    previousCurrentAvatarTags
                };
                feedStore.addFeed(feed);
                database.addAvatarToDatabase(feed);
            }
        }
        // if status is offline, ignore status and statusDescription
        if (
            (props.status &&
                props.status[0] !== 'offline' &&
                props.status[1] !== 'offline') ||
            (!props.status && props.statusDescription)
        ) {
            let status = '';
            let previousStatus = '';
            let statusDescription = '';
            let previousStatusDescription = '';
            if (props.status) {
                if (props.status[0]) {
                    status = props.status[0];
                }
                if (props.status[1]) {
                    previousStatus = props.status[1];
                }
            } else if (ref.status) {
                status = ref.status;
                previousStatus = ref.status;
            }
            if (props.statusDescription) {
                if (props.statusDescription[0]) {
                    statusDescription = props.statusDescription[0];
                }
                if (props.statusDescription[1]) {
                    previousStatusDescription = props.statusDescription[1];
                }
            } else if (ref.statusDescription) {
                statusDescription = ref.statusDescription;
                previousStatusDescription = ref.statusDescription;
            }
            feed = {
                created_at: new Date().toJSON(),
                type: 'Status',
                userId: ref.id,
                displayName: ref.displayName,
                status,
                statusDescription,
                previousStatus,
                previousStatusDescription
            };
            feedStore.addFeed(feed);
            database.addStatusToDatabase(feed);
        }
        if (props.bio && props.bio[0] && props.bio[1]) {
            let bio = '';
            let previousBio = '';
            if (props.bio[0]) {
                bio = props.bio[0];
            }
            if (props.bio[1]) {
                previousBio = props.bio[1];
            }
            feed = {
                created_at: new Date().toJSON(),
                type: 'Bio',
                userId: ref.id,
                displayName: ref.displayName,
                bio,
                previousBio
            };
            feedStore.addFeed(feed);
            database.addBioToDatabase(feed);
        }
        if (
            props.note &&
            props.note[0] !== null &&
            props.note[0] !== props.note[1]
        ) {
            checkNote(ref.id, props.note[0]);
        }
    }

    function updateAutoStateChange() {
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
            withCompany = locationStore.lastLocation.friendList.size >= 1;
        }

        const currentStatus = state.currentUser.status;
        const newStatus = withCompany
            ? generalSettingsStore.autoStateChangeCompanyStatus
            : generalSettingsStore.autoStateChangeAloneStatus;

        if (currentStatus === newStatus) {
            return;
        }

        userRequest
            .saveCurrentUser({
                status: newStatus
            })
            .then(() => {
                const text = `Status automaticly changed to ${newStatus}`;
                if (AppGlobal.errorNoty) {
                    AppGlobal.errorNoty.close();
                }
                AppGlobal.errorNoty = new Noty({
                    type: 'info',
                    text
                });
                AppGlobal.errorNoty.show();
                console.log(text);
            });
    }

    function addCustomTag(data) {
        if (data.Tag) {
            state.customUserTags.set(data.UserId, {
                tag: data.Tag,
                colour: data.TagColour
            });
        } else {
            state.customUserTags.delete(data.UserId);
        }
        const feedUpdate = {
            userId: data.UserId,
            colour: data.TagColour
        };
        AppApi.ExecuteVrOverlayFunction(
            'updateHudFeedTag',
            JSON.stringify(feedUpdate)
        );
        const ref = state.cachedUsers.get(data.UserId);
        if (typeof ref !== 'undefined') {
            ref.$customTag = data.Tag;
            ref.$customTagColour = data.TagColour;
        }
        sharedFeedStore.updateSharedFeed(true);
    }

    async function initUserNotes() {
        state.lastNoteCheck = new Date();
        state.lastDbNoteDate = null;
        state.notes.clear();
        try {
            // todo: get users from store
            const users = state.cachedUsers;
            const dbNotes = await database.getAllUserNotes();
            for (const note of dbNotes) {
                state.notes.set(note.userId, note.note);
                const user = users.get(note.userId);
                if (user) {
                    user.note = note.note;
                }
                if (
                    !state.lastDbNoteDate ||
                    state.lastDbNoteDate < note.createdAt
                ) {
                    state.lastDbNoteDate = note.createdAt;
                }
            }
            await getLatestUserNotes();
        } catch (error) {
            console.error('Error initializing user notes:', error);
        }
    }

    async function getLatestUserNotes() {
        state.lastNoteCheck = new Date();
        const params = {
            offset: 0,
            n: 10 // start light
        };
        const newNotes = new Map();
        let done = false;
        try {
            for (let i = 0; i < 100; i++) {
                params.offset = i * params.n;
                const args = await userRequest.getUserNotes(params);
                for (const note of args.json) {
                    if (
                        state.lastDbNoteDate &&
                        state.lastDbNoteDate > note.createdAt
                    ) {
                        done = true;
                    }
                    if (
                        !state.lastDbNoteDate ||
                        state.lastDbNoteDate < note.createdAt
                    ) {
                        state.lastDbNoteDate = note.createdAt;
                    }
                    note.note = replaceBioSymbols(note.note);
                    newNotes.set(note.targetUserId, note);
                }
                if (done || args.json.length === 0) {
                    break;
                }
                params.n = 100; // crank it after first run
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 1000);
                });
            }
        } catch (error) {
            console.error('Error fetching user notes:', error);
        }
        // todo: get users from store
        const users = state.cachedUsers;

        for (const note of newNotes.values()) {
            const newNote = {
                userId: note.targetUserId,
                displayName: note.targetUser?.displayName || note.targetUserId,
                note: note.note,
                createdAt: note.createdAt
            };
            await database.addUserNote(newNote);
            state.notes.set(note.targetUserId, note.note);
            const user = users.get(note.targetUserId);
            if (user) {
                user.note = note.note;
            }
        }
    }

    async function checkNote(userId, newNote) {
        // last check was more than than 5 minutes ago
        if (
            !state.lastNoteCheck ||
            state.lastNoteCheck.getTime() + 5 * 60 * 1000 > Date.now()
        ) {
            return;
        }
        const existingNote = state.notes.get(userId);
        if (typeof existingNote !== 'undefined' && !newNote) {
            console.log('deleting note', userId);
            state.notes.delete(userId);
            await database.deleteUserNote(userId);
            return;
        }
        if (typeof existingNote === 'undefined' || existingNote !== newNote) {
            console.log('detected note change', userId, newNote);
            await getLatestUserNotes();
        }
    }

    function getCurrentUser() {
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
     * @param {import('../types/api/user').GetCurrentUserResponse} json
     * @returns {import('../types/api/user').GetCurrentUserResponse}
     */
    function applyCurrentUser(json) {
        authStore.attemptingAutoLogin = false;
        let ref = state.currentUser;
        if (watchState.isLoggedIn) {
            if (json.currentAvatar !== ref.currentAvatar) {
                avatarStore.addAvatarToHistory(json.currentAvatar);
                if (gameStore.isGameRunning) {
                    avatarStore.addAvatarWearTime(ref.currentAvatar);
                    ref.$previousAvatarSwapTime = Date.now();
                }
            }
            Object.assign(ref, json);
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
                displayName: '',
                emailVerified: false,
                fallbackAvatar: '',
                friendGroupNames: [],
                friendKey: '',
                friends: [],
                googleId: '',
                hasBirthday: false,
                hasEmail: false,
                hasLoggedInFromClient: false,
                hasPendingEmail: false,
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
                $online_for: Date.now(),
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
            if (gameStore.isGameRunning) {
                ref.$previousAvatarSwapTime = Date.now();
            }
            state.cachedUsers.clear(); // clear before running applyUser
            state.currentUser = ref;
            authStore.loginComplete();
        }

        ref.$isVRCPlus = ref.tags.includes('system_supporter');
        appearanceSettingsStore.applyUserTrustLevel(ref);
        applyUserLanguage(ref);
        applyPresenceLocation(ref);
        groupStore.applyPresenceGroups(ref);
        instanceStore.applyQueuedInstance(ref.queuedInstance);
        friendStore.updateUserCurrentStatus(ref);
        friendStore.updateFriendships(ref);
        if (ref.homeLocation !== ref.$homeLocation?.tag) {
            ref.$homeLocation = parseLocation(ref.homeLocation);
            // apply home location name to user dialog
            if (state.userDialog.visible && state.userDialog.id === ref.id) {
                getWorldName(state.currentUser.homeLocation).then(
                    (worldName) => {
                        state.userDialog.$homeLocationName = worldName;
                    }
                );
            }
        }
        if (ref.pastDisplayNames) {
            state.pastDisplayNameTable.data = ref.pastDisplayNames;
        }

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
            displayName: json.displayName,
            friendKey: json.friendKey,
            // json.friendRequestStatus - missing from currentUser
            id: json.id,
            // instanceId - missing from currentUser
            isFriend: json.isFriend,
            last_activity: json.last_activity,
            last_login: json.last_login,
            last_mobile: json.last_mobile,
            last_platform: json.last_platform,
            // location - missing from currentUser
            // note - missing from currentUser
            // platform - not always present
            profilePicOverride: json.profilePicOverride,
            profilePicOverrideThumbnail: json.profilePicOverrideThumbnail,
            pronouns: json.pronouns,
            state: json.state,
            status: json.status,
            statusDescription: json.statusDescription,
            tags: json.tags,
            // travelingToInstance - missing from currentUser
            // travelingToLocation - missing from currentUser
            // travelingToWorld - missing from currentUser
            userIcon: json.userIcon,
            // worldId - missing from currentUser
            // fallbackAvatar - gone from user

            // Location from gameLog/presence
            location,
            instanceId,
            worldId,
            travelingToLocation,
            travelingToInstance,
            travelingToWorld

            // $online_for: state.currentUser.$online_for,
            // $offline_for: state.currentUser.$offline_for,
            // $location_at: state.currentUser.$location_at,
            // $travelingToTime: state.currentUser.$travelingToTime
        });
        // set VRCX online/offline timers
        userRef.$online_for = state.currentUser.$online_for;
        userRef.$offline_for = state.currentUser.$offline_for;
        userRef.$location_at = state.currentUser.$location_at;
        userRef.$travelingToTime = state.currentUser.$travelingToTime;
        if (json.presence?.platform) {
            userRef.platform = json.presence.platform;
        }

        return ref;
    }

    return {
        state,

        currentUser,
        currentTravelers,
        userDialog,
        subsetOfLanguages,
        languageDialog,
        pastDisplayNameTable,
        showUserDialogHistory,
        customUserTags,
        cachedUsers,
        applyCurrentUser,
        applyUser,
        showUserDialog,
        applyUserDialogLocation,
        sortUserDialogAvatars,
        refreshUserDialogAvatars,
        refreshUserDialogTreeData,
        lookupUser,
        updateAutoStateChange,
        addCustomTag,
        initUserNotes,
        getCurrentUser,
        handleConfig,

        checkNote
    };
});
