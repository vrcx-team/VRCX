import { toast } from 'vue-sonner';
import { useFavoriteStore } from '../stores/favorite';
import { useAppearanceSettingsStore } from '../stores/settings/appearance';
import { useAvatarStore } from '../stores/avatar';
import { applyAvatar } from './avatarCoordinator';
import { useFriendStore } from '../stores/friend';
import { useGeneralSettingsStore } from '../stores/settings/general';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';
import { applyWorld } from './worldCoordinator';
import { runUpdateFriendFlow } from './friendPresenceCoordinator';
import { avatarRequest, favoriteRequest, queryRequest } from '../api';
import { database } from '../services/database';
import { i18n } from '../plugins/i18n';
import { processBulk } from '../services/request';
import { watchState } from '../services/watchState';
import {
    compareByName,
    createDefaultFavoriteCachedRef,
    removeFromArray,
    replaceReactiveObject
} from '../shared/utils';

// --- handleFavorite / handleFavoriteAtDelete / handleFavoriteAdd ---

/**
 *
 * @param {object} args
 * @returns {void}
 */
export function handleFavorite(args) {
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();

    args.ref = applyFavoriteCached(args.json);
    applyFavorite(args.ref.type, args.ref.favoriteId);
    runUpdateFriendFlow(args.ref.favoriteId);
    const { ref } = args;
    const userDialog = userStore.userDialog;
    if (userDialog.visible && ref.favoriteId === userDialog.id) {
        userStore.setUserDialogIsFavorite(true);
    }
    const worldDialog = worldStore.worldDialog;
    if (worldDialog.visible && ref.favoriteId === worldDialog.id) {
        worldStore.setWorldDialogIsFavorite(true);
    }
    const avatarDialog = avatarStore.avatarDialog;
    if (avatarDialog.visible && ref.favoriteId === avatarDialog.id) {
        avatarStore.setAvatarDialogIsFavorite(true);
    }
}

/**
 *
 * @param {object} args
 * @returns {void}
 */
export function handleFavoriteAdd(args) {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();
    const avatarStore = useAvatarStore();
    const generalSettingsStore = useGeneralSettingsStore();

    handleFavorite({
        json: args.json,
        params: {
            favoriteId: args.json.id
        }
    });
    if (!favoriteStore.favoritesSortOrder.includes(args.params.favoriteId)) {
        favoriteStore.favoritesSortOrder.unshift(args.params.favoriteId);
    }

    if (
        args.params.type === 'avatar' &&
        !avatarStore.cachedAvatars.has(args.params.favoriteId)
    ) {
        refreshFavoriteAvatars(args.params.tags);
    }

    if (
        args.params.type === 'friend' &&
        (!generalSettingsStore.localFavoriteFriendsGroups.some(
            (key) => !key.startsWith('local:')
        ) ||
            generalSettingsStore.localFavoriteFriendsGroups.includes(
                'friend:' + args.params.tags
            ))
    ) {
        friendStore.updateLocalFavoriteFriends();
    }
    favoriteStore.updateFavoriteDialog(args.params.objectId);
}

/**
 *
 * @param {object} ref
 * @returns {void}
 */
export function handleFavoriteAtDelete(ref) {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();

    const favorite = favoriteStore.state.favoriteObjects.get(ref.favoriteId);
    removeFromArray(favoriteStore.state.favoriteFriends_, favorite);
    removeFromArray(favoriteStore.state.favoriteWorlds_, favorite);
    removeFromArray(favoriteStore.state.favoriteAvatars_, favorite);
    favoriteStore.cachedFavorites.delete(ref.id);
    favoriteStore.cachedFavoritesByObjectId.delete(ref.favoriteId);
    favoriteStore.state.favoriteObjects.delete(ref.favoriteId);
    friendStore.localFavoriteFriends.delete(ref.favoriteId);
    favoriteStore.setFavoritesSortOrder(
        favoriteStore.favoritesSortOrder.filter((id) => id !== ref.favoriteId)
    );

    runUpdateFriendFlow(ref.favoriteId);
    friendStore.updateSidebarFavorites();
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.id === ref.favoriteId) {
        userStore.setUserDialogIsFavorite(false);
    }
    const worldDialog = worldStore.worldDialog;
    if (worldDialog.visible && worldDialog.id === ref.favoriteId) {
        worldStore.setWorldDialogIsFavorite(
            favoriteStore.localWorldFavoritesList.includes(worldDialog.id)
        );
    }
    const avatarDialog = avatarStore.avatarDialog;
    if (avatarDialog.visible && avatarDialog.id === ref.favoriteId) {
        avatarStore.setAvatarDialogIsFavorite(false);
    }
    favoriteStore.countFavoriteGroups();
}

