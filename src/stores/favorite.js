import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import {
    compareByName,
    createDefaultFavoriteGroupRef,
    replaceReactiveObject
} from '../shared/utils';
import { favoriteRequest } from '../api';
import { database } from '../services/database';
import { processBulk } from '../services/request';
import { useAppearanceSettingsStore } from './settings/appearance';
import { watchState } from '../services/watchState';
import { onLoginStateChanged } from '../coordinators/favoriteCoordinator';

export const useFavoriteStore = defineStore('Favorite', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();

    const { t } = useI18n();

    const state = reactive({
        favoriteObjects: new Map(),
        favoriteFriends_: [],
        favoriteWorlds_: [],
        favoriteAvatars_: []
    });

    const cachedFavorites = reactive(new Map());
    const cachedFavoritesByObjectId = reactive(new Map());

    const cachedFavoriteGroups = ref({});

    const isFavoriteGroupLoading = ref(false);

    const favoriteFriendGroups = ref([]);

    const favoriteWorldGroups = ref([]);
    const favoriteAvatarGroups = ref([]);

    const favoriteLimits = ref({
        maxFavoriteGroups: {
            avatar: 6,
            friend: 3,
            vrcPlusWorld: 4,
            world: 4
        },
        maxFavoritesPerGroup: {
            avatar: 50,
            friend: 150,
            vrcPlusWorld: 100,
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

    const localFriendFavorites = reactive({});

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

    const localFriendFavoritesList = computed(() =>
        Object.values(localFriendFavorites)
            .flat()
            .map((userId) => userId)
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

    const localFriendFavoriteGroups = computed(() =>
        Object.keys(localFriendFavorites).sort()
    );

    const localFriendFavGroupLength = computed(() => (group) => {
        const favoriteGroup = localFriendFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    });

    /**
     *
     * @param {Array} list
     * @param {object} selectionRef
     * @returns {void}
     */
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
            // Internal state reset
            cachedFavorites.clear();
            cachedFavoritesByObjectId.clear();
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
            // Cross-store operations delegated to coordinator
            onLoginStateChanged(isLoggedIn);
        },
        { flush: 'sync' }
    );

    /**
     * @returns {void}
     */
    function getCachedFavoriteGroupsByTypeName() {
        const groups = {};
        for (const group of favoriteFriendGroups.value) {
            groups[group.key] = group;
        }
        for (const group of favoriteWorldGroups.value) {
            groups[group.key] = group;
        }
        for (const group of favoriteAvatarGroups.value) {
            groups[group.key] = group;
        }
        return groups;
    }

    /**
     *
     * @param {string} objectId
     * @returns {object | undefined}
     */
    function getCachedFavoritesByObjectId(objectId) {
        return cachedFavoritesByObjectId.get(objectId);
    }

    /**
     *
     * @param {object}  args
     * @returns {void}
     */
    function handleFavoriteGroup(args) {
        args.ref = applyFavoriteGroup(args.json);
    }

    /**
     *
     * @returns {void}
     */
    function refreshFavoriteGroups() {
        if (isFavoriteGroupLoading.value) {
            return;
        }
        isFavoriteGroupLoading.value = true;
        processBulk({
            fn: (params) => favoriteRequest.getFavoriteGroups(params),
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

    /**
     *
     */
    function buildFavoriteGroups() {
        let group;
        let groups;
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
        // 400 = ['vrcPlusWorlds1', 'vrcPlusWorlds2', 'vrcPlusWorlds3', 'vrcPlusWorlds4'] x 100
        for (
            i = 0;
            i < favoriteLimits.value.maxFavoriteGroups.vrcPlusWorld;
            ++i
        ) {
            favoriteWorldGroups.value.push({
                assign: false,
                key: `vrcPlusWorld:vrcPlusWorlds${i + 1}`,
                type: 'vrcPlusWorld',
                name: `vrcPlusWorlds${i + 1}`,
                displayName: `VRC+ Group ${i + 1}`,
                capacity:
                    favoriteLimits.value.maxFavoritesPerGroup.vrcPlusWorld,
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
            vrcPlusWorld: favoriteWorldGroups.value,
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
        countFavoriteGroups();
    }

    /**
     *
     */
    function countFavoriteGroups() {
        const cachedFavoriteGroups = getCachedFavoriteGroupsByTypeName();
        for (const key in cachedFavoriteGroups) {
            cachedFavoriteGroups[key].count = 0;
        }
        for (let ref of cachedFavorites.values()) {
            let group = cachedFavoriteGroups[ref.$groupKey];
            if (typeof group === 'undefined') {
                continue;
            }
            ++group.count;
        }
    }

    /**
     *
     * @param {object} json
     * @returns {object}
     */
    function applyFavoriteGroup(json) {
        let ref = cachedFavoriteGroups.value[json.id];
        if (typeof ref === 'undefined') {
            ref = createDefaultFavoriteGroupRef(json);
            cachedFavoriteGroups.value[ref.id] = ref;
        } else {
            Object.assign(ref, json);
        }
        return ref;
    }

    /**
     * @returns {void}
     */
    function showWorldImportDialog() {
        worldImportDialogVisible.value = true;
    }

    /**
     * @returns {void}
     */
    function showAvatarImportDialog() {
        avatarImportDialogVisible.value = true;
    }

    /**
     * @returns {void}
     */
    function showFriendImportDialog() {
        friendImportDialogVisible.value = true;
    }

    /**
     * @param {string} value
     */
    function setAvatarImportDialogInput(value) {
        avatarImportDialogInput.value = value;
    }

    /**
     * @param {string} value
     */
    function setWorldImportDialogInput(value) {
        worldImportDialogInput.value = value;
    }

    /**
     * @param {string} value
     */
    function setFriendImportDialogInput(value) {
        friendImportDialogInput.value = value;
    }

    /**
     *
     * @param avatarRef
     */
    function syncLocalAvatarFavoriteRef(avatarRef) {
        if (!avatarRef?.id) {
            return;
        }
        for (let i = 0; i < localAvatarFavoriteGroups.value.length; ++i) {
            const groupName = localAvatarFavoriteGroups.value[i];
            const group = localAvatarFavorites[groupName];
            if (!group) {
                continue;
            }
            for (let j = 0; j < group.length; ++j) {
                if (group[j]?.id === avatarRef.id) {
                    group[j] = avatarRef;
                }
            }
        }
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

    /**
     *
     * @param {string} objectId
     */
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

    /**
     * @param {string} userId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalFriendFavorite(userId, group) {
        const favoriteGroup = localFriendFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        return favoriteGroup.includes(userId);
    }

    /**
     * Check if a user is in any local friend favorite group.
     * @param {string} userId
     * @returns {boolean}
     */
    function isInAnyLocalFriendGroup(userId) {
        for (const group in localFriendFavorites) {
            if (localFriendFavorites[group]?.includes(userId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} group
     */
    function newLocalFriendFavoriteGroup(group) {
        if (localFriendFavoriteGroups.value.includes(group)) {
            toast.error(
                t('prompt.new_local_favorite_group.message.error', {
                    name: group
                })
            );
            return;
        }
        if (!localFriendFavorites[group]) {
            localFriendFavorites[group] = [];
        }
    }

    /**
     *
     * @param objectId
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

    /**
     *
     * @param type
     * @param objectId
     */
    function showFavoriteDialog(type, objectId) {
        const D = favoriteDialog.value;
        D.type = type;
        D.objectId = objectId;
        D.visible = true;
        updateFavoriteDialog(objectId);
    }

    /**
     *
     * @param a
     * @param b
     */
    function compareByFavoriteSortOrder(a, b) {
        const indexA = favoritesSortOrder.value.indexOf(a.id);
        const indexB = favoritesSortOrder.value.indexOf(b.id);
        return indexA - indexB;
    }

    /**
     * @param {boolean} value
     */
    function setIsFavoriteLoading(value) {
        isFavoriteLoading.value = value;
    }

    /**
     * @param {object} value
     */
    function setFavoriteLimits(value) {
        favoriteLimits.value = value;
    }

    /**
     * @param {Array} value
     */
    function setFavoritesSortOrder(value) {
        favoritesSortOrder.value = value;
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
        cachedFavoritesByObjectId,
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
        localFriendFavoritesList,

        localWorldFavoriteGroups,
        localFriendFavorites,
        localFriendFavoriteGroups,

        localFriendFavGroupLength,
        groupedByGroupKeyFavoriteFriends,
        selectedFavoriteFriends,
        selectedFavoriteWorlds,
        selectedFavoriteAvatars,
        localWorldFavGroupLength,
        localAvatarFavGroupLength,
        favoritesSortOrder,

        refreshFavoriteGroups,
        applyFavoriteGroup,
        showWorldImportDialog,
        showAvatarImportDialog,
        showFriendImportDialog,
        setAvatarImportDialogInput,
        setWorldImportDialogInput,
        setFriendImportDialogInput,
        syncLocalAvatarFavoriteRef,
        hasLocalWorldFavorite,
        hasLocalAvatarFavorite,
        updateFavoriteDialog,
        deleteLocalWorldFavoriteGroup,
        deleteFavoriteNoConfirm,
        showFavoriteDialog,
        getCachedFavoritesByObjectId,
        getCachedFavoriteGroupsByTypeName,
        handleFavoriteGroup,
        hasLocalFriendFavorite,
        isInAnyLocalFriendGroup,
        newLocalFriendFavoriteGroup,
        countFavoriteGroups,
        setIsFavoriteLoading,
        setFavoriteLimits,
        setFavoritesSortOrder
    };
});
