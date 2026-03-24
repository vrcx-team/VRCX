import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { checkVRChatCache } from '../shared/utils';
import { queryRequest } from '../api';
import {
    getAvatarHistory,
    preloadOwnAvatars
} from '../coordinators/avatarCoordinator';
import { database } from '../services/database';
import { watchState } from '../services/watchState';

export const useAvatarStore = defineStore('Avatar', () => {
    let cachedAvatarModerations = new Map();
    let cachedAvatars = new Map();
    let cachedAvatarNames = new Map();

    const avatarDialog = ref({
        visible: false,
        loading: false,
        activeTab: 'Info',
        lastActiveTab: 'Info',
        id: '',
        memo: '',
        ref: {},
        isFavorite: false,
        isBlocked: false,
        isQuestFallback: false,
        hasImposter: false,
        imposterVersion: '',
        isPC: false,
        isQuest: false,
        isIos: false,
        platformInfo: {},
        galleryImages: [],
        galleryLoading: false,
        inCache: false,
        cacheSize: '',
        cacheLocked: false,
        cachePath: '',
        fileAnalysis: {},
        timeSpent: 0
    });
    const avatarHistory = ref([]);
    const loadingToastId = ref(null);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            avatarDialog.value.visible = false;
            cachedAvatars.clear();
            cachedAvatarNames.clear();
            cachedAvatarModerations.clear();
            avatarHistory.value = [];
            if (isLoggedIn) {
                getAvatarHistory();
                preloadOwnAvatars();
            }
        },
        { flush: 'sync' }
    );

    /**
     * @param {boolean} value
     */
    function setAvatarDialogLoading(value) {
        avatarDialog.value.loading = value;
    }

    /**
     * @param {boolean} value
     */
    function setAvatarDialogVisible(value) {
        avatarDialog.value.visible = value;
    }

    /**
     * @param {boolean} value
     */
    function setAvatarDialogIsFavorite(value) {
        avatarDialog.value.isFavorite = value;
    }

    /**
     *
     * @param {string} avatarId
     * @returns {Promise<string[]>}
     */
    async function getAvatarGallery(avatarId) {
        const D = avatarDialog.value;
        const args = await queryRequest
            .fetch('avatarGallery', { avatarId })
            .finally(() => {
                D.galleryLoading = false;
            });
        if (args.params.galleryId !== D.id) {
            return;
        }
        D.galleryImages = [];
        // wtf is this? why is order sorting only needed if it's your own avatar?
        const sortedGallery = args.json.sort((a, b) => {
            if (!a.order && !b.order) {
                return 0;
            }
            return a.order - b.order;
        });
        for (const file of sortedGallery) {
            const url = file.versions[file.versions.length - 1].file.url;
            D.galleryImages.push(url);
        }

        // for JSON tab treeData
        D.ref.gallery = args.json;
        return D.galleryImages;
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyAvatarModeration(json) {
        // fix inconsistent Unix time response
        if (typeof json.created === 'number') {
            json.created = new Date(json.created).toJSON();
        }

        let ref = cachedAvatarModerations.get(json.targetAvatarId);
        if (typeof ref === 'undefined') {
            ref = {
                avatarModerationType: '',
                created: '',
                targetAvatarId: '',
                ...json
            };
            cachedAvatarModerations.set(ref.targetAvatarId, ref);
        } else {
            Object.assign(ref, json);
        }

        // update avatar dialog
        const D = avatarDialog.value;
        if (
            D.visible &&
            ref.avatarModerationType === 'block' &&
            D.id === ref.targetAvatarId
        ) {
            D.isBlocked = true;
        }

        return ref;
    }

    /**
     *
     */
    function resetCachedAvatarModerations() {
        cachedAvatarModerations.clear();
    }

    /**
     *
     */
    function updateVRChatAvatarCache() {
        const D = avatarDialog.value;
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
     */
    function clearAvatarHistory() {
        avatarHistory.value = [];
        database.clearAvatarHistory();
    }

    /**
     * @param {Array} value
     */
    function setAvatarHistory(value) {
        avatarHistory.value = value;
    }

    /**
     * @param {*} value
     */
    function setLoadingToastId(value) {
        loadingToastId.value = value;
    }

    return {
        avatarDialog,
        avatarHistory,
        loadingToastId,
        cachedAvatarModerations,
        cachedAvatars,
        cachedAvatarNames,

        applyAvatarModeration,
        resetCachedAvatarModerations,
        getAvatarGallery,
        updateVRChatAvatarCache,
        clearAvatarHistory,
        setAvatarHistory,
        setLoadingToastId,
        setAvatarDialogVisible,
        setAvatarDialogIsFavorite,
        setAvatarDialogLoading
    };
});
