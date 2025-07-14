import { request } from '../service/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const userReq = {
    /**
     * Fetch user from API.
     * identifier of registered user
     * @type {import('../types/user').getUser}
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
            const args = {
                json,
                params
            };
            args.ref = userStore.applyUser(json);
            return args;
        });
    },

    /**
     * Fetch user from cache if they're in it. Otherwise, calls API.
     * @param {{ userId: string }} params identifier of registered user
     * @returns {Promise<{json: any, params}>}
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
     * @typedef {object} GetUsersParameters
     * @property {number} n
     * @property {number} offset
     * @property {string} search
     * @property {'nuisanceFactor' | 'created' | '_created_at' | 'last_login'} sort
     * @property {'ascending' | 'descending'} order
     */
    /**
     * Fetch multiple users from API.
     * @param params {GetUsersParameters} filtering and sorting parameters
     * @returns {Promise<{json: any, params}>}
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
     * @param params {string[]}
     * @returns {Promise<{json: any, params}>}
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
     * @param params {string[]}
     * @returns {Promise<{json: any, params}>}
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
     * @param params {{ userId: string }}
     * @returns {Promise<{json: any, params}>}
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
     * @typedef {{
     *     status: 'active' | 'offline' | 'busy' | 'ask me' | 'join me',
     *     statusDescription: string
     * }} SaveCurrentUserParameters
     */

    /**
     * Updates current user's status.
     * @param params {SaveCurrentUserParameters} new status to be set
     * @returns {Promise<{json: any, params}>}
     */
    saveCurrentUser(params) {
        const userStore = useUserStore();
        return request(`users/${getCurrentUserId()}`, {
            method: 'PUT',
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
     * @param params {{ offset: number, n: number }}
     * @returns {Promise<{json: any, params}>}
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
