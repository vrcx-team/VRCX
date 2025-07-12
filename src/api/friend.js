import { API } from '../service/eventBus';
import { request } from '../service/request';

const friendReq = {
    /**
     * Fetch friends of current user.
     * @param {{ n: number, offset: number, offline: boolean }} params
     * @returns {Promise<{json: any, params}>}
     */
    getFriends(params) {
        return request('auth/user/friends', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            for (const user of args.json) {
                if (!user.displayName) {
                    console.error('/friends gave us garbage', user);
                    continue;
                }
                API.$emit('USER', {
                    json: user,
                    params: {
                        userId: json.id
                    }
                });
            }
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: T, params}>}
     */
    sendFriendRequest(params) {
        return request(`user/${params.userId}/friendRequest`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    cancelFriendRequest(params) {
        return request(`user/${params.userId}/friendRequest`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteFriend(params) {
        return request(`auth/user/friends/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getFriendStatus(params) {
        return request(`user/${params.userId}/friendStatus`, {
            method: 'GET'
        }).then((json) => {
            console.log('getFriendStatus', json);
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deleteHiddenFriendRequest(params, userId) {
        return request(`user/${userId}/friendRequest`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                userId
            };
            return args;
        });
    }
};

export default friendReq;
