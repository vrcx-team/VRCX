import { useAppearanceSettingsStore, useUserStore } from '../../stores';
import { languageMappings } from '../constants';
import { timeToText } from './base/format';
import { HueToHex } from './base/ui';
import { convertFileUrlToImageUrl } from './common';

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
 * @returns
 */
async function getNameColour(userId) {
    const hue = await AppApi.GetColourFromUserID(userId);
    return HueToHex(hue);
}

/**
 *
 * @param {string} text
 * @returns
 */
function removeEmojis(text) {
    if (!text) {
        return '';
    }
    return text
        .replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 *
 * @param {object} user
 * @param {boolean} pendingOffline
 * @returns
 */
function userStatusClass(user, pendingOffline = false) {
    const userStore = useUserStore();
    const style = {};
    if (typeof user === 'undefined') {
        return style;
    }
    let id = '';
    if (user.id) {
        id = user.id;
    } else if (user.userId) {
        id = user.userId;
    }
    if (id === userStore.currentUser.id) {
        return statusClass(user.status);
    }
    if (!user.isFriend) {
        return style;
    }
    if (pendingOffline) {
        // Pending offline
        style.offline = true;
    } else if (
        user.status !== 'active' &&
        user.location === 'private' &&
        user.state === '' &&
        id &&
        !userStore.currentUser.onlineFriends.includes(id)
    ) {
        // temp fix
        if (userStore.currentUser.activeFriends.includes(id)) {
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
    const style = {};
    if (typeof status !== 'undefined') {
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
        }
    }
    return style;
}

/**
 * @param {object} user - User Ref Object
 * @param {boolean} isIcon - is use for icon (about 40x40)
 * @param {string} resolution - requested icon resolution (default 128),
 * @param {boolean} isUserDialogIcon - is use for user dialog icon
 * @returns {string} - img url
 */
function userImage(
    user,
    isIcon = false,
    resolution = '128',
    isUserDialogIcon = false
) {
    const appAppearanceSettingsStore = useAppearanceSettingsStore();
    if (!user) {
        return '';
    }
    if (
        (isUserDialogIcon && user.userIcon) ||
        (appAppearanceSettingsStore.displayVRCPlusIconsAsAvatar &&
            user.userIcon)
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
 * @returns {string|*}
 */
function userImageFull(user) {
    const appAppearanceSettingsStore = useAppearanceSettingsStore();
    if (
        appAppearanceSettingsStore.displayVRCPlusIconsAsAvatar &&
        user.userIcon
    ) {
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
 * @param {object} ctx
 * @returns {string}
 */
function userOnlineFor(ctx) {
    if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
        return timeToText(Date.now() - ctx.ref.$online_for);
    } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
        return timeToText(Date.now() - ctx.ref.$active_for);
    } else if (ctx.ref.$offline_for) {
        return timeToText(Date.now() - ctx.ref.$offline_for);
    }
    return '-';
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
    userOnlineFor
};
