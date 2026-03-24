import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import {
    useAuthStore,
    useAvatarStore,
    useInstanceStore,
    useWorldStore
} from '../stores';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../shared/utils/fileUtils';
import { compareUnityVersion } from '../shared/utils/avatar';
import { queryRequest } from '../api';

async function deleteVRChatCache(ref) {
    const authStore = useAuthStore();
    const sdkUnityVersion = authStore.cachedConfig.sdkUnityVersion;
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
            compareUnityVersion(unityPackage.unitySortNumber, sdkUnityVersion)
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
    const authStore = useAuthStore();
    const sdkUnityVersion = authStore.cachedConfig.sdkUnityVersion;
    let assetUrl = '';
    let variant = '';
    for (let i = ref.unityPackages.length - 1; i > -1; i--) {
        const unityPackage = ref.unityPackages[i];
        if (unityPackage.variant && unityPackage.variant !== 'security') {
            continue;
        }
        if (
            unityPackage.platform === 'standalonewindows' &&
            compareUnityVersion(unityPackage.unitySortNumber, sdkUnityVersion)
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
 * @param {object} ref
 * @returns {Promise<object>}
 */
async function getBundleDateSize(ref) {
    const authStore = useAuthStore();
    const sdkUnityVersion = authStore.cachedConfig.sdkUnityVersion;
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
        if (
            !compareUnityVersion(unityPackage.unitySortNumber, sdkUnityVersion)
        ) {
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

export { deleteVRChatCache, checkVRChatCache, getBundleDateSize };
