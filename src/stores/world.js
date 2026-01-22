import { reactive, shallowReactive, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import {
    checkVRChatCache,
    getAvailablePlatforms,
    getBundleDateSize,
    getWorldMemo,
    isRealInstance,
    parseLocation,
    replaceBioSymbols
} from '../shared/utils';
import { instanceRequest, miscRequest, worldRequest } from '../api';
import { database } from '../service/database';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useGroupStore } from './group';
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
    const avatarStore = useAvatarStore();
    const groupStore = useGroupStore();
    const uiStore = useUiStore();
    const { t } = useI18n();

    const worldDialog = reactive({
        visible: false,
        loading: false,
        lastActiveTab: 'Instances',
        id: '',
        memo: '',
        $location: {},
        ref: {},
        isFavorite: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        rooms: [],
        treeData: {},
        bundleSizes: {},
        lastUpdated: '',
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
        () => {
            worldDialog.visible = false;
            cachedWorlds.clear();
        },
        { flush: 'sync' }
    );

    /**
     *
     * @param {string} tag
     * @param {string} shortName
     */
    function showWorldDialog(tag, shortName = null, options = {}) {
        const D = worldDialog;
        const L = parseLocation(tag);
        if (L.worldId === '') {
            return;
        }
        const hadActiveDialog =
            worldDialog.visible ||
            userStore.userDialog.visible ||
            avatarStore.avatarDialog.visible ||
            groupStore.groupDialog.visible ||
            instanceStore.previousInstancesInfoDialog.visible ||
            instanceStore.previousInstancesUserDialog.visible ||
            instanceStore.previousInstancesWorldDialog.visible ||
            instanceStore.previousInstancesGroupDialog.visible;
        if (!hadActiveDialog) {
            uiStore.clearDialogCrumbs();
        }
        if (!options.skipBreadcrumb) {
            uiStore.pushDialogCrumb('world', L.worldId);
        }
        D.visible = true;
        instanceStore.hidePreviousInstancesDialogs();
        userStore.userDialog.visible = false;
        avatarStore.avatarDialog.visible = false;
        groupStore.groupDialog.visible = false;
        L.shortName = shortName;
        D.id = L.worldId;
        D.$location = L;
        D.treeData = {};
        D.bundleSizes = {};
        D.lastUpdated = '';
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
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
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

                    if (args.cache) {
                        worldRequest.getWorld(args.params).then((args1) => {
                            if (D.id === args1.ref.id) {
                                D.loading = false;
                                D.ref = args1.ref;
                                updateVRChatWorldCache();
                            }
                            return args1;
                        });
                    }
                }
                D.visible = true;
            });
    }

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

    function cleanupWorldCache(WorldCache) {
        const maxCacheSize = 10000;

        if (WorldCache.size <= maxCacheSize) {
            return;
        }

        const deletedCount = WorldCache.size - maxCacheSize;
        while (WorldCache.size > maxCacheSize) {
            const deletedKey = WorldCache.keys().next().value;
            WorldCache.delete(deletedKey);
        }
        console.log(
            `World cache cleanup: Deleted ${deletedCount}. Current cache size: ${WorldCache.size}`
        );
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyWorld(json) {
        if (json.name) {
            json.name = replaceBioSymbols(json.name);
        }
        if (json.description) {
            json.description = replaceBioSymbols(json.description);
        }
        let ref = cachedWorlds.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                name: '',
                description: '',
                defaultContentSettings: {},
                authorId: '',
                authorName: '',
                capacity: 0,
                recommendedCapacity: 0,
                tags: [],
                releaseStatus: '',
                imageUrl: '',
                thumbnailImageUrl: '',
                assetUrl: '',
                assetUrlObject: {},
                pluginUrl: '',
                pluginUrlObject: {},
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                unityPackages: [],
                version: 0,
                favorites: 0,
                created_at: '',
                updated_at: '',
                publicationDate: '',
                labsPublicationDate: '',
                visits: 0,
                popularity: 0,
                heat: 0,
                publicOccupants: 0,
                privateOccupants: 0,
                occupants: 0,
                instances: [],
                featured: false,
                organization: '',
                previewYoutubeId: '',
                // VRCX
                $isLabs: false,
                //
                ...json
            };
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
            if (Object.keys(worldDialog.bundleSizes).length === 0) {
                getBundleDateSize(ref).then((bundleSizes) => {
                    worldDialog.bundleSizes = bundleSizes;
                });
            }
        }
        if (favoriteStore.localWorldFavoritesList.includes(ref.id)) {
            // update db cache
            database.addWorldToCache(ref);
        }
        return ref;
    }

    return {
        worldDialog,
        cachedWorlds,
        showWorldDialog,
        updateVRChatWorldCache,
        applyWorld
    };
});
