import { BaseWorld } from '../common';

// Exported API functions
export type GetInstance = (params: {
    worldId: string;
    instanceId: string;
}) => Promise<{
    json: GetInstanceResponse;
    params: { worldId: string; instanceId: string };
}>;

export type CreateInstance = (params: {
    worldId: string;
    type: string;
    region: string;
    ownerId: string;
    roleIds?: string[];
    groupAccessType?: string;
    queueEnabled?: boolean;
}) => Promise<{
    json: any;
    params: any;
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

// Internal response types
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
    world: BaseWorld & {
        defaultContentSettings: Record<string, any>;
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
