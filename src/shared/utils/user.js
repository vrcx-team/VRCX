import { HueToHex } from './base/ui';
import { convertFileUrlToImageUrl } from './common';
import { languageMappings } from '../constants';
import { removeEmojis } from './base/string';

const THEME_COLOR_LIMITS = Object.freeze({
    darkMinLuminance: 0.016,
    lightMaxLuminance: 0.93
});

/**
 *
 * @param {object} ctx
 * @returns {string?}
 */
function userOnlineForTimestamp(ctx) {
    if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
        return new Date(ctx.ref.$online_for).toJSON();
    } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
        return new Date(ctx.ref.$active_for).toJSON();
    } else if (ctx.ref.$offline_for) {
        return new Date(ctx.ref.$offline_for).toJSON();
    }
    return null;
}

/**
 *
 * @param {string} language
 * @returns
 */
function languageClass(language) {
    const style = {};
    const mapping = languageMappings[language];
    if (typeof mapping !== 'undefined') {
        style[mapping] = true;
    } else {
        style.unknown = true;
    }
    return style;
}

/**
 *
 * @param {string} userId
 * @param {boolean} isDarkMode
 * @returns
 */
async function getNameColour(userId, isDarkMode) {
    const hue = await AppApi.GetColourFromUserID(userId);
    return HueToHex(hue, isDarkMode);
}

/**
 * @param {string} value
 * @returns {string | null}
 */
function normalizeProfileHex(value) {
    const hex = String(value || '')
        .trim()
        .replace(/^#/, '')
        .toLowerCase();
    if (!/^[0-9a-f]{6}$/.test(hex)) {
        return null;
    }
    return `#${hex}`;
}

/**
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number } | null}
 */
function hexToRgb(hex) {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!match) {
        return null;
    }
    const value = match[1];
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16)
    };
}

/**
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {string}
 */
