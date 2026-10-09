import { queryClient } from '../queries';
import { request } from '../services/request';

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

const VRCPlusIconsReq = {
    /**
     * @param {import('vrchat').GetFiles['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').File[]>;
     *     params: import('vrchat').GetFiles['query'];
     * }>}
     */
    getFileList(params) {
        return request('files', {
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
            refetchActiveGalleryQueries();
            return args;
        });
    },

    /**
     * @param {string} imageData
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').File>; params: { tag: string } }>}
     */
    uploadVRCPlusIcon(imageData) {
        const params = {
            tag: 'icon'
        };
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

    // deleteFileVersion(params) {
    //     return request(`file/${params.fileId}/${params.version}`, {
    //         method: 'DELETE'
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params
    //         };
    //         return args;
    //     });
    // }
};

export default VRCPlusIconsReq;
