import { request } from '../service/request';

const playerModerationReq = {
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
     * @param {{ moderated: string, type: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{ moderated: string, type: string }} params
     * @return { Promise<{json: any, params}> }
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
    }
};

export default playerModerationReq;
