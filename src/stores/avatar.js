import { nextTick, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';

import {
    checkVRChatCache,
    extractFileId,
    getAvailablePlatforms,
    getBundleDateSize,
    getPlatformInfo,
    replaceBioSymbols,
    storeAvatarImage
} from '../shared/utils';
import { avatarRequest, miscRequest } from '../api';
import { AppDebug } from '../service/appConfig';
import { database } from '../service/database';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAvatarProviderStore } from './avatarProvider';
import { useFavoriteStore } from './favorite';
import { useUserStore } from './user';
import { useVRCXUpdaterStore } from './vrcxUpdater';
import { watchState } from '../service/watchState';

import webApiService from '../service/webapi';

export const useAvatarStore = defineStore('Avatar', () => {
    const favoriteStore = useFavoriteStore();
    const avatarProviderStore = useAvatarProviderStore();
    const vrcxUpdaterStore = useVRCXUpdaterStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const userStore = useUserStore();

    let cachedAvatarModerations = new Map();
    let cachedAvatars = new Map();
    let cachedAvatarNames = new Map();

    const avatarDialog = ref({
        visible: false,
        loading: false,
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
        bundleSizes: [],
        platformInfo: {},
        galleryImages: [],
        galleryLoading: false,
        lastUpdated: '',
        inCache: false,
        cacheSize: '',
        cacheLocked: false,
        cachePath: '',
        fileAnalysis: []
    });
    const avatarHistory = ref([]);

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
            }
        },
        { flush: 'sync' }
    );

    /**
    / * @param {object} json
    / * @returns {object} ref
    */
    function applyAvatar(json) {
        json.name = replaceBioSymbols(json.name);
        json.description = replaceBioSymbols(json.description);
        let ref = cachedAvatars.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                acknowledgements: '',
                authorId: '',
                authorName: '',
                created_at: '',
                description: '',
                featured: false,
                highestPrice: null,
                id: '',
                imageUrl: '',
                listingDate: null,
                lock: false,
                lowestPrice: null,
                name: '',
                pendingUpload: false,
                performance: {},
                productId: null,
                publishedListings: [],
                releaseStatus: '',
                searchable: false,
                styles: [],
                tags: [],
                thumbnailImageUrl: '',
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                unityPackages: [],
                updated_at: '',
                version: 0,
                ...json
            };
            cachedAvatars.set(ref.id, ref);
        } else {
            const { unityPackages } = ref;
            Object.assign(ref, json);
            if (
                json.unityPackages?.length > 0 &&
                unityPackages.length > 0 &&
                !json.unityPackages[0].assetUrl
            ) {
                ref.unityPackages = unityPackages;
            }
        }
        for (const listing of ref.publishedListings) {
            listing.displayName = replaceBioSymbols(listing.displayName);
            listing.description = replaceBioSymbols(listing.description);
        }
        favoriteStore.applyFavorite('avatar', ref.id);
        if (favoriteStore.localAvatarFavoritesList.includes(ref.id)) {
            for (
                let i = 0;
                i < favoriteStore.localAvatarFavoriteGroups.length;
                ++i
            ) {
                const groupName = favoriteStore.localAvatarFavoriteGroups[i];
                if (!favoriteStore.localAvatarFavorites[groupName]) {
                    continue;
                }
                for (
                    let j = 0;
                    j < favoriteStore.localAvatarFavorites[groupName].length;
                    ++j
                ) {
                    const ref =
                        favoriteStore.localAvatarFavorites[groupName][j];
                    if (ref.id === ref.id) {
                        favoriteStore.localAvatarFavorites[groupName][j] = ref;
                    }
                }
            }

            // update db cache
            database.addAvatarToCache(ref);
        }
        return ref;
    }

    /**
     *
     * @param {string} avatarId
     * @returns
     */
    function showAvatarDialog(avatarId) {
        const D = avatarDialog.value;
        D.visible = true;
        D.loading = true;
        D.id = avatarId;
        D.inCache = false;
        D.cacheSize = '';
        D.cacheLocked = false;
        D.cachePath = '';
        D.fileAnalysis = [];
        D.isQuestFallback = false;
        D.isPC = false;
        D.isQuest = false;
        D.isIos = false;
        D.hasImposter = false;
        D.imposterVersion = '';
        D.lastUpdated = '';
        D.bundleSizes = [];
        D.platformInfo = {};
        D.galleryImages = [];
        D.galleryLoading = true;
        D.isFavorite =
            favoriteStore.cachedFavoritesByObjectId(avatarId) ||
            (userStore.isLocalUserVrcPlusSupporter &&
                favoriteStore.localAvatarFavoritesList.includes(avatarId));
        D.isBlocked = cachedAvatarModerations.has(avatarId);
        const ref2 = cachedAvatars.get(avatarId);
        if (typeof ref2 !== 'undefined') {
            D.ref = ref2;
            updateVRChatAvatarCache();
            if (
                ref2.releaseStatus !== 'public' &&
                ref2.authorId !== userStore.currentUser.id
            ) {
                D.loading = false;
                return;
            }
        }
        avatarRequest
            .getAvatar({ avatarId })
            .then((args) => {
                const ref = applyAvatar(args.json);
                D.ref = ref;
                getAvatarGallery(avatarId);
                updateVRChatAvatarCache();
                if (/quest/.test(ref.tags)) {
                    D.isQuestFallback = true;
                }
                const { isPC, isQuest, isIos } = getAvailablePlatforms(
                    ref.unityPackages
                );
                D.isPC = isPC;
                D.isQuest = isQuest;
                D.isIos = isIos;
                D.platformInfo = getPlatformInfo(ref.unityPackages);
                for (let i = ref.unityPackages.length - 1; i > -1; i--) {
                    const unityPackage = ref.unityPackages[i];
                    if (unityPackage.variant === 'impostor') {
                        D.hasImposter = true;
                        D.imposterVersion = unityPackage.impostorizerVersion;
                        break;
                    }
                }
                if (D.bundleSizes.length === 0) {
                    getBundleDateSize(ref).then((bundleSizes) => {
                        D.bundleSizes = bundleSizes;
                    });
                }
            })
            .catch((err) => {
                D.visible = false;
                throw err;
            })
            .finally(() => {
                nextTick(() => (D.loading = false));
            });
    }

    /**
     *
     * @param {string} avatarId
     * @returns {Promise<string[]>}
     */
    async function getAvatarGallery(avatarId) {
        const D = avatarDialog.value;
        const args = await avatarRequest
            .getAvatarGallery(avatarId)
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
     * @returns {Promise<void>}
     */
    async function getAvatarHistory() {
        const historyArray = await database.getAvatarHistory(
            userStore.currentUser.id
        );
        for (let i = 0; i < historyArray.length; i++) {
            const avatar = historyArray[i];
            if (avatar.authorId === userStore.currentUser.id) {
                continue;
            }
            applyAvatar(avatar);
        }
        avatarHistory.value = historyArray;
    }

    /**
     * @param {string} avatarId
     */
    function addAvatarToHistory(avatarId) {
        avatarRequest
            .getAvatar({ avatarId })
            .then((args) => {
                const ref = applyAvatar(args.json);

                database.addAvatarToCache(ref);
                database.addAvatarToHistory(ref.id);

                if (ref.authorId === userStore.currentUser.id) {
                    return;
                }

                const historyArray = avatarHistory.value;
                for (let i = 0; i < historyArray.length; ++i) {
                    if (historyArray[i].id === ref.id) {
                        historyArray.splice(i, 1);
                    }
                }

                avatarHistory.value.unshift(ref);
            })
            .catch((err) => {
                console.error('Failed to add avatar to history:', err);
            });
    }

    function clearAvatarHistory() {
        avatarHistory.value = [];
        database.clearAvatarHistory();
    }

    function promptClearAvatarHistory() {
        ElMessageBox.confirm('Continue? Clear Avatar History', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then(() => {
                clearAvatarHistory();
            })
            .catch(() => {});
    }

    /**
     *
     * @param {string} imageUrl
     * @returns {Promise<object>}
     */
    async function getAvatarName(imageUrl) {
        const fileId = extractFileId(imageUrl);
        if (!fileId) {
            return {
                ownerId: '',
                avatarName: '-'
            };
        }
        if (cachedAvatarNames.has(fileId)) {
            return cachedAvatarNames.get(fileId);
        }
        try {
            const args = await miscRequest.getFile({ fileId });
            return storeAvatarImage(args, cachedAvatarNames);
        } catch (error) {
            console.error('Failed to get avatar images:', error);
            return {
                ownerId: '',
                vatarName: '-'
            };
        }
    }

    async function lookupAvatars(type, search) {
        const avatars = new Map();
        if (type === 'search') {
            try {
                const response = await webApiService.execute({
                    url: `${
                        avatarProviderStore.avatarRemoteDatabaseProvider
                    }?${type}=${encodeURIComponent(search)}&n=5000`,
                    method: 'GET',
                    headers: {
                        Referer: 'https://vrcx.app',
                        'VRCX-ID': vrcxUpdaterStore.vrcxId
                    }
                });
                const json = JSON.parse(response.data);
                if (AppDebug.debugWebRequests) {
                    console.log(json, response);
                }
                if (response.status === 200 && typeof json === 'object') {
                    json.forEach((avatar) => {
                        if (!avatars.has(avatar.Id)) {
                            const ref = {
                                authorId: '',
                                authorName: '',
                                name: '',
                                description: '',
                                id: '',
                                imageUrl: '',
                                thumbnailImageUrl: '',
                                created_at: '0001-01-01T00:00:00.0000000Z',
                                updated_at: '0001-01-01T00:00:00.0000000Z',
                                releaseStatus: 'public',
                                ...avatar
                            };
                            avatars.set(ref.id, ref);
                        }
                    });
                } else {
                    throw new Error(`Error: ${response.data}`);
                }
            } catch (err) {
                const msg = `Avatar search failed for ${search} with ${avatarProviderStore.avatarRemoteDatabaseProvider}\n${err}`;
                console.error(msg);
                ElMessage({
                    message: msg,
                    type: 'error'
                });
            }
        } else if (type === 'authorId') {
            const length =
                avatarProviderStore.avatarRemoteDatabaseProviderList.length;
            for (let i = 0; i < length; ++i) {
                const url =
                    avatarProviderStore.avatarRemoteDatabaseProviderList[i];
                const avatarArray = await lookupAvatarsByAuthor(url, search);
                avatarArray.forEach((avatar) => {
                    if (!avatars.has(avatar.id)) {
                        avatars.set(avatar.id, avatar);
                    }
                });
            }
        }
        return avatars;
    }

    async function lookupAvatarByImageFileId(authorId, fileId) {
        const length =
            avatarProviderStore.avatarRemoteDatabaseProviderList.length;
        for (let i = 0; i < length; ++i) {
            const url = avatarProviderStore.avatarRemoteDatabaseProviderList[i];
            const avatarArray = await lookupAvatarsByAuthor(url, authorId);
            for (const avatar of avatarArray) {
                if (extractFileId(avatar.imageUrl) === fileId) {
                    return avatar.id;
                }
            }
        }
        return null;
    }

    async function lookupAvatarsByAuthor(url, authorId) {
        const avatars = [];
        if (!url) {
            return avatars;
        }
        try {
            const response = await webApiService.execute({
                url: `${url}?authorId=${encodeURIComponent(authorId)}`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app',
                    'VRCX-ID': vrcxUpdaterStore.vrcxId
                }
            });
            const json = JSON.parse(response.data);
            if (AppDebug.debugWebRequests) {
                console.log(json, response);
            }
            if (response.status === 200 && typeof json === 'object') {
                json.forEach((avatar) => {
                    const ref = {
                        authorId: '',
                        authorName: '',
                        name: '',
                        description: '',
                        id: '',
                        imageUrl: '',
                        thumbnailImageUrl: '',
                        created_at: '0001-01-01T00:00:00.0000000Z',
                        updated_at: '0001-01-01T00:00:00.0000000Z',
                        releaseStatus: 'public',
                        ...avatar
                    };
                    avatars.push(ref);
                });
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch (err) {
            const msg = `Avatar lookup failed for ${authorId} with ${url}\n${err}`;
            console.error(msg);
            ElMessage({
                message: msg,
                type: 'error'
            });
        }
        return avatars;
    }

    function selectAvatarWithConfirmation(id) {
        ElMessageBox.confirm(`Continue? Select Avatar`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then(() => {
                selectAvatarWithoutConfirmation(id);
            })
            .catch(() => {});
    }

    async function selectAvatarWithoutConfirmation(id) {
        if (userStore.currentUser.currentAvatar === id) {
            ElMessage({
                message: 'Avatar already selected',
                type: 'info'
            });
            return;
        }
        return avatarRequest
            .selectAvatar({
                avatarId: id
            })
            .then(() => {
                ElMessage({
                    message: 'Avatar changed',
                    type: 'success'
                });
            });
    }

    function checkAvatarCache(fileId) {
        let avatarId = '';
        for (let ref of cachedAvatars.values()) {
            if (extractFileId(ref.imageUrl) === fileId) {
                avatarId = ref.id;
            }
        }
        return avatarId;
    }

    async function checkAvatarCacheRemote(fileId, ownerUserId) {
        if (advancedSettingsStore.avatarRemoteDatabase) {
            const avatarId = await lookupAvatarByImageFileId(
                ownerUserId,
                fileId
            );
            return avatarId;
        }
        return null;
    }

    async function showAvatarAuthorDialog(
        refUserId,
        ownerUserId,
        currentAvatarImageUrl
    ) {
        const fileId = extractFileId(currentAvatarImageUrl);
        if (!fileId) {
            ElMessage({
                message: 'Sorry, the author is unknown',
                type: 'error'
            });
        } else if (refUserId === userStore.currentUser.id) {
            showAvatarDialog(userStore.currentUser.currentAvatar);
        } else {
            let avatarId = checkAvatarCache(fileId);
            let avatarInfo;
            if (!avatarId) {
                avatarInfo = await getAvatarName(currentAvatarImageUrl);
                if (avatarInfo.ownerId === userStore.currentUser.id) {
                    userStore.refreshUserDialogAvatars(fileId);
                }
            }
            if (!avatarId) {
                avatarId = await checkAvatarCacheRemote(
                    fileId,
                    avatarInfo.ownerId
                );
            }
            if (!avatarId) {
                if (avatarInfo.ownerId === refUserId) {
                    ElMessage({
                        message:
                            "It's personal (own) avatar or not found in avatar database",
                        type: 'warning'
                    });
                } else {
                    ElMessage({
                        message: 'Avatar not found in avatar database',
                        type: 'warning'
                    });
                    userStore.showUserDialog(avatarInfo.ownerId);
                }
            }
            if (avatarId) {
                showAvatarDialog(avatarId);
            }
        }
    }

    function addAvatarWearTime(avatarId) {
        if (!userStore.currentUser.$previousAvatarSwapTime || !avatarId) {
            return;
        }
        const timeSpent =
            Date.now() - userStore.currentUser.$previousAvatarSwapTime;
        database.addAvatarTimeSpent(avatarId, timeSpent);
    }

    return {
        avatarDialog,
        avatarHistory,
        cachedAvatarModerations,
        cachedAvatars,
        cachedAvatarNames,

        showAvatarDialog,
        applyAvatarModeration,
        getAvatarGallery,
        updateVRChatAvatarCache,
        getAvatarHistory,
        addAvatarToHistory,
        applyAvatar,
        promptClearAvatarHistory,
        getAvatarName,
        lookupAvatars,
        selectAvatarWithConfirmation,
        selectAvatarWithoutConfirmation,
        showAvatarAuthorDialog,
        addAvatarWearTime
    };
});
