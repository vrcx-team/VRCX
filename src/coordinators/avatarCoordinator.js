import { nextTick } from 'vue';
import { toast } from 'vue-sonner';
import { i18n } from '../plugins/i18n';

import {
    createDefaultAvatarRef,
    extractFileId,
    getAvailablePlatforms,
    getBundleDateSize,
    getPlatformInfo,
    replaceBioSymbols,
    sanitizeEntityJson,
    storeAvatarImage
} from '../shared/utils';
import { avatarRequest, miscRequest, queryRequest } from '../api';
import { logWebRequest } from '../services/appConfig';
import { database } from '../services/database';
import { patchAvatarFromEvent } from '../queries';
import { processBulk } from '../services/request';
import { applyFavorite } from './favoriteCoordinator';
import { refreshUserDialogAvatars, showUserDialog } from './userCoordinator';
import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useAvatarProviderStore } from '../stores/avatarProvider';
import { useAvatarStore } from '../stores/avatar';
import { useFavoriteStore } from '../stores/favorite';
import { useModalStore } from '../stores/modal';
import { syncAvatarSearchIndex, removeAvatarSearchIndex } from './searchIndexCoordinator';
import { useUiStore } from '../stores/ui';
import { useUserStore } from '../stores/user';
import { useVRCXUpdaterStore } from '../stores/vrcxUpdater';

import webApiService from '../services/webapi';

/**
 * @param {object} json
 * @returns {object} ref
 */