/**
 *
 * @param {string} objectId
 * @returns {void}
 */
export function handleFavoriteDelete(objectId) {
    const favoriteStore = useFavoriteStore();
    const ref = favoriteStore.getCachedFavoritesByObjectId(objectId);
    if (typeof ref === 'undefined') {
        return;
    }
    handleFavoriteAtDelete(ref);
}

/**
 *
 * @param {object} args
 * @returns {void}
 */
export function handleFavoriteGroupClear(args) {
    const favoriteStore = useFavoriteStore();
    const key = `${args.params.type}:${args.params.group}`;
    for (const ref of favoriteStore.cachedFavorites.values()) {
        if (ref.$groupKey !== key) {
            continue;
        }
        handleFavoriteAtDelete(ref);
    }
}

// --- List handlers ---

/**
 *
 * @param {object} args
 * @returns {void}
 */
export function handleFavoriteWorldList(args) {
    const worldStore = useWorldStore();
    for (const json of args.json) {
        if (json.id === '???') {
            continue;
        }
        applyWorld(json);
    }
}

/**
 *
 * @param {object} args
 */
export function handleFavoriteAvatarList(args) {
    const avatarStore = useAvatarStore();
    for (const json of args.json) {
        if (json.releaseStatus === 'hidden') {
            continue;
        }
        applyAvatar(json);
    }
}

// --- applyFavoriteCached / applyFavorite ---

/**
 *
 * @param {object} json
 * @returns {object}
 */
export function applyFavoriteCached(json) {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();
    const generalSettingsStore = useGeneralSettingsStore();

    let ref = favoriteStore.cachedFavorites.get(json.id);
    if (typeof ref === 'undefined') {
        ref = createDefaultFavoriteCachedRef(json);
        favoriteStore.cachedFavorites.set(ref.id, ref);
        favoriteStore.cachedFavoritesByObjectId.set(ref.favoriteId, ref);
        if (
            ref.type === 'friend' &&
            (!generalSettingsStore.localFavoriteFriendsGroups.some(
                (key) => !key.startsWith('local:')
            ) ||
                generalSettingsStore.localFavoriteFriendsGroups.includes(
                    ref.$groupKey
                ))
        ) {
            friendStore.localFavoriteFriends.add(ref.favoriteId);
            friendStore.updateSidebarFavorites();
        }
        if (!favoriteStore.isFavoriteLoading) {
            favoriteStore.countFavoriteGroups();
        }
    } else {
        if (ref.favoriteId !== json.favoriteId) {
            favoriteStore.cachedFavoritesByObjectId.delete(ref.favoriteId);
        }
        Object.assign(ref, json);
        favoriteStore.cachedFavoritesByObjectId.set(ref.favoriteId, ref);
    }

    return ref;
}

/**
 *
 * @param {'friend' | 'world' | 'vrcPlusWorld' | 'avatar'} type
 * @param {string} objectId
 * @returns {Promise<void>}
 */
