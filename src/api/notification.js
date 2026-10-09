import { request } from '../services/request';
import { useGalleryStore } from '../stores';

const notificationReq = {
    /**
     * @param {import('vrchat').GetNotifications['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification[]>;
     *     params: import('vrchat').GetNotifications['query'];
     * }>}
     */
    getNotifications(params) {
        return request('auth/user/notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };

            return args;
        });
    },

    /**
     * @param {import('vrchat').GetNotifications['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification[]>;
     *     params: import('vrchat').GetNotifications['query'];
     * }>}
     */
    getHiddenFriendRequests(params) {
        return request('auth/user/notifications', {
            method: 'GET',
            params: {
                type: 'friendRequest',
                hidden: true,
                ...params
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ n?: number; offset?: number; type?: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').NotificationV2[]>; params: any }>}
     */
    getNotificationsV2(params) {
        return request('notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean }} params
     * @param {string} receiverUserId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').SentNotification>;
     *     params: import('vrchat').InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean };
     *     receiverUserId: string;
     * }>}
     */
    sendInvite(params, receiverUserId) {
        return request(`invite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },
    /**
     * @param {import('vrchat').InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean }} params
     * @param {string} receiverUserId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').SentNotification>;
     *     params: import('vrchat').InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean };
     *     receiverUserId: string;
     * }>}
     */
    sendInvitePhoto(params, receiverUserId) {
        return request(`invite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').RequestInviteRequest & { platform?: string }} params
     * @param {string} receiverUserId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification>;
     *     params: import('vrchat').RequestInviteRequest & { platform?: string };
     *     receiverUserId: string;
     * }>}
     */
    sendRequestInvite(params, receiverUserId) {
        return request(`requestInvite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').RequestInviteRequest & { platform?: string }} params
     * @param {string} receiverUserId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification>;
     *     params: import('vrchat').RequestInviteRequest & { platform?: string };
     *     receiverUserId: string;
     * }>}
     */
    sendRequestInvitePhoto(params, receiverUserId) {
        return request(`requestInvite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').InviteResponse} params
     * @param {string} inviteId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification>;
     *     params: import('vrchat').InviteResponse;
     *     inviteId: string;
     * }>}
     */
    sendInviteResponse(params, inviteId) {
        return request(`invite/${inviteId}/response`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').InviteResponse} params
     * @param {string} inviteId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Notification>;
     *     params: import('vrchat').InviteResponse;
     *     inviteId: string;
     * }>}
     */
    sendInviteResponsePhoto(params, inviteId) {
        return request(`invite/${inviteId}/response/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage,
            inviteId
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    acceptFriendRequestNotification(params) {
        return request(`auth/user/notifications/${params.notificationId}/accept`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    hideNotification(params) {
        return request(`auth/user/notifications/${params.notificationId}/hide`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Notification>; params }>}
     */
    seeNotification(params) {
        return request(`auth/user/notifications/${params.notificationId}/see`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').NotificationV2>; params }>}
     */
    seeNotificationV2(params) {
        return request(`notifications/${params.notificationId}/see`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string } & import('vrchat').RespondNotificationV2Request} params
     * @returns {Promise<{
     *     json: string;
     *     params: { notificationId: string } & import('vrchat').RespondNotificationV2Request;
     * }>}
     */
    sendNotificationResponse(params) {
        return request(`notifications/${params.notificationId}/respond`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {string} notificationId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { notificationId: string };
     * }>}
     */
    hideNotificationV2(notificationId) {
        return request(`notifications/${notificationId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params: {
                    notificationId
                }
            };
            return args;
        });
    }
};

export default notificationReq;
