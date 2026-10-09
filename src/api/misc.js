import { queryClient, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const miscReq = {
    /**
     * @param {{ fileId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').File>; params: { fileId: string } }>}
     */
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

    /**
     * @param {import('vrchat').UpdateUserNoteRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').UpdateUserNoteResponse>;
     *     params: import('vrchat').UpdateUserNoteRequest;
     * }>}
     */
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
     *     userId: string;
     *     contentType: string;
     *     reason: string;
     *     type: string;
     * }} params
     * @returns {Promise<{ json: any; params }>}
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
     *     fileId: string;
     *     version: number;
     *     variant: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').FileAnalysis>; params }>}
     */
    getFileAnalysis(params) {
        return request(`analysis/${params.fileId}/${params.version}/${params.variant}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Balance> }>}
     */
    getVRChatCredits() {
        return request(`user/${getCurrentUserId()}/economy/balance`, {
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
     *     location: string;
     *     hardClose: boolean;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Instance>; params }>}
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
     *     worldId: string;
     * }} params
     * @returns {Promise<{ json: unknown; params }>}
     */
    deleteWorldPersistData(params) {
        return request(`users/${getCurrentUserId()}/${params.worldId}/persist`, {
            method: 'DELETE'
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
     *     worldId: string;
     * }} params
     * @returns {Promise<{ json: unknown; params }>}
     */
    hasWorldPersistData(params) {
        return request(`users/${getCurrentUserId()}/${params.worldId}/persist/exists`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ badgeId: string } & import('vrchat').UpdateUserBadgeRequest} params
     * @returns {Promise<{ json: unknown; params: { badgeId: string } & import('vrchat').UpdateUserBadgeRequest }>}
     */
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

    /**
     * @returns {Promise<{ json: number }>}
     */
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

    /**
     * @param {string} fileId
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').File>; fileId: string }>}
     */
    deleteFile(fileId) {
        return request(`file/${fileId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                fileId
            };
            queryClient.removeQueries({
                queryKey: queryKeys.file(fileId),
                exact: true
            });
            return args;
        });
    },

    /**
     * @param {{ userId: string } & import('vrchat').BoopRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { userId: string } & import('vrchat').BoopRequest;
     * }>}
     */
    sendBoop(params) {
        return request(`users/${params.userId}/boop`, {
            method: 'POST',
            params: {
                emojiId: params.emojiId
                // inventoryItemId
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
