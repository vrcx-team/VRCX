import { request } from '../service/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}
const vrcPlusImageReq = {
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
            return args;
        });
    },

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
            return args;
        });
    },

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

    deletePrint(printId) {
        return request(`prints/${printId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                printId
            };
            return args;
        });
    },

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
            return args;
        });
    },

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
