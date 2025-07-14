export type getInstance = (params: {
    worldId: string;
    instanceId: string;
}) => Promise<{
    json: getInstanceResponse;
    params: { worldId: string; instanceId: string };
}>;

interface getInstanceResponse {
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
    platforms: Platforms;
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
    world: World;
    worldId: string;
}

interface Platforms {
    android: number;
    ios: number;
    standalonewindows: number;
}

interface World {
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
    unityPackages: WorldUnityPackage[];
    updated_at: string;
    urlList: any[];
    version: number;
    visits: number;
}

interface WorldUnityPackage {
    assetUrl: string;
    assetVersion: number;
    created_at: string;
    id: string;
    platform: string;
    unitySortNumber: number;
    unityVersion: string;
    worldSignature: string;
}
