import { request } from '../services/request';

const playerModerationReq = {
    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').PlayerModeration[]> }>}
     */
    getPlayerModerations() {
        return request('auth/user/playermoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').ModerateUserRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PlayerModeration>;
     *     params: import('vrchat').ModerateUserRequest;
     * }>}
     */
    // old-way: POST auth/user/blocks {blocked:userId}
    sendPlayerModeration(params) {
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

    /**
     * @param {import('vrchat').ModerateUserRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: import('vrchat').ModerateUserRequest;
     * }>}
     */
    // old-way: PUT auth/user/unblocks {blocked:userId}
    deletePlayerModeration(params) {
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

    /**
     * @param {Pick<import('vrchat').ModerateUserRequest, 'type'>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: Pick<import('vrchat').ModerateUserRequest, 'type'>;
     * }>}
     */
    deletePlayerModerations(params) {
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
