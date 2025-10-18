import { useAvatarStore, useWorldStore } from '../stores';
import { request } from '../service/request';

const imageReq = {
    async uploadAvatarFailCleanup(id) {
        const avatarStore = useAvatarStore();
        try {
            const json = await request(`file/${id}`, {
                method: 'GET'
            });
            const fileId = json.id;
            const fileVersion = json.versions[json.versions.length - 1].version;
            request(`file/${fileId}/${fileVersion}/signature/finish`, {
                method: 'PUT'
            }).catch((err) =>
                console.error('Failed to finish signature:', err)
            );
            request(`file/${fileId}/${fileVersion}/file/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish file:', err));
        } catch (error) {
            console.error('Failed to cleanup avatar upload:', error);
        }
        avatarStore.avatarDialog.loading = false;
    },

    async uploadAvatarImage(params, fileId) {
        try {
            return await request(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                const args = {
                    json,
                    params,
                    fileId
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(fileId);
            throw err;
        }
    },

    async uploadAvatarImageFileStart(params) {
        try {
            return await request(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(params.fileId);
        }
    },

    uploadAvatarImageFileFinish(params) {
        return request(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    async uploadAvatarImageSigStart(params) {
        try {
            return await request(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(params.fileId);
        }
    },

    uploadAvatarImageSigFinish(params) {
        return request(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    setAvatarImage(params) {
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

    async uploadWorldFailCleanup(id) {
        const worldStore = useWorldStore();
        try {
            const json = await request(`file/${id}`, {
                method: 'GET'
            });
            const fileId = json.id;
            const fileVersion = json.versions[json.versions.length - 1].version;
            request(`file/${fileId}/${fileVersion}/signature/finish`, {
                method: 'PUT'
            }).catch((err) =>
                console.error('Failed to finish signature:', err)
            );
            request(`file/${fileId}/${fileVersion}/file/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish file:', err));
        } catch (error) {
            console.error('Failed to cleanup world upload:', error);
        }
        worldStore.worldDialog.loading = false;
    },

    async uploadWorldImage(params, fileId) {
        try {
            return await request(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                const args = {
                    json,
                    params,
                    fileId
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(fileId);
        }
        return void 0;
    },

    async uploadWorldImageFileStart(params) {
        try {
            return await request(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadWorldImageFileFinish(params) {
        return request(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    async uploadWorldImageSigStart(params) {
        try {
            return await request(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadWorldImageSigFinish(params) {
        return request(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    setWorldImage(params) {
        const worldStore = useWorldStore();
        return request(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = worldStore.applyWorld(json);
            return args;
        });
    },

    getAvatarImages(params) {
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

    getWorldImages(params) {
        return request(`file/${params.fileId}`, {
            method: 'GET',
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

export default imageReq;
