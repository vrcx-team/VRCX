const miscReq = {
    getBundles(fileId) {
        return window.API.call(`file/${fileId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    saveNote(params) {
        return window.API.call('userNotes', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTE', args);
            return args;
        });
    },

    /**
     * @param {{
     *       userId: string,
     *       contentType: string,
     *       reason: string,
     *       type: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    reportUser(params) {
        return window.API.call(`feedback/${params.userId}/user`, {
            method: 'POST',
            params: {
                contentType: params.contentType,
                reason: params.reason,
                type: params.type
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FEEDBACK:REPORT:USER', args);
            return args;
        });
    },

    /**
     * @param {{
     *       fileId: string,
     *       version: number
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getFileAnalysis(params) {
        return window.API.call(
            `analysis/${params.fileId}/${params.version}/${params.variant}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FILE:ANALYSIS', args);
            return args;
        });
    },

    getVRChatCredits() {
        return window.API.call(`user/${window.API.currentUser.id}/balance`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            window.API.$emit('VRCCREDITS', args);
            return args;
        });
    },

    /**
     * @param {{
     *       location: string,
     *       hardClose: boolean
     * }} params
     * @returns {Promise<{json: any, params}>}
     */
    closeInstance(params) {
        return window.API.call(`instances/${params.location}`, {
            method: 'DELETE',
            params: {
                hardClose: params.hardClose ?? false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('INSTANCE:CLOSE', args);
            return args;
        });
    },

    /**
     * @param {{
     *       worldId: string
     * }} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteWorldPersistData(params) {
        return window.API.call(
            `users/${window.API.currentUser.id}/${params.worldId}/persist`,
            {
                method: 'DELETE'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('WORLD:PERSIST:DELETE', args);
            return args;
        });
    },

    /**
     * @param {{
     *       worldId: string
     * }} params
     * @returns {Promise<{json: any, params}>}
     */
    hasWorldPersistData(params) {
        return window.API.call(
            `users/${window.API.currentUser.id}/${params.worldId}/persist/exists`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('WORLD:PERSIST:HAS', args);
            return args;
        });
    },

    updateBadge(params) {
        return window.API.call(
            `users/${window.API.currentUser.id}/badges/${params.badgeId}`,
            {
                method: 'PUT',
                params: {
                    userId: window.API.currentUser.id,
                    badgeId: params.badgeId,
                    hidden: params.hidden,
                    showcased: params.showcased
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('BADGE:UPDATE', args);
            return args;
        });
    }
};

export default miscReq;
