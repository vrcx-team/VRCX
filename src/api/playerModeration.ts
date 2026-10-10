import type { ModerateUserRequest, PlayerModeration, Success } from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';

const playerModerationReq = {
    getPlayerModerations(): Promise<{ json: Json<PlayerModeration[]> }> {
        return request('auth/user/playermoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    // old-way: POST auth/user/blocks {blocked:userId}
    sendPlayerModeration(
        params: ModerateUserRequest
    ): Promise<{ json: Json<PlayerModeration>; params: ModerateUserRequest }> {
        return request('auth/user/playermoderations', {
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

    // old-way: PUT auth/user/unblocks {blocked:userId}
    deletePlayerModeration(params: ModerateUserRequest): Promise<{ json: Json<Success>; params: ModerateUserRequest }> {
        return request('auth/user/unplayermoderate', {
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

    deletePlayerModerations(
        params: Pick<ModerateUserRequest, 'type'>
    ): Promise<{ json: Json<Success>; params: Pick<ModerateUserRequest, 'type'> }> {
        return request('auth/user/unplayermoderate', {
            method: 'PUT',
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

export default playerModerationReq;
