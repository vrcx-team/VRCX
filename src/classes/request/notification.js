// #region | API: Notification

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
        return window.API.call('auth/user/notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:LIST', args);
            return args;
        });
    },

    getHiddenFriendRequests(params) {
        return window.API.call('auth/user/notifications', {
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
            window.API.$emit('NOTIFICATION:LIST:HIDDEN', args);
            return args;
        });
    },

    getNotificationsV2(params) {
        return window.API.call('notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:V2:LIST', args);
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
     * receiverUserId: string,
     * type: string,
     * message: string,
     * seen: boolean,
     * details: JsonString<any>
     *  }} params
     * @param receiverUserId
     * @return { Promise<{json: any, params}> }
     */
    sendInvite(params, receiverUserId) {
        return window.API.call(`invite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            window.API.$emit('NOTIFICATION:INVITE:SEND', args);
            return args;
        });
    },
    sendInvitePhoto(params, receiverUserId) {
        return window.API.call(`invite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: window.$app.uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            window.API.$emit('NOTIFICATION:INVITE:PHOTO:SEND', args);
            return args;
        });
    },

    sendRequestInvite(params, receiverUserId) {
        return window.API.call(`requestInvite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            window.API.$emit('NOTIFICATION:REQUESTINVITE:SEND', args);
            return args;
        });
    },

    sendRequestInvitePhoto(params, receiverUserId) {
        return window.API.call(`requestInvite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: window.$app.uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            window.API.$emit('NOTIFICATION:REQUESTINVITE:PHOTO:SEND', args);
            return args;
        });
    },

    sendInviteResponse(params, inviteId) {
        return window.API.call(`invite/${inviteId}/response`, {
            method: 'POST',
            params,
            inviteId
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            window.API.$emit('INVITE:RESPONSE:SEND', args);
            return args;
        });
    },

    sendInviteResponsePhoto(params, inviteId) {
        return window.API.call(`invite/${inviteId}/response/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: window.$app.uploadImage,
            inviteId
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            window.API.$emit('INVITE:RESPONSE:PHOTO:SEND', args);
            return args;
        });
    },

    /**
     * @param {{ notificationId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    acceptFriendRequestNotification(params) {
        return window.API.call(
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
                window.API.$emit('NOTIFICATION:ACCEPT', args);
                return args;
            })
            .catch((err) => {
                // if friend request could not be found, delete it
                if (err && err.message && err.message.includes('404')) {
                    window.API.$emit('NOTIFICATION:HIDE', { params });
                }
            });
    },

    /**
     * @param {{ notificationId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    hideNotification(params) {
        return window.API.call(
            `auth/user/notifications/${params.notificationId}/hide`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:HIDE', args);
            return args;
        });
    },

    // ------------------- need to test -------------------

    /**
     * @param {{
     * notificationId: string,
     * responseType: string,
     * responseData: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    sendNotificationResponse(params) {
        return window.API.call(
            `notifications/${params.notificationId}/respond`,
            {
                method: 'POST',
                params
            }
        )
            .then((json) => {
                const args = {
                    json,
                    params
                };
                window.API.$emit('NOTIFICATION:RESPONSE', args);
                return args;
            })
            .catch((err) => {
                // TODO: need to test
                // something went wrong, lets assume it's already expired
                window.API.$emit('NOTIFICATION:HIDE', { params });
                notificationReq.hideNotificationV2(params.notificationId);
                throw err;
            });
    },
    // use in sendNotificationResponse
    hideNotificationV2(notificationId) {
        return window.API.call(`notifications/${notificationId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params: {
                    notificationId
                }
            };
            window.API.$emit('NOTIFICATION:V2:HIDE', args);
            return args;
        });
    }

    // ------------------ look like no place use these requests ------------------

    // sendInviteGalleryPhoto(params, receiverUserId) {
    //     return window.API.call(`invite/${receiverUserId}/photo`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params,
    //             receiverUserId
    //         };
    //         window.API.$emit('NOTIFICATION:INVITE:GALLERYPHOTO:SEND', args);
    //         return args;
    //     });
    // },

    // API.clearNotifications = function () {
    //     return this.call('auth/user/notifications/clear', {
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
