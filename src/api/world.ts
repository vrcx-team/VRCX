import type { File, LimitedWorld, SearchWorlds, UpdateWorldRequest, World } from 'vrchat';
import type { Json } from '../types/vrcx';
import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { applyWorld } from '../coordinators/worldCoordinator';

const worldReq = {
    getWorld(params: { worldId: string }): Promise<{ json: Json<World>; ref: any; params: { worldId: string } }> {
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

    getWorlds(
        params: SearchWorlds['query'],
        option?: string
    ): Promise<{ json: Json<LimitedWorld[]>; params: SearchWorlds['query']; option?: string }> {
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
    deleteWorld(params: { worldId: string }): Promise<{ json: Json<World>; params }> {
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

    saveWorld(
        params: UpdateWorldRequest & { id: string }
    ): Promise<{ json: Json<World>; params: UpdateWorldRequest & { id: string } }> {
        return request(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyWorld(json)
            };
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after mutation:', err);
            });
            return args;
        });
    },

    publishWorld(params: { worldId: string }): Promise<{ json: unknown; params }> {
        return request(`worlds/${params.worldId}/publish`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyWorld(json)
            };
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after publish:', err);
            });
            return args;
        });
    },

    unpublishWorld(params: { worldId: string }): Promise<{ json: unknown; params }> {
        return request(`worlds/${params.worldId}/publish`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyWorld(json)
            };
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.world(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh world query after unpublish:', err);
            });
            return args;
        });
    },

    uploadWorldImage(imageData: string): Promise<{ json: Json<File>; params: { tag: string } }> {
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
