import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from './fileUtils';
import { escapeTag, replaceBioSymbols } from './base/string';
import { getFaviconUrl, replaceVrcPackageUrl } from './urlUtils';
import { AppDebug } from '../../services/appConfig.js';
import { getAvailablePlatforms } from './platformUtils';

/**
 *
 * @param {string} url
 * @param {number} resolution
 * @param endpointDomain
 * @returns {string}
 */
function convertFileUrlToImageUrl(
    url,
    resolution = 128,
    endpointDomain = AppDebug.endpointDomain
) {
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
        return `${endpointDomain}/image/file_${fileId}/${version}/${resolution}`;
    }
    // no match return origin url
    return url;
}

/**
 *
 * @param func
 * @param delay
 */
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

// Re-export from appActions and cacheCoordinator for backward compatibility
export {
    downloadAndSaveJson,
    copyToClipboard,
    openExternalLink,
    openDiscordProfile,
    openFolderGeneric
} from './appActions';

export {
    deleteVRChatCache,
    checkVRChatCache,
    getBundleDateSize
} from '../../coordinators/cacheCoordinator';

export {
    getAvailablePlatforms,
    getFaviconUrl,
    convertFileUrlToImageUrl,
    replaceVrcPackageUrl,
    extractFileId,
    extractFileVersion,
    extractVariantVersion,
    replaceBioSymbols,
    debounce
};
