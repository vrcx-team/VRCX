import Noty from 'noty';
import utils from '../../classes/utils';
import { compareUnityVersion } from '../avatar/utils';
import {
    displayLocation,
    isRealInstance,
    parseLocation
} from '../instance/utils';
import {
    getPrintFileName,
    getPrintLocalDate,
    isFriendOnline
} from '../user/utils';

function getAvailablePlatforms(unityPackages) {
    var isPC = false;
    var isQuest = false;
    var isIos = false;
    if (typeof unityPackages === 'object') {
        for (var unityPackage of unityPackages) {
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

function downloadAndSaveJson(fileName, data) {
    if (!fileName || !data) {
        return;
    }
    try {
        var link = document.createElement('a');
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
            text: utils.escapeTag('Failed to download JSON.')
        }).show();
    }
}

async function deleteVRChatCache(ref) {
    var assetUrl = '';
    var variant = '';
    for (var i = ref.unityPackages.length - 1; i > -1; i--) {
        var unityPackage = ref.unityPackages[i];
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
            if (unityPackage.variant !== 'standard') {
                variant = unityPackage.variant;
            }
            break;
        }
    }
    var id = extractFileId(assetUrl);
    var version = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    await AssetBundleManager.DeleteCache(id, version, variant, variantVersion);
}

async function checkVRChatCache(ref) {
    if (!ref.unityPackages) {
        return { Item1: -1, Item2: false, Item3: '' };
    }
    var assetUrl = '';
    var variant = '';
    for (var i = ref.unityPackages.length - 1; i > -1; i--) {
        var unityPackage = ref.unityPackages[i];
        if (unityPackage.variant && unityPackage.variant !== 'security') {
            continue;
        }
        if (
            unityPackage.platform === 'standalonewindows' &&
            compareUnityVersion(unityPackage.unitySortNumber)
        ) {
            assetUrl = unityPackage.assetUrl;
            if (unityPackage.variant !== 'standard') {
                variant = unityPackage.variant;
            }
            break;
        }
    }
    if (!assetUrl) {
        assetUrl = ref.assetUrl;
    }
    var id = extractFileId(assetUrl);
    var version = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
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

function copyToClipboard(text, message = 'Copied successfully!') {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            window.$app.$message({
                message: message,
                type: 'success'
            });
        })
        .catch((err) => {
            console.error('Copy failed:', err);
            window.$app.$message.error('Copy failed!');
        });
}

function getFaviconUrl(resource) {
    if (!resource) {
        return '';
    }
    try {
        const url = new URL(resource);
        return `https://icons.duckduckgo.com/ip2/${url.host}.ico`;
    } catch (err) {
        console.error('Invalid URL:', err);
        return '';
    }
}

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

function replaceVrcPackageUrl(url) {
    if (!url) {
        return '';
    }
    return url.replace('https://api.vrchat.cloud/', 'https://vrchat.com/');
}

function getLaunchURL(instance) {
    var L = instance;
    if (L.instanceId) {
        if (L.shortName) {
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                L.worldId
            )}&instanceId=${encodeURIComponent(
                L.instanceId
            )}&shortName=${encodeURIComponent(L.shortName)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            L.worldId
        )}&instanceId=${encodeURIComponent(L.instanceId)}`;
    }
    return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
        L.worldId
    )}`;
}

function extractFileId(s) {
    var match = String(s).match(/file_[0-9A-Za-z-]+/);
    return match ? match[0] : '';
}

function extractFileVersion(s) {
    var match = /(?:\/file_[0-9A-Za-z-]+\/)([0-9]+)/gi.exec(s);
    return match ? match[1] : '';
}

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

// ---------------------- devtool method --------------------------

async function getBundleLocation(input) {
    const $app = window.$app;
    var assetUrl = input;
    var variant = '';
    if (assetUrl) {
        // continue
    } else if (
        $app.avatarDialog.visible &&
        $app.avatarDialog.ref.unityPackages.length > 0
    ) {
        var unityPackages = $app.avatarDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            var unityPackage = unityPackages[i];
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
                if (unityPackage.variant !== 'standard') {
                    variant = unityPackage.variant;
                }
                break;
            }
        }
    } else if ($app.avatarDialog.visible && $app.avatarDialog.ref.assetUrl) {
        assetUrl = $app.avatarDialog.ref.assetUrl;
    } else if (
        $app.worldDialog.visible &&
        $app.worldDialog.ref.unityPackages.length > 0
    ) {
        var unityPackages = $app.worldDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            var unityPackage = unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                compareUnityVersion(unityPackage.unitySortNumber)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
    } else if ($app.worldDialog.visible && $app.worldDialog.ref.assetUrl) {
        assetUrl = $app.worldDialog.ref.assetUrl;
    }
    if (!assetUrl) {
        return null;
    }
    var fileId = extractFileId(assetUrl);
    var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    var assetLocation = await AssetBundleManager.GetVRChatCacheFullLocation(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    var cacheInfo = await AssetBundleManager.CheckVRChatCache(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    var inCache = false;
    if (cacheInfo.Item1 > 0) {
        inCache = true;
    }
    console.log(`InCache: ${inCache}`);
    var fullAssetLocation = `${assetLocation}\\__data`;
    console.log(fullAssetLocation);
    return fullAssetLocation;
}

const _utils = {
    getAvailablePlatforms,
    deleteVRChatCache,
    checkVRChatCache,
    getLaunchURL,
    extractFileId,
    extractFileVersion,
    extractVariantVersion,
    isRealInstance,
    displayLocation,
    parseLocation,
    getPrintFileName,
    getPrintLocalDate,
    isFriendOnline
};

export {
    getAvailablePlatforms,
    downloadAndSaveJson,
    deleteVRChatCache,
    checkVRChatCache,
    copyToClipboard,
    getFaviconUrl,
    convertFileUrlToImageUrl,
    replaceVrcPackageUrl,
    getLaunchURL,
    extractFileId,
    extractFileVersion,
    extractVariantVersion,
    getBundleLocation,
    _utils
};
