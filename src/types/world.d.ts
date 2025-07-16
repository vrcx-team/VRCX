export type getWorld = (params: { worldId: string }) => Promise<{
    json: getWorldResponse;
    params: { worldId: string };
}>;

interface getWorldResponse {
    authorId: string;
    authorName: string;
    capacity: number;
    created_at: string;
    defaultContentSettings: Record<string, unknown>;
    description: string;
    favorites: number;
    featured: boolean;
    heat: number;
    id: string;
    imageUrl: string;
    instances: any[];
    labsPublicationDate: string;
    name: string;
    occupants: number;
    organization: string;
    popularity: number;
    previewYoutubeId: string | null;
    privateOccupants: number;
    publicOccupants: number;
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
}

interface UnityPackage {
    assetUrl: string;
    assetUrlObject: Record<string, unknown>;
    assetVersion: number;
    created_at: string;
    id: string;
    platform: string;
    pluginUrl: string;
    pluginUrlObject: Record<string, unknown>;
    unitySortNumber: number;
    unityVersion: string;
}
