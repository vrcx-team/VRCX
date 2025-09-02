import { request } from '../service/request';
import { useUserStore } from '../stores/user';

const friendReq = {
    /**
     * Fetch friends of current user.
     * @type {import('../types/api/friend').GetFriends}
     */
    getFriends(params) {
        const userStore = useUserStore();
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
                userStore.applyUser(user);
            }
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params: { userId: string }}>}
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
     * @returns {Promise<{json: any, params: { userId: string }}>}
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
     * @returns {Promise<{json: any, params: { userId: string }}>}
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
     * currentUserId for own reference
     * @param {{ userId: string, currentUserId: string }} params
     * @returns {Promise<{json: any, params: { userId: string, currentUserId: string }}>}
     */
    getFriendStatus(params) {
        return request(`user/${params.userId}/friendStatus`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            console.log('getFriendStatus', args);
            return args;
        });
    },

    /**
     * @param {any} params
     * @param {string} userId
     * @returns {Promise<{json: any, params: any, userId: string}>}
     */
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
