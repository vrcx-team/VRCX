/**
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
 * @param {string} url
 * @returns {string}
 */
function replaceVrcPackageUrl(url) {
    if (!url) {
        return '';
    }
    return url.replace('https://api.vrchat.cloud/', 'https://vrchat.com/');
}

export { getFaviconUrl, replaceVrcPackageUrl };
