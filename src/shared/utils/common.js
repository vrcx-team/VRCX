import Noty from 'noty';
import { storeToRefs } from 'pinia';
import { miscRequest } from '../../api';
import { $app } from '../../app';
import {
    useAvatarStore,
    useInstanceStore,
    useWorldStore,
    useSearchStore
} from '../../stores';
import { compareUnityVersion } from './avatar';
import { escapeTag } from './base/string';

/**
 *
 * @param {object} unityPackages
 * @returns
 */
function getAvailablePlatforms(unityPackages) {
    let isPC = false;
    let isQuest = false;
    let isIos = false;
    if (typeof unityPackages === 'object') {
        for (const unityPackage of unityPackages) {
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            if (unityPackage.platform === 'standalonewindows') {
                isPC = true;
            } else if (unityPackage.platform === 'android') {
                isQuest = true;
            } else if (unityPackage.platform === 'ios') {
                isIos = true;
            }
        }
    }
    return { isPC, isQuest, isIos };
}

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
        new Noty({
            type: 'error',
            text: escapeTag('Failed to download JSON.')
        }).show();
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

    return AssetBundleManager.CheckVRChatCache(
        id,
        version,
        variant,
        variantVersion
    );
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
            $app.$message({
                message: message,
                type: 'success'
            });
        })
        .catch((err) => {
            console.error('Copy failed:', err);
            $app.$message.error('Copy failed!');
        });
}

/**
 *
 * @param {string} resource
 * @returns {string}
 */
function getFaviconUrl(resource) {
    if (!resource) {
        return '';
    }
    try {
        const url = new URL(resource);
        return `https://icons.duckduckgo.com/ip2/${url.host}.ico`;
    } catch (err) {
        console.error('Invalid URL:', resource, err);
        return '';
    }
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
        return `https://api.vrchat.cloud/api/1/image/file_${fileId}/${version}/${resolution}`;
    }
    // no match return origin url
    return url;
}

/**
 *
 * @param {string} url
 * @returns {string}
 */
function replaceVrcPackageUrl(url) {
    if (!url) {
        return '';
    }
    return url.replace('https://api.vrchat.cloud/', 'https://vrchat.com/');
}

/**
 *
 * @param {string} s
 * @returns {string}
 */
function extractFileId(s) {
    const match = String(s).match(/file_[0-9A-Za-z-]+/);
    return match ? match[0] : '';
}

/**
 *
 * @param {string} s
 * @returns {string}
 */
function extractFileVersion(s) {
    const match = /(?:\/file_[0-9A-Za-z-]+\/)([0-9]+)/gi.exec(s);
    return match ? match[1] : '';
}

/**
 *
 * @param {string} url
 * @returns {string}
 */
function extractVariantVersion(url) {
    if (!url) {
        return '0';
    }
    try {
        const params = new URLSearchParams(new URL(url).search);
        const version = params.get('v');
        if (version) {
            return version;
        }
        return '0';
    } catch {
        return '0';
    }
}

/**
 *
 * @param {object} json
 * @returns {Array}
 */
function buildTreeData(json) {
    const node = [];
    for (const key in json) {
        if (key[0] === '$') {
            continue;
        }
        const value = json[key];
        if (Array.isArray(value) && value.length === 0) {
            node.push({
                key,
                value: '[]'
            });
        } else if (value === Object(value) && Object.keys(value).length === 0) {
            node.push({
                key,
                value: '{}'
            });
        } else if (Array.isArray(value)) {
            node.push({
                children: value.map((val, idx) => {
                    if (val === Object(val)) {
                        return {
                            children: buildTreeData(val),
                            key: idx
                        };
                    }
                    return {
                        key: idx,
                        value: val
                    };
                }),
                key
            });
        } else if (value === Object(value)) {
            node.push({
                children: buildTreeData(value),
                key
            });
        } else {
            node.push({
                key,
                value: String(value)
            });
        }
    }
    node.sort(function (a, b) {
        const A = String(a.key).toUpperCase();
        const B = String(b.key).toUpperCase();
        if (A < B) {
            return -1;
        }
        if (A > B) {
            return 1;
        }
        return 0;
    });
    return node;
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
function replaceBioSymbols(text) {
    if (!text) {
        return '';
    }
    const symbolList = {
        '@': '＠',
        '#': '＃',
        $: '＄',
        '%': '％',
        '&': '＆',
        '=': '＝',
        '+': '＋',
        '/': '⁄',
        '\\': '＼',
        ';': ';',
        ':': '˸',
        ',': '‚',
        '?': '？',
        '!': 'ǃ',
        '"': '＂',
        '<': '≺',
        '>': '≻',
        '.': '․',
        '^': '＾',
        '{': '｛',
        '}': '｝',
        '[': '［',
        ']': '］',
        '(': '（',
        ')': '）',
        '|': '｜',
        '*': '∗'
    };
    let newText = text;
    for (const key in symbolList) {
        const regex = new RegExp(symbolList[key], 'g');
        newText = newText.replace(regex, key);
    }
    return newText.replace(/ {1,}/g, ' ').trimRight();
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

    $app.$confirm(`${link}`, 'Open External Link', {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Open',
        cancelButtonText: 'Copy',
        type: 'info',
        callback: (action) => {
            if (action === 'confirm') {
                AppApi.OpenLink(link);
            } else if (action === 'cancel') {
                copyLink(link);
            }
        }
    });
}

/**
 *
 * @param {string} text
 */
function copyLink(text) {
    $app.$message({
        message: 'Link copied to clipboard',
        type: 'success'
    });
    copyToClipboard(text);
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
    const bundleSizes = [];
    const bundleJson = [];
    for (let i = ref.unityPackages.length - 1; i > -1; i--) {
        const unityPackage = ref.unityPackages[i];
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
        if (bundleSizes[platform]) {
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
        const args = await miscRequest.getFileAnalysis({
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
        const createdAt = json.created_at;
        const fileSize = `${(json.fileSize / 1048576).toFixed(2)} MB`;
        bundleSizes[platform] = {
            createdAt,
            fileSize
        };

        if (unityPackage.variant === 'standard') {
            if (avatarDialog.value.id === ref.id) {
                // update avatar dialog
                avatarDialog.value.bundleSizes[platform] =
                    bundleSizes[platform];
                avatarDialog.value.lastUpdated = createdAt;
                avatarDialog.value.fileAnalysis = buildTreeData(bundleJson);
            }
            // update world dialog
            if (worldDialog.value.id === ref.id) {
                worldDialog.value.bundleSizes[platform] = bundleSizes[platform];
                worldDialog.value.lastUpdated = createdAt;
                worldDialog.value.fileAnalysis = buildTreeData(bundleJson);
            }
            // update player list
            if (currentInstanceLocation.value.worldId === ref.id) {
                currentInstanceWorld.value.bundleSizes[platform] =
                    bundleSizes[platform];
                currentInstanceWorld.value.lastUpdated = createdAt;
            }
        }
    }

    return bundleSizes;
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
    buildTreeData,
    replaceBioSymbols,
    openExternalLink,
    copyLink,
    getBundleDateSize,
    openFolderGeneric,
    debounce
};
