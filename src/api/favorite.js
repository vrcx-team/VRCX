// #region | API: Favorite

const favoriteReq = {
    getFavoriteLimits() {
        return window.API.call('auth/user/favoritelimits', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            window.API.$emit('FAVORITE:LIMITS', args);
            return args;
        });
    },

    /**
     * @param {{
     * n: number,
     * offset: number,
     * type: string,
     * tag: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getFavorites(params) {
        return window.API.call('favorites', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:LIST', args);
            return args;
        });
    },

    /**
     * @param {{
     *    type: string,
     *    favoriteId: string (objectId),
     *    tags: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    addFavorite(params) {
        return window.API.call('favorites', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:ADD', args);
            return args;
        });
    },

    /**
     * @param {{ objectId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteFavorite(params) {
        return window.API.call(`favorites/${params.objectId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:DELETE', args);
            return args;
        });
    },

    /**
     * @param {{ n: number, offset: number, type: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getFavoriteGroups(params) {
        return window.API.call('favorite/groups', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:GROUP:LIST', args);
            return args;
        });
    },

    /**
     *
     * @param {{ type: string, group: string, displayName: string, visibility: string }} params group is a name
     * @return { Promise<{json: any, params}> }
     */
    saveFavoriteGroup(params) {
        return window.API.call(
            `favorite/group/${params.type}/${params.group}/${window.API.currentUser.id}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:GROUP:SAVE', args);
            return args;
        });
    },

    /**
     * @param {{
     *    type: string,
     *    group: string (name)
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    clearFavoriteGroup(params) {
        return window.API.call(
            `favorite/group/${params.type}/${params.group}/${window.API.currentUser.id}`,
            {
                method: 'DELETE',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:GROUP:CLEAR', args);
            return args;
        });
    },

    /**
     * @param {{
     *    n: number,
     *    offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getFavoriteWorlds(params) {
        return window.API.call('worlds/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:WORLD:LIST', args);
            return args;
        });
    },

    /**
     * @param {{
     *    n: number,
     *    offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getFavoriteAvatars(params) {
        return window.API.call('avatars/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FAVORITE:AVATAR:LIST', args);
            return args;
        });
    }
};

// #endregion

export default favoriteReq;
