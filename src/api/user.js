import { request } from '../service/request';
import { useUserStore } from '../stores';

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
     * @type {import('../types/api/user').GetUser}
     */
    getUser(params) {
        const userStore = useUserStore();
        return request(`users/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            if (!json) {
                throw new Error(
                    `getUser missing user data for: ${params.userId}`
                );
            }
            json.$lastFetch = Date.now(); // todo: make this not suck
            const args = {
                json,
                params,
                ref: userStore.applyUser(json)
            };
            return args;
        });
    },

    /**
     * Fetch user from cache if they're in it. Otherwise, calls API.
     * @type {import('../types/api/user').GetCachedUser}
     */
    getCachedUser(params) {
        const userStore = useUserStore();
        return new Promise((resolve, reject) => {
            const ref = userStore.cachedUsers.get(params.userId);
            if (typeof ref === 'undefined') {
                userReq
                    .getUser(params)
                    .catch(reject)
                    .then((args) => {
                        args.ref = userStore.applyUser(args.json);
                        resolve(args);
                    });
            } else {
                resolve({
                    cache: true,
                    json: ref,
                    params,
                    ref
                });
            }
        });
    },

    /**
     * @type {import('../types/api/user').GetUsers}
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
     * @param {{tags: string[]}} params User tags to add
     * @returns {Promise<{json: any, params: {tags: string[]}}>}
     */
    addUserTags(params) {
        const userStore = useUserStore();
        return request(`users/${getCurrentUserId()}/addTags`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            userStore.applyCurrentUser(json);
            return args;
        });
    },

    /**
     * @param {{tags: string[]}} params User tags to remove
     * @returns {Promise<{json: any, params: {tags: string[]}}>}
     */
    removeUserTags(params) {
        const userStore = useUserStore();
        return request(`users/${getCurrentUserId()}/removeTags`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            userStore.applyCurrentUser(json);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params: { userId: string }}>}
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
     * @type {import('../types/api/user').GetCurrentUser}
     */
    saveCurrentUser(params) {
        const userStore = useUserStore();
        return request(`users/${getCurrentUserId()}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: userStore.applyCurrentUser(json)
            };
            return args;
        });
    },

    /**
     * @param {{ offset: number, n: number }} params
     * @returns {Promise<{json: any, params: { offset: number, n: number }}>}
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
    }
};

export default userReq;
