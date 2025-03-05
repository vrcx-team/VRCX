// #region | API: User

const userReq = {
    /**
     * Fetch user from API.
     * @param {{ userId: string }} params identifier of registered user
     * @returns {Promise<{json: any, params}>}
     */
    getUser(params) {
        return window.API.call(`users/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('USER', args);
            return args;
        });
    },

    /**
     * Fetch user from cache if they're in it. Otherwise, calls API.
     * @param {{ userId: string }} params identifier of registered user
     * @returns {Promise<{json: any, params}>}
     */
    getCachedUser(params) {
        return new Promise((resolve, reject) => {
            const ref = window.API.cachedUsers.get(params.userId);
            if (typeof ref === 'undefined') {
                userReq.getUser(params).catch(reject).then(resolve);
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
        return window.API.call('users', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('USER:LIST', args);
            return args;
        });
    },

    /**
     * @param params {string[]}
     * @returns {Promise<{json: any, params}>}
     */
    addUserTags(params) {
        return window.API.call(`users/${window.API.currentUser.id}/addTags`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('USER:CURRENT:SAVE', args);
            return args;
        });
    },

    /**
     * @param params {string[]}
     * @returns {Promise<{json: any, params}>}
     */
    removeUserTags(params) {
        return window.API.call(
            `users/${window.API.currentUser.id}/removeTags`,
            {
                method: 'POST',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('USER:CURRENT:SAVE', args);
            return args;
        });
    },

    /**
     * @param params {{ userId: string }}
     * @returns {Promise<{json: any, params}>}
     */
    getUserFeedback(params) {
        return window.API.call(`users/${params.userId}/feedback`, {
            method: 'GET',
            params: {
                n: 100
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('USER:FEEDBACK', args);
            return args;
        });
    }
};
// #endregion

export default userReq;
