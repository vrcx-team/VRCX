import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { applyWorld } from '../coordinators/worldCoordinator';

const worldReq = {
    /**
     * @param {{ worldId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').World>;
     *     ref: any;
     *     params: { worldId: string };
     * }>}
     */
    getWorld(params) {
        return request(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            return {
                json,
                params,
                ref: applyWorld(json)
            };
        });
    },

    /**
     * @param {import('vrchat').SearchWorlds['query']} params
     * @param {string} [option]
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').LimitedWorld[]>;
     *     params: import('vrchat').SearchWorlds['query'];
     *     option?: string;
     * }>}
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
                applyWorld(json);
            }
            return args;
        });
    },
    /**
     * @param {{ worldId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').World>; params }>}
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
     * @param {import('vrchat').UpdateWorldRequest & { id: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').World>;
     *     params: import('vrchat').UpdateWorldRequest & { id: string };
     * }>}
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
            args.ref = applyWorld(json);
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
     * @param {{ worldId: string }} params
     * @returns {Promise<{ json: unknown; params }>}
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
            args.ref = applyWorld(json);
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
     * @param {{ worldId: string }} params
     * @returns {Promise<{ json: unknown; params }>}
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
            args.ref = applyWorld(json);
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after unpublish:', err);
            });
            return args;
        });
    },

    /**
     * @param {string} imageData
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').File>; params: { tag: string } }>}
     */
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
