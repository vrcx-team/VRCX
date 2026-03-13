import { reactive, shallowReactive, watch } from 'vue';
import { defineStore } from 'pinia';

import { checkVRChatCache } from '../shared/utils';
import { preloadOwnWorlds } from '../coordinators/worldCoordinator';
import { watchState } from '../services/watchState';

export const useWorldStore = defineStore('World', () => {
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
     * @param {boolean} value
     */
    function setWorldDialogLoading(value) {
        worldDialog.loading = value;
    }

    /**
     * @param {boolean} value
     */
    function setWorldDialogVisible(value) {
        worldDialog.visible = value;
    }

    /**
     * @param {boolean} value
     */
    function setWorldDialogIsFavorite(value) {
        worldDialog.isFavorite = value;
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

    return {
        worldDialog,
        cachedWorlds,
        setWorldDialogVisible,
        setWorldDialogIsFavorite,
        setWorldDialogLoading,
        updateVRChatWorldCache
    };
});
