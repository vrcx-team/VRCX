import { nextTick, reactive, shallowReactive, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import {
    checkVRChatCache,
    createDefaultWorldRef,
    evictMapCache,
    getAvailablePlatforms,
    getBundleDateSize,
    getWorldMemo,
    isRealInstance,
    parseLocation,
    sanitizeEntityJson
} from '../shared/utils';
import { instanceRequest, miscRequest, worldRequest } from '../api';
import { database } from '../service/database';
import { patchWorldFromEvent } from '../query';
import { processBulk } from '../service/request';
import { useFavoriteStore } from './favorite';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { watchState } from '../service/watchState';

export const useWorldStore = defineStore('World', () => {
    const locationStore = useLocationStore();
    const favoriteStore = useFavoriteStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const { t } = useI18n();

    const worldDialog = reactive({
        visible: false,
        loading: false,
        activeTab: 'Instances',
        lastActiveTab: 'Instances',
        id: '',
        memo: '',
        $location: {},
        ref: {},
        isFavorite: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        rooms: [],
        inCache: false,
        cacheSize: '',
        cacheLocked: false,
        cachePath: '',
        fileAnalysis: {},
        lastVisit: '',
        visitCount: 0,
        timeSpent: 0,
        isPC: false,
        isQuest: false,
        isIos: false,
        hasPersistData: false
    });

    const cachedWorlds = shallowReactive(new Map());

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            worldDialog.visible = false;
            cachedWorlds.clear();
            if (isLoggedIn) {
                preloadOwnWorlds();
            }
        },
        { flush: 'sync' }
    );

    /**
     *
     * @param {string} tag
     * @param {string} shortName
     * @param options
     */
    function showWorldDialog(tag, shortName = null, options = {}) {
        const D = worldDialog;
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
        const loadWorldRequest = forceRefresh
            ? worldRequest.getWorld({
                  worldId: L.worldId
              })
            : worldRequest.getCachedWorld({
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
                    uiStore.setDialogCrumbLabel(
                        'world',
                        D.id,
                        D.ref?.name || D.id
                    );
                    D.visible = true;
                    D.loading = false;
                    D.isFavorite = favoriteStore.getCachedFavoritesByObjectId(
                        D.id
                    );
                    if (!D.isFavorite) {
                        D.isFavorite =
                            favoriteStore.localWorldFavoritesList.includes(
                                D.id
                            );
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
                    updateVRChatWorldCache();
                    miscRequest
                        .hasWorldPersistData({
                            worldId: D.id
                        })
                        .then((args) => {
                            if (
                                args.params.worldId === worldDialog.id &&
                                worldDialog.visible
                            ) {
                                worldDialog.hasPersistData =
                                    args.json !== false;
                            }
                        });
                }
            });
    }

    /**
     *
     */
    function updateVRChatWorldCache() {
        const D = worldDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = '';
            D.cacheLocked = false;
            D.cachePath = '';
            checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo.Item1 > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo.Item1 / 1048576).toFixed(2)} MB`;
                    D.cachePath = cacheInfo.Item3;
                }
                D.cacheLocked = cacheInfo.Item2;
            });
        }
    }

    /**
     *
     * @param WorldCache
     */
    function cleanupWorldCache(WorldCache) {
        evictMapCache(WorldCache, 10000, () => false, {
            logLabel: 'World cache cleanup'
        });
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyWorld(json) {
        sanitizeEntityJson(json, ['name', 'description']);
        let ref = cachedWorlds.get(json.id);
        if (typeof ref === 'undefined') {
            ref = createDefaultWorldRef(json);
            cleanupWorldCache(cachedWorlds);
            cachedWorlds.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        ref.$isLabs = ref.tags.includes('system_labs');
        favoriteStore.applyFavorite('world', ref.id);
        const userDialog = userStore.userDialog;
        if (userDialog.visible && userDialog.$location.worldId === ref.id) {
            userStore.applyUserDialogLocation();
        }
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
        return ref;
    }

    /**
     * Preload all own worlds into cache at startup for global search.
     */
    async function preloadOwnWorlds() {
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

    return {
        worldDialog,
        cachedWorlds,
        showWorldDialog,
        updateVRChatWorldCache,
        applyWorld,
        preloadOwnWorlds
    };
});
