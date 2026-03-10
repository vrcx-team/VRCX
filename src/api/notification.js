import { request } from '../services/request';
import { useGalleryStore } from '../stores';

const notificationReq = {
    /**
     * @typedef {{
     *      n: number,
     *      offset: number,
     *      sent: boolean,
     *      type: string,
     *      //  (ISO8601 or 'five_minutes_ago')
     *      after: 'five_minutes_ago' | (string & {})
     * }} NotificationFetchParameter
     */

    /**
     *
     * @param {NotificationFetchParameter} params
     * @returns {Promise<{json: any, params}>}
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
     * @param {{n?: number, offset?: number}} params
     * @returns {Promise<{json: any, params: any}>}
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
     * @param {{n?: number, offset?: number, type?: string}} params
     * @returns {Promise<{json: any, params: any}>}
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
     * string that represents valid serialized JSON of T's value
     * @template T=any
     * @typedef {string} JsonString
     */

    /**
     * @param {{
     * receiverUserId?: string,
     * type?: string,
     * message?: string,
     * seen?: boolean,
     * details?: JsonString<any>,
     * instanceId?: string,
     * worldId?: string,
     * worldName?: string,
     * messageSlot?: string,
     * rsvp?: boolean,
     *  }} params
     * @param receiverUserId
     * @returns { Promise<{json: any, params}> }
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
     * @returns { Promise<{json: any, params}> }
     */
    acceptFriendRequestNotification(params) {
        return request(
            `auth/user/notifications/${params.notificationId}/accept`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns { Promise<{json: any, params}> }
     */
    hideNotification(params) {
        return request(
            `auth/user/notifications/${params.notificationId}/hide`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @returns { Promise<{json: any, params}> }
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
     * @returns { Promise<{json: any, params}> }
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
     * @param {{
     * notificationId: string,
     * responseType: string,
     * responseData: string
     * }} params
     * @returns { Promise<{json: any, params}> }
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
