import { request } from '../service/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const miscReq = {
    getFile(params) {
        return request(`file/${params.fileId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    saveNote(params) {
        return request('userNotes', {
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
     * @param {{
     *       userId: string,
     *       contentType: string,
     *       reason: string,
     *       type: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    reportUser(params) {
        return request(`feedback/${params.userId}/user`, {
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
            return args;
        });
    },

    /**
     * @param {{
     *       fileId: string,
     *       version: number,
     *       variant: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getFileAnalysis(params) {
        return request(
            `analysis/${params.fileId}/${params.version}/${params.variant}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getVRChatCredits() {
        return request(`user/${getCurrentUserId()}/balance`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
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
        return request(`instances/${params.location}`, {
            method: 'DELETE',
            params: {
                hardClose: params.hardClose ?? false
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
     * @param {{
     *       worldId: string
     * }} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteWorldPersistData(params) {
        return request(
            `users/${getCurrentUserId()}/${params.worldId}/persist`,
            {
                method: 'DELETE'
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
     * @param {{
     *       worldId: string
     * }} params
     * @returns {Promise<{json: any, params}>}
     */
    hasWorldPersistData(params) {
        return request(
            `users/${getCurrentUserId()}/${params.worldId}/persist/exists`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    updateBadge(params) {
        return request(`users/${getCurrentUserId()}/badges/${params.badgeId}`, {
            method: 'PUT',
            params: {
                userId: getCurrentUserId(),
                badgeId: params.badgeId,
                hidden: params.hidden,
                showcased: params.showcased
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getVisits() {
        return request('visits', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    deleteFile(fileId) {
        return request(`file/${fileId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                fileId
            };
            return args;
        });
    },

    /**
     * @params {{
        userId: string,
        emojiId: string
     }} params
     * @returns {Promise<{json: any, params}>}
     */
    sendBoop(params) {
        return request(`users/${params.userId}/boop`, {
            method: 'POST',
            params: {
                emojiId: params.emojiId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default miscReq;
