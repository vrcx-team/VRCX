import type {
    AvatarModeration,
    AvatarModerationCreated,
    CreateAvatarModerationRequest,
    DeleteGlobalAvatarModeration,
    OkStatus2
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';

const avatarModerationReq = {
    getAvatarModerations(): Promise<{ json: Json<AvatarModeration[]> }> {
        return request('auth/user/avatarmoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    sendAvatarModeration(
        params: CreateAvatarModerationRequest
    ): Promise<{ json: Json<AvatarModerationCreated>; params: CreateAvatarModerationRequest }> {
        return request('auth/user/avatarmoderations', {
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

    deleteAvatarModeration(
        params: DeleteGlobalAvatarModeration['query']
    ): Promise<{ json: Json<OkStatus2>; params: DeleteGlobalAvatarModeration['query'] }> {
        return request(
            `auth/user/avatarmoderations?targetAvatarId=${encodeURIComponent(
                params.targetAvatarId
            )}&avatarModerationType=${encodeURIComponent(params.avatarModerationType)}`,
            {
                method: 'DELETE'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default avatarModerationReq;
