import { HueToHex } from './base/ui';
import { convertFileUrlToImageUrl } from './common';
import { languageMappings } from '../constants';
import { removeEmojis } from './base/string';
import { timeToText } from './base/format';

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
            style.active = true;
        } else {
            // Offline
            style.offline = true;
        }
    } else if (user.state === 'active') {
        // Active
        style.active = true;
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
        user.$platform !== 'web'
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
 *
 * @param {object} ref
 * @returns {string}
 */
function userOnlineFor(ref) {
    if (ref.state === 'online' && ref.$online_for) {
        return timeToText(Date.now() - ref.$online_for);
    } else if (ref.state === 'active' && ref.$active_for) {
        return timeToText(Date.now() - ref.$active_for);
    } else if (ref.$offline_for) {
        return timeToText(Date.now() - ref.$offline_for);
    }
    return '-';
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
    removeEmojis,
    userStatusClass,
    statusClass,
    userImage,
    userImageFull,
    parseUserUrl,
    userOnlineFor,
    findUserByDisplayName
};
