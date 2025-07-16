import { BaseWorld } from '../common';

// API functions
export type GetWorld = (params: { worldId: string }) => Promise<{
    json: GetWorldResponse;
    params: { worldId: string };
}>;

export type GetCachedWorld = (params: { worldId: string }) => Promise<{
    json: GetWorldResponse;
    ref: any;
    cache?: boolean;
    params: { worldId: string };
}>;

export type GetWorlds = (
    params: {
        n: number;
        offset: number;
        search?: string;
        userId?: string;
        user?: 'me' | 'friend';
        sort?:
            | 'popularity'
            | 'heat'
            | 'trust'
            | 'shuffle'
            | 'favorites'
            | 'reportScore'
            | 'reportCount'
            | 'publicationDate'
            | 'labsPublicationDate'
            | 'created'
            | '_created_at'
            | 'updated'
            | '_updated_at'
            | 'order';
        order?: 'ascending' | 'descending';
        releaseStatus?: 'public' | 'private' | 'hidden' | 'all';
        featured?: boolean;
    },
    option?: string
) => Promise<{
    json: WorldSearchResponse;
    params: any;
    option?: string;
}>;

// Type aliases
type WorldSearchResponse = WorldSearchResponseItem[];

// Internal response types
interface WorldSearchResponseItem extends BaseWorld {
    // World search specific fields
    occupants: number;
    defaultContentSettings: Record<string, any>;
}

interface GetWorldResponse extends BaseWorld {
    // World detail specific fields
    instances: any[];
    occupants: number;
    privateOccupants: number;
    publicOccupants: number;
    defaultContentSettings: Record<string, unknown>;
    urlList: any[];
    version: number;
    visits: number;
}
