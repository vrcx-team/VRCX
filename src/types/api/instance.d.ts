import { UnityPackage } from '../common';

// API functions
export type GetInstance = (params: {
    worldId: string;
    instanceId: string;
}) => Promise<{
    json: GetInstanceResponse;
    params: { worldId: string; instanceId: string };
}>;

export type GetInstanceShortName = (instance: {
    worldId: string;
    instanceId: string;
    shortName?: string;
}) => Promise<{
    json: GetInstanceShortNameResponse;
    instance: { worldId: string; instanceId: string };
    params?: { shortName: string };
}>;

// API response types
interface GetInstanceResponse {
    active: boolean;
    ageGate: boolean;
    canRequestInvite: boolean;
    capacity: number;
    clientNumber: string;
    closedAt: string | null;
    contentSettings: Record<string, any>;
    displayName: string | null;
    full: boolean;
    gameServerVersion: number;
    hardClose: string | null;
    hasCapacityForYou: boolean;
    hidden: string;
    id: string;
    instanceId: string;
    instancePersistenceEnabled: boolean | null;
    location: string;
    n_users: number;
    name: string;
    ownerId: string;
    permanent: boolean;
    photonRegion: string;
    platforms: {
        android: number;
        ios: number;
        standalonewindows: number;
    };
    playerPersistenceEnabled: boolean;
    queueEnabled: boolean;
    queueSize: number;
    recommendedCapacity: number;
    region: string;
    secureName: string;
    shortName: string | null;
    strict: boolean;
    tags: string[];
    type: string;
    userCount: number;
    world: {
        authorId: string;
        authorName: string;
        capacity: number;
        created_at: string;
        defaultContentSettings: Record<string, any>;
        description: string;
        favorites: number;
        featured: boolean;
        heat: number;
        id: string;
        imageUrl: string;
        labsPublicationDate: string;
        name: string;
        organization: string;
        popularity: number;
        previewYoutubeId: string | null;
        publicationDate: string;
        recommendedCapacity: number;
        releaseStatus: string;
        tags: string[];
        thumbnailImageUrl: string;
        udonProducts: any[];
        unityPackages: UnityPackage[];
        updated_at: string;
        urlList: any[];
        version: number;
        visits: number;
    };
    worldId: string;
}

interface GetInstanceShortNameResponse {
    secureName: string;
    shortName: string;
}