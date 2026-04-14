import { queryClient } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores/user';
import { applyUser } from '../coordinators/userCoordinator';
import { watchState } from '../services/watchState';

/**
 *
 */
function refetchActiveFriendListQueries() {
    queryClient
        .invalidateQueries({
            queryKey: ['friends'],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh friend list queries:', err);
        });
}

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
                // hacky way to add state to bulk fetch at startup
                if (!watchState.isFriendsLoaded) {
                    for (const item of json) {
                        if (
                            userStore.currentUser.activeFriends.includes(
                                item.id
                            )
                        ) {
                            item.state = 'active';
                        } else if (
                            userStore.currentUser.onlineFriends.includes(
                                item.id
                            )
                        ) {
                            item.state = 'online';
                        } else {
                            item.state = 'offline';
                        }
                    }
                }
                applyUser(user);
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
            refetchActiveFriendListQueries();
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
            refetchActiveFriendListQueries();
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @param customMsg
     * @returns {Promise<{json: any, params: { userId: string }}>}
     */
    deleteFriend(params, customMsg) {
        return request(`auth/user/friends/${params.userId}`, {
            method: 'DELETE',
            customMsg
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveFriendListQueries();
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
