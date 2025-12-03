import { computed, reactive, ref, shallowReactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import {
    compareByName,
    removeFromArray,
    replaceReactiveObject
} from '../shared/utils';
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

    const cachedFavoriteGroups = ref({});

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

    const localWorldFavorites = reactive({});

    const localAvatarFavorites = reactive({});

    const selectedFavoriteFriends = ref([]);
    const selectedFavoriteWorlds = ref([]);
    const selectedFavoriteAvatars = ref([]);

    const favoriteDialog = ref({
        visible: false,
        loading: false,
        type: '',
        objectId: '',
        currentGroup: {}
    });

    const favoritesSortOrder = ref([]);

    const favoriteFriends = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteFriends_.sort(compareByFavoriteSortOrder);
        }
        return state.favoriteFriends_.sort(compareByName);
    });

    const favoriteWorlds = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteWorlds_.sort(compareByFavoriteSortOrder);
        }
        return state.favoriteWorlds_.sort(compareByName);
    });

    const favoriteAvatars = computed(() => {
        if (appearanceSettingsStore.sortFavorites) {
            return state.favoriteAvatars_.sort(compareByFavoriteSortOrder);
        }
        return state.favoriteAvatars_.sort(compareByName);
    });

    watch(
        favoriteFriends,
        (list) => {
            syncFavoriteSelection(list, selectedFavoriteFriends);
        },
        { immediate: true }
    );

    watch(
        favoriteWorlds,
        (list) => {
            syncFavoriteSelection(list, selectedFavoriteWorlds);
        },
        { immediate: true }
    );

    watch(
        favoriteAvatars,
        (list) => {
            syncFavoriteSelection(list, selectedFavoriteAvatars);
        },
        { immediate: true }
    );

    const localAvatarFavoriteGroups = computed(() =>
        Object.keys(localAvatarFavorites).sort()
    );

    const localWorldFavoriteGroups = computed(() =>
        Object.keys(localWorldFavorites).sort()
    );

    const localWorldFavoritesList = computed(() =>
        Object.values(localWorldFavorites)
            .flat()
            .map((fav) => fav.id)
    );

    const localAvatarFavoritesList = computed(() =>
        Object.values(localAvatarFavorites)
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
        const favoriteGroup = localWorldFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    });

    const localAvatarFavGroupLength = computed(() => (group) => {
        const favoriteGroup = localAvatarFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    });

    function syncFavoriteSelection(list, selectionRef) {
        if (!Array.isArray(list)) {
            selectionRef.value = [];
            return;
        }
        const availableIds = new Set(list.map((item) => item.id));
        const filtered = selectionRef.value.filter((id) =>
            availableIds.has(id)
        );
        if (filtered.length !== selectionRef.value.length) {
            selectionRef.value = filtered;
        }
    }

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
            replaceReactiveObject(localWorldFavorites, {});
            replaceReactiveObject(localAvatarFavorites, {});
            selectedFavoriteFriends.value = [];
            selectedFavoriteWorlds.value = [];
            selectedFavoriteAvatars.value = [];
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

    function getCachedFavoriteGroupsByTypeName() {
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
    }

    function getCachedFavoritesByObjectId(objectId) {
        for (const item of cachedFavorites.values()) {
            if (item.favoriteId === objectId) {
                return item;
            }
        }
        return undefined;
    }

    function handleFavoriteAdd(args) {
        handleFavorite({
            json: args.json,
            params: {
                favoriteId: args.json.id
            }
        });
        if (!favoritesSortOrder.value.includes(args.params.favoriteId)) {
            favoritesSortOrder.value.unshift(args.params.favoriteId);
        }

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
        args.ref = applyFavoriteCached(args.json);
        applyFavorite(args.ref.type, args.ref.favoriteId);
        friendStore.updateFriend(args.ref.favoriteId);
        const { ref } = args;
        const userDialog = userStore.userDialog;
        if (userDialog.visible && ref.favoriteId === userDialog.id) {
            userDialog.isFavorite = true;
        }
        const worldDialog = worldStore.worldDialog;
        if (worldDialog.visible && ref.favoriteId === worldDialog.id) {
            worldDialog.isFavorite = true;
        }
        const avatarDialog = avatarStore.avatarDialog;
        if (avatarDialog.visible && ref.favoriteId === avatarDialog.id) {
            avatarDialog.isFavorite = true;
        }
    }

    function handleFavoriteDelete(objectId) {
        const ref = getCachedFavoritesByObjectId(objectId);
        if (typeof ref === 'undefined') {
            return;
        }
        handleFavoriteAtDelete(ref);
    }

    function handleFavoriteGroup(args) {
        args.ref = applyFavoriteGroup(args.json);
    }

    function handleFavoriteGroupClear(args) {
        const key = `${args.params.type}:${args.params.group}`;
        for (const ref of cachedFavorites.values()) {
            if (ref.$groupKey !== key) {
                continue;
            }
            handleFavoriteAtDelete(ref);
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

    function handleFavoriteAtDelete(ref) {
        const favorite = state.favoriteObjects.get(ref.favoriteId);
        removeFromArray(state.favoriteFriends_, favorite);
        removeFromArray(state.favoriteWorlds_, favorite);
        removeFromArray(state.favoriteAvatars_, favorite);
        cachedFavorites.delete(ref.id);
        state.favoriteObjects.delete(ref.favoriteId);
        friendStore.localFavoriteFriends.delete(ref.favoriteId);
        favoritesSortOrder.value = favoritesSortOrder.value.filter(
            (id) => id !== ref.favoriteId
        );

        friendStore.updateFriend(ref.favoriteId);
        friendStore.updateSidebarFavorites();
        const userDialog = userStore.userDialog;
        if (userDialog.visible && userDialog.id === ref.favoriteId) {
            userDialog.isFavorite = false;
        }
        const worldDialog = worldStore.worldDialog;
        if (worldDialog.visible && worldDialog.id === ref.favoriteId) {
            worldDialog.isFavorite = localWorldFavoritesList.value.includes(
                worldDialog.id
            );
        }
        const avatarDialog = avatarStore.avatarDialog;
        if (avatarDialog.visible && avatarDialog.id === ref.favoriteId) {
            avatarDialog.isFavorite = false;
        }
    }

    /**
     *
     * @param {'friend' | 'world' | 'avatar'} type
     * @param {string} objectId
     * @returns {Promise<void>}
     */
    async function applyFavorite(type, objectId) {
        let ref;
        const favorite = getCachedFavoritesByObjectId(objectId);
        let ctx = state.favoriteObjects.get(objectId);
        if (ctx) {
            ctx = shallowReactive(ctx);
        }
        if (typeof favorite !== 'undefined') {
            let isTypeChanged = false;
            if (typeof ctx === 'undefined') {
                ctx = {
                    id: objectId,
                    type,
                    groupKey: favorite.$groupKey,
                    ref: null,
                    name: ''
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
                if (type === 'friend') {
                    state.favoriteFriends_.push(ctx);
                } else if (type === 'world') {
                    state.favoriteWorlds_.push(ctx);
                } else if (type === 'avatar') {
                    state.favoriteAvatars_.push(ctx);
                }
            }
        }
    }

    function refreshFavoriteGroups() {
        if (isFavoriteGroupLoading.value) {
            return;
        }
        isFavoriteGroupLoading.value = true;
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
                    buildFavoriteGroups();
                }
                isFavoriteGroupLoading.value = false;
            }
        });
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
            if (assigns.has(ref.id)) {
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
            group = getCachedFavoriteGroupsByTypeName()[ref.$groupKey];
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
        let newFavoriteSortOrder = [];
        processBulk({
            fn: favoriteRequest.getFavorites,
            N: -1,
            params: {
                n: 300,
                offset: 0
            },
            handle(args) {
                for (const json of args.json) {
                    newFavoriteSortOrder.push(json.favoriteId);
                    handleFavorite({
                        json,
                        params: {
                            favoriteId: json.id
                        }
                    });
                }
            },
            done(ok) {
                if (ok) {
                    for (const id of favoritesSortOrder.value) {
                        if (!newFavoriteSortOrder.includes(id)) {
                            const fav = cachedFavorites.get(id);
                            if (fav) {
                                handleFavoriteAtDelete(fav);
                            }
                        }
                    }
                    favoritesSortOrder.value = newFavoriteSortOrder;
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
                ...json
            };
            cachedFavoriteGroups.value[ref.id] = ref;
        } else {
            Object.assign(ref, json);
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
                friendStore.updateSidebarFavorites();
            }
            ref.$groupKey = `${ref.type}:${String(ref.tags[0])}`;
            const group = getCachedFavoriteGroupsByTypeName()[ref.$groupKey];
            if (typeof group !== 'undefined') {
                ++group.count;
            }
        } else {
            Object.assign(ref, json);
        }

        return ref;
    }

    /**
     *
     * @param tag
     */
    async function refreshFavoriteAvatars(tag) {
        const params = {
            n: 300,
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
                        processBulk({
                            fn,
                            N,
                            handle: (args) => handleFavoriteAvatarList(args),
                            params: {
                                n: 300,
                                offset: 0,
                                tag
                            }
                        });
                    }
                } else {
                    processBulk({
                        fn,
                        N,
                        handle: (args) => handleFavoriteWorldList(args),
                        params: {
                            n: 300,
                            offset: 0
                        }
                    });
                }
            }
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
        if (!localWorldFavorites[group]) {
            localWorldFavorites[group] = [];
        }

        localWorldFavorites[group].unshift(ref);
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
        const favoriteGroup = localWorldFavorites[group];
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
        if (!localAvatarFavorites[group]) {
            localAvatarFavorites[group] = [];
        }
        localAvatarFavorites[group].unshift(ref);
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
        const favoriteGroup = localAvatarFavorites[group];
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
        const favoriteGroup = localAvatarFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            avatarIdRemoveList.add(favoriteGroup[i].id);
        }

        delete localAvatarFavorites[group];
        database.deleteAvatarFavoriteGroup(group);

        for (i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
            const groupName = localAvatarFavoriteGroups.value[i];
            if (!localAvatarFavorites[groupName]) {
                continue;
            }
            for (let j = 0; j < localAvatarFavorites[groupName].length; ++j) {
                const avatarId = localAvatarFavorites[groupName][j].id;
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
                if (!localAvatarFavorites[groupName] || group === groupName) {
                    continue loop;
                }
                for (
                    let j = 0;
                    j < localAvatarFavorites[groupName].length;
                    ++j
                ) {
                    const avatarId = localAvatarFavorites[groupName][j].id;
                    if (id === avatarId) {
                        avatarInFavorites = true;
                        break loop;
                    }
                }
            }
            if (!avatarInFavorites) {
                if (!avatarStore.avatarHistory.includes(id)) {
                    database.removeAvatarFromCache(id);
                }
            }
        });
    }

    function sortLocalAvatarFavorites() {
        if (!appearanceSettingsStore.sortFavorites) {
            for (let i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
                const group = localAvatarFavoriteGroups.value[i];
                if (localAvatarFavorites[group]) {
                    localAvatarFavorites[group].sort(compareByName);
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
        localAvatarFavorites[newName] = localAvatarFavorites[group];

        delete localAvatarFavorites[group];
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
        if (!localAvatarFavorites[group]) {
            localAvatarFavorites[group] = [];
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

        replaceReactiveObject(localAvatarFavorites, localFavorites);

        sortLocalAvatarFavorites();
    }

    /**
     *
     * @param {string} avatarId
     * @param {string} group
     */
    function removeLocalAvatarFavorite(avatarId, group) {
        let i;
        const favoriteGroup = localAvatarFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let avatarInFavorites = false;
        for (i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
            const groupName = localAvatarFavoriteGroups.value[i];
            if (!localAvatarFavorites[groupName] || group === groupName) {
                continue;
            }
            for (let j = 0; j < localAvatarFavorites[groupName].length; ++j) {
                const id = localAvatarFavorites[groupName][j].id;
                if (id === avatarId) {
                    avatarInFavorites = true;
                    break;
                }
            }
        }
        if (!avatarInFavorites) {
            if (!avatarStore.avatarHistory.includes(avatarId)) {
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
                getCachedFavoritesByObjectId(avatarId);
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
        const favoriteGroup = localWorldFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            worldIdRemoveList.add(favoriteGroup[i].id);
        }

        delete localWorldFavorites[group];
        database.deleteWorldFavoriteGroup(group);

        for (i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const groupName = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites[groupName]) {
                continue;
            }
            for (let j = 0; j < localWorldFavorites[groupName].length; ++j) {
                const worldId = localWorldFavorites[groupName][j].id;
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
                if (localWorldFavorites[group]) {
                    localWorldFavorites[group].sort(compareByName);
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
        localWorldFavorites[newName] = localWorldFavorites[group];

        delete localWorldFavorites[group];
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
        const favoriteGroup = localWorldFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        let worldInFavorites = false;
        for (i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const groupName = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites[groupName] || group === groupName) {
                continue;
            }
            for (let j = 0; j < localWorldFavorites[groupName].length; ++j) {
                const id = localWorldFavorites[groupName][j].id;
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
                getCachedFavoritesByObjectId(worldId);
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

        replaceReactiveObject(localWorldFavorites, localFavorites);

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
        if (!localWorldFavorites[group]) {
            localWorldFavorites[group] = [];
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

    function compareByFavoriteSortOrder(a, b) {
        const indexA = favoritesSortOrder.value.indexOf(a.id);
        const indexB = favoritesSortOrder.value.indexOf(b.id);
        return indexA - indexB;
    }

    return {
        state,

        favoriteFriends,
        favoriteWorlds,
        favoriteAvatars,
        isFavoriteGroupLoading,
        favoriteFriendGroups,
        cachedFavoriteGroups,
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

        localWorldFavoriteGroups,
        groupedByGroupKeyFavoriteFriends,
        selectedFavoriteFriends,
        selectedFavoriteWorlds,
        selectedFavoriteAvatars,
        localWorldFavGroupLength,
        localAvatarFavGroupLength,
        favoritesSortOrder,

        initFavorites,
        applyFavorite,
        refreshFavoriteGroups,
        refreshFavorites,
        applyFavoriteGroup,
        refreshFavoriteAvatars,
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
        handleFavoriteAdd,
        getCachedFavoritesByObjectId
    };
});
