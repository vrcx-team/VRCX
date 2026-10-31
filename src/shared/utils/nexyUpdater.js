/**
 * Release handling for Nexy's GitHub updater. Never accept files from the VRCX release feed.
 */

export function getNexyAsset(assets, platform, arch = 'x64') {
    if (!Array.isArray(assets)) {
        return { downloadUrl: '', hashString: '', size: 0 };
    }
    for (const asset of assets) {
        if (
            asset?.state !== 'uploaded' ||
            !asset.browser_download_url ||
            !Number.isSafeInteger(asset.size) ||
            asset.size <= 0
        ) {
            continue;
        }
        const name = asset.name || '';
        const isWindowsSetup = platform === 'win32' && /^Nexy_.+_Setup_x64\.exe$/i.test(name);
        const isLinuxAppImage =
            platform === 'linux' &&
            ['x64', 'arm64'].includes(arch) &&
            name.endsWith(`_${arch}.AppImage`) &&
            /^Nexy_.+_(x64|arm64)\.AppImage$/i.test(name);
        if (!isWindowsSetup && !isLinuxAppImage) {
            continue;
        }
        const url = asset.browser_download_url;
        if (!url.startsWith('https://github.com/valzzu/Nexy/releases/download/')) {
            continue;
        }
        return {
            downloadUrl: url,
            hashString:
                typeof asset.digest === 'string' && /^sha256:[0-9a-f]{64}$/i.test(asset.digest)
                    ? asset.digest.substring(7)
                    : '',
            size: asset.size
        };
    }
    return { downloadUrl: '', hashString: '', size: 0 };
}

export function getNexyReleases(data, channel, platform, arch) {
    if (!Array.isArray(data)) {
        return [];
    }
    return data
        .filter(
            (release) =>
                release &&
                !release.draft &&
                Boolean(release.prerelease) === (channel === 'Nightly') &&
                release.published_at &&
                (release.tag_name || release.name) &&
                getNexyAsset(release.assets, platform, arch).downloadUrl
        )
        .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

function parseVersion(value) {
    const match = String(value || '').match(
        /^(?:Nexy\s+)?(?:Nightly\s+)?v?(\d{4})\.(\d{1,2})\.(\d{1,2})(?:T(\d{1,2})(?:[.:](\d{2}))?)?/i
    );
    return match ? match.slice(1).map((part) => Number(part || 0)) : null;
}

export function isNexyReleaseNewer(release, currentVersion) {
    const next = parseVersion(release?.tag_name || release?.name);
    const current = parseVersion(currentVersion);
    if (!next || !current) {
        // A release with an unknown version format must never trigger an automatic install.
        return false;
    }
    for (let i = 0; i < next.length; i++) {
        if (next[i] !== current[i]) {
            return next[i] > current[i];
        }
    }
    return false;
}
