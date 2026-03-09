import { useFavoriteStore, useUserStore } from '../stores';
import { request } from '../service/request';
import {
    entityQueryPolicies,
    fetchWithEntityPolicy,
    queryClient,
    queryKeys
} from '../queries';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

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

    getCachedFavoriteLimits() {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.favoriteLimits(),
            policy: entityQueryPolicies.favoriteCollection,
            queryFn: () => favoriteReq.getFavoriteLimits()
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
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

    getCachedFavorites(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.favorites(params),
            policy: entityQueryPolicies.favoriteCollection,
            queryFn: () => favoriteReq.getFavorites(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
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
            refetchActiveFavoriteQueries();
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
            refetchActiveFavoriteQueries();
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

    getCachedFavoriteGroups(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.favoriteGroups(params),
            policy: entityQueryPolicies.favoriteCollection,
            queryFn: () => favoriteReq.getFavoriteGroups(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
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
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    /**
     * @param {{
     *    type: string,
     *    group: string
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

    getCachedFavoriteWorlds(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.favoriteWorlds(params),
            policy: entityQueryPolicies.favoriteCollection,
            queryFn: () => favoriteReq.getFavoriteWorlds(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
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
    },

    getCachedFavoriteAvatars(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.favoriteAvatars(params),
            policy: entityQueryPolicies.favoriteCollection,
            queryFn: () => favoriteReq.getFavoriteAvatars(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    }
};

export default favoriteReq;
