import { request } from '../service/request';
import { useWorldStore } from '../stores';
import {
    entityQueryPolicies,
    fetchWithEntityPolicy,
    patchAndRefetchActiveQuery,
    queryKeys
} from '../query';

const worldReq = {
    /**
     * @type {import('../types/api/world').GetWorld}
     */
    getWorld(params) {
        const worldStore = useWorldStore();
        return request(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = worldStore.applyWorld(json);
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, ref: any, cache?: boolean, params}>}
     */
    getCachedWorld(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.world(params.worldId),
            policy: entityQueryPolicies.world,
            queryFn: () => worldReq.getWorld(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

    /**
     * @type {import('../types/api/world').GetWorlds}
     */
    getWorlds(params, option) {
        const worldStore = useWorldStore();
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
                worldStore.applyWorld(json);
            }
            return args;
        });
    },
    /**
     * @param {object} params
     * @param {string} [option]
     * @returns {Promise<{json: any, cache?: boolean, params: any, option?: string}>}
     */
    getCachedWorlds(params, option) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.worldsByUser({
                ...params,
                option: option || ''
            }),
            policy: entityQueryPolicies.worldCollection,
            queryFn: () => worldReq.getWorlds(params, option)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
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
     * @type {import('../types/api/world').SaveWorld}
     */
    saveWorld(params) {
        const worldStore = useWorldStore();
        return request(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = worldStore.applyWorld(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after mutation:', err);
            });
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    publishWorld(params) {
        const worldStore = useWorldStore();
        return request(`worlds/${params.worldId}/publish`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = worldStore.applyWorld(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after publish:', err);
            });
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    unpublishWorld(params) {
        const worldStore = useWorldStore();
        return request(`worlds/${params.worldId}/publish`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = worldStore.applyWorld(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after unpublish:', err);
            });
            return args;
        });
    },

    uploadWorldImage(imageData) {
        const params = {
            tag: 'worldimage'
        };
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default worldReq;
