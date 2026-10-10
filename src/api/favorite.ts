import type {
    Avatar,
    Favorite,
    FavoriteGroup,
    FavoriteLimits,
    FavoritedWorld,
    GetFavoriteGroups,
    GetFavoritedAvatars,
    GetFavoritedWorlds,
    GetFavorites,
    Success,
    UpdateFavoriteGroupRequest,
    UpdateFavoriteGroupResponse
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { useUserStore } from '../stores';
import { handleFavoriteAdd, handleFavoriteDelete, handleFavoriteGroupClear } from '../coordinators/favoriteCoordinator';
import { queryClient } from '../queries';
import { request } from '../services/request';

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
    getFavoriteLimits(): Promise<{ json: Json<FavoriteLimits> }> {
        return request('auth/user/favoritelimits', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    getFavorites(params: GetFavorites['query']): Promise<{ json: Json<Favorite[]>; params: GetFavorites['query'] }> {
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

    addFavorite(params: {
        type: string;
        favoriteId: string;
        tags: string;
    }): Promise<{ json: Json<Favorite>; params: { type: string; favoriteId: string; tags: string } }> {
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

    deleteFavorite(params: { objectId: string }): Promise<{ json: Json<Success>; params }> {
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

    getFavoriteGroups(
        params: GetFavoriteGroups['query']
    ): Promise<{ json: Json<FavoriteGroup[]>; params: GetFavoriteGroups['query'] }> {
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

    saveFavoriteGroup(params: UpdateFavoriteGroupRequest & { type: string; group: string }): Promise<{
        json: Json<UpdateFavoriteGroupResponse>;
        params: UpdateFavoriteGroupRequest & { type: string; group: string };
    }> {
        return request(`favorite/group/${params.type}/${params.group}/${getCurrentUserId()}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    clearFavoriteGroup(params: { type: string; group: string }): Promise<{ json: Json<Success>; params }> {
        return request(`favorite/group/${params.type}/${params.group}/${getCurrentUserId()}`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            handleFavoriteGroupClear(args);
            refetchActiveFavoriteQueries();
            return args;
        });
    },

    getFavoriteWorlds(
        params: GetFavoritedWorlds['query']
    ): Promise<{ json: Json<FavoritedWorld[]>; params: GetFavoritedWorlds['query'] }> {
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

    getFavoriteAvatars(
        params: GetFavoritedAvatars['query']
    ): Promise<{ json: Json<Avatar[]>; params: GetFavoritedAvatars['query'] }> {
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
