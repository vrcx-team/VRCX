import { request } from '../service/request';
import { useGroupStore, useNotificationStore } from '../stores';

/**
 * @returns {any}
 */
function getGalleryStore() {
    return useGroupStore();
}

const notificationReq = {
    /** @typedef {{
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
     * @return { Promise<{json: any, params}> }
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
            imageData: getGalleryStore().uploadImage
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
            imageData: getGalleryStore().uploadImage
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
            params,
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

    sendInviteResponsePhoto(params, inviteId) {
        return request(`invite/${inviteId}/response/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: getGalleryStore().uploadImage,
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
     * @return { Promise<{json: any, params}> }
     */
    acceptFriendRequestNotification(params) {
        return request(
            `auth/user/notifications/${params.notificationId}/accept`,
            {
                method: 'PUT'
            }
        )
            .then((json) => {
                const args = {
                    json,
                    params
                };
                useNotificationStore().handleNotificationAccept(args);
                return args;
            })
            .catch((err) => {
                // if friend request could not be found, delete it
                if (err && err.message && err.message.includes('404')) {
                    useNotificationStore().handleNotificationHide({ params });
                }
            });
    },

    /**
     * @param {{ notificationId: string }} params
     * @return { Promise<{json: any, params}> }
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
            useNotificationStore().handleNotificationHide(args);
            return args;
        });
    },

    /**
     * @param {{
     * notificationId: string,
     * responseType: string,
     * responseData: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    sendNotificationResponse(params) {
        return request(`notifications/${params.notificationId}/respond`, {
            method: 'POST',
            params
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

    // sendInviteGalleryPhoto(params, receiverUserId) {
    //     return request(`invite/${receiverUserId}/photo`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params,
    //             receiverUserId
    //         };
    //         API.$emit('NOTIFICATION:INVITE:GALLERYPHOTO:SEND', args);
    //         return args;
    //     });
    // },

    // API.clearNotifications = function () {
    //     return request('auth/user/notifications/clear', {
    //         method: 'PUT'
    //     }).then((json) => {
    //         var args = {
    //             json
    //         };
    //         // FIXME: NOTIFICATION:CLEAR 핸들링
    //         this.$emit('NOTIFICATION:CLEAR', args);
    //         return args;
    //     });
    // };
};
// #endregion

export default notificationReq;
