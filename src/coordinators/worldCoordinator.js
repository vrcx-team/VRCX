import { nextTick } from 'vue';
import { toast } from 'vue-sonner';
import { i18n } from '../plugins/i18n';

import {
    createDefaultWorldRef,
    evictMapCache,
    getAvailablePlatforms,
    getBundleDateSize,
    isRealInstance,
    parseLocation,
    sanitizeEntityJson
} from '../shared/utils';
import { getWorldMemo } from './memoCoordinator';
import { instanceRequest, queryRequest, worldRequest } from '../api';
import { database } from '../services/database';
import { patchWorldFromEvent } from '../queries';
import { processBulk } from '../services/request';
import { applyFavorite } from './favoriteCoordinator';
import { useFavoriteStore } from '../stores/favorite';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { syncWorldSearchIndex, removeWorldSearchIndex } from './searchIndexCoordinator';
import { useUiStore } from '../stores/ui';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';

/**
 * @param {string} tag
 * @param {string} shortName
 * @param options
 */
export function showWorldDialog(tag, shortName = null, options = {}) {
    const worldStore = useWorldStore();
    const uiStore = useUiStore();
    const instanceStore = useInstanceStore();
    const favoriteStore = useFavoriteStore();
    const locationStore = useLocationStore();
    const t = i18n.global.t;

    const D = worldStore.worldDialog;
    const forceRefresh = Boolean(options?.forceRefresh);
    const L = parseLocation(tag);
    if (L.worldId === '') {
        return;
    }
    const isMainDialogOpen = uiStore.openDialog({
        type: 'world',
        id: L.worldId,
        tag,
        shortName
    });
    D.visible = true;
    if (isMainDialogOpen && D.id === L.worldId && !forceRefresh) {
        uiStore.setDialogCrumbLabel('world', D.id, D.ref?.name || D.id);
        instanceStore.applyWorldDialogInstances();
        nextTick(() => (D.loading = false));
        return;
    }
    L.shortName = shortName;
    D.id = L.worldId;
    D.$location = L;
    D.loading = true;
    D.inCache = false;
    D.cacheSize = '';
    D.cacheLocked = false;
    D.cachePath = '';
    D.fileAnalysis = {};
    D.rooms = [];
    D.lastVisit = '';
    D.visitCount = 0;
    D.timeSpent = 0;
    D.isFavorite = false;
    D.avatarScalingDisabled = false;
    D.focusViewDisabled = false;
    D.isPC = false;
    D.isQuest = false;
    D.isIos = false;
    D.hasPersistData = false;
    D.memo = '';
    const LL = parseLocation(locationStore.lastLocation.location);
    let currentWorldMatch = false;
    if (LL.worldId === D.id) {
        currentWorldMatch = true;
    }
    getWorldMemo(D.id).then((memo) => {
        if (memo.worldId === D.id) {
            D.memo = memo.memo;
        }
    });
    database.getLastVisit(D.id, currentWorldMatch).then((ref) => {
        if (ref.worldId === D.id) {
            D.lastVisit = ref.created_at;
        }
    });
    database.getVisitCount(D.id).then((ref) => {
        if (ref.worldId === D.id) {
            D.visitCount = ref.visitCount;
        }
    });
    database.getTimeSpentInWorld(D.id).then((ref) => {
        if (ref.worldId === D.id) {
            D.timeSpent = ref.timeSpent;
        }
    });
    const loadWorldRequest = worldRequest.getWorld({
        worldId: L.worldId
    });
    loadWorldRequest
        .catch((err) => {
            nextTick(() => (D.loading = false));
            D.id = null;
            D.visible = false;
            uiStore.jumpBackDialogCrumb();
            toast.error(t('message.world.load_failed'));
            throw err;
        })
        .then((args) => {
            if (D.id === args.ref.id) {
                D.ref = args.ref;
                uiStore.setDialogCrumbLabel('world', D.id, D.ref?.name || D.id);
                if (args.ref.instances) {
                    for (const instance of args.ref.instances) {
                        const instanceId = instance[0];
                        const tag = `${D.id}:${instanceId}`;
                        if (isRealInstance(tag)) {
                            instanceRequest.getInstance({
                                worldId: D.id,
                                instanceId
                            });
                        }
                    }
                }
                D.visible = true;
                D.loading = false;
                D.isFavorite = favoriteStore.getCachedFavoritesByObjectId(D.id);
                if (!D.isFavorite) {
                    D.isFavorite =
                        favoriteStore.localWorldFavoritesList.includes(D.id);
                }
                let { isPC, isQuest, isIos } = getAvailablePlatforms(
                    args.ref.unityPackages
                );
                D.avatarScalingDisabled = args.ref?.tags.includes(
                    'feature_avatar_scaling_disabled'
                );
                D.focusViewDisabled = args.ref?.tags.includes(
                    'feature_focus_view_disabled'
                );
                D.isPC = isPC;
                D.isQuest = isQuest;
                D.isIos = isIos;
                worldStore.updateVRChatWorldCache();
                queryRequest
                    .fetch('worldPersistData', {
                        worldId: D.id
                    })
                    .then((args) => {
                        if (
                            args.params.worldId === worldStore.worldDialog.id &&
                            worldStore.worldDialog.visible
                        ) {
                            worldStore.worldDialog.hasPersistData =
                                args.json !== false;
                        }
                    });
            }
        });
}

