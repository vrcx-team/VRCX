import { API } from '../service/eventBus';
import { request } from '../service/request';
import { useUserStore } from '../stores';

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
     * @param {{
     * n: number,
     * offset: number,
     * type: string,
     * tag: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{
     *    type: string,
     *    favoriteId: string (objectId),
     *    tags: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
            API.$emit('FAVORITE:ADD', args);
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
            API.$emit('FAVORITE:DELETE', args);
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
            API.$emit('FAVORITE:GROUP:LIST', args);
            return args;
        });
    },

    /**
     *
     * @param {{ type: string, group: string, displayName: string, visibility: string }} params group is a name
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
            API.$emit('FAVORITE:GROUP:SAVE', args);
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
            API.$emit('FAVORITE:GROUP:CLEAR', args);
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
        return request('worlds/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('FAVORITE:WORLD:LIST', args);
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
        return request('avatars/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('FAVORITE:AVATAR:LIST', args);
            return args;
        });
    }
};

export default favoriteReq;
