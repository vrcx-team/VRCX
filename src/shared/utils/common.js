import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import {
    useAvatarStore,
    useInstanceStore,
    useModalStore,
    useSearchStore,
    useWorldStore
} from '../../stores';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from './fileUtils';
import { escapeTag, replaceBioSymbols } from './base/string';
import { getFaviconUrl, replaceVrcPackageUrl } from './urlUtils';
import { AppDebug } from '../../services/appConfig.js';
import { compareUnityVersion } from './avatar';
import { getAvailablePlatforms } from './platformUtils';
import { i18n } from '../../plugins/i18n';
import { queryRequest } from '../../api';

/**
 * @param {string} fileName
 * @param {*} data
 */
function downloadAndSaveJson(fileName, data) {
    if (!fileName || !data) {
        return;
    }
    try {
        const link = document.createElement('a');
        link.setAttribute(
            'href',
            `data:application/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data, null, 2)
            )}`
        );
        link.setAttribute('download', `${fileName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch {
        toast.error(escapeTag('Failed to download JSON.'));
    }
}

async function deleteVRChatCache(ref) {
    let assetUrl = '';
    let variant = '';
    for (let i = ref.unityPackages.length - 1; i > -1; i--) {
        const unityPackage = ref.unityPackages[i];
        if (
            unityPackage.variant &&
            unityPackage.variant !== 'standard' &&
            unityPackage.variant !== 'security'
        ) {
            continue;
        }
        if (
            unityPackage.platform === 'standalonewindows' &&
            compareUnityVersion(unityPackage.unitySortNumber)
        ) {
            assetUrl = unityPackage.assetUrl;
            if (!unityPackage.variant || unityPackage.variant === 'standard') {
                variant = 'security';
            } else {
                variant = unityPackage.variant;
            }
            break;
        }
    }
    const id = extractFileId(assetUrl);
    const version = parseInt(extractFileVersion(assetUrl), 10);
    const variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    await AssetBundleManager.DeleteCache(id, version, variant, variantVersion);
}

/**
 *
 * @param {object} ref
 * @returns
 */
async function checkVRChatCache(ref) {
    if (!ref.unityPackages) {
        return { Item1: -1, Item2: false, Item3: '' };
    }
    let assetUrl = '';
    let variant = '';
    for (let i = ref.unityPackages.length - 1; i > -1; i--) {
        const unityPackage = ref.unityPackages[i];
        if (unityPackage.variant && unityPackage.variant !== 'security') {
            continue;
        }
        if (
            unityPackage.platform === 'standalonewindows' &&
            compareUnityVersion(unityPackage.unitySortNumber)
        ) {
            assetUrl = unityPackage.assetUrl;
            if (!unityPackage.variant || unityPackage.variant === 'standard') {
                variant = 'security';
            } else {
                variant = unityPackage.variant;
            }
            break;
        }
    }
    if (!assetUrl) {
        assetUrl = ref.assetUrl;
    }
    const id = extractFileId(assetUrl);
    const version = parseInt(extractFileVersion(assetUrl), 10);
    const variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    if (!id || !version) {
        return { Item1: -1, Item2: false, Item3: '' };
    }

    try {
        return AssetBundleManager.CheckVRChatCache(
            id,
            version,
            variant,
            variantVersion
        );
    } catch (err) {
        console.error('Failed reading VRChat cache size:', err);
        toast.error(`Failed reading VRChat cache size: ${err}`);
        return { Item1: -1, Item2: false, Item3: '' };
    }
}

/**
 *
 * @param {string} text
 * @param {string} message
 */
function copyToClipboard(text, message = 'Copied successfully!') {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            toast.success(message);
        })
        .catch((err) => {
            console.error('Copy failed:', err);
            toast.error(i18n.global.t('message.copy_failed'));
        });
}

/**
 *
 * @param {string} url
 * @param {number} resolution
 * @returns {string}
 */
function convertFileUrlToImageUrl(url, resolution = 128) {
    if (!url) {
        return '';
    }
    /**
     * possible patterns?
     * /file/file_fileId/version
     * /file/file_fileId/version/
     * /file/file_fileId/version/file
     * /file/file_fileId/version/file/
     */
    const pattern = /file\/file_([a-f0-9-]+)\/(\d+)(\/file)?\/?$/;
    const match = url.match(pattern);

    if (match) {
        const fileId = match[1];
        const version = match[2];
        return `${AppDebug.endpointDomain}/image/file_${fileId}/${version}/${resolution}`;
    }
    // no match return origin url
    return url;
}

/**
 *
 * @param {string} link
 */
function openExternalLink(link) {
    const searchStore = useSearchStore();
    if (searchStore.directAccessParse(link)) {
        return;
    }

    const modalStore = useModalStore();
    modalStore
        .confirm({
            description: `${link}`,
            title: 'Open External Link',
            confirmText: 'Open',
            cancelText: 'Copy'
        })
        .then(({ ok, reason }) => {
            if (reason === 'cancel') {
                copyToClipboard(link, 'Link copied to clipboard!');
                return;
            }
            if (ok) {
                AppApi.OpenLink(link);
                return;
            }
        });
}

function openDiscordProfile(discordId) {
    if (!discordId) {
        toast.error('No Discord ID provided!');
        return;
    }
    AppApi.OpenDiscordProfile(discordId).catch((err) => {
        console.error('Failed to open Discord profile:', err);
        toast.error('Failed to open Discord profile!');
    });
}

/**
 *
 * @param {object} ref
 * @returns {Promise<object>}
 */
async function getBundleDateSize(ref) {
    const avatarStore = useAvatarStore();
    const { avatarDialog } = storeToRefs(avatarStore);
    const worldStore = useWorldStore();
    const { worldDialog } = storeToRefs(worldStore);
    const instanceStore = useInstanceStore();
    const { currentInstanceWorld, currentInstanceLocation } =
        storeToRefs(instanceStore);
    const bundleJson = {};
    for (let i = ref.unityPackages.length - 1; i > -1; i--) {
        const unityPackage = ref.unityPackages[i];
        if (!unityPackage) {
            continue;
        }
        if (
            unityPackage.variant &&
            unityPackage.variant !== 'standard' &&
            unityPackage.variant !== 'security'
        ) {
            continue;
        }
        if (!compareUnityVersion(unityPackage.unitySortNumber)) {
            continue;
        }

        const platform = unityPackage.platform;
        if (bundleJson[platform]) {
            continue;
        }
        const assetUrl = unityPackage.assetUrl;
        const fileId = extractFileId(assetUrl);
        const version = parseInt(extractFileVersion(assetUrl), 10);
        let variant = '';
        if (!unityPackage.variant || unityPackage.variant === 'standard') {
            variant = 'security';
        } else {
            variant = unityPackage.variant;
        }
        if (!fileId || !version) {
            continue;
        }
        const args = await queryRequest.fetch('fileAnalysis', {
            fileId,
            version,
            variant
        });
        if (!args?.json?.success) {
            continue;
        }

        const json = args.json;
        if (typeof json.fileSize !== 'undefined') {
            json._fileSize = `${(json.fileSize / 1048576).toFixed(2)} MB`;
        }
        if (typeof json.uncompressedSize !== 'undefined') {
            json._uncompressedSize = `${(json.uncompressedSize / 1048576).toFixed(2)} MB`;
        }
        if (typeof json.avatarStats?.totalTextureUsage !== 'undefined') {
            json._totalTextureUsage = `${(json.avatarStats.totalTextureUsage / 1048576).toFixed(2)} MB`;
        }
        bundleJson[platform] = json;

        if (avatarDialog.value.id === ref.id) {
            // update avatar dialog
            avatarDialog.value.fileAnalysis[platform] = json;
        }
        // update world dialog
        if (worldDialog.value.id === ref.id) {
            worldDialog.value.fileAnalysis[platform] = json;
        }
        // update player list
        if (currentInstanceLocation.value.worldId === ref.id) {
            currentInstanceWorld.value.fileAnalysis[platform] = json;
        }
    }

    return bundleJson;
}

// #region | App: Random unsorted app methods, data structs, API functions, and an API feedback/file analysis event

function openFolderGeneric(path) {
    AppApi.OpenFolderAndSelectItem(path, true);
}

function debounce(func, delay) {
    let timer = null;
    return function (...args) {
        const context = this;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

export {
    getAvailablePlatforms,
    downloadAndSaveJson,
    deleteVRChatCache,
    checkVRChatCache,
    copyToClipboard,
    getFaviconUrl,
    convertFileUrlToImageUrl,
    replaceVrcPackageUrl,
    extractFileId,
    extractFileVersion,
    extractVariantVersion,
    replaceBioSymbols,
    openExternalLink,
    openDiscordProfile,
    getBundleDateSize,
    openFolderGeneric,
    debounce
};
