import type { FriendStatus, GetFriends, LimitedUserFriend, Notification, Success } from 'vrchat';
import type { Json } from '../types/vrcx';
import { queryClient } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores/user';
import { applyUser } from '../coordinators/userCoordinator';
import { watchState } from '../services/watchState';

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
    getFriends(
        params: GetFriends['query']
    ): Promise<{ json: (Json<LimitedUserFriend> & { state?: string })[]; params: GetFriends['query'] }> {
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
                        if (userStore.currentUser.activeFriends.includes(item.id)) {
                            item.state = 'active';
                        } else if (userStore.currentUser.onlineFriends.includes(item.id)) {
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

    sendFriendRequest(params: { userId: string }): Promise<{ json: Json<Notification>; params: { userId: string } }> {
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

    cancelFriendRequest(params: { userId: string }): Promise<{ json: Json<Success>; params: { userId: string } }> {
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

    deleteFriend(params: { userId: string }, customMsg): Promise<{ json: Json<Success>; params: { userId: string } }> {
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

    getFriendStatus(params: {
        userId: string;
        currentUserId: string;
    }): Promise<{ json: Json<FriendStatus>; params: { userId: string; currentUserId: string } }> {
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

    deleteHiddenFriendRequest(
        params: any,
        userId: string
    ): Promise<{ json: Json<Success>; params: any; userId: string }> {
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
