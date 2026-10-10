import type {
    ChangeUserTagsRequest,
    CurrentUser,
    Feedback,
    GetMutualFriends,
    GetMutualGroups,
    GetUserNotes,
    LimitedUserGroups,
    LimitedUserSearch,
    MutualFriend,
    Mutuals,
    PrivateProfile,
    PublicProfile,
    SearchUsers,
    UpdateProfileRequest,
    UpdateUserRequest,
    User,
    UserNote
} from 'vrchat';
import type { AccountStanding, Json, VrcxCurrentUser, VrcxUser } from '../types/vrcx';
import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';
import { applyUser, applyCurrentUser, applyPublicProfile } from '../coordinators/userCoordinator';

function getCurrentUserId(): string {
    return useUserStore().currentUser.id;
}

const userReq = {
    getUser(params: { userId: string }): Promise<{ json: Json<User>; ref: VrcxUser; params: { userId: string } }> {
        return request(`users/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            if (!json) {
                throw new Error(`getUser missing user data for: ${params.userId}`);
            }
            json.$lastFetch = Date.now(); // todo: make this not suck
            const args = {
                json,
                params,
                ref: applyUser(json)
            };
            return args;
        });
    },

    getUsers(params: SearchUsers['query']): Promise<{ json: Json<LimitedUserSearch[]>; params: SearchUsers['query'] }> {
        return request('users', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    addUserTags(params: ChangeUserTagsRequest): Promise<{ json: Json<CurrentUser>; params: ChangeUserTagsRequest }> {
        return request(`users/${getCurrentUserId()}/addTags`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            applyCurrentUser(json);
            return args;
        });
    },

    removeUserTags(params: ChangeUserTagsRequest): Promise<{ json: Json<CurrentUser>; params: ChangeUserTagsRequest }> {
        return request(`users/${getCurrentUserId()}/removeTags`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            applyCurrentUser(json);
            return args;
        });
    },

    getUserFeedback(params: { userId: string }): Promise<{ json: Json<Feedback[]>; params: { userId: string } }> {
        return request(`users/${params.userId}/feedback`, {
            method: 'GET',
            params: {
                n: 100
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    saveCurrentUser(
        params: UpdateUserRequest
    ): Promise<{ json: Json<CurrentUser>; ref: VrcxCurrentUser; params: UpdateUserRequest }> {
        return request(`users/${getCurrentUserId()}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyCurrentUser(json)
            };
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.user(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh user query after mutation:', err);
            });
            return args;
        });
    },

    getUserNotes(params: GetUserNotes['query']): Promise<{ json: Json<UserNote[]>; params: GetUserNotes['query'] }> {
        return request(`userNotes`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getMutualCounts(params: { userId: string }): Promise<{ json: Json<Mutuals>; params: { userId: string } }> {
        return request(`users/${params.userId}/mutuals`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getMutualFriends(
        params: GetMutualFriends['path'] & GetMutualFriends['query']
    ): Promise<{ json: Json<MutualFriend[]>; params: GetMutualFriends['path'] & GetMutualFriends['query'] }> {
        return request(`users/${params.userId}/mutuals/friends`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getMutualGroups(
        params: GetMutualGroups['path'] & GetMutualGroups['query']
    ): Promise<{ json: Json<LimitedUserGroups[]>; params: GetMutualGroups['path'] & GetMutualGroups['query'] }> {
        return request(`users/${params.userId}/mutuals/groups`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getPublicProfile(params: { userId: string }): Promise<{
        json: Json<PublicProfile>;
        params: { userId: string };
        ref: Json<PublicProfile> & { $lastFetch?: number };
    }> {
        return request(`profile/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            json.$lastFetch = Date.now();
            const args = {
                json,
                params,
                ref: applyPublicProfile(json)
            };
            return args;
        });
    },

    getPrivateProfile(params: { userId: string }): Promise<{ json: Json<PrivateProfile>; params: { userId: string } }> {
        return request(`profile/${params.userId}/private`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getAccountStanding(): Promise<{ json: AccountStanding }> {
        return request('auth/user/accountStanding', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    getSelfProfile(): Promise<{ json: Json<PublicProfile>; params: {} }> {
        return request(`profile/${getCurrentUserId()}`, {
            method: 'GET',
            params: {
                asSelf: true
            }
        }).then((json) => {
            const args = {
                json,
                params: {}
            };
            return args;
        });
    },

    saveProfile(params: UpdateProfileRequest): Promise<{ json: Json<PublicProfile>; params: UpdateProfileRequest }> {
        return request(`profile/${getCurrentUserId()}`, {
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

    saveProfileTheme(params: {
        buttonColor: string;
        iconColor: string;
        themeId: string;
        name: string;
        subtextColor: string;
    }) {
        return request(`profile/theme/${params.themeId}`, {
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

    createProfileTheme(params: { buttonColor?: string; iconColor?: string; name: string; subtextColor?: string }) {
        return request(`profile/theme`, {
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

    deleteProfileTheme(params: { id: string }) {
        return request(`profile/theme/${params.id}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default userReq;