export async function applyFavorite(type, objectId) {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();

    let ref;
    const favorite = favoriteStore.getCachedFavoritesByObjectId(objectId);
    let ctx = favoriteStore.state.favoriteObjects.get(objectId);
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
            } else if (type === 'world' || type === 'vrcPlusWorld') {
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
            favoriteStore.state.favoriteObjects.set(objectId, ctx);
            isTypeChanged = true;
        } else {
            if (ctx.type !== type) {
                // WTF???
                isTypeChanged = true;
                if (type === 'friend') {
                    removeFromArray(favoriteStore.state.favoriteFriends_, ctx);
                } else if (type === 'world' || type === 'vrcPlusWorld') {
                    removeFromArray(favoriteStore.state.favoriteWorlds_, ctx);
                } else if (type === 'avatar') {
                    removeFromArray(favoriteStore.state.favoriteAvatars_, ctx);
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
            } else if (type === 'world' || type === 'vrcPlusWorld') {
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
                    const world = await database.getCachedWorldById(objectId);
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
                    const avatar = await database.getCachedAvatarById(objectId);
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
                favoriteStore.state.favoriteFriends_.push(ctx);
            } else if (type === 'world' || type === 'vrcPlusWorld') {
                favoriteStore.state.favoriteWorlds_.push(ctx);
            } else if (type === 'avatar') {
                favoriteStore.state.favoriteAvatars_.push(ctx);
            }
        }
    }
}

// --- Refresh flows ---

/**
 *
 * @returns {void}
 */
export function refreshFavorites() {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();

    if (favoriteStore.isFavoriteLoading) {
        return;
    }
    favoriteStore.setIsFavoriteLoading(true);
    queryRequest
        .fetch('favoriteLimits')
        .then((args) => {
            favoriteStore.setFavoriteLimits({
                ...favoriteStore.favoriteLimits,
                ...args.json
            });
        })
        .catch((err) => {
            console.error(err);
        });
    let newFavoriteSortOrder = [];
    processBulk({
        fn: (params) => favoriteRequest.getFavorites(params),
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
                for (const id of favoriteStore.favoritesSortOrder) {
                    if (!newFavoriteSortOrder.includes(id)) {
                        const fav = favoriteStore.cachedFavorites.get(id);
                        if (fav) {
                            handleFavoriteAtDelete(fav);
                        }
                    }
                }
                favoriteStore.setFavoritesSortOrder(newFavoriteSortOrder);
            }
            refreshFavoriteItems();
            favoriteStore.refreshFavoriteGroups();
            friendStore.updateLocalFavoriteFriends();
            favoriteStore.setIsFavoriteLoading(false);
            watchState.isFavoritesLoaded = true;
            favoriteStore.countFavoriteGroups();
        }
    });
}

/**
 *
 * @param {string} tag
 * @returns {Promise<void>}
 */
export async function refreshFavoriteAvatars(tag) {
    const params = {
        n: 300,
        offset: 0,
        tag
    };
    const args = await favoriteRequest.getFavoriteAvatars(params);
    handleFavoriteAvatarList(args);
}

/**
 * @returns {void}
 */
