import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import { compareByName, removeFromArray } from '../shared/utils';
import { database } from '../service/database';
import { favoriteRequest } from '../api';
import { processBulk } from '../service/request';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAvatarStore } from './avatar';
import { useFriendStore } from './friend';
import { useGeneralSettingsStore } from './settings/general';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { watchState } from '../service/watchState';

export const useFavoriteStore = defineStore('Favorite', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const userStore = useUserStore();

    const { t } = useI18n();

    const state = reactive({
        favoriteObjects: new Map(),
        favoriteFriends_: [],
        favoriteWorlds_: [],
        favoriteAvatars_: []
    });

    const cachedFavorites = reactive(new Map());

    const currentFavoriteTab = ref('friend');

    const cachedFavoriteGroups = ref({});

    const cachedFavoriteGroupsByTypeName = computed(() => {
        const group = {};

        for (const k in favoriteFriendGroups.value) {
            const element = favoriteFriendGroups.value[k];
            group[element.key] = element;
        }
        for (const k in favoriteWorldGroups.value) {
            const element = favoriteWorldGroups.value[k];
            group[element.key] = element;
        }
        for (const k in favoriteAvatarGroups.value) {
            const element = favoriteAvatarGroups.value[k];
            group[element.key] = element;
        }

        return group;
    });

    const favoriteFriends = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteFriends_;
        }
        const sorted = [...state.favoriteFriends_];
        sorted.sort(compareByName);
        return sorted;
    });

    const favoriteWorlds = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteWorlds_;
        }
        const sorted = [...state.favoriteWorlds_];
        sorted.sort(compareByName);
        return sorted;
    });

    const favoriteAvatars = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteAvatars_;
        }
        const sorted = [...state.favoriteAvatars_];
        sorted.sort(compareByName);
        return sorted;
    });

    const isFavoriteGroupLoading = ref(false);

    const favoriteFriendGroups = ref([]);

    const favoriteWorldGroups = ref([]);
    const favoriteAvatarGroups = ref([]);

    const favoriteLimits = ref({
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
    });

    const isFavoriteLoading = ref(false);

    const friendImportDialogInput = ref('');

    const worldImportDialogInput = ref('');

    const avatarImportDialogInput = ref('');

    const worldImportDialogVisible = ref(false);

    const avatarImportDialogVisible = ref(false);

    const friendImportDialogVisible = ref(false);

    const localWorldFavorites = ref({});

    const localAvatarFavorites = ref({});

    const editFavoritesMode = ref(false);

    const favoriteDialog = ref({
        visible: false,
        loading: false,
        type: '',
        objectId: '',
        currentGroup: {}
    });

    const cachedFavoritesByObjectId = computed(() => (objectId) => {
        for (const item of cachedFavorites.values()) {
            if (item.favoriteId === objectId) {
                return item;
            }
        }
        return undefined;
    });

    const localAvatarFavoriteGroups = computed(() =>
        Object.keys(localAvatarFavorites.value).sort()
    );

    const localWorldFavoriteGroups = computed(() =>
        Object.keys(localWorldFavorites.value).sort()
    );

    const localWorldFavoritesList = computed(() =>
        Object.values(localWorldFavorites.value)
            .flat()
            .map((fav) => fav.id)
    );

    const localAvatarFavoritesList = computed(() =>
        Object.values(localAvatarFavorites.value)
            .flat()
            .map((fav) => fav.id)
    );

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

    const localWorldFavGroupLength = computed(() => (group) => {
        const favoriteGroup = localWorldFavorites.value[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    });

    const localAvatarFavGroupLength = computed(() => (group) => {
        const favoriteGroup = localAvatarFavorites.value[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            friendStore.localFavoriteFriends.clear();
            cachedFavorites.clear();
            cachedFavoriteGroups.value = {};
            favoriteFriendGroups.value = [];
            favoriteWorldGroups.value = [];
            favoriteAvatarGroups.value = [];
            isFavoriteLoading.value = false;
            isFavoriteGroupLoading.value = false;
            state.favoriteObjects.clear();
            state.favoriteFriends_ = [];
            state.favoriteWorlds_ = [];
            state.favoriteAvatars_ = [];
            localAvatarFavorites.value = {};
            favoriteDialog.value.visible = false;
            worldImportDialogVisible.value = false;
            avatarImportDialogVisible.value = false;
            friendImportDialogVisible.value = false;
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
        const ref = cachedFavoritesByObjectId.value(args.params.objectId);
        if (typeof ref === 'undefined') {
            return;
        }
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
    }

    function handleFavoriteGroupClear(args) {
        const key = `${args.params.type}:${args.params.group}`;
        for (const ref of cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$groupKey !== key) {
                continue;
            }
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
        cachedFavorites.clear();
        state.favoriteObjects.clear();
        state.favoriteFriends_ = [];
        state.favoriteWorlds_ = [];
        state.favoriteAvatars_ = [];
    }

    function handleFavoriteAtDelete(args) {
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

        const worldDialog = worldStore.worldDialog;
        if (
            !(
                worldDialog.visible === false ||
                worldDialog.id !== args.ref.favoriteId
            )
        ) {
            worldDialog.isFavorite = localWorldFavoritesList.value.includes(
                worldDialog.id
            );
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
     *
     * @param {'friend' | 'world' | 'avatar'} type
     * @param {string} objectId
     * @param {boolean} sortTop
     * @returns {Promise<void>}
     */
    async function applyFavorite(type, objectId, sortTop = false) {
        let ref;
        const favorite = cachedFavoritesByObjectId.value(objectId);
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
                state.favoriteObjects.set(objectId, ctx);
                isTypeChanged = true;
            } else {
                if (ctx.type !== type) {
                    // WTF???
                    isTypeChanged = true;
                    if (type === 'friend') {
                        removeFromArray(state.favoriteFriends_, ctx);
                    } else if (type === 'world') {
                        removeFromArray(state.favoriteWorlds_, ctx);
                    } else if (type === 'avatar') {
                        removeFromArray(state.favoriteAvatars_, ctx);
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
                        }
                    } else {
                        // try fetch from local world favorites
                        const world =
                            await database.getCachedWorldById(objectId);
                        if (world) {
                            ctx.ref = world;
                            ctx.name = world.name;
                            ctx.deleted = true;
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
                        }
                    } else {
                        // try fetch from local avatar history
                        const avatar =
                            await database.getCachedAvatarById(objectId);
                        if (avatar) {
                            ctx.ref = avatar;
                            ctx.name = avatar.name;
                            ctx.deleted = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (sortTop) {
                    if (type === 'friend') {
                        state.favoriteFriends_.unshift(ctx);
                    } else if (type === 'world') {
                        state.favoriteWorlds_.unshift(ctx);
                    } else if (type === 'avatar') {
                        state.favoriteAvatars_.unshift(ctx);
                    }
                } else if (type === 'friend') {
                    state.favoriteFriends_.push(ctx);
                } else if (type === 'world') {
                    state.favoriteWorlds_.push(ctx);
                } else if (type === 'avatar') {
                    state.favoriteAvatars_.push(ctx);
                }
            }
        } else if (typeof ctx !== 'undefined') {
            state.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                removeFromArray(state.favoriteFriends_, ctx);
            } else if (type === 'world') {
                removeFromArray(state.favoriteWorlds_, ctx);
            } else if (type === 'avatar') {
                removeFromArray(state.favoriteAvatars_, ctx);
            }
        }
    }

    function refreshFavoriteGroups() {
        if (isFavoriteGroupLoading.value) {
            return;
        }
        isFavoriteGroupLoading.value = true;
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
                isFavoriteGroupLoading.value = false;
            }
        });
    }

    function expireFavoriteGroups() {
        for (const key in cachedFavoriteGroups.value) {
            cachedFavoriteGroups.value[key].$isExpired = true;
        }
    }

    function deleteExpiredFavoriteGroups() {
        for (const key in cachedFavoriteGroups.value) {
            const ref = cachedFavoriteGroups.value[key];
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
        favoriteFriendGroups.value = [];
        for (i = 0; i < favoriteLimits.value.maxFavoriteGroups.friend; ++i) {
            favoriteFriendGroups.value.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: favoriteLimits.value.maxFavoritesPerGroup.friend,
                count: 0,
                visibility: 'private'
            });
        }
        // 400 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 100
        favoriteWorldGroups.value = [];
        for (i = 0; i < favoriteLimits.value.maxFavoriteGroups.world; ++i) {
            favoriteWorldGroups.value.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: favoriteLimits.value.maxFavoritesPerGroup.world,
                count: 0,
                visibility: 'private'
            });
        }
        // 350 = ['avatars1', ...] x 50
        // Favorite Avatars (0/50)
        // VRC+ Group 1..5 (0/50)
        favoriteAvatarGroups.value = [];
        for (i = 0; i < favoriteLimits.value.maxFavoriteGroups.avatar; ++i) {
            favoriteAvatarGroups.value.push({
                assign: false,
                key: `avatar:avatars${i + 1}`,
                type: 'avatar',
                name: `avatars${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: favoriteLimits.value.maxFavoritesPerGroup.avatar,
                count: 0,
                visibility: 'private'
            });
        }
        const types = {
            friend: favoriteFriendGroups.value,
            world: favoriteWorldGroups.value,
            avatar: favoriteAvatarGroups.value
        };
        const assigns = new Set();
        // assign the same name first
        for (const key in cachedFavoriteGroups.value) {
            const ref = cachedFavoriteGroups.value[key];
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
                    assigns.add(ref.id);
                    break;
                }
            }
        }

        for (const key in cachedFavoriteGroups.value) {
            const ref = cachedFavoriteGroups.value[key];
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
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // update favorites

        for (ref of cachedFavorites.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            group = cachedFavoriteGroupsByTypeName.value[ref.$groupKey];
            if (typeof group === 'undefined') {
                continue;
            }
            ++group.count;
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async function refreshFavorites() {
        if (isFavoriteLoading.value) {
            return;
        }
        isFavoriteLoading.value = true;
        try {
            const args = await favoriteRequest.getFavoriteLimits();
            favoriteLimits.value = {
                ...favoriteLimits.value,
                ...args.json
            };
        } catch (err) {
            console.error(err);
        }
        expireFavorites();
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
                isFavoriteLoading.value = false;
                watchState.isFavoritesLoaded = true;
            }
        });
    }

    /**
     *
     * @param json
     * @returns {any}
     */
    function applyFavoriteGroup(json) {
        let ref = cachedFavoriteGroups.value[json.id];
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
                //
                ...json
            };
            cachedFavoriteGroups.value[ref.id] = ref;
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
        let ref = cachedFavorites.get(json.id);
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
                //
                ...json
            };
            cachedFavorites.set(ref.id, ref);
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

        if (ref.$isDeleted === false) {
            const group = cachedFavoriteGroupsByTypeName.value[ref.$groupKey];
            if (typeof group !== 'undefined') {
                ++group.count;
            }
        }
        return ref;
    }

    /**
     *
     */
    function deleteExpiredFavorites() {
        for (const ref of cachedFavorites.values()) {
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
        for (const ref of cachedFavorites.values()) {
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
        worldImportDialogVisible.value = true;
    }

    function showAvatarImportDialog() {
        avatarImportDialogVisible.value = true;
    }

    function showFriendImportDialog() {
        friendImportDialogVisible.value = true;
    }

    /**
     *
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
        if (!localWorldFavorites.value[group]) {
            localWorldFavorites.value[group] = [];
        }

        localWorldFavorites.value[group].unshift(ref);
        database.addWorldToCache(ref);
        database.addWorldToFavorites(worldId, group);
        if (
            favoriteDialog.value.visible &&
            favoriteDialog.value.objectId === worldId
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
     *
     * @param {string} worldId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalWorldFavorite(worldId, group) {
        const favoriteGroup = localWorldFavorites.value[group];
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
     *
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
        if (!localAvatarFavorites.value[group]) {
            localAvatarFavorites.value[group] = [];
        }
        localAvatarFavorites.value[group].unshift(ref);
        database.addAvatarToCache(ref);
        database.addAvatarToFavorites(avatarId, group);
        if (
            favoriteDialog.value.visible &&
            favoriteDialog.value.objectId === avatarId
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
     *
     * @param {string} avatarId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalAvatarFavorite(avatarId, group) {
        const favoriteGroup = localAvatarFavorites.value[group];
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

    function updateFavoriteDialog(objectId) {
        const D = favoriteDialog.value;
        if (!D.visible || D.objectId !== objectId) {
            return;
        }
        D.currentGroup = {};
        const favorite = state.favoriteObjects.get(objectId);
        if (favorite) {
            let group;
            for (group of favoriteWorldGroups.value) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of favoriteAvatarGroups.value) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of favoriteFriendGroups.value) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {string} group
     */
    function deleteLocalAvatarFavoriteGroup(group) {
        let i;
        // remove from cache if no longer in favorites
        const avatarIdRemoveList = new Set();
        const favoriteGroup = localAvatarFavorites.value[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            avatarIdRemoveList.add(favoriteGroup[i].id);
        }

        delete localAvatarFavorites.value[group];
        database.deleteAvatarFavoriteGroup(group);

        for (i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
            const groupName = localAvatarFavoriteGroups.value[i];
            if (!localAvatarFavorites.value[groupName]) {
                continue;
            }
            for (
                let j = 0;
                j < localAvatarFavorites.value[groupName].length;
                ++j
            ) {
                const avatarId = localAvatarFavorites.value[groupName][j].id;
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
                i < localAvatarFavoriteGroups.value.length;
                ++i
            ) {
                const groupName = localAvatarFavoriteGroups.value[i];
                if (
                    !localAvatarFavorites.value[groupName] ||
                    group === groupName
                ) {
                    continue loop;
                }
                for (
                    let j = 0;
                    j < localAvatarFavorites.value[groupName].length;
                    ++j
                ) {
                    const avatarId =
                        localAvatarFavorites.value[groupName][j].id;
                    if (id === avatarId) {
                        avatarInFavorites = true;
                        break loop;
                    }
                }
            }
            if (!avatarInFavorites) {
                if (!avatarStore.avatarHistory.has(id)) {
                    database.removeAvatarFromCache(id);
                }
            }
        });
    }

    function sortLocalAvatarFavorites() {
        if (!appearanceSettingsStore.sortFavorites) {
            for (let i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
                const group = localAvatarFavoriteGroups.value[i];
                if (localAvatarFavorites.value[group]) {
                    localAvatarFavorites.value[group].sort(compareByName);
                }
            }
        }
    }

    /**
     *
     * @param {string} newName
     * @param {string} group
     */
    function renameLocalAvatarFavoriteGroup(newName, group) {
        if (localAvatarFavoriteGroups.value.includes(newName)) {
            ElMessage({
                message: t('prompt.local_favorite_group_rename.message.error', {
                    name: newName
                }),
                type: 'error'
            });
            return;
        }
        localAvatarFavorites.value[newName] = localAvatarFavorites.value[group];

        delete localAvatarFavorites.value[group];
        database.renameAvatarFavoriteGroup(newName, group);
        sortLocalAvatarFavorites();
    }

    /**
     *
     * @param {string} group
     */
    function newLocalAvatarFavoriteGroup(group) {
        if (localAvatarFavoriteGroups.value.includes(group)) {
            ElMessage({
                message: t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!localAvatarFavorites.value[group]) {
            localAvatarFavorites.value[group] = [];
        }
        sortLocalAvatarFavorites();
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async function getLocalAvatarFavorites() {
        const localGroups = new Set();
        const localListSet = new Set();
        const localFavorites = Object.create(null);

        const avatarCache = await database.getAvatarCache();
        for (let i = 0; i < avatarCache.length; ++i) {
            const ref = avatarCache[i];
            if (!avatarStore.cachedAvatars.has(ref.id)) {
                avatarStore.applyAvatar(ref);
            }
        }

        const favorites = await database.getAvatarFavorites();
        for (let i = 0; i < favorites.length; ++i) {
            const favorite = favorites[i];

            localListSet.add(favorite.avatarId);

            if (!localFavorites[favorite.groupName]) {
                localFavorites[favorite.groupName] = [];
            }
            localGroups.add(favorite.groupName);

            let ref = avatarStore.cachedAvatars.get(favorite.avatarId);
            if (typeof ref === 'undefined') {
                ref = { id: favorite.avatarId };
            }
            localFavorites[favorite.groupName].unshift(ref);
        }

        let groupsArr = Array.from(localGroups);
        if (groupsArr.length === 0) {
            // default group
            localFavorites.Favorites = [];
            groupsArr = ['Favorites'];
        }

        localAvatarFavorites.value = localFavorites;

        sortLocalAvatarFavorites();
    }

    /**
     *
     * @param {string} avatarId
     * @param {string} group
     */
    function removeLocalAvatarFavorite(avatarId, group) {
        let i;
        const favoriteGroup = localAvatarFavorites.value[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let avatarInFavorites = false;
        for (i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
            const groupName = localAvatarFavoriteGroups.value[i];
            if (!localAvatarFavorites.value[groupName] || group === groupName) {
                continue;
            }
            for (
                let j = 0;
                j < localAvatarFavorites.value[groupName].length;
                ++j
            ) {
                const id = localAvatarFavorites.value[groupName][j].id;
                if (id === avatarId) {
                    avatarInFavorites = true;
                    break;
                }
            }
        }
        if (!avatarInFavorites) {
            if (!avatarStore.avatarHistory.has(avatarId)) {
                database.removeAvatarFromCache(avatarId);
            }
        }
        database.removeAvatarFromFavorites(avatarId, group);
        if (
            favoriteDialog.value.visible &&
            favoriteDialog.value.objectId === avatarId
        ) {
            updateFavoriteDialog(avatarId);
        }
        if (
            avatarStore.avatarDialog.visible &&
            avatarStore.avatarDialog.id === avatarId
        ) {
            avatarStore.avatarDialog.isFavorite =
                cachedFavoritesByObjectId.value(avatarId);
        }

        // update UI
        sortLocalAvatarFavorites();
    }

    /**
     *
     * @param {string} group
     */
    function deleteLocalWorldFavoriteGroup(group) {
        let i;
        // remove from cache if no longer in favorites
        const worldIdRemoveList = new Set();
        const favoriteGroup = localWorldFavorites.value[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            worldIdRemoveList.add(favoriteGroup[i].id);
        }

        delete localWorldFavorites.value[group];
        database.deleteWorldFavoriteGroup(group);

        for (i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const groupName = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites.value[groupName]) {
                continue;
            }
            for (
                let j = 0;
                j < localWorldFavorites.value[groupName].length;
                ++j
            ) {
                const worldId = localWorldFavorites.value[groupName][j].id;
                if (worldIdRemoveList.has(worldId)) {
                    worldIdRemoveList.delete(worldId);
                    break;
                }
            }
        }

        worldIdRemoveList.forEach((id) => {
            database.removeWorldFromCache(id);
        });
    }

    function sortLocalWorldFavorites() {
        if (!appearanceSettingsStore.sortFavorites) {
            for (let i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
                const group = localWorldFavoriteGroups.value[i];
                if (localWorldFavorites.value[group]) {
                    localWorldFavorites.value[group].sort(compareByName);
                }
            }
        }
    }

    /**
     *
     * @param {string} newName
     * @param {string} group
     */
    function renameLocalWorldFavoriteGroup(newName, group) {
        if (localWorldFavoriteGroups.value.includes(newName)) {
            ElMessage({
                message: t('prompt.local_favorite_group_rename.message.error', {
                    name: newName
                }),
                type: 'error'
            });
            return;
        }
        localWorldFavorites.value[newName] = localWorldFavorites.value[group];

        delete localWorldFavorites.value[group];
        database.renameWorldFavoriteGroup(newName, group);
        sortLocalWorldFavorites();
    }

    /**
     *
     * @param {string} worldId
     * @param {string} group
     */
    function removeLocalWorldFavorite(worldId, group) {
        let i;
        const favoriteGroup = localWorldFavorites.value[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let worldInFavorites = false;
        for (i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const groupName = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites.value[groupName] || group === groupName) {
                continue;
            }
            for (
                let j = 0;
                j < localWorldFavorites.value[groupName].length;
                ++j
            ) {
                const id = localWorldFavorites.value[groupName][j].id;
                if (id === worldId) {
                    worldInFavorites = true;
                    break;
                }
            }
        }
        if (!worldInFavorites) {
            database.removeWorldFromCache(worldId);
        }
        database.removeWorldFromFavorites(worldId, group);
        if (
            favoriteDialog.value.visible &&
            favoriteDialog.value.objectId === worldId
        ) {
            updateFavoriteDialog(worldId);
        }
        if (
            worldStore.worldDialog.visible &&
            worldStore.worldDialog.id === worldId
        ) {
            worldStore.worldDialog.isFavorite =
                cachedFavoritesByObjectId.value(worldId);
        }

        // update UI
        sortLocalWorldFavorites();
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async function getLocalWorldFavorites() {
        const localGroups = new Set();
        const localListSet = new Set();
        const localFavorites = Object.create(null);

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

            localListSet.add(favorite.worldId);

            if (!localFavorites[favorite.groupName]) {
                localFavorites[favorite.groupName] = [];
            }
            localGroups.add(favorite.groupName);

            let ref = worldStore.cachedWorlds.get(favorite.worldId);
            if (typeof ref === 'undefined') {
                ref = { id: favorite.worldId };
            }
            localFavorites[favorite.groupName].unshift(ref);
        }

        let groupsArr = Array.from(localGroups);
        if (groupsArr.length === 0) {
            localFavorites.Favorites = [];
            // default group
            groupsArr = ['Favorites'];
        }

        localWorldFavorites.value = localFavorites;

        sortLocalWorldFavorites();
    }

    /**
     *
     * @param {string} group
     */
    function newLocalWorldFavoriteGroup(group) {
        if (localWorldFavoriteGroups.value.includes(group)) {
            ElMessage({
                message: t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!localWorldFavorites.value[group]) {
            localWorldFavorites.value[group] = [];
        }
        if (!localWorldFavoriteGroups.value.includes(group)) {
            localWorldFavoriteGroups.value.push(group);
        }
        sortLocalWorldFavorites();
    }

    /**
     *
     * @param {string} objectId
     */
    function deleteFavoriteNoConfirm(objectId) {
        if (!objectId) {
            return;
        }
        favoriteDialog.value.visible = true;
        favoriteRequest
            .deleteFavorite({
                objectId
            })
            .then(() => {
                favoriteDialog.value.visible = false;
            })
            .finally(() => {
                favoriteDialog.value.loading = false;
            });
    }

    function showFavoriteDialog(type, objectId) {
        const D = favoriteDialog.value;
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
        localWorldFavoritesList,
        cachedFavoritesByObjectId,
        localWorldFavoriteGroups,
        groupedByGroupKeyFavoriteFriends,
        currentFavoriteTab,
        localWorldFavGroupLength,
        localAvatarFavGroupLength,
        editFavoritesMode,

        initFavorites,
        applyFavorite,
        refreshFavoriteGroups,
        refreshFavorites,
        applyFavoriteGroup,
        refreshFavoriteAvatars,
        clearBulkFavoriteSelection,
        showWorldImportDialog,
        showAvatarImportDialog,
        showFriendImportDialog,
        addLocalWorldFavorite,
        hasLocalWorldFavorite,
        hasLocalAvatarFavorite,
        addLocalAvatarFavorite,
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
