import { extractFileId, extractFileVersion } from '../../shared/utils';
import {
    getNotificationMessage,
    toNotificationText
} from '../../shared/utils/notificationMessage';

/**
 * Creates the overlay dispatch functions for the Notification store.
 * @param {object} deps
 * @param {Function} deps.getUserIdFromNoty
 * @param {object} deps.queryRequest
 * @param {object} deps.notificationsSettingsStore
 * @param {object} deps.advancedSettingsStore
 * @param {object} deps.appearanceSettingsStore
 * @returns {object} The overlay dispatch functions
 */
export function createOverlayDispatch({
    getUserIdFromNoty,
    queryRequest,
    notificationsSettingsStore,
    advancedSettingsStore,
    appearanceSettingsStore
}) {
    /**
     *
     * @param {object} noty
     * @returns
     */
    async function notySaveImage(noty) {
        const imageUrl = await notyGetImage(noty);
        let fileId = extractFileId(imageUrl);
        let fileVersion = extractFileVersion(imageUrl);
        let imageLocation = '';
        try {
            if (fileId && fileVersion) {
                imageLocation = await AppApi.GetImage(
                    imageUrl,
                    fileId,
                    fileVersion
                );
            } else if (imageUrl && imageUrl.startsWith('http')) {
                fileVersion = imageUrl.split('/').pop(); // 1416226261.thumbnail-500.png
                fileId = fileVersion.split('.').shift(); // 1416226261
                imageLocation = await AppApi.GetImage(
                    imageUrl,
                    fileId,
                    fileVersion
                );
            }
        } catch (err) {
            console.error(imageUrl, err);
        }
        return imageLocation;
    }

    /**
     *
     * @param noty
     * @param message
     * @param image
     */
    function displayDesktopToast(noty, message, image) {
        const result = getNotificationMessage(noty, message);
        if (result) {
            desktopNotification(result.title, result.body, image);
        }
    }

    /**
     *
     * @param {string} noty
     * @param {string} message
     * @param {string} imageFile
     */
    function displayOverlayNotification(noty, message, imageFile) {
        let image = '';
        if (imageFile) {
            image = `file:///${imageFile}`;
        }
        AppApi.ExecuteVrOverlayFunction(
            'playNoty',
            JSON.stringify({ noty, message, image })
        );
    }

    /**
     *
     * @param {any} noty
     * @param {string} message
     * @param {string} image
     */
    function displayXSNotification(noty, message, image) {
        const result = getNotificationMessage(noty, message);
        if (!result) return;
        const timeout = Math.floor(
            parseInt(
                notificationsSettingsStore.notificationTimeout.toString(),
                10
            ) / 1000
        );
        const opacity =
            parseFloat(advancedSettingsStore.notificationOpacity.toString()) /
            100;
        const text = toNotificationText(result.title, result.body, noty.type);
        AppApi.XSNotification('VRCX', text, timeout, opacity, image);
    }

    /**
     *
     * @param playOvrtHudNotifications
     * @param playOvrtWristNotifications
     * @param noty
     * @param message
     * @param image
     */
    function displayOvrtNotification(
        playOvrtHudNotifications,
        playOvrtWristNotifications,
        noty,
        message,
        image
    ) {
        const result = getNotificationMessage(noty, message);
        if (!result) return;
        const timeout = Math.floor(
            parseInt(
                notificationsSettingsStore.notificationTimeout.toString(),
                10
            ) / 1000
        );
        const opacity =
            parseFloat(advancedSettingsStore.notificationOpacity.toString()) /
            100;
        const text = toNotificationText(result.title, result.body, noty.type);
        AppApi.OVRTNotification(
            playOvrtHudNotifications,
            playOvrtWristNotifications,
            'VRCX',
            text,
            timeout,
            opacity,
            image
        );
    }

    /**
     *
     * @param {object} noty
     * @returns
     */
    async function notyGetImage(noty) {
        let imageUrl = '';
        const userId = getUserIdFromNoty(noty);

        if (noty.thumbnailImageUrl) {
            imageUrl = noty.thumbnailImageUrl;
        } else if (noty.details && noty.details.imageUrl) {
            imageUrl = noty.details.imageUrl;
        } else if (noty.imageUrl) {
            imageUrl = noty.imageUrl;
        } else if (userId && !userId.startsWith('grp_')) {
            imageUrl = await queryRequest
                .fetch('user', {
                    userId
                })
                .catch((err) => {
                    console.error(err);
                    return '';
                })
                .then((args) => {
                    if (!args.json) {
                        return '';
                    }
                    if (
                        appearanceSettingsStore.displayVRCPlusIconsAsAvatar &&
                        args.json.userIcon
                    ) {
                        return args.json.userIcon;
                    }
                    if (args.json.profilePicOverride) {
                        return args.json.profilePicOverride;
                    }
                    return args.json.currentAvatarThumbnailImageUrl;
                });
        }
        return imageUrl;
    }

    /**
     *
     * @param {string} displayName
     * @param {string} message
     * @param {string} image
     */
    function desktopNotification(displayName, message, image) {
        if (WINDOWS) {
            AppApi.DesktopNotification(displayName, message, image);
        } else {
            window.electron.desktopNotification(displayName, message, image);
        }
    }

    return {
        notySaveImage,
        displayDesktopToast,
        displayOverlayNotification,
        displayXSNotification,
        displayOvrtNotification,
        notyGetImage,
        desktopNotification
    };
}
