import { request } from '../service/request';
import { useUserStore } from '../stores';

const avatarReq = {
    /**
     * @type {import('../types/avatar').getAvatar}
     */
    getAvatar(params) {
        return request(`avatars/${params.avatarId}`, {
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
     * @typedef {{
     *     n: number,
     *     offset: number,
     *     search: string,
     *     userId: string,
     *     user: 'me' | 'friends'
     *     sort: 'created' | 'updated' | 'order' | '_created_at' | '_updated_at',
     *     order: 'ascending' | 'descending',
     *     releaseStatus: 'public' | 'private' | 'hidden' | 'all',
     *     featured: boolean
     * }} GetAvatarsParameter
     */
    /**
     *
     * @param {GetAvatarsParameter} params
     * @returns {Promise<{json: any, params}>}
     */
    getAvatars(params) {
        return request('avatars', {
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
     * @param {{ id: string, releaseStatus?: 'public' | 'private', name?: string, description?: string,tags?: string[] }} params
     * @returns {Promise<{json: any, params}>}
     */
    saveAvatar(params) {
        return request(`avatars/${params.id}`, {
            method: 'PUT',
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
     * @param {{avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    selectAvatar(params) {
        const userStore = useUserStore();
        return request(`avatars/${params.avatarId}/select`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            userStore.applyCurrentUser(json);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    selectFallbackAvatar(params) {
        const userStore = useUserStore();
        return request(`avatars/${params.avatarId}/selectfallback`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            userStore.applyCurrentUser(json);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteAvatar(params) {
        return request(`avatars/${params.avatarId}`, {
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
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    createImposter(params) {
        return request(`avatars/${params.avatarId}/impostor/enqueue`, {
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
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: T, params}>}
     */
    deleteImposter(params) {
        return request(`avatars/${params.avatarId}/impostor`, {
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
     * @returns {Promise<{json: any}>}
     */
    getAvailableAvatarStyles() {
        return request('avatarStyles', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} avatarId
     * @returns {Promise<{json: any, params}>}
     */
    getAvatarGallery(avatarId) {
        const params = {
            tag: 'avatargallery',
            galleryId: avatarId,
            n: 100,
            offset: 0
        };
        return request(`files`, {
            params,
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
     * @param {{ imageData: string, avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    uploadAvatarGalleryImage(imageData, avatarId) {
        const params = {
            tag: 'avatargallery',
            galleryId: avatarId
        };
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {string[]} order
     * @returns {Promise<{json: any, params}>}
     */
    setAvatarGalleryOrder(order) {
        const params = {
            ids: order
        };
        return request('files/order', {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default avatarReq;