/**
 * @param {object} json
 * @returns {object} ref
 */
export function applyWorld(json) {
    const worldStore = useWorldStore();
    const favoriteStore = useFavoriteStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();

    sanitizeEntityJson(json, ['name', 'description']);
    let ref = worldStore.cachedWorlds.get(json.id);
    if (typeof ref === 'undefined') {
        ref = createDefaultWorldRef(json);
        evictMapCache(worldStore.cachedWorlds, 10000, () => false, {
            logLabel: 'World cache cleanup'
        });
        worldStore.cachedWorlds.set(ref.id, ref);
    } else {
        Object.assign(ref, json);
    }
    ref.$isLabs = ref.tags.includes('system_labs');
    applyFavorite('world', ref.id);
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.$location.worldId === ref.id) {
        userStore.applyUserDialogLocation();
    }
    const worldDialog = worldStore.worldDialog;
    if (worldDialog.visible && worldDialog.id === ref.id) {
        worldDialog.ref = ref;
        worldDialog.avatarScalingDisabled = ref.tags?.includes(
            'feature_avatar_scaling_disabled'
        );
        worldDialog.focusViewDisabled = ref.tags?.includes(
            'feature_focus_view_disabled'
        );
        instanceStore.applyWorldDialogInstances();
        for (const room of worldDialog.rooms) {
            if (isRealInstance(room.tag)) {
                instanceRequest.getInstance({
                    worldId: worldDialog.id,
                    instanceId: room.id
                });
            }
        }
        if (Object.keys(worldDialog.fileAnalysis).length === 0) {
            getBundleDateSize(ref);
        }
    }
    if (favoriteStore.localWorldFavoritesList.includes(ref.id)) {
        // update db cache
        database.addWorldToCache(ref);
    }
    patchWorldFromEvent(ref);
    syncWorldSearchIndex(ref);
    return ref;
}

/**
 * Preload all own worlds into cache at startup for global search.
 */
export async function preloadOwnWorlds() {
    const params = {
        n: 50,
        offset: 0,
        sort: 'updated',
        order: 'descending',
        releaseStatus: 'all',
        user: 'me'
    };
    await processBulk({
        fn: (p) => worldRequest.getWorlds(p),
        N: -1,
        params,
        handle: (args) => {
            for (const json of args.json) {
                applyWorld(json);
            }
        }
    });
}

/**
 * @param {string} id
 */
export function removeWorldFromCache(id) {
    const worldStore = useWorldStore();
    worldStore.cachedWorlds.delete(id);
    removeWorldSearchIndex(id);
}
