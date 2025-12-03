import { useFavoriteStore, useUserStore } from '../stores';
import { request } from '../service/request';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const favoriteReq = {
    getFavoriteLimits() {
        return request('auth/user/favoritelimits', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @type {import('../types/api/favorite').GetFavorites}
     */
    getFavorites(params) {
        return request('favorites', {
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
     * @type {import('../types/api/favorite').AddFavorite}
     */
    addFavorite(params) {
        return request('favorites', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            useFavoriteStore().handleFavoriteAdd(args);
            return args;
        });
    },

    /**
     * @param {{ objectId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteFavorite(params) {
        return request(`favorites/${params.objectId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            useFavoriteStore().handleFavoriteDelete(params.objectId);
            return args;
        });
    },

    /**
     * @param {{ n: number, offset: number, type: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getFavoriteGroups(params) {
        return request('favorite/groups', {
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
     *
     * @param {{ type: string, group: string, displayName?: string, visibility?: string }} params group is a name
     * @return { Promise<{json: any, params}> }
     */
    saveFavoriteGroup(params) {
        return request(
            `favorite/group/${params.type}/${params.group}/${getCurrentUserId()}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
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
        return request(
            `favorite/group/${params.type}/${params.group}/${getCurrentUserId()}`,
            {
                method: 'DELETE',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            useFavoriteStore().handleFavoriteGroupClear(args);
            return args;
        });
    },

    /**
     * @type {import('../types/api/favorite').GetFavoriteWorlds}
     */
    getFavoriteWorlds(params) {
        return request('worlds/favorites', {
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
     * @type {import('../types/api/favorite').GetFavoriteAvatars}
     */
    getFavoriteAvatars(params) {
        return request('avatars/favorites', {
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

export default favoriteReq;
