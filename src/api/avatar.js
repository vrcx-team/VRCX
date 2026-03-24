import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';
import { applyCurrentUser } from '../coordinators/userCoordinator';

const avatarReq = {
    /**
     * @type {import('../types/api/avatar').GetAvatar}
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
     * @type {import('../types/api/avatar').GetAvatars}
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
     * @type {import('../types/api/avatar').SaveAvatar}
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
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.avatar(params.id),
                nextData: args
            }).catch((err) => {
                console.error(
                    'Failed to refresh avatar query after mutation:',
                    err
                );
            });
            return args;
        });
    },

    /**
     * @param {{avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    selectAvatar(params) {
        return request(`avatars/${params.avatarId}/select`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            const ref = applyCurrentUser(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.user(ref.id),
                nextData: {
                    json,
                    params: { userId: ref.id },
                    ref
                }
            }).catch((err) => {
                console.error(
                    'Failed to refresh current user query after avatar select:',
                    err
                );
            });
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @returns { Promise<{json: any, params}> }
     */
    selectFallbackAvatar(params) {
        return request(`avatars/${params.avatarId}/selectfallback`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            const ref = applyCurrentUser(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.user(ref.id),
                nextData: {
                    json,
                    params: { userId: ref.id },
                    ref
                }
            }).catch((err) => {
                console.error(
                    'Failed to refresh current user query after fallback avatar select:',
                    err
                );
            });
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @returns { Promise<{json: any, params}> }
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
     * @returns {Promise<{json: any, params}>}
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
     * @param {string} avatarId
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

    uploadAvatarImage(imageData) {
        const params = {
            tag: 'avatarimage'
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
     * @param {{ imageData: string, avatarId: string }}
     * @param imageData
     * @param avatarId
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
