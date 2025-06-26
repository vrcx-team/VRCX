const vrcPlusImageReq = {
    uploadGalleryImage(imageData) {
        const params = {
            tag: 'gallery'
        };
        return window.API.call('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('GALLERYIMAGE:ADD', args);
            return args;
        });
    },

    uploadSticker(imageData, params) {
        return window.API.call('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('STICKER:ADD', args);
            return args;
        });
    },

    getPrints(params) {
        return window.API.call(`prints/user/${window.API.currentUser.id}`, {
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
        return window.API.call(`prints/${printId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                printId
            };
            // window.API.$emit('PRINT:DELETE', args);
            return args;
        });
    },

    uploadPrint(imageData, cropWhiteBorder, params) {
        return window.API.call('prints', {
            uploadImagePrint: true,
            cropWhiteBorder,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('PRINT:ADD', args);
            return args;
        });
    },

    getPrint(params) {
        return window.API.call(`prints/${params.printId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('PRINT', args);
            return args;
        });
    },

    uploadEmoji(imageData, params) {
        return window.API.call('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('EMOJI:ADD', args);
            return args;
        });
    }

    // ----------- no place uses this function ------------

    // editPrint(params) {
    //     return window.API.call(`prints/${params.printId}`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params
    //         };
    //         window.API.$emit('PRINT:EDIT', args);
    //         return args;
    //     });
    // },
};

export default vrcPlusImageReq;
