import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';
import { applyUser, applyCurrentUser, applyPublicProfile } from '../coordinators/userCoordinator';

/**
 * @returns {string}
 */
function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const userReq = {
    /**
     * Fetch user from API.
     * identifier of registered user
     *
     * @param {{ userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').User>;
     *     ref: import('@/types/vrcx').VrcxUser;
     *     params: { userId: string };
     * }>}
     */
    getUser(params) {
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

    /**
     * @param {import('vrchat').SearchUsers['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').LimitedUserSearch[]>;
     *     params: import('vrchat').SearchUsers['query'];
     * }>}
     */
    getUsers(params) {
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

    /**
     * @param {import('vrchat').ChangeUserTagsRequest} params User tags to add
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CurrentUser>;
     *     params: import('vrchat').ChangeUserTagsRequest;
     * }>}
     */
    addUserTags(params) {
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

    /**
     * @param {import('vrchat').ChangeUserTagsRequest} params User tags to remove
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CurrentUser>;
     *     params: import('vrchat').ChangeUserTagsRequest;
     * }>}
     */
    removeUserTags(params) {
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

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Feedback[]>;
     *     params: { userId: string };
     * }>}
     */
    getUserFeedback(params) {
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

    /**
     * Updates current user's status.
     *
     * @param {import('vrchat').UpdateUserRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CurrentUser>;
     *     ref: import('@/types/vrcx').VrcxCurrentUser;
     *     params: import('vrchat').UpdateUserRequest;
     * }>}
     */
    saveCurrentUser(params) {
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

    /**
     * @param {import('vrchat').GetUserNotes['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').UserNote[]>;
     *     params: import('vrchat').GetUserNotes['query'];
     * }>}
     */
    getUserNotes(params) {
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

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Mutuals>; params: { userId: string } }>}
     */
    getMutualCounts(params) {
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

    /**
     * @param {import('vrchat').GetMutualFriends['path'] & import('vrchat').GetMutualFriends['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').MutualFriend[]>;
     *     params: import('vrchat').GetMutualFriends['path'] & import('vrchat').GetMutualFriends['query'];
     * }>}
     */
    getMutualFriends(params) {
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

    /**
     * @param {import('vrchat').GetMutualGroups['path'] & import('vrchat').GetMutualGroups['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').LimitedUserGroups[]>;
     *     params: import('vrchat').GetMutualGroups['path'] & import('vrchat').GetMutualGroups['query'];
     * }>}
     */
    getMutualGroups(params) {
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

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PublicProfile>;
     *     params: { userId: string };
     *     ref: import('@/types/vrcx').Json<import('vrchat').PublicProfile> & { $lastFetch?: number };
     * }>}
     */
    getPublicProfile(params) {
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

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PrivateProfile>;
     *     params: { userId: string };
     * }>}
     */
    getPrivateProfile(params) {
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

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').PublicProfile>; params: {} }>}
     */
    getSelfProfile() {
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

    /**
     * @param {import('vrchat').UpdateProfileRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PublicProfile>;
     *     params: import('vrchat').UpdateProfileRequest;
     * }>}
     */
    saveProfile(params) {
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

    /**
     * @param {{ buttonColor: string; iconColor: string; themeId: string; name: string; subtextColor: string }} params
     */
    saveProfileTheme(params) {
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

    /**
     * @param {{ buttonColor?: string; iconColor?: string; name: string; subtextColor?: string }} params
     */
    createProfileTheme(params) {
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

    /**
     * @param {{ id: string }} params
     */
    deleteProfileTheme(params) {
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