function rgbToHex(rgb) {
    const toHex = (value) => {
        const n = Math.max(0, Math.min(255, Math.round(value)));
        return n.toString(16).padStart(2, '0');
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {number}
 */
function getRelativeLuminance(rgb) {
    const channel = (value) => {
        const normalized = value / 255;
        if (normalized <= 0.03928) {
            return normalized / 12.92;
        }
        return ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const r = channel(rgb.r);
    const g = channel(rgb.g);
    const b = channel(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {{ r: number, g: number, b: number }} from
 * @param {{ r: number, g: number, b: number }} to
 * @param {number} weight
 * @returns {{ r: number, g: number, b: number }}
 */
function mixRgb(from, to, weight) {
    return {
        r: from.r + (to.r - from.r) * weight,
        g: from.g + (to.g - from.g) * weight,
        b: from.b + (to.b - from.b) * weight
    };
}

/**
 * @param {string} colorValue
 * @param {string} fallback
 * @param {boolean} isDarkMode
 * @returns {string}
 */
function getReadableProfileThemeColor(colorValue, fallback, isDarkMode) {
    const normalized = normalizeProfileHex(colorValue);
    if (!normalized) {
        return fallback;
    }
    let rgb = hexToRgb(normalized);
    if (!rgb) {
        return fallback;
    }

    const luminanceThreshold = isDarkMode
        ? THEME_COLOR_LIMITS.darkMinLuminance
        : THEME_COLOR_LIMITS.lightMaxLuminance;
    let luminance = getRelativeLuminance(rgb);
    const requiresAdjustment = isDarkMode
        ? luminance < luminanceThreshold
        : luminance > luminanceThreshold;
    if (!requiresAdjustment) {
        return normalized;
    }

    // Nudge only extreme values so profile colors remain recognizable.
    const targetRgb = isDarkMode
        ? { r: 255, g: 255, b: 255 }
        : { r: 0, g: 0, b: 0 };
    for (let i = 0; i < 14; i++) {
        rgb = mixRgb(rgb, targetRgb, 0.18);
        luminance = getRelativeLuminance(rgb);
        if (
            (isDarkMode && luminance >= luminanceThreshold) ||
            (!isDarkMode && luminance <= luminanceThreshold)
        ) {
            break;
        }
    }
    return rgbToHex(rgb);
}

/**
 * @param {string} colorValue
 * @returns {string}
 */
function invertHexColor(colorValue) {
    const normalized = normalizeProfileHex(colorValue);
    if (!normalized) {
        return colorValue;
    }
    const rgb = hexToRgb(normalized);
    if (!rgb) {
        return colorValue;
    }
    const invertedRgb = {
        r: 255 - rgb.r,
        g: 255 - rgb.g,
        b: 255 - rgb.b
    };
    return rgbToHex(invertedRgb);
}

/**
 *
 * @param {object} user
 * @param {boolean} pendingOffline
 * @param {object} currentUser - current user object from useUserStore
 * @returns
 */
function userStatusClass(user, pendingOffline = false, currentUser) {
    const style = {
        'status-icon': true
    };
    if (typeof user === 'undefined') {
        return null;
    }
    let id = '';
    if (user.id) {
        id = user.id;
    } else if (user.userId) {
        id = user.userId;
    }
    if (id === currentUser?.id) {
        const platform = currentUser.presence?.platform;
        return {
            ...style,
            ...statusClass(user.status),
            mobile:
                platform &&
                platform !== 'standalonewindows' &&
                platform !== 'web'
        };
    }
    if (!user.isFriend) {
        return null;
    }
    if (pendingOffline) {
        // Pending offline
        style.offline = true;
    } else if (
        user.status !== 'active' &&
        user.location === 'private' &&
        user.state === '' &&
        id &&
        !(currentUser?.onlineFriends || []).includes(id)
    ) {
        // temp fix
        if ((currentUser?.activeFriends || []).includes(id)) {
            // Active
            if (user.status === 'join me') {
                style['active-joinme'] = true;
            } else if (user.status === 'ask me') {
                style['active-askme'] = true;
            } else if (user.status === 'busy') {
                style['active-busy'] = true;
            } else {
                style.active = true;
            }
        } else {
            // Offline
            style.offline = true;
        }
    } else if (user.state === 'active') {
        // Active
        if (user.status === 'join me') {
            style['active-joinme'] = true;
        } else if (user.status === 'ask me') {
            style['active-askme'] = true;
        } else if (user.status === 'busy') {
            style['active-busy'] = true;
        } else {
            style.active = true;
        }
    } else if (user.location === 'offline') {
        // Offline
        style.offline = true;
    } else if (user.status === 'active') {
        // Online
        style.online = true;
    } else if (user.status === 'join me') {
        // Join Me
        style.joinme = true;
    } else if (user.status === 'ask me') {
        // Ask Me
        style.askme = true;
    } else if (user.status === 'busy') {
        // Do Not Disturb
        style.busy = true;
    } else {
        // Unknown status
        return null;
    }
    if (
        user.$platform &&
        user.$platform !== 'standalonewindows' &&
        user.$platform !== 'web' &&
        user.state === 'online'
    ) {
        style.mobile = true;
    }
    return style;
}

/**
 *
 * @param {string} status
 * @returns {object}
 */
function statusClass(status) {
    if (typeof status === 'undefined') {
        return null;
    }
    const style = {
        'status-icon': true
    };
    if (status === 'active') {
        // Online
        style.online = true;
    } else if (status === 'join me') {
        // Join Me
        style.joinme = true;
    } else if (status === 'ask me') {
        // Ask Me
        style.askme = true;
    } else if (status === 'busy') {
        // Do Not Disturb
        style.busy = true;
    } else {
        return null;
    }
    return style;
}

/**
 * @param {object} user - User Ref Object
 * @param {boolean} isIcon - is use for icon (about 40x40)
 * @param {string} resolution - requested icon resolution (default 128),
 * @param {boolean} isUserDialogIcon - is use for user dialog icon
 * @param {boolean} displayVRCPlusIconsAsAvatar - from appearance settings store
 * @returns {string} - img url
 */
function userImage(
    user,
    isIcon = false,
    resolution = '128',
    isUserDialogIcon = false,
    displayVRCPlusIconsAsAvatar = false
) {
    if (!user) {
        return '';
    }
    if (
        (isUserDialogIcon && user.userIcon) ||
        (displayVRCPlusIconsAsAvatar && user.userIcon)
    ) {
        if (isIcon) {
            return convertFileUrlToImageUrl(user.userIcon);
        }
        return user.userIcon;
    }

    if (user.profilePicOverrideThumbnail) {
        if (isIcon) {
            return user.profilePicOverrideThumbnail.replace(
                '/256',
                `/${resolution}`
            );
        }
        return user.profilePicOverrideThumbnail;
    }
    if (user.profilePicOverride) {
        return user.profilePicOverride;
    }
    if (user.thumbnailUrl) {
        return user.thumbnailUrl;
    }
    if (user.currentAvatarThumbnailImageUrl) {
        if (isIcon) {
            return user.currentAvatarThumbnailImageUrl.replace(
                '/256',
                `/${resolution}`
            );
        }
        return user.currentAvatarThumbnailImageUrl;
    }
    if (user.currentAvatarImageUrl) {
        if (isIcon) {
            return convertFileUrlToImageUrl(user.currentAvatarImageUrl);
        }
        return user.currentAvatarImageUrl;
    }
    return '';
}

/**
 *
 * @param {object} user
 * @param {boolean} displayVRCPlusIconsAsAvatar - from appearance settings store
 * @returns {string|*}
 */
function userImageFull(user, displayVRCPlusIconsAsAvatar = false) {
    if (!user) {
        return '';
    }
    if (displayVRCPlusIconsAsAvatar && user.userIcon) {
        return user.userIcon;
    }
    if (user.profilePicOverride) {
        return user.profilePicOverride;
    }
    return user.currentAvatarImageUrl;
}

/**
 *
 * @param {string} user
 * @returns {*|string}
 */
function parseUserUrl(user) {
    const url = new URL(user);
    const urlPath = url.pathname;
    if (urlPath.substring(5, 11) === '/user/') {
        const userId = urlPath.substring(11);
        return userId;
    }
}

/**
 * Find a user object from cachedUsers by displayName.
 * @param {Map} cachedUsers
 * @param {string} displayName
 * @param {Map<string, Set<string>>} [cachedUserIdsByDisplayName]
 * @returns {object|undefined}
 */
function findUserByDisplayName(
    cachedUsers,
    displayName,
    cachedUserIdsByDisplayName
) {
    const indexedUserIds = cachedUserIdsByDisplayName?.get(displayName);
    if (indexedUserIds) {
        for (const userId of indexedUserIds) {
            const ref = cachedUsers.get(userId);
            if (ref?.displayName === displayName) {
                return ref;
            }
        }
    }
    for (const ref of cachedUsers.values()) {
        if (ref.displayName === displayName) {
            return ref;
        }
    }
    return undefined;
}

export {
    userOnlineForTimestamp,
    languageClass,
    getNameColour,
    getReadableProfileThemeColor,
    invertHexColor,
    removeEmojis,
    userStatusClass,
    statusClass,
    userImage,
    userImageFull,
    parseUserUrl,
    findUserByDisplayName
};
