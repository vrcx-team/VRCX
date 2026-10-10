import type {
    Balance,
    BoopRequest,
    File,
    FileAnalysis,
    Instance,
    Success,
    UpdateUserBadgeRequest,
    UpdateUserNoteRequest,
    UpdateUserNoteResponse
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { queryClient, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const miscReq = {
    getFile(params: { fileId: string }): Promise<{ json: Json<File>; params: { fileId: string } }> {
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

    saveNote(
        params: UpdateUserNoteRequest
    ): Promise<{ json: Json<UpdateUserNoteResponse>; params: UpdateUserNoteRequest }> {
        return request('userNotes', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    reportUser(params: {
        userId: string;
        contentType: string;
        reason: string;
        type: string;
    }): Promise<{ json: any; params }> {
        return request(`feedback/${params.userId}/user`, {
            method: 'POST',
            params: {
                contentType: params.contentType,
                reason: params.reason,
                type: params.type
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getFileAnalysis(params: {
        fileId: string;
        version: number;
        variant: string;
    }): Promise<{ json: Json<FileAnalysis>; params }> {
        return request(`analysis/${params.fileId}/${params.version}/${params.variant}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getVRChatCredits(): Promise<{ json: Json<Balance> }> {
        return request(`user/${getCurrentUserId()}/economy/balance`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    closeInstance(params: { location: string; hardClose: boolean }): Promise<{ json: Json<Instance>; params }> {
        return request(`instances/${params.location}`, {
            method: 'DELETE',
            params: {
                hardClose: params.hardClose ?? false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deleteWorldPersistData(params: { worldId: string }): Promise<{ json: unknown; params }> {
        return request(`users/${getCurrentUserId()}/${params.worldId}/persist`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    hasWorldPersistData(params: { worldId: string }): Promise<{ json: unknown; params }> {
        return request(`users/${getCurrentUserId()}/${params.worldId}/persist/exists`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    updateBadge(
        params: { badgeId: string } & UpdateUserBadgeRequest
    ): Promise<{ json: unknown; params: { badgeId: string } & UpdateUserBadgeRequest }> {
        return request(`users/${getCurrentUserId()}/badges/${params.badgeId}`, {
            method: 'PUT',
            params: {
                userId: getCurrentUserId(),
                badgeId: params.badgeId,
                hidden: params.hidden,
                showcased: params.showcased
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getVisits(): Promise<{ json: number }> {
        return request('visits', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    deleteFile(fileId: string): Promise<{ json: Json<File>; fileId: string }> {
        return request(`file/${fileId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                fileId
            };
            queryClient.removeQueries({
                queryKey: queryKeys.file(fileId),
                exact: true
            });
            return args;
        });
    },

    sendBoop(
        params: { userId: string } & BoopRequest
    ): Promise<{ json: Json<Success>; params: { userId: string } & BoopRequest }> {
        return request(`users/${params.userId}/boop`, {
            method: 'POST',
            params: {
                emojiId: params.emojiId
                // inventoryItemId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default miscReq;
