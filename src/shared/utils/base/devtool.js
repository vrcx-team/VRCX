import { useAvatarStore, useWorldStore } from '../../../stores';
import { compareUnityVersion } from '../avatar';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../common';

/**
 *
 * @param {string} input
 * @returns {Promise<string|null>}
 */
async function getBundleLocation(input) {
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();
    let unityPackage;
    let unityPackages;
    let assetUrl = input;
    let variant = '';
    if (assetUrl) {
        // continue
    } else if (
        avatarStore.avatarDialog.visible &&
        avatarStore.avatarDialog.ref.unityPackages.length > 0
    ) {
        unityPackages = avatarStore.avatarDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            unityPackage = unityPackages[i];
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
    } else if (
        avatarStore.avatarDialog.visible &&
        avatarStore.avatarDialog.ref.assetUrl
    ) {
        assetUrl = avatarStore.avatarDialog.ref.assetUrl;
    } else if (
        worldStore.worldDialog.visible &&
        worldStore.worldDialog.ref.unityPackages.length > 0
    ) {
        unityPackages = worldStore.worldDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            unityPackage = unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                compareUnityVersion(unityPackage.unitySortNumber)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
    } else if (
        worldStore.worldDialog.visible &&
        worldStore.worldDialog.ref.assetUrl
    ) {
        assetUrl = worldStore.worldDialog.ref.assetUrl;
    }
    if (!assetUrl) {
        return null;
    }
    const fileId = extractFileId(assetUrl);
    const fileVersion = parseInt(extractFileVersion(assetUrl), 10);
    const variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    const assetLocation = await AssetBundleManager.GetVRChatCacheFullLocation(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    const cacheInfo = await AssetBundleManager.CheckVRChatCache(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    let inCache = false;
    if (cacheInfo.Item1 > 0) {
        inCache = true;
    }
    console.log(`InCache: ${inCache}`);
    const fullAssetLocation = `${assetLocation}\\__data`;
    console.log(fullAssetLocation);
    return fullAssetLocation;
}

export { getBundleLocation };
