import { useFavoriteStore, useUserStore } from '../stores';
import {
    handleFavoriteAdd,
    handleFavoriteDelete,
    handleFavoriteGroupClear
} from '../coordinators/favoriteCoordinator';
import { queryClient } from '../queries';
import { request } from '../services/request';

/**
 *
 */
function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

/**
 *
 */
function refetchActiveFavoriteQueries() {
    queryClient
        .invalidateQueries({
            queryKey: ['favorite'],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh favorite queries:', err);
        });
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
            handleFavoriteAdd(args);
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    /**
     * @param {{ objectId: string }} params
     * @returns { Promise<{json: any, params}> }
     */
    deleteFavorite(params) {
        return request(`favorites/${params.objectId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            handleFavoriteDelete(params.objectId);
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    /**
     * @param {{ n: number, offset: number, type: string }} params
     * @returns { Promise<{json: any, params}> }
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
     * @returns { Promise<{json: any, params}> }
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
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    /**
     * @param {{
     *    type: string,
     *    group: string
     * }} params
     * @returns { Promise<{json: any, params}> }
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
            handleFavoriteGroupClear(args);
            refetchActiveFavoriteQueries();
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
