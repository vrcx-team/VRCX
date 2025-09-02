import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { favoriteRequest } from '../api';
import { $app } from '../app';
import { database } from '../service/database';
import { processBulk } from '../service/request';
import { watchState } from '../service/watchState';
import { compareByName, removeFromArray } from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useFriendStore } from './friend';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { useI18n } from 'vue-i18n-bridge';

export const useFavoriteStore = defineStore('Favorite', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const userStore = useUserStore();

    const { t } = useI18n();

    const state = reactive({
        isFavoriteGroupLoading: false,
        favoriteFriendGroups: [],
        cachedFavoriteGroups: new Map(),
        favoriteLimits: {
            maxFavoriteGroups: {
                avatar: 6,
                friend: 3,
                world: 4
            },
            maxFavoritesPerGroup: {
                avatar: 50,
                friend: 150,
                world: 100
            }
        },
        cachedFavoriteGroupsByTypeName: new Map(),
        cachedFavorites: new Map(),
        favoriteWorldGroups: [],
        favoriteAvatarGroups: [],
        isFavoriteLoading: false,
        friendImportDialogInput: '',
        worldImportDialogInput: '',
        avatarImportDialogInput: '',
        worldImportDialogVisible: false,
        avatarImportDialogVisible: false,
        friendImportDialogVisible: false,
        localWorldFavorites: {},
        localAvatarFavorites: {},
        localAvatarFavoritesList: [],
        localAvatarFavoriteGroups: [],
        favoriteDialog: {
            visible: false,
            loading: false,
            type: '',
            objectId: '',
            currentGroup: {}
        },
        favoriteObjects: new Map(),
        localWorldFavoriteGroups: [],
        localWorldFavoritesList: [],
        favoriteFriends_: [],
        favoriteFriendsSorted: [],
        favoriteWorlds_: [],
        favoriteWorldsSorted: [],
        favoriteAvatars_: [],
        favoriteAvatarsSorted: [],
        sortFavoriteFriends: false,
        sortFavoriteWorlds: false,
        sortFavoriteAvatars: false,
        cachedFavoritesByObjectId: new Map()
    });

    const favoriteFriends = computed(() => {
        if (state.sortFavoriteFriends) {
            state.sortFavoriteFriends = false;
            state.favoriteFriendsSorted.sort(compareByName);
        }
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteFriends_;
        }
        return state.favoriteFriendsSorted;
    });

    const favoriteWorlds = computed(() => {
        if (state.sortFavoriteWorlds) {
            state.sortFavoriteWorlds = false;
            state.favoriteWorldsSorted.sort(compareByName);
        }
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteWorlds_;
        }
        return state.favoriteWorldsSorted;
    });

    const favoriteAvatars = computed(() => {
        if (state.sortFavoriteAvatars) {
            state.sortFavoriteAvatars = false;
            state.favoriteAvatarsSorted.sort(compareByName);
        }
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteAvatars_;
        }
        return state.favoriteAvatarsSorted;
    });

    const isFavoriteGroupLoading = computed({
        get() {
            return state.isFavoriteGroupLoading;
        },
        set(value) {
            state.isFavoriteGroupLoading = value;
        }
    });

    const favoriteFriendGroups = computed({
        get() {
            return state.favoriteFriendGroups;
        },
        set(value) {
            state.favoriteFriendGroups = value;
        }
    });
    const favoriteWorldGroups = computed({
        get() {
            return state.favoriteWorldGroups;
        },
        set(value) {
            state.favoriteWorldGroups = value;
        }
    });
    const favoriteAvatarGroups = computed({
        get() {
            return state.favoriteAvatarGroups;
        },
        set(value) {
            state.favoriteAvatarGroups = value;
        }
    });

    const cachedFavoriteGroups = state.cachedFavoriteGroups;
    const cachedFavoriteGroupsByTypeName = state.cachedFavoriteGroupsByTypeName;
    const cachedFavorites = state.cachedFavorites;

    const favoriteLimits = computed({
        get() {
            return state.favoriteLimits;
        },
        set(value) {
            state.favoriteLimits = value;
        }
    });

    const isFavoriteLoading = computed({
        get() {
            return state.isFavoriteLoading;
        },
        set(value) {
            state.isFavoriteLoading = value;
        }
    });

    const friendImportDialogInput = computed({
        get() {
            return state.friendImportDialogInput;
        },
        set(value) {
            state.friendImportDialogInput = value;
        }
    });

    const worldImportDialogInput = computed({
        get() {
            return state.worldImportDialogInput;
        },
        set(value) {
            state.worldImportDialogInput = value;
        }
    });

    const avatarImportDialogInput = computed({
        get() {
            return state.avatarImportDialogInput;
        },
        set(value) {
            state.avatarImportDialogInput = value;
        }
    });

    const worldImportDialogVisible = computed({
        get() {
            return state.worldImportDialogVisible;
        },
        set(value) {
            state.worldImportDialogVisible = value;
        }
    });

    const avatarImportDialogVisible = computed({
        get() {
            return state.avatarImportDialogVisible;
        },
        set(value) {
            state.avatarImportDialogVisible = value;
        }
    });

    const friendImportDialogVisible = computed({
        get() {
            return state.friendImportDialogVisible;
        },
        set(value) {
            state.friendImportDialogVisible = value;
        }
    });

    const localWorldFavorites = computed({
        get() {
            return state.localWorldFavorites;
        },
        set(value) {
            state.localWorldFavorites = value;
        }
    });

    const localAvatarFavorites = computed({
        get() {
            return state.localAvatarFavorites;
        },
        set(value) {
            state.localAvatarFavorites = value;
        }
    });

    const localAvatarFavoritesList = computed({
        get() {
            return state.localAvatarFavoritesList;
        },
        set(value) {
            state.localAvatarFavoritesList = value;
        }
    });

    const localAvatarFavoriteGroups = computed({
        get() {
            return state.localAvatarFavoriteGroups;
        },
        set(value) {
            state.localAvatarFavoriteGroups = value;
        }
    });

    const favoriteDialog = computed({
        get() {
            return state.favoriteDialog;
        },
        set(value) {
            state.favoriteDialog = value;
        }
    });

    const favoriteObjects = computed({
        get() {
            return state.favoriteObjects;
        },
        set(value) {
            state.favoriteObjects = value;
        }
    });

    const localWorldFavoritesList = computed({
        get() {
            return state.localWorldFavoritesList;
        },
        set(value) {
            state.localWorldFavoritesList = value;
        }
    });

    const favoriteFriends_ = computed({
        get() {
            return state.favoriteFriends_;
        },
        set(value) {
            state.favoriteFriends_ = value;
        }
    });

    const favoriteFriendsSorted = computed({
        get() {
            return state.favoriteFriendsSorted;
        },
        set(value) {
            state.favoriteFriendsSorted = value;
        }
    });

    const favoriteWorlds_ = computed({
        get() {
            return state.favoriteWorlds_;
        },
        set(value) {
            state.favoriteWorlds_ = value;
        }
    });

    const favoriteWorldsSorted = computed({
        get() {
            return state.favoriteWorldsSorted;
        },
        set(value) {
            state.favoriteWorldsSorted = value;
        }
    });

    const favoriteAvatars_ = computed({
        get() {
            return state.favoriteAvatars_;
        },
        set(value) {
            state.favoriteAvatars_ = value;
        }
    });

    const favoriteAvatarsSorted = computed({
        get() {
            return state.favoriteAvatarsSorted;
        },
        set(value) {
            state.favoriteAvatarsSorted = value;
        }
    });

    const sortFavoriteFriends = computed({
        get() {
            return state.sortFavoriteFriends;
        },
        set(value) {
            state.sortFavoriteFriends = value;
        }
    });

    const sortFavoriteWorlds = computed({
        get() {
            return state.sortFavoriteWorlds;
        },
        set(value) {
            state.sortFavoriteWorlds = value;
        }
    });

    const sortFavoriteAvatars = computed({
        get() {
            return state.sortFavoriteAvatars;
        },
        set(value) {
            state.sortFavoriteAvatars = value;
        }
    });

    const cachedFavoritesByObjectId = computed({
        get() {
            return state.cachedFavoritesByObjectId;
        },
        set(value) {
            state.cachedFavoritesByObjectId = value;
        }
    });

    const localWorldFavoriteGroups = computed({
        get() {
            return state.localWorldFavoriteGroups;
        },
        set(value) {
            state.localWorldFavoriteGroups = value;
        }
    });

    const groupedByGroupKeyFavoriteFriends = computed(() => {
        const groupedByGroupKeyFavoriteFriends = {};
        favoriteFriends.value.forEach((friend) => {
            if (friend.groupKey) {
                if (!groupedByGroupKeyFavoriteFriends[friend.groupKey]) {
                    groupedByGroupKeyFavoriteFriends[friend.groupKey] = [];
                }
                groupedByGroupKeyFavoriteFriends[friend.groupKey].push(friend);
            }
        });
        return groupedByGroupKeyFavoriteFriends;
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            friendStore.localFavoriteFriends.clear();
            state.cachedFavorites.clear();
            state.cachedFavoritesByObjectId.clear();
            state.cachedFavoriteGroups.clear();
            state.cachedFavoriteGroupsByTypeName.clear();
            state.favoriteFriendGroups = [];
            state.favoriteWorldGroups = [];
            state.favoriteAvatarGroups = [];
            state.isFavoriteLoading = false;
            state.isFavoriteGroupLoading = false;
            state.favoriteObjects.clear();
            state.favoriteFriends_ = [];
            state.favoriteFriendsSorted = [];
            state.favoriteWorlds_ = [];
            state.favoriteWorldsSorted = [];
            state.favoriteAvatars_ = [];
            state.favoriteAvatarsSorted = [];
            state.sortFavoriteFriends = false;
            state.sortFavoriteWorlds = false;
            state.sortFavoriteAvatars = false;
            state.localAvatarFavoriteGroups = [];
            state.localAvatarFavoritesList = [];
            state.localAvatarFavorites = {};
            state.favoriteDialog.visible = false;
            state.worldImportDialogVisible = false;
            state.avatarImportDialogVisible = false;
            state.friendImportDialogVisible = false;
            if (isLoggedIn) {
                initFavorites();
            }
        },
        { flush: 'sync' }
    );

    function handleFavoriteAdd(args) {
        handleFavorite({
            json: args.json,
            params: {
                favoriteId: args.json.id
            },
            sortTop: true
        });

        if (
            args.params.type === 'avatar' &&
            !avatarStore.cachedAvatars.has(args.params.favoriteId)
        ) {
            refreshFavoriteAvatars(args.params.tags);
        }

        if (
            args.params.type === 'friend' &&
            generalSettingsStore.localFavoriteFriendsGroups.includes(
                'friend:' + args.params.tags
            )
        ) {
            friendStore.updateLocalFavoriteFriends();
        }
        updateFavoriteDialog(args.params.objectId);
    }

    function handleFavorite(args) {
        const fav = applyFavoriteCached(args.json);
        if (!fav.$isDeleted) {
            args.ref = fav;
        }
        applyFavorite(args.ref.type, args.ref.favoriteId, args.sortTop);
        friendStore.updateFriend(args.ref.favoriteId);
        const { ref } = args;
        const userDialog = userStore.userDialog;
        if (
            !(
                userDialog.visible === false ||
                ref.$isDeleted ||
                ref.favoriteId !== userDialog.id
            )
        ) {
            userDialog.isFavorite = true;
        }

        const worldDialog = worldStore.worldDialog;
        if (
            !(
                worldDialog.visible === false ||
                ref.$isDeleted ||
                ref.favoriteId !== worldDialog.id
            )
        ) {
            worldDialog.isFavorite = true;
        }

        const avatarDialog = avatarStore.avatarDialog;
        if (
            !(
                avatarDialog.visible === false ||
                ref.$isDeleted ||
                ref.favoriteId !== avatarDialog.id
            )
        ) {
            avatarDialog.isFavorite = true;
        }
    }

    function handleFavoriteDelete(args) {
        const ref = state.cachedFavoritesByObjectId.get(args.params.objectId);
        if (typeof ref === 'undefined') {
            return;
        }
        state.cachedFavoritesByObjectId.delete(args.params.objectId);
        friendStore.localFavoriteFriends.delete(args.params.objectId);
        friendStore.updateSidebarFriendsList();
        if (ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        ref.$isDeleted = true;
        handleFavoriteAtDelete({
            ref,
            params: {
                favoriteId: ref.id
            }
        });
    }

    function handleFavoriteGroup(args) {
        const ref = applyFavoriteGroup(args.json);
        if (ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        if (ref.$groupRef !== null) {
            ref.$groupRef.displayName = ref.displayName;
            ref.$groupRef.visibility = ref.visibility;
        }
    }

    function handleFavoriteGroupClear(args) {
        const key = `${args.params.type}:${args.params.group}`;
        for (const ref of state.cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$groupKey !== key) {
                continue;
            }
            state.cachedFavoritesByObjectId.delete(ref.favoriteId);
            friendStore.localFavoriteFriends.delete(ref.favoriteId);
            friendStore.updateSidebarFriendsList();
            ref.$isDeleted = true;
            handleFavoriteAtDelete({
                ref,
                params: {
                    favoriteId: ref.id
                }
            });
        }
    }

    function handleFavoriteWorldList(args) {
        for (const json of args.json) {
            if (json.id === '???') {
                continue;
            }
            worldStore.applyWorld(json);
        }
    }

    function handleFavoriteAvatarList(args) {
        for (const json of args.json) {
            if (json.releaseStatus === 'hidden') {
                continue;
            }
            avatarStore.applyAvatar(json);
        }
    }

    function expireFavorites() {
        friendStore.localFavoriteFriends.clear();
        state.cachedFavorites.clear();
        state.cachedFavoritesByObjectId.clear();
        state.favoriteObjects.clear();
        state.favoriteFriends_ = [];
        state.favoriteFriendsSorted = [];
        state.favoriteWorlds_ = [];
        state.favoriteWorldsSorted = [];
        state.favoriteAvatars_ = [];
        state.favoriteAvatarsSorted = [];
    }

    function handleFavoriteAtDelete(args) {
        const { ref } = args;
        if (ref.$groupRef !== null) {
            --ref.$groupRef.count;
        }
        applyFavorite(args.ref.type, args.ref.favoriteId);
        friendStore.updateFriend(args.ref.favoriteId);
        const userDialog = userStore.userDialog;
        if (
            !(
                userDialog.visible === false ||
                userDialog.id !== args.ref.favoriteId
            )
        ) {
            userDialog.isFavorite = false;
        }

        const favoriteStore = useFavoriteStore();
        const worldDialog = worldStore.worldDialog;
        if (
            !(
                worldDialog.visible === false ||
                worldDialog.id !== args.ref.favoriteId
            )
        ) {
            worldDialog.isFavorite =
                favoriteStore.localWorldFavoritesList.includes(worldDialog.id);
        }

        const avatarDialog = avatarStore.avatarDialog;
        if (
            !(
                avatarDialog.visible === false ||
                avatarDialog.id !== args.ref.favoriteId
            )
        ) {
            avatarDialog.isFavorite = false;
        }
    }

    /**
     * aka: `$app.methods.applyFavorite`
     * @param {'friend' | 'world' | 'avatar'} type
     * @param {string} objectId
     * @param {boolean} sortTop
     * @returns {Promise<void>}
     */
    async function applyFavorite(type, objectId, sortTop = false) {
        let ref;
        const favorite = state.cachedFavoritesByObjectId.get(objectId);
        let ctx = state.favoriteObjects.get(objectId);
        if (typeof favorite !== 'undefined') {
            let isTypeChanged = false;
            if (typeof ctx === 'undefined') {
                ctx = {
                    id: objectId,
                    type,
                    groupKey: favorite.$groupKey,
                    ref: null,
                    name: '',
                    $selected: false
                };
                state.favoriteObjects.set(objectId, ctx);
                if (type === 'friend') {
                    ref = userStore.cachedUsers.get(objectId);
                    if (typeof ref === 'undefined') {
                        ref = friendStore.friendLog.get(objectId);
                        if (typeof ref !== 'undefined' && ref.displayName) {
                            ctx.name = ref.displayName;
                        }
                    } else {
                        ctx.ref = ref;
                        ctx.name = ref.displayName;
                    }
                } else if (type === 'world') {
                    ref = worldStore.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                } else if (type === 'avatar') {
                    ref = avatarStore.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                }
                isTypeChanged = true;
            } else {
                if (ctx.type !== type) {
                    // WTF???
                    isTypeChanged = true;
                    if (type === 'friend') {
                        removeFromArray(state.favoriteFriends_, ctx);
                        removeFromArray(state.favoriteFriendsSorted, ctx);
                    } else if (type === 'world') {
                        removeFromArray(state.favoriteWorlds_, ctx);
                        removeFromArray(state.favoriteWorldsSorted, ctx);
                    } else if (type === 'avatar') {
                        removeFromArray(state.favoriteAvatars_, ctx);
                        removeFromArray(state.favoriteAvatarsSorted, ctx);
                    }
                }
                if (type === 'friend') {
                    ref = userStore.cachedUsers.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.displayName) {
                            ctx.name = ref.displayName;
                            state.sortFavoriteFriends = true;
                        }
                    }
                    // else too bad
                } else if (type === 'world') {
                    ref = worldStore.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            state.sortFavoriteWorlds = true;
                        }
                    } else {
                        // try fetch from local world favorites
                        const world =
                            await database.getCachedWorldById(objectId);
                        if (world) {
                            ctx.ref = world;
                            ctx.name = world.name;
                            ctx.deleted = true;
                            state.sortFavoriteWorlds = true;
                        }
                        if (!world) {
                            // try fetch from local world history
                            const worldName =
                                await database.getGameLogWorldNameByWorldId(
                                    objectId
                                );
                            if (worldName) {
                                ctx.name = worldName;
                                ctx.deleted = true;
                                state.sortFavoriteWorlds = true;
                            }
                        }
                    }
                } else if (type === 'avatar') {
                    ref = avatarStore.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            state.sortFavoriteAvatars = true;
                        }
                    } else {
                        // try fetch from local avatar history
                        const avatar =
                            await database.getCachedAvatarById(objectId);
                        if (avatar) {
                            ctx.ref = avatar;
                            ctx.name = avatar.name;
                            ctx.deleted = true;
                            state.sortFavoriteAvatars = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (sortTop) {
                    if (type === 'friend') {
                        state.favoriteFriends_.unshift(ctx);
                        state.favoriteFriendsSorted.push(ctx);
                        state.sortFavoriteFriends = true;
                    } else if (type === 'world') {
                        state.favoriteWorlds_.unshift(ctx);
                        state.favoriteWorldsSorted.push(ctx);
                        state.sortFavoriteWorlds = true;
                    } else if (type === 'avatar') {
                        state.favoriteAvatars_.unshift(ctx);
                        state.favoriteAvatarsSorted.push(ctx);
                        state.sortFavoriteAvatars = true;
                    }
                } else if (type === 'friend') {
                    state.favoriteFriends_.push(ctx);
                    state.favoriteFriendsSorted.push(ctx);
                    state.sortFavoriteFriends = true;
                } else if (type === 'world') {
                    state.favoriteWorlds_.push(ctx);
                    state.favoriteWorldsSorted.push(ctx);
                    state.sortFavoriteWorlds = true;
                } else if (type === 'avatar') {
                    state.favoriteAvatars_.push(ctx);
                    state.favoriteAvatarsSorted.push(ctx);
                    state.sortFavoriteAvatars = true;
                }
            }
        } else if (typeof ctx !== 'undefined') {
            state.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                removeFromArray(state.favoriteFriends_, ctx);
                removeFromArray(state.favoriteFriendsSorted, ctx);
            } else if (type === 'world') {
                removeFromArray(state.favoriteWorlds_, ctx);
                removeFromArray(state.favoriteWorldsSorted, ctx);
            } else if (type === 'avatar') {
                removeFromArray(state.favoriteAvatars_, ctx);
                removeFromArray(state.favoriteAvatarsSorted, ctx);
            }
        }
    }

    function refreshFavoriteGroups() {
        if (state.isFavoriteGroupLoading) {
            return;
        }
        state.isFavoriteGroupLoading = true;
        expireFavoriteGroups();
        processBulk({
            fn: favoriteRequest.getFavoriteGroups,
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            handle: (args) => {
                for (const json of args.json) {
                    handleFavoriteGroup({
                        json,
                        params: {
                            favoriteGroupId: json.id
                        }
                    });
                }
            },
            done(ok) {
                if (ok) {
                    deleteExpiredFavoriteGroups();
                    buildFavoriteGroups();
                }
                state.isFavoriteGroupLoading = false;
            }
        });
    }

    function expireFavoriteGroups() {
        for (const ref of state.cachedFavoriteGroups.values()) {
            ref.$isExpired = true;
        }
    }

    function deleteExpiredFavoriteGroups() {
        for (const ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
        }
    }

    function buildFavoriteGroups() {
        let group;
        let groups;
        let ref;
        let i;
        // 450 = ['group_0', 'group_1', 'group_2'] x 150
        state.favoriteFriendGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.friend; ++i) {
            state.favoriteFriendGroups.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.friend,
                count: 0,
                visibility: 'private'
            });
        }
        // 400 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 100
        state.favoriteWorldGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.world; ++i) {
            state.favoriteWorldGroups.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.world,
                count: 0,
                visibility: 'private'
            });
        }
        // 350 = ['avatars1', ...] x 50
        // Favorite Avatars (0/50)
        // VRC+ Group 1..5 (0/50)
        state.favoriteAvatarGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.avatar; ++i) {
            state.favoriteAvatarGroups.push({
                assign: false,
                key: `avatar:avatars${i + 1}`,
                type: 'avatar',
                name: `avatars${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.avatar,
                count: 0,
                visibility: 'private'
            });
        }
        const types = {
            friend: state.favoriteFriendGroups,
            world: state.favoriteWorldGroups,
            avatar: state.favoriteAvatarGroups
        };
        const assigns = new Set();
        // assign the same name first
        for (ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (group of groups) {
                if (group.assign === false && group.name === ref.name) {
                    group.assign = true;
                    if (ref.displayName) {
                        group.displayName = ref.displayName;
                    }
                    group.visibility = ref.visibility;
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }

        for (ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || assigns.has(ref.id)) {
                continue;
            }
            groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (group of groups) {
                if (group.assign === false) {
                    group.assign = true;
                    group.key = `${group.type}:${ref.name}`;
                    group.name = ref.name;
                    group.displayName = ref.displayName;
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // update favorites
        state.cachedFavoriteGroupsByTypeName.clear();
        for (const type in types) {
            for (group of types[type]) {
                state.cachedFavoriteGroupsByTypeName.set(group.key, group);
            }
        }
        for (ref of state.cachedFavorites.values()) {
            ref.$groupRef = null;
            if (ref.$isDeleted) {
                continue;
            }
            group = state.cachedFavoriteGroupsByTypeName.get(ref.$groupKey);
            if (typeof group === 'undefined') {
                continue;
            }
            ref.$groupRef = group;
            ++group.count;
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async function refreshFavorites() {
        if (state.isFavoriteLoading) {
            return;
        }
        state.isFavoriteLoading = true;
        try {
            const args = await favoriteRequest.getFavoriteLimits();
            state.favoriteLimits = {
                ...state.favoriteLimits,
                ...args.json
            };
        } catch (err) {
            console.error(err);
        }
        expireFavorites();
        state.cachedFavoriteGroupsByTypeName.clear();
        processBulk({
            fn: favoriteRequest.getFavorites,
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            handle(args) {
                for (const json of args.json) {
                    handleFavorite({
                        json,
                        params: {
                            favoriteId: json.id
                        },
                        sortTop: false
                    });
                }
            },
            done(ok) {
                if (ok) {
                    deleteExpiredFavorites();
                }
                refreshFavoriteItems();
                refreshFavoriteGroups();
                friendStore.updateLocalFavoriteFriends();
                state.isFavoriteLoading = false;
            }
        });
    }

    /**
     *
     * @param json
     * @returns {any}
     */
    function applyFavoriteGroup(json) {
        let ref = state.cachedFavoriteGroups.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                ownerId: '',
                ownerDisplayName: '',
                name: '',
                displayName: '',
                type: '',
                visibility: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupRef: null,
                //
                ...json
            };
            state.cachedFavoriteGroups.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        return ref;
    }

    /**
     *
     * @param json
     * @returns {any}
     */
    function applyFavoriteCached(json) {
        let ref = state.cachedFavorites.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                type: '',
                favoriteId: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupKey: '',
                $groupRef: null,
                //
                ...json
            };
            state.cachedFavorites.set(ref.id, ref);
            state.cachedFavoritesByObjectId.set(ref.favoriteId, ref);
            if (
                ref.type === 'friend' &&
                (generalSettingsStore.localFavoriteFriendsGroups.length === 0 ||
                    generalSettingsStore.localFavoriteFriendsGroups.includes(
                        ref.groupKey
                    ))
            ) {
                friendStore.localFavoriteFriends.add(ref.favoriteId);
                friendStore.updateSidebarFriendsList();
            }
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        ref.$groupKey = `${ref.type}:${String(ref.tags[0])}`;

        if (ref.$isDeleted === false && ref.$groupRef === null) {
            const group = state.cachedFavoriteGroupsByTypeName.get(
                ref.$groupKey
            );
            if (typeof group !== 'undefined') {
                ref.$groupRef = group;
                ++group.count;
            }
        }
        return ref;
    }

    /**
     *
     */
    function deleteExpiredFavorites() {
        for (const ref of state.cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            handleFavoriteAtDelete({
                ref,
                params: {
                    favoriteId: ref.id
                }
            });
        }
    }

    /**
     *
     * @param tag
     */
    async function refreshFavoriteAvatars(tag) {
        const n = Math.floor(Math.random() * (50 + 1)) + 50;
        const params = {
            n,
            offset: 0,
            tag
        };
        const args = await favoriteRequest.getFavoriteAvatars(params);
        handleFavoriteAvatarList(args);
    }

    /**
     *
     */
    function refreshFavoriteItems() {
        const types = {
            world: [0, favoriteRequest.getFavoriteWorlds],
            avatar: [0, favoriteRequest.getFavoriteAvatars]
        };
        const tags = [];
        for (const ref of state.cachedFavorites.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            const type = types[ref.type];
            if (typeof type === 'undefined') {
                continue;
            }
            if (ref.type === 'avatar' && !tags.includes(ref.tags[0])) {
                tags.push(ref.tags[0]);
            }
            ++type[0];
        }
        for (const type in types) {
            const [N, fn] = types[type];
            if (N > 0) {
                if (type === 'avatar') {
                    for (const tag of tags) {
                        const n = Math.floor(Math.random() * (50 + 1)) + 50;
                        processBulk({
                            fn,
                            N,
                            handle: (args) => handleFavoriteAvatarList(args),
                            params: {
                                n,
                                offset: 0,
                                tag
                            }
                        });
                    }
                } else {
                    const n = Math.floor(Math.random() * (36 + 1)) + 64;
                    processBulk({
                        fn,
                        N,
                        handle: (args) => handleFavoriteWorldList(args),
                        params: {
                            n,
                            offset: 0
                        }
                    });
                }
            }
        }
    }

    /**
     * aka: `$app.methods.clearBulkFavoriteSelection`
     */
    function clearBulkFavoriteSelection() {
        let ctx;
        for (ctx of state.favoriteFriends_) {
            ctx.$selected = false;
        }
        for (ctx of state.favoriteWorlds_) {
            ctx.$selected = false;
        }
        for (ctx of state.favoriteAvatars_) {
            ctx.$selected = false;
        }
    }

    function showWorldImportDialog() {
        state.worldImportDialogVisible = true;
    }

    function showAvatarImportDialog() {
        state.avatarImportDialogVisible = true;
    }

    function showFriendImportDialog() {
        state.friendImportDialogVisible = true;
    }

    /**
     * aka: `$app.methods.getLocalWorldFavoriteGroupLength`
     * @param {string} group
     * @returns {*|number}
     */
    function getLocalWorldFavoriteGroupLength(group) {
        const favoriteGroup = state.localWorldFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    }

    /**
     * aka: `$app.methods.addLocalWorldFavorite`
     * @param {string} worldId
     * @param {string} group
     */
    function addLocalWorldFavorite(worldId, group) {
        if (hasLocalWorldFavorite(worldId, group)) {
            return;
        }
        const ref = worldStore.cachedWorlds.get(worldId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!state.localWorldFavoritesList.includes(worldId)) {
            state.localWorldFavoritesList.push(worldId);
        }
        if (!state.localWorldFavorites[group]) {
            state.localWorldFavorites[group] = [];
        }
        if (!state.localWorldFavoriteGroups.includes(group)) {
            state.localWorldFavoriteGroups.push(group);
        }
        state.localWorldFavorites[group].unshift(ref);
        database.addWorldToCache(ref);
        database.addWorldToFavorites(worldId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === worldId
        ) {
            updateFavoriteDialog(worldId);
        }
        if (
            worldStore.worldDialog.visible &&
            worldStore.worldDialog.id === worldId
        ) {
            worldStore.worldDialog.isFavorite = true;
        }

        // update UI
        sortLocalWorldFavorites();
    }

    /**
     * aka: `$app.methods.hasLocalWorldFavorite`
     * @param {string} worldId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalWorldFavorite(worldId, group) {
        const favoriteGroup = state.localWorldFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (let i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                return true;
            }
        }
        return false;
    }

    /**
     * aka: `$app.methods.addLocalAvatarFavorite`
     * @param {string} avatarId
     * @param {string} group
     */
    function addLocalAvatarFavorite(avatarId, group) {
        if (hasLocalAvatarFavorite(avatarId, group)) {
            return;
        }
        const ref = avatarStore.cachedAvatars.get(avatarId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!state.localAvatarFavoritesList.includes(avatarId)) {
            state.localAvatarFavoritesList.push(avatarId);
        }
        if (!state.localAvatarFavorites[group]) {
            state.localAvatarFavorites[group] = [];
        }
        if (!state.localAvatarFavoriteGroups.includes(group)) {
            state.localAvatarFavoriteGroups.push(group);
        }
        state.localAvatarFavorites[group].unshift(ref);
        database.addAvatarToCache(ref);
        database.addAvatarToFavorites(avatarId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === avatarId
        ) {
            updateFavoriteDialog(avatarId);
        }
        if (
            avatarStore.avatarDialog.visible &&
            avatarStore.avatarDialog.id === avatarId
        ) {
            avatarStore.avatarDialog.isFavorite = true;
        }

        // update UI
        sortLocalAvatarFavorites();
    }

    /**
     * aka: `$app.methods.hasLocalAvatarFavorite`
     * @param {string} avatarId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalAvatarFavorite(avatarId, group) {
        const favoriteGroup = state.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (let i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                return true;
            }
        }
        return false;
    }

    /**
     * aka: `$app.methods.getLocalAvatarFavoriteGroupLength`
     * @param {string} group
     * @returns {*|number}
     */
    function getLocalAvatarFavoriteGroupLength(group) {
        const favoriteGroup = state.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    }

    function updateFavoriteDialog(objectId) {
        const D = state.favoriteDialog;
        if (!D.visible || D.objectId !== objectId) {
            return;
        }
        D.currentGroup = {};
        const favorite = state.favoriteObjects.get(objectId);
        if (favorite) {
            let group;
            for (group of state.favoriteWorldGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of state.favoriteAvatarGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of state.favoriteFriendGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
        }
    }

    /**
     * aka: `$app.methods.deleteLocalAvatarFavoriteGroup`
     * @param {string} group
     */
    function deleteLocalAvatarFavoriteGroup(group) {
        let i;
        // remove from cache if no longer in favorites
        const avatarIdRemoveList = new Set();
        const favoriteGroup = state.localAvatarFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            avatarIdRemoveList.add(favoriteGroup[i].id);
        }

        removeFromArray(state.localAvatarFavoriteGroups, group);
        delete state.localAvatarFavorites[group];
        database.deleteAvatarFavoriteGroup(group);

        for (i = 0; i < state.localAvatarFavoriteGroups.length; ++i) {
            const groupName = state.localAvatarFavoriteGroups[i];
            if (!state.localAvatarFavorites[groupName]) {
                continue;
            }
            for (
                let j = 0;
                j < state.localAvatarFavorites[groupName].length;
                ++j
            ) {
                const avatarId = state.localAvatarFavorites[groupName][j].id;
                if (avatarIdRemoveList.has(avatarId)) {
                    avatarIdRemoveList.delete(avatarId);
                    break;
                }
            }
        }

        avatarIdRemoveList.forEach((id) => {
            // remove from cache if no longer in favorites
            let avatarInFavorites = false;
            loop: for (
                let i = 0;
                i < state.localAvatarFavoriteGroups.length;
                ++i
            ) {
                const groupName = state.localAvatarFavoriteGroups[i];
                if (
                    !state.localAvatarFavorites[groupName] ||
                    group === groupName
                ) {
                    continue loop;
                }
                for (
                    let j = 0;
                    j < state.localAvatarFavorites[groupName].length;
                    ++j
                ) {
                    const avatarId =
                        state.localAvatarFavorites[groupName][j].id;
                    if (id === avatarId) {
                        avatarInFavorites = true;
                        break loop;
                    }
                }
            }
            if (!avatarInFavorites) {
                removeFromArray(state.localAvatarFavoritesList, id);
                if (!avatarStore.avatarHistory.has(id)) {
                    database.removeAvatarFromCache(id);
                }
            }
        });
    }

    /**
     * aka: `$app.methods.sortLocalAvatarFavorites`
     */
    function sortLocalAvatarFavorites() {
        state.localAvatarFavoriteGroups.sort();
        if (!appearanceSettingsStore.sortFavorites) {
            for (let i = 0; i < state.localAvatarFavoriteGroups.length; ++i) {
                const group = state.localAvatarFavoriteGroups[i];
                if (state.localAvatarFavorites[group]) {
                    state.localAvatarFavorites[group].sort(compareByName);
                }
            }
        }
    }

    /**
     * aka: `$app.methods.renameLocalAvatarFavoriteGroup`
     * @param {string} newName
     * @param {string} group
     */
    function renameLocalAvatarFavoriteGroup(newName, group) {
        if (state.localAvatarFavoriteGroups.includes(newName)) {
            $app.$message({
                message: t('prompt.local_favorite_group_rename.message.error', {
                    name: newName
                }),
                type: 'error'
            });
            return;
        }
        state.localAvatarFavoriteGroups.push(newName);
        state.localAvatarFavorites[newName] = state.localAvatarFavorites[group];

        removeFromArray(state.localAvatarFavoriteGroups, group);
        delete state.localAvatarFavorites[group];
        database.renameAvatarFavoriteGroup(newName, group);
        sortLocalAvatarFavorites();
    }

    /**
     * aka: `$app.methods.newLocalAvatarFavoriteGroup`
     * @param {string} group
     */
    function newLocalAvatarFavoriteGroup(group) {
        if (state.localAvatarFavoriteGroups.includes(group)) {
            $app.$message({
                message: t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!state.localAvatarFavorites[group]) {
            state.localAvatarFavorites[group] = [];
        }
        if (!state.localAvatarFavoriteGroups.includes(group)) {
            state.localAvatarFavoriteGroups.push(group);
        }
        sortLocalAvatarFavorites();
    }

    /**
     * aka: `$app.methods.getLocalAvatarFavorites`
     * @returns {Promise<void>}
     */
    async function getLocalAvatarFavorites() {
        let ref;
        let i;
        state.localAvatarFavoriteGroups = [];
        state.localAvatarFavoritesList = [];
        state.localAvatarFavorites = {};
        const avatarCache = await database.getAvatarCache();
        for (i = 0; i < avatarCache.length; ++i) {
            ref = avatarCache[i];
            if (!avatarStore.cachedAvatars.has(ref.id)) {
                avatarStore.applyAvatar(ref);
            }
        }
        const favorites = await database.getAvatarFavorites();
        for (i = 0; i < favorites.length; ++i) {
            const favorite = favorites[i];
            if (!state.localAvatarFavoritesList.includes(favorite.avatarId)) {
                state.localAvatarFavoritesList.push(favorite.avatarId);
            }
            if (!state.localAvatarFavorites[favorite.groupName]) {
                state.localAvatarFavorites[favorite.groupName] = [];
            }
            if (!state.localAvatarFavoriteGroups.includes(favorite.groupName)) {
                state.localAvatarFavoriteGroups.push(favorite.groupName);
            }
            ref = avatarStore.cachedAvatars.get(favorite.avatarId);
            if (typeof ref === 'undefined') {
                ref = {
                    id: favorite.avatarId
                };
            }
            state.localAvatarFavorites[favorite.groupName].unshift(ref);
        }
        if (state.localAvatarFavoriteGroups.length === 0) {
            // default group
            state.localAvatarFavorites.Favorites = [];
            state.localAvatarFavoriteGroups.push('Favorites');
        }
        sortLocalAvatarFavorites();
    }

    /**
     * aka: `$app.methods.removeLocalAvatarFavorite`
     * @param {string} avatarId
     * @param {string} group
     */
    function removeLocalAvatarFavorite(avatarId, group) {
        let i;
        const favoriteGroup = state.localAvatarFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let avatarInFavorites = false;
        for (i = 0; i < state.localAvatarFavoriteGroups.length; ++i) {
            const groupName = state.localAvatarFavoriteGroups[i];
            if (!state.localAvatarFavorites[groupName] || group === groupName) {
                continue;
            }
            for (
                let j = 0;
                j < state.localAvatarFavorites[groupName].length;
                ++j
            ) {
                const id = state.localAvatarFavorites[groupName][j].id;
                if (id === avatarId) {
                    avatarInFavorites = true;
                    break;
                }
            }
        }
        if (!avatarInFavorites) {
            removeFromArray(state.localAvatarFavoritesList, avatarId);
            if (!avatarStore.avatarHistory.has(avatarId)) {
                database.removeAvatarFromCache(avatarId);
            }
        }
        database.removeAvatarFromFavorites(avatarId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === avatarId
        ) {
            updateFavoriteDialog(avatarId);
        }
        if (
            avatarStore.avatarDialog.visible &&
            avatarStore.avatarDialog.id === avatarId
        ) {
            avatarStore.avatarDialog.isFavorite =
                state.cachedFavoritesByObjectId.has(avatarId);
        }

        // update UI
        sortLocalAvatarFavorites();
    }

    /**
     * aka: `$app.methods.deleteLocalWorldFavoriteGroup`
     * @param {string} group
     */
    function deleteLocalWorldFavoriteGroup(group) {
        let i;
        // remove from cache if no longer in favorites
        const worldIdRemoveList = new Set();
        const favoriteGroup = state.localWorldFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            worldIdRemoveList.add(favoriteGroup[i].id);
        }

        removeFromArray(state.localWorldFavoriteGroups, group);
        delete state.localWorldFavorites[group];
        database.deleteWorldFavoriteGroup(group);

        for (i = 0; i < state.localWorldFavoriteGroups.length; ++i) {
            const groupName = state.localWorldFavoriteGroups[i];
            if (!state.localWorldFavorites[groupName]) {
                continue;
            }
            for (
                let j = 0;
                j < state.localWorldFavorites[groupName].length;
                ++j
            ) {
                const worldId = state.localWorldFavorites[groupName][j].id;
                if (worldIdRemoveList.has(worldId)) {
                    worldIdRemoveList.delete(worldId);
                    break;
                }
            }
        }

        worldIdRemoveList.forEach((id) => {
            removeFromArray(state.localWorldFavoritesList, id);
            database.removeWorldFromCache(id);
        });
    }

    /**
     * aka: `$app.methods.sortLocalWorldFavorites`
     */
    function sortLocalWorldFavorites() {
        state.localWorldFavoriteGroups.sort();
        if (!appearanceSettingsStore.sortFavorites) {
            for (let i = 0; i < state.localWorldFavoriteGroups.length; ++i) {
                const group = state.localWorldFavoriteGroups[i];
                if (state.localWorldFavorites[group]) {
                    state.localWorldFavorites[group].sort(compareByName);
                }
            }
        }
    }

    /**
     * aka: `$app.methods.renameLocalWorldFavoriteGroup`
     * @param {string} newName
     * @param {string} group
     */
    function renameLocalWorldFavoriteGroup(newName, group) {
        if (state.localWorldFavoriteGroups.includes(newName)) {
            $app.$message({
                message: t('prompt.local_favorite_group_rename.message.error', {
                    name: newName
                }),
                type: 'error'
            });
            return;
        }
        state.localWorldFavoriteGroups.push(newName);
        state.localWorldFavorites[newName] = state.localWorldFavorites[group];

        removeFromArray(state.localWorldFavoriteGroups, group);
        delete state.localWorldFavorites[group];
        database.renameWorldFavoriteGroup(newName, group);
        sortLocalWorldFavorites();
    }

    /**
     * aka: `$app.methods.removeLocalWorldFavorite`
     * @param {string} worldId
     * @param {string} group
     */
    function removeLocalWorldFavorite(worldId, group) {
        let i;
        const favoriteGroup = state.localWorldFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let worldInFavorites = false;
        for (i = 0; i < state.localWorldFavoriteGroups.length; ++i) {
            const groupName = state.localWorldFavoriteGroups[i];
            if (!state.localWorldFavorites[groupName] || group === groupName) {
                continue;
            }
            for (
                let j = 0;
                j < state.localWorldFavorites[groupName].length;
                ++j
            ) {
                const id = state.localWorldFavorites[groupName][j].id;
                if (id === worldId) {
                    worldInFavorites = true;
                    break;
                }
            }
        }
        if (!worldInFavorites) {
            removeFromArray(state.localWorldFavoritesList, worldId);
            database.removeWorldFromCache(worldId);
        }
        database.removeWorldFromFavorites(worldId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === worldId
        ) {
            updateFavoriteDialog(worldId);
        }
        if (
            worldStore.worldDialog.visible &&
            worldStore.worldDialog.id === worldId
        ) {
            worldStore.worldDialog.isFavorite =
                state.cachedFavoritesByObjectId.has(worldId);
        }

        // update UI
        sortLocalWorldFavorites();
    }

    /**
     * aka: `$app.methods.getLocalWorldFavorites`
     * @returns {Promise<void>}
     */
    async function getLocalWorldFavorites() {
        state.localWorldFavoriteGroups = [];
        state.localWorldFavoritesList = [];
        state.localWorldFavorites = {};
        const worldCache = await database.getWorldCache();
        for (let i = 0; i < worldCache.length; ++i) {
            const ref = worldCache[i];
            if (!worldStore.cachedWorlds.has(ref.id)) {
                worldStore.applyWorld(ref);
            }
        }
        const favorites = await database.getWorldFavorites();
        for (let i = 0; i < favorites.length; ++i) {
            const favorite = favorites[i];
            if (!state.localWorldFavoritesList.includes(favorite.worldId)) {
                state.localWorldFavoritesList.push(favorite.worldId);
            }
            if (!state.localWorldFavorites[favorite.groupName]) {
                state.localWorldFavorites[favorite.groupName] = [];
            }
            if (!state.localWorldFavoriteGroups.includes(favorite.groupName)) {
                state.localWorldFavoriteGroups.push(favorite.groupName);
            }
            let ref = worldStore.cachedWorlds.get(favorite.worldId);
            if (typeof ref === 'undefined') {
                ref = {
                    id: favorite.worldId
                };
            }
            state.localWorldFavorites[favorite.groupName].unshift(ref);
        }
        if (state.localWorldFavoriteGroups.length === 0) {
            // default group
            state.localWorldFavorites.Favorites = [];
            state.localWorldFavoriteGroups.push('Favorites');
        }
        sortLocalWorldFavorites();
    }

    /**
     * aka: `$app.methods.newLocalWorldFavoriteGroup`
     * @param {string} group
     */
    function newLocalWorldFavoriteGroup(group) {
        if (state.localWorldFavoriteGroups.includes(group)) {
            $app.$message({
                message: t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!state.localWorldFavorites[group]) {
            state.localWorldFavorites[group] = [];
        }
        if (!state.localWorldFavoriteGroups.includes(group)) {
            state.localWorldFavoriteGroups.push(group);
        }
        sortLocalWorldFavorites();
    }

    /**
     * aka: `$app.methods.deleteFavoriteNoConfirm`
     * @param {string} objectId
     */
    function deleteFavoriteNoConfirm(objectId) {
        if (!objectId) {
            return;
        }
        state.favoriteDialog.visible = true;
        favoriteRequest
            .deleteFavorite({
                objectId
            })
            .then(() => {
                state.favoriteDialog.visible = false;
            })
            .finally(() => {
                state.favoriteDialog.loading = false;
            });
    }

    function showFavoriteDialog(type, objectId) {
        const D = state.favoriteDialog;
        D.type = type;
        D.objectId = objectId;
        D.visible = true;
        updateFavoriteDialog(objectId);
    }

    async function saveSortFavoritesOption() {
        getLocalWorldFavorites();
        appearanceSettingsStore.setSortFavorites();
    }

    async function initFavorites() {
        refreshFavorites();
        getLocalWorldFavorites();
        getLocalAvatarFavorites();
    }

    return {
        state,

        favoriteFriends,
        favoriteWorlds,
        favoriteAvatars,
        isFavoriteGroupLoading,
        favoriteFriendGroups,
        cachedFavoriteGroups,
        cachedFavoriteGroupsByTypeName,
        favoriteLimits,
        cachedFavorites,
        favoriteWorldGroups,
        favoriteAvatarGroups,
        isFavoriteLoading,
        friendImportDialogInput,
        worldImportDialogInput,
        avatarImportDialogInput,
        worldImportDialogVisible,
        avatarImportDialogVisible,
        friendImportDialogVisible,
        localWorldFavorites,
        localAvatarFavorites,
        localAvatarFavoritesList,
        localAvatarFavoriteGroups,
        favoriteDialog,
        favoriteObjects,
        localWorldFavoritesList,
        favoriteFriends_,
        favoriteFriendsSorted,
        favoriteWorlds_,
        favoriteWorldsSorted,
        favoriteAvatars_,
        favoriteAvatarsSorted,
        sortFavoriteFriends,
        sortFavoriteWorlds,
        sortFavoriteAvatars,
        cachedFavoritesByObjectId,
        localWorldFavoriteGroups,
        groupedByGroupKeyFavoriteFriends,

        initFavorites,
        applyFavorite,
        refreshFavoriteGroups,
        refreshFavorites,
        applyFavoriteGroup,
        applyFavoriteCached,
        refreshFavoriteAvatars,
        clearBulkFavoriteSelection,
        showWorldImportDialog,
        showAvatarImportDialog,
        showFriendImportDialog,
        getLocalWorldFavoriteGroupLength,
        addLocalWorldFavorite,
        hasLocalWorldFavorite,
        hasLocalAvatarFavorite,
        addLocalAvatarFavorite,
        getLocalAvatarFavoriteGroupLength,
        updateFavoriteDialog,
        deleteLocalAvatarFavoriteGroup,
        renameLocalAvatarFavoriteGroup,
        newLocalAvatarFavoriteGroup,
        getLocalAvatarFavorites,
        removeLocalAvatarFavorite,
        deleteLocalWorldFavoriteGroup,
        sortLocalWorldFavorites,
        renameLocalWorldFavoriteGroup,
        removeLocalWorldFavorite,
        getLocalWorldFavorites,
        newLocalWorldFavoriteGroup,
        deleteFavoriteNoConfirm,
        showFavoriteDialog,
        saveSortFavoritesOption,
        handleFavoriteWorldList,
        handleFavoriteGroupClear,
        handleFavoriteGroup,
        handleFavoriteDelete,
        handleFavoriteAdd
    };
});
