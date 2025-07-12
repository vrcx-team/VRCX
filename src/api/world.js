import { API } from '../service/eventBus';
import { request } from '../service/request';
import { useWorldStore } from '../stores';

function getWorldStore() {
    return useWorldStore();
}

const worldReq = {
    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    getWorld(params) {
        return request(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD', args);
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    getCachedWorld(params) {
        return new Promise((resolve, reject) => {
            const ref = getWorldStore().cachedWorlds.get(params.worldId);
            if (typeof ref === 'undefined') {
                worldReq.getWorld(params).catch(reject).then(resolve);
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
     * @typedef {object} WorldSearchParameter
     * @property {number} n
     * @property {number} offset
     * @property {string} search
     * @property {string} userId
     * @property {'me' | 'friend'} user
     * @property {'popularity' | 'heat' | 'trust' | 'shuffle' | 'favorites' | 'reportScore' | 'reportCount' | 'publicationDate' | 'labsPublicationDate' | 'created' | '_created_at' | 'updated' | '_updated_at' | 'order'} sort
     * @property {'ascending' | 'descending'} order
     * @property {'public' | 'private' | 'hidden' | 'all'} releaseStatus
     * @property {boolean} featured
     */
    /**
     *
     * @param {WorldSearchParameter} params
     * @param {string?} option sub-path of calling endpoint
     * @returns {Promise<{json: any, params, option}>}
     */
    getWorlds(params, option) {
        let endpoint = 'worlds';
        if (typeof option !== 'undefined') {
            endpoint = `worlds/${option}`;
        }
        return request(endpoint, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                option
            };
            for (const json of args.json) {
                API.$emit('WORLD', {
                    json,
                    params: {
                        worldId: json.id
                    }
                });
            }
            return args;
        });
    },
    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteWorld(params) {
        return request(`worlds/${params.worldId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{id: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    saveWorld(params) {
        return request(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD', {
                json,
                params: {
                    worldId: json.id
                }
            });
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    publishWorld(params) {
        return request(`worlds/${params.worldId}/publish`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD', {
                json,
                params: {
                    worldId: json.id
                }
            });
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    unpublishWorld(params) {
        return request(`worlds/${params.worldId}/publish`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD', {
                json,
                params: {
                    worldId: json.id
                }
            });
            return args;
        });
    }
};

export default worldReq;
