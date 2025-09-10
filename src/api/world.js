import { request } from '../service/request';
import { useWorldStore } from '../stores';

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
        const worldStore = useWorldStore();
        return new Promise((resolve, reject) => {
            const ref = worldStore.cachedWorlds.get(params.worldId);
            if (typeof ref === 'undefined') {
                worldReq
                    .getWorld(params)
                    .catch(reject)
                    .then((args) => {
                        args.ref = worldStore.applyWorld(args.json);
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
