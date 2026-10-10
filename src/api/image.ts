import type {
    Avatar,
    CreateFileVersionRequest,
    File,
    FileUploadUrl,
    UpdateAvatarRequest,
    UpdateWorldRequest,
    World
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { useAvatarStore, useWorldStore } from '../stores';
import { applyWorld } from '../coordinators/worldCoordinator';
import { request } from '../services/request';

const imageReq = {
    async uploadAvatarFailCleanup(id: string) {
        const avatarStore = useAvatarStore();
        try {
            const json = await request(`file/${id}`, {
                method: 'GET'
            });
            const fileId = json.id;
            const fileVersion = json.versions[json.versions.length - 1].version;
            request(`file/${fileId}/${fileVersion}/signature/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish signature:', err));
            request(`file/${fileId}/${fileVersion}/file/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish file:', err));
        } catch (error) {
            console.error('Failed to cleanup avatar upload:', error);
        }
        avatarStore.setAvatarDialogLoading(false);
    },

    async uploadAvatarImage(
        params: CreateFileVersionRequest,
        fileId: string
    ): Promise<{ json: Json<File>; params: CreateFileVersionRequest; fileId: string }> {
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

    async uploadAvatarImageFileStart(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<FileUploadUrl>; params: { fileId: string; fileVersion: number } }> {
        try {
            return await request(`file/${params.fileId}/${params.fileVersion}/file/start`, {
                method: 'PUT'
            }).then((json) => {
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

    uploadAvatarImageFileFinish(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<File>; params: { fileId: string; fileVersion: number } }> {
        return request(`file/${params.fileId}/${params.fileVersion}/file/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    async uploadAvatarImageSigStart(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<FileUploadUrl>; params: { fileId: string; fileVersion: number } }> {
        try {
            return await request(`file/${params.fileId}/${params.fileVersion}/signature/start`, {
                method: 'PUT'
            }).then((json) => {
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

    uploadAvatarImageSigFinish(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<File>; params: { fileId: string; fileVersion: number } }> {
        return request(`file/${params.fileId}/${params.fileVersion}/signature/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    setAvatarImage(
        params: { id: string } & UpdateAvatarRequest
    ): Promise<{ json: Json<Avatar>; params: { id: string } & UpdateAvatarRequest }> {
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

    async uploadWorldFailCleanup(id: string) {
        const worldStore = useWorldStore();
        try {
            const json = await request(`file/${id}`, {
                method: 'GET'
            });
            const fileId = json.id;
            const fileVersion = json.versions[json.versions.length - 1].version;
            request(`file/${fileId}/${fileVersion}/signature/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish signature:', err));
            request(`file/${fileId}/${fileVersion}/file/finish`, {
                method: 'PUT'
            }).catch((err) => console.error('Failed to finish file:', err));
        } catch (error) {
            console.error('Failed to cleanup world upload:', error);
        }
        worldStore.setWorldDialogLoading(false);
    },

    async uploadWorldImage(
        params: CreateFileVersionRequest,
        fileId: string
    ): Promise<{ json: Json<File>; params: CreateFileVersionRequest; fileId: string }> {
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

    async uploadWorldImageFileStart(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<FileUploadUrl>; params: { fileId: string; fileVersion: number } }> {
        try {
            return await request(`file/${params.fileId}/${params.fileVersion}/file/start`, {
                method: 'PUT'
            }).then((json) => {
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

    uploadWorldImageFileFinish(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<File>; params: { fileId: string; fileVersion: number } }> {
        return request(`file/${params.fileId}/${params.fileVersion}/file/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    async uploadWorldImageSigStart(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<FileUploadUrl>; params: { fileId: string; fileVersion: number } }> {
        try {
            return await request(`file/${params.fileId}/${params.fileVersion}/signature/start`, {
                method: 'PUT'
            }).then((json) => {
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

    uploadWorldImageSigFinish(params: {
        fileId: string;
        fileVersion: number;
    }): Promise<{ json: Json<File>; params: { fileId: string; fileVersion: number } }> {
        return request(`file/${params.fileId}/${params.fileVersion}/signature/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    setWorldImage(
        params: { id: string } & UpdateWorldRequest
    ): Promise<{ json: Json<World>; params: { id: string } & UpdateWorldRequest; ref: any }> {
        return request(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            return {
                json,
                params,
                ref: applyWorld(json)
            };
        });
    },

    getAvatarImages(params: { fileId: string }): Promise<{ json: Json<File>; params: { fileId: string } }> {
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

    getWorldImages(params: { fileId: string }): Promise<{ json: Json<File>; params: { fileId: string } }> {
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
