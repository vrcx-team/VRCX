import { request } from '../service/request';

const VRCPlusIconsReq = {
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