export function refreshFavoriteItems() {
    const favoriteStore = useFavoriteStore();
    const types = {
        world: [0, (params) => favoriteRequest.getFavoriteWorlds(params)],
        avatar: [0, (params) => favoriteRequest.getFavoriteAvatars(params)]
    };
    const tags = [];
    for (const ref of favoriteStore.cachedFavorites.values()) {
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

// --- Sort helpers ---

/**
 * @returns {void}
 */
export function sortLocalAvatarFavorites() {
    const favoriteStore = useFavoriteStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    if (!appearanceSettingsStore.sortFavorites) {
        for (
            let i = 0;
            i < favoriteStore.localAvatarFavoriteGroups.length;
            ++i
        ) {
            const group = favoriteStore.localAvatarFavoriteGroups[i];
            if (favoriteStore.localAvatarFavorites[group]) {
                favoriteStore.localAvatarFavorites[group].sort(compareByName);
            }
        }
    }
}

/**
 * @returns {void}
 */
export function sortLocalWorldFavorites() {
    const favoriteStore = useFavoriteStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    if (!appearanceSettingsStore.sortFavorites) {
        for (
            let i = 0;
            i < favoriteStore.localWorldFavoriteGroups.length;
            ++i
        ) {
            const group = favoriteStore.localWorldFavoriteGroups[i];
            if (favoriteStore.localWorldFavorites[group]) {
                favoriteStore.localWorldFavorites[group].sort(compareByName);
            }
        }
    }
}

// --- Local World Favorites ---

/**
 *
 * @param {string} worldId
 * @param {string} group
 */
export function addLocalWorldFavorite(worldId, group) {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    if (favoriteStore.hasLocalWorldFavorite(worldId, group)) {
        return;
    }
    const ref = worldStore.cachedWorlds.get(worldId);
    if (typeof ref === 'undefined') {
        return;
    }
    if (!favoriteStore.localWorldFavorites[group]) {
        favoriteStore.localWorldFavorites[group] = [];
    }

    favoriteStore.localWorldFavorites[group].unshift(ref);
    database.addWorldToCache(ref);
    database.addWorldToFavorites(worldId, group);
    if (
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === worldId
    ) {
        favoriteStore.updateFavoriteDialog(worldId);
    }
    if (
        worldStore.worldDialog.visible &&
        worldStore.worldDialog.id === worldId
    ) {
        worldStore.setWorldDialogIsFavorite(true);
    }

    // update UI
    sortLocalWorldFavorites();
}

/**
 *
 * @param {string} worldId
 * @param {string} group
 */
export function removeLocalWorldFavorite(worldId, group) {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    let i;
    const favoriteGroup = favoriteStore.localWorldFavorites[group];
    for (i = 0; i < favoriteGroup.length; ++i) {
        if (favoriteGroup[i].id === worldId) {
            favoriteGroup.splice(i, 1);
        }
    }

    // remove from cache if no longer in favorites
    let worldInFavorites = false;
    for (i = 0; i < favoriteStore.localWorldFavoriteGroups.length; ++i) {
        const groupName = favoriteStore.localWorldFavoriteGroups[i];
        if (
            !favoriteStore.localWorldFavorites[groupName] ||
            group === groupName
        ) {
            continue;
        }
        for (
            let j = 0;
            j < favoriteStore.localWorldFavorites[groupName].length;
            ++j
        ) {
            const id = favoriteStore.localWorldFavorites[groupName][j].id;
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
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === worldId
    ) {
        favoriteStore.updateFavoriteDialog(worldId);
    }
    if (
        worldStore.worldDialog.visible &&
        worldStore.worldDialog.id === worldId
    ) {
        worldStore.setWorldDialogIsFavorite(
            favoriteStore.getCachedFavoritesByObjectId(worldId)
        );
    }

    // update UI
    sortLocalWorldFavorites();
}

/**
 *
 * @returns {Promise<void>}
 */
export async function getLocalWorldFavorites() {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    const localGroups = new Set();
    const localListSet = new Set();
    const localFavorites = Object.create(null);

    const worldCache = await database.getWorldCache();
    for (let i = 0; i < worldCache.length; ++i) {
        const ref = worldCache[i];
        if (!worldStore.cachedWorlds.has(ref.id)) {
            applyWorld(ref);
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

    replaceReactiveObject(favoriteStore.localWorldFavorites, localFavorites);

    sortLocalWorldFavorites();
}

/**
 *
 * @param {string} newName
 * @param {string} group
 */
export function renameLocalWorldFavoriteGroup(newName, group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localWorldFavoriteGroups.includes(newName)) {
        toast.error(
            t('prompt.local_favorite_group_rename.message.error', {
                name: newName
            })
        );
        return;
    }
    favoriteStore.localWorldFavorites[newName] =
        favoriteStore.localWorldFavorites[group];

    delete favoriteStore.localWorldFavorites[group];
    database.renameWorldFavoriteGroup(newName, group);
    sortLocalWorldFavorites();
}

/**
 *
 * @param {string} group
 */
export function newLocalWorldFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localWorldFavoriteGroups.includes(group)) {
        toast.error(
            t('prompt.new_local_favorite_group.message.error', {
                name: group
            })
        );
        return;
    }
    if (!favoriteStore.localWorldFavorites[group]) {
        favoriteStore.localWorldFavorites[group] = [];
    }
    sortLocalWorldFavorites();
}

// --- Local Avatar Favorites ---

/**
 *
 * @param {string} avatarId
 * @param {string} group
 */
export function addLocalAvatarFavorite(avatarId, group) {
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();

    if (favoriteStore.hasLocalAvatarFavorite(avatarId, group)) {
        return;
    }
    const ref = avatarStore.cachedAvatars.get(avatarId);
    if (typeof ref === 'undefined') {
        return;
    }
    if (!favoriteStore.localAvatarFavorites[group]) {
        favoriteStore.localAvatarFavorites[group] = [];
    }
    favoriteStore.localAvatarFavorites[group].unshift(ref);
    database.addAvatarToCache(ref);
    database.addAvatarToFavorites(avatarId, group);
    if (
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === avatarId
    ) {
        favoriteStore.updateFavoriteDialog(avatarId);
    }
    if (
        avatarStore.avatarDialog.visible &&
        avatarStore.avatarDialog.id === avatarId
    ) {
        avatarStore.setAvatarDialogIsFavorite(true);
    }

    // update UI
    sortLocalAvatarFavorites();
}

/**
 *
 * @param {string} avatarId
 * @param {string} group
 */
export function removeLocalAvatarFavorite(avatarId, group) {
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();

    let i;
    const favoriteGroup = favoriteStore.localAvatarFavorites[group];
    for (i = 0; i < favoriteGroup.length; ++i) {
        if (favoriteGroup[i].id === avatarId) {
            favoriteGroup.splice(i, 1);
        }
    }

    // remove from cache if no longer in favorites
    let avatarInFavorites = false;
    for (i = 0; i < favoriteStore.localAvatarFavoriteGroups.length; ++i) {
        const groupName = favoriteStore.localAvatarFavoriteGroups[i];
        if (
            !favoriteStore.localAvatarFavorites[groupName] ||
            group === groupName
        ) {
            continue;
        }
        for (
            let j = 0;
            j < favoriteStore.localAvatarFavorites[groupName].length;
            ++j
        ) {
            const id = favoriteStore.localAvatarFavorites[groupName][j].id;
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
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === avatarId
    ) {
        favoriteStore.updateFavoriteDialog(avatarId);
    }
    if (
        avatarStore.avatarDialog.visible &&
        avatarStore.avatarDialog.id === avatarId
    ) {
        avatarStore.setAvatarDialogIsFavorite(
            favoriteStore.getCachedFavoritesByObjectId(avatarId)
        );
    }

    // update UI
    sortLocalAvatarFavorites();
}

/**
 *
 * @param {string} group
 */
export function deleteLocalAvatarFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();

    let i;
    // remove from cache if no longer in favorites
    const avatarIdRemoveList = new Set();
    const favoriteGroup = favoriteStore.localAvatarFavorites[group];
    for (i = 0; i < favoriteGroup.length; ++i) {
        avatarIdRemoveList.add(favoriteGroup[i].id);
    }

    delete favoriteStore.localAvatarFavorites[group];
    database.deleteAvatarFavoriteGroup(group);

    for (i = 0; i < favoriteStore.localAvatarFavoriteGroups.length; ++i) {
        const groupName = favoriteStore.localAvatarFavoriteGroups[i];
        if (!favoriteStore.localAvatarFavorites[groupName]) {
            continue;
        }
        for (
            let j = 0;
            j < favoriteStore.localAvatarFavorites[groupName].length;
            ++j
        ) {
            const avatarId =
                favoriteStore.localAvatarFavorites[groupName][j].id;
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
            i < favoriteStore.localAvatarFavoriteGroups.length;
            ++i
        ) {
            const groupName = favoriteStore.localAvatarFavoriteGroups[i];
            if (
                !favoriteStore.localAvatarFavorites[groupName] ||
                group === groupName
            ) {
                continue loop;
            }
            for (
                let j = 0;
                j < favoriteStore.localAvatarFavorites[groupName].length;
                ++j
            ) {
                const avatarId =
                    favoriteStore.localAvatarFavorites[groupName][j].id;
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

/**
 *
 * @returns {Promise<void>}
 */
export async function getLocalAvatarFavorites() {
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();

    const localGroups = new Set();
    const localListSet = new Set();
    const localFavorites = Object.create(null);

    const avatarCache = await database.getAvatarCache();
    for (let i = 0; i < avatarCache.length; ++i) {
        const ref = avatarCache[i];
        if (!avatarStore.cachedAvatars.has(ref.id)) {
            applyAvatar(ref);
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

    replaceReactiveObject(favoriteStore.localAvatarFavorites, localFavorites);

    sortLocalAvatarFavorites();
}

/**
 *
 * @param {string} newName
 * @param {string} group
 */
export function renameLocalAvatarFavoriteGroup(newName, group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localAvatarFavoriteGroups.includes(newName)) {
        toast.error(
            t('prompt.local_favorite_group_rename.message.error', {
                name: newName
            })
        );
        return;
    }
    favoriteStore.localAvatarFavorites[newName] =
        favoriteStore.localAvatarFavorites[group];

    delete favoriteStore.localAvatarFavorites[group];
    database.renameAvatarFavoriteGroup(newName, group);
    sortLocalAvatarFavorites();
}

/**
 *
 * @param {string} group
 */
export function newLocalAvatarFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localAvatarFavoriteGroups.includes(group)) {
        toast.error(
            t('prompt.new_local_favorite_group.message.error', {
                name: group
            })
        );
        return;
    }
    if (!favoriteStore.localAvatarFavorites[group]) {
        favoriteStore.localAvatarFavorites[group] = [];
    }
    sortLocalAvatarFavorites();
}

/**
 * Check invalid local avatar favorites
 * @param {string | null} targetGroup - Target group to check, null for all groups
 * @param {Function | null} onProgress - Progress callback function, receives (current, total) parameters
 * @returns {Promise<{total: number, invalid: number, invalidIds: string[]}>}
 */
export async function checkInvalidLocalAvatars(
    targetGroup = null,
    onProgress = null
) {
    const favoriteStore = useFavoriteStore();
    const result = {
        total: 0,
        invalid: 0,
        invalidIds: []
    };

    const groupsToCheck = targetGroup
        ? [targetGroup]
        : favoriteStore.localAvatarFavoriteGroups;

    for (const group of groupsToCheck) {
        const favoriteGroup = favoriteStore.localAvatarFavorites[group];
        if (favoriteGroup && favoriteGroup.length > 0) {
            result.total += favoriteGroup.length;
        }
    }

    let currentIndex = 0;

    for (const group of groupsToCheck) {
        const favoriteGroup = favoriteStore.localAvatarFavorites[group];
        if (!favoriteGroup || favoriteGroup.length === 0) {
            continue;
        }

        for (const favorite of favoriteGroup) {
            currentIndex++;

            if (typeof onProgress === 'function') {
                onProgress(currentIndex, result.total);
            }

            try {
                await avatarRequest.getAvatar({
                    avatarId: favorite.id
                });
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`Failed to fetch avatar ${favorite.id}:`, err);
                result.invalid++;
                result.invalidIds.push(favorite.id);
            }
        }
    }

    return result;
}

/**
 * Remove invalid avatars from local favorites
 * @param {string[]} avatarIds - Array of avatar IDs to remove
 * @param {string | null} targetGroup - Target group, null for all groups
 * @returns {Promise<{removed: number, removedIds: string[]}>}
 */
export async function removeInvalidLocalAvatars(avatarIds, targetGroup = null) {
    const favoriteStore = useFavoriteStore();
    const result = {
        removed: 0,
        removedIds: []
    };

    const groupsToCheck = targetGroup
        ? [targetGroup]
        : favoriteStore.localAvatarFavoriteGroups;

    for (const group of groupsToCheck) {
        const favoriteGroup = favoriteStore.localAvatarFavorites[group];
        if (!favoriteGroup) {
            continue;
        }

        for (const avatarId of avatarIds) {
            const index = favoriteGroup.findIndex((fav) => fav.id === avatarId);
            if (index !== -1) {
                removeLocalAvatarFavorite(avatarId, group);
                result.removed++;
                if (!result.removedIds.includes(avatarId)) {
                    result.removedIds.push(avatarId);
                }
            }
        }
    }

    return result;
}

// --- Local Friend Favorites ---

/**
 * @param {string} userId
 * @param {string} group
 */
export function addLocalFriendFavorite(userId, group) {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();

    if (favoriteStore.hasLocalFriendFavorite(userId, group)) {
        return;
    }
    if (!favoriteStore.localFriendFavorites[group]) {
        favoriteStore.localFriendFavorites[group] = [];
    }
    favoriteStore.localFriendFavorites[group].unshift(userId);
    database.addFriendToLocalFavorites(userId, group);
    if (
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === userId
    ) {
        favoriteStore.updateFavoriteDialog(userId);
    }
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.id === userId) {
        userStore.setUserDialogIsFavorite(true);
    }
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} userId
 * @param {string} group
 */
export function removeLocalFriendFavorite(userId, group) {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();

    const favoriteGroup = favoriteStore.localFriendFavorites[group];
    if (favoriteGroup) {
        const idx = favoriteGroup.indexOf(userId);
        if (idx !== -1) {
            favoriteGroup.splice(idx, 1);
        }
    }
    database.removeFriendFromLocalFavorites(userId, group);
    if (
        favoriteStore.favoriteDialog.visible &&
        favoriteStore.favoriteDialog.objectId === userId
    ) {
        favoriteStore.updateFavoriteDialog(userId);
    }
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.id === userId) {
        userStore.setUserDialogIsFavorite(
            favoriteStore.getCachedFavoritesByObjectId(userId) ||
                favoriteStore.isInAnyLocalFriendGroup(userId)
        );
    }
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} group
 */
export function deleteLocalFriendFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();

    delete favoriteStore.localFriendFavorites[group];
    database.deleteFriendFavoriteGroup(group);
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @returns {Promise<void>}
 */
export async function getLocalFriendFavorites() {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();

    const localFavorites = Object.create(null);

    const favorites = await database.getFriendFavorites();
    for (let i = 0; i < favorites.length; ++i) {
        const favorite = favorites[i];
        if (!localFavorites[favorite.groupName]) {
            localFavorites[favorite.groupName] = [];
        }
        localFavorites[favorite.groupName].unshift(favorite.userId);
    }

    if (Object.keys(localFavorites).length === 0) {
        localFavorites.Favorites = [];
    }

    replaceReactiveObject(favoriteStore.localFriendFavorites, localFavorites);
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} newName
 * @param {string} group
 */
export function renameLocalFriendFavoriteGroup(newName, group) {
    const favoriteStore = useFavoriteStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const { t } = i18n.global;
    if (favoriteStore.localFriendFavoriteGroups.includes(newName)) {
        toast.error(
            t('prompt.local_favorite_group_rename.message.error', {
                name: newName
            })
        );
        return;
    }
    favoriteStore.localFriendFavorites[newName] =
        favoriteStore.localFriendFavorites[group];
    delete favoriteStore.localFriendFavorites[group];
    database.renameFriendFavoriteGroup(newName, group);
    const oldKey = `local:${group}`;
    const idx = generalSettingsStore.localFavoriteFriendsGroups.indexOf(oldKey);
    if (idx !== -1) {
        const updated = [...generalSettingsStore.localFavoriteFriendsGroups];
        updated[idx] = `local:${newName}`;
        generalSettingsStore.setLocalFavoriteFriendsGroups(updated);
    }
}

// --- Sort / Init ---

/**
 *
 */
export async function saveSortFavoritesOption() {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    getLocalWorldFavorites();
    getLocalFriendFavorites();
    appearanceSettingsStore.setSortFavorites();
}

/**
 *
 */
export async function initFavorites() {
    refreshFavorites();
    getLocalWorldFavorites();
    getLocalAvatarFavorites();
    getLocalFriendFavorites();
}

/**
 * Called by the favorite store watch when login state changes.
 * Handles cross-store cleanup that can't stay in the store.
 * @param {boolean} isLoggedIn
 */
export function onLoginStateChanged(isLoggedIn) {
    const friendStore = useFriendStore();
    friendStore.localFavoriteFriends.clear();
    if (isLoggedIn) {
        initFavorites();
    }
}