export function applyAvatar(json) {
    const avatarStore = useAvatarStore();
    const favoriteStore = useFavoriteStore();

    sanitizeEntityJson(json, ['name', 'description']);
    let ref = avatarStore.cachedAvatars.get(json.id);
    if (typeof ref === 'undefined') {
        ref = createDefaultAvatarRef(json);
        avatarStore.cachedAvatars.set(ref.id, ref);
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
    applyFavorite('avatar', ref.id);
    if (favoriteStore.localAvatarFavoritesList.includes(ref.id)) {
        const avatarRef = ref;
        favoriteStore.syncLocalAvatarFavoriteRef(avatarRef);

        // update db cache
        database.addAvatarToCache(avatarRef);
    }
    patchAvatarFromEvent(ref);
    syncAvatarSearchIndex(ref);
    return ref;
}

/**
 *
 * @param {string} avatarId
 * @param options
 * @returns
 */
export function showAvatarDialog(avatarId, options = {}) {
    const avatarStore = useAvatarStore();
    const uiStore = useUiStore();
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const t = i18n.global.t;

    const D = avatarStore.avatarDialog;
    const forceRefresh = Boolean(options?.forceRefresh);
    const isMainDialogOpen = uiStore.openDialog({
        type: 'avatar',
        id: avatarId
    });
    D.visible = true;
    if (isMainDialogOpen && D.id === avatarId && !forceRefresh) {
        uiStore.setDialogCrumbLabel('avatar', D.id, D.ref?.name || D.id);
        nextTick(() => (D.loading = false));
        return;
    }
    D.loading = true;
    D.id = avatarId;
    D.inCache = false;
    D.cacheSize = '';
    D.cacheLocked = false;
    D.cachePath = '';
    D.fileAnalysis = {};
    D.isQuestFallback = false;
    D.isPC = false;
    D.isQuest = false;
    D.isIos = false;
    D.hasImposter = false;
    D.imposterVersion = '';
    D.platformInfo = {};
    D.galleryImages = [];
    D.galleryLoading = true;
    D.isFavorite =
        favoriteStore.getCachedFavoritesByObjectId(avatarId) ||
        (userStore.isLocalUserVrcPlusSupporter &&
            favoriteStore.localAvatarFavoritesList.includes(avatarId));
    D.isBlocked = avatarStore.cachedAvatarModerations.has(avatarId);
    const ref2 = avatarStore.cachedAvatars.get(avatarId);
    if (typeof ref2 !== 'undefined') {
        D.ref = ref2;
        uiStore.setDialogCrumbLabel('avatar', D.id, D.ref?.name || D.id);
        nextTick(() => (D.loading = false));
    }
    const loadAvatarRequest = forceRefresh
        ? avatarRequest.getAvatar({ avatarId })
        : queryRequest.fetch('avatar.dialog', { avatarId });
    loadAvatarRequest
        .then((args) => {
            const ref = applyAvatar(args.json);
            D.ref = ref;
            uiStore.setDialogCrumbLabel('avatar', D.id, D.ref?.name || D.id);
            avatarStore.getAvatarGallery(avatarId);
            avatarStore.updateVRChatAvatarCache();
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
            if (Object.keys(D.fileAnalysis).length === 0) {
                getBundleDateSize(ref);
            }
        })
        .catch((err) => {
            D.loading = false;
            D.id = null;
            D.visible = false;
            uiStore.jumpBackDialogCrumb();
            toast.error(t('message.api_handler.avatar_private_or_deleted'));
            throw err;
        })
        .finally(() => {
            nextTick(() => (D.loading = false));
        });
}

/**
 *
 * @returns {Promise<void>}
 */
export async function getAvatarHistory() {
    const avatarStore = useAvatarStore();
    const userStore = useUserStore();

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
    avatarStore.setAvatarHistory(historyArray);
}

/**
 * @param {string} avatarId
 */
export function addAvatarToHistory(avatarId) {
    const avatarStore = useAvatarStore();
    const userStore = useUserStore();

    avatarRequest
        .getAvatar({ avatarId })
        .then((args) => {
            const ref = applyAvatar(args.json);

            database.addAvatarToCache(ref);
            database.addAvatarToHistory(ref.id);

            if (ref.authorId === userStore.currentUser.id) {
                return;
            }

            const historyArray = avatarStore.avatarHistory;
            for (let i = 0; i < historyArray.length; ++i) {
                if (historyArray[i].id === ref.id) {
                    historyArray.splice(i, 1);
                }
            }

            avatarStore.avatarHistory.unshift(ref);
        })
        .catch((err) => {
            console.error('Failed to add avatar to history:', err);
        });
}

/**
 *
 */
export function promptClearAvatarHistory() {
    const avatarStore = useAvatarStore();
    const modalStore = useModalStore();
    const t = i18n.global.t;

    modalStore
        .confirm({
            description: t('confirm.clear_avatar_history'),
            title: t('confirm.title'),
            destructive: true
        })
        .then(({ ok }) => {
            if (!ok) return;
            avatarStore.clearAvatarHistory();
        })
        .catch(() => {});
}

/**
 *
 * @param {string} imageUrl
 * @returns {Promise<object>}
 */
export async function getAvatarName(imageUrl) {
    const avatarStore = useAvatarStore();

    const fileId = extractFileId(imageUrl);
    if (!fileId) {
        return {
            ownerId: '',
            avatarName: '-'
        };
    }
    if (avatarStore.cachedAvatarNames.has(fileId)) {
        return avatarStore.cachedAvatarNames.get(fileId);
    }
    try {
        const args = await miscRequest.getFile({ fileId });
        return storeAvatarImage(args, avatarStore.cachedAvatarNames);
    } catch (error) {
        console.error('Failed to get avatar images:', error);
        return {
            ownerId: '',
            avatarName: '-'
        };
    }
}

/**
 *
 * @param type
 * @param search
 */
export async function lookupAvatars(type, search) {
    const avatarProviderStore = useAvatarProviderStore();
    const vrcxUpdaterStore = useVRCXUpdaterStore();

    const avatars = new Map();
    if (type === 'search') {
        try {
            const url = `${
                avatarProviderStore.avatarRemoteDatabaseProvider
            }?${type}=${encodeURIComponent(search)}&n=5000`;
            const response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app',
                    'VRCX-ID': vrcxUpdaterStore.vrcxId
                }
            });
            const json = JSON.parse(response.data);
            logWebRequest('[EXTERNAL GET]', url, `(${response.status})`, json);
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
            toast.error(msg);
        }
    } else if (type === 'authorId') {
        const length =
            avatarProviderStore.avatarRemoteDatabaseProviderList.length;
        for (let i = 0; i < length; ++i) {
            const url = avatarProviderStore.avatarRemoteDatabaseProviderList[i];
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

/**
 *
 * @param authorId
 * @param fileId
 */
export async function lookupAvatarByImageFileId(authorId, fileId) {
    const avatarProviderStore = useAvatarProviderStore();

    for (const providerUrl of avatarProviderStore.avatarRemoteDatabaseProviderList) {
        const avatar = await lookupAvatarByFileId(providerUrl, fileId);
        if (avatar?.id) {
            return avatar.id;
        }
    }

    for (const providerUrl of avatarProviderStore.avatarRemoteDatabaseProviderList) {
        const avatarArray = await lookupAvatarsByAuthor(providerUrl, authorId);
        for (const avatar of avatarArray) {
            if (extractFileId(avatar.imageUrl) === fileId) {
                return avatar.id;
            }
        }
    }
    return null;
}

/**
 *
 * @param providerUrl
 * @param fileId
 */
async function lookupAvatarByFileId(providerUrl, fileId) {
    const vrcxUpdaterStore = useVRCXUpdaterStore();

    try {
        const url = `${providerUrl}?fileId=${encodeURIComponent(fileId)}`;
        const response = await webApiService.execute({
            url,
            method: 'GET',
            headers: {
                Referer: 'https://vrcx.app',
                'VRCX-ID': vrcxUpdaterStore.vrcxId
            }
        });
        const json = JSON.parse(response.data);
        logWebRequest('[EXTERNAL GET]', url, `(${response.status})`, json);
        if (response.status === 200 && typeof json === 'object') {
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
                ...json
            };
            return ref;
        } else {
            return null;
        }
    } catch (err) {
        // ignore errors for now, not all providers support this lookup type
        return null;
    }
}

/**
 *
 * @param providerUrl
 * @param authorId
 */
async function lookupAvatarsByAuthor(providerUrl, authorId) {
    const vrcxUpdaterStore = useVRCXUpdaterStore();

    const avatars = [];
    if (!providerUrl || !authorId) {
        return avatars;
    }
    const url = `${providerUrl}?authorId=${encodeURIComponent(authorId)}`;
    try {
        const response = await webApiService.execute({
            url,
            method: 'GET',
            headers: {
                Referer: 'https://vrcx.app',
                'VRCX-ID': vrcxUpdaterStore.vrcxId
            }
        });
        const json = JSON.parse(response.data);
        logWebRequest('[EXTERNAL GET]', url, `(${response.status})`, json);
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
        toast.error(msg);
    }
    return avatars;
}

/**
 *
 * @param id
 */
export function selectAvatarWithConfirmation(id) {
    const modalStore = useModalStore();
    const t = i18n.global.t;

    modalStore
        .confirm({
            description: t('confirm.select_avatar'),
            title: t('confirm.title')
        })
        .then(({ ok }) => {
            if (!ok) return;
            selectAvatarWithoutConfirmation(id);
        })
        .catch(() => {});
}

/**
 *
 * @param id
 */
export async function selectAvatarWithoutConfirmation(id) {
    const userStore = useUserStore();

    if (userStore.currentUser.currentAvatar === id) {
        toast.info('Avatar already selected');
        return;
    }
    return avatarRequest
        .selectAvatar({
            avatarId: id
        })
        .then(() => {
            toast.success('Avatar changed');
        });
}

/**
 *
 * @param fileId
 */
export function checkAvatarCache(fileId) {
    const avatarStore = useAvatarStore();

    let avatarId = '';
    for (let ref of avatarStore.cachedAvatars.values()) {
        if (extractFileId(ref.imageUrl) === fileId) {
            avatarId = ref.id;
        }
    }
    return avatarId;
}

/**
 *
 * @param fileId
 * @param ownerUserId
 */
export async function checkAvatarCacheRemote(fileId, ownerUserId) {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const avatarStore = useAvatarStore();
    const t = i18n.global.t;

    if (advancedSettingsStore.avatarRemoteDatabase) {
        try {
            toast.dismiss(avatarStore.loadingToastId);
            avatarStore.setLoadingToastId(
                toast.loading(t('message.avatar_lookup.loading'))
            );
            const avatarId = await lookupAvatarByImageFileId(
                ownerUserId,
                fileId
            );
            return avatarId;
        } catch (err) {
            console.error('Failed to lookup avatar by image file id:', err);
        } finally {
            toast.dismiss(avatarStore.loadingToastId);
        }
    }
    return null;
}

/**
 *
 * @param refUserId
 * @param ownerUserId
 * @param currentAvatarImageUrl
 */
export async function showAvatarAuthorDialog(
    refUserId,
    ownerUserId,
    currentAvatarImageUrl
) {
    const userStore = useUserStore();
    const t = i18n.global.t;

    const fileId = extractFileId(currentAvatarImageUrl);
    if (!fileId) {
        toast.error(t('message.avatar_lookup.failed'));
    } else if (refUserId === userStore.currentUser.id) {
        showAvatarDialog(userStore.currentUser.currentAvatar);
    } else {
        let avatarId = checkAvatarCache(fileId);
        let avatarInfo;
        if (!avatarId) {
            avatarInfo = await getAvatarName(currentAvatarImageUrl);
            if (avatarInfo.ownerId === userStore.currentUser.id) {
                await refreshUserDialogAvatars(fileId);
                return;
            }
        }
        if (!avatarId) {
            avatarId = await checkAvatarCacheRemote(fileId, ownerUserId);
        }
        if (!avatarId) {
            if (ownerUserId === refUserId) {
                toast.warning(t('message.avatar_lookup.private_or_not_found'));
            } else {
                toast.warning(t('message.avatar_lookup.not_found'));
                showUserDialog(avatarInfo.ownerId);
            }
        }
        if (avatarId) {
            showAvatarDialog(avatarId);
        }
    }
}

/**
 *
 * @param avatarId
 */
export function addAvatarWearTime(avatarId) {
    const userStore = useUserStore();

    if (!userStore.currentUser.$previousAvatarSwapTime || !avatarId) {
        return;
    }
    const timeSpent =
        Date.now() - userStore.currentUser.$previousAvatarSwapTime;
    database.addAvatarTimeSpent(avatarId, timeSpent);
}

/**
 * Preload all own avatars into cache at startup for global search.
 */
export async function preloadOwnAvatars() {
    const params = {
        n: 50,
        offset: 0,
        sort: 'updated',
        order: 'descending',
        releaseStatus: 'all',
        user: 'me'
    };
    await processBulk({
        fn: avatarRequest.getAvatars,
        N: -1,
        params,
        handle: (args) => {
            for (const json of args.json) {
                applyAvatar(json);
            }
        }
    });
}

/**
 * @param {string} id
 */
export function removeAvatarFromCache(id) {
    const avatarStore = useAvatarStore();
    avatarStore.cachedAvatars.delete(id);
    removeAvatarSearchIndex(id);
}
