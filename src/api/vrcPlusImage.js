import { queryClient } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

function refetchActiveGalleryQueries() {
    queryClient
        .invalidateQueries({
            queryKey: ['gallery'],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh gallery queries:', err);
        });
}
const vrcPlusImageReq = {
    /**
     * @param {string} imageData
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').File>; params: { tag: string } }>}
     */
    uploadGalleryImage(imageData) {
        const params = {
            tag: 'gallery'
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
            refetchActiveGalleryQueries();
            return args;
        });
    },

    /**
     * @param {string} imageData
     * @param {Omit<NonNullable<import('vrchat').UploadImage['body']>, 'file'>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').File>;
     *     params: Omit<NonNullable<import('vrchat').UploadImage['body']>, 'file'>;
     * }>}
     */
    uploadSticker(imageData, params) {
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    /**
     * @param {{ n?: number }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Print[]>; params: { n?: number } }>}
     */
    getPrints(params) {
        return request(`prints/user/${getCurrentUserId()}`, {
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
     * @param {string} printId
     * @returns {Promise<{ json: unknown; printId: string }>}
     */
    deletePrint(printId) {
        return request(`prints/${printId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                printId
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    /**
     * @param {string} imageData
     * @param {boolean} cropWhiteBorder
     * @param {import('@/types/vrcx').Json<Omit<NonNullable<import('vrchat').UploadPrint['body']>, 'image'>>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Print>;
     *     params: import('@/types/vrcx').Json<Omit<NonNullable<import('vrchat').UploadPrint['body']>, 'image'>>;
     * }>}
     */
    uploadPrint(imageData, cropWhiteBorder, params) {
        return request('prints', {
            uploadImagePrint: true,
            cropWhiteBorder,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    },

    /**
     * @param {{ printId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Print>; params: { printId: string } }>}
     */
    getPrint(params) {
        return request(`prints/${params.printId}`, {
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
     * @param {string} imageData
     * @param {Omit<NonNullable<import('vrchat').UploadImage['body']>, 'file'>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').File>;
     *     params: Omit<NonNullable<import('vrchat').UploadImage['body']>, 'file'>;
     * }>}
     */
    uploadEmoji(imageData, params) {
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGalleryQueries();
            return args;
        });
    }

    // editPrint(params) {
    //     return request(`prints/${params.printId}`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params
    //         };
    //         API.$emit('PRINT:EDIT', args);
    //         return args;
    //     });
    // },
};

export default vrcPlusImageReq;
