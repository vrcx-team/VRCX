// #region | App: VRCPlus Icons

const VRCPlusIconsReq = {
    getFileList(params) {
        return window.API.call('files', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FILES:LIST', args);
            return args;
        });
    },

    deleteFile(fileId) {
        return window.API.call(`file/${fileId}`, {
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
            window.API.$emit('VRCPLUSICON:ADD', args);
            return args;
        });
    }

    // unused
    // images.pug line 63
    // deleteFileVersion(params) {
    //     return window.API.call(`file/${params.fileId}/${params.version}`, {
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

// #endregion

export default VRCPlusIconsReq;
