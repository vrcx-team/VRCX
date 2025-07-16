export type getFavorites = (params: { n: number; offset: number }) => Promise<{
    json: getFavoritesResponseList;
    params: { n: number; offset: number };
}>;

export type getFavoriteAvatars = (params: {
    n: number;
    offset: number;
    tag: string;
}) => Promise<{
    json: getFavoriteAvatarsResponseList;
    params: { n: number; offset: number; tag: string };
}>;

export type getFavoriteWorlds = (params: {
    n: number;
    offset: number;
}) => Promise<{
    json: getFavoriteWorldsResponseList;
    params: { n: number; offset: number };
}>;

export type addFavorite = (params: {
    type: string;
    favoriteId: string;
    tags: string;
}) => Promise<{
    json: addFavoriteResponse;
    params: {
        type: string;
        favoriteId: string;
        tags: string;
    };
}>;

interface getFavoritesResponseItem {
    favoriteId: string;
    id: string;
    tags: string[];
    type: string;
}

type getFavoritesResponseList = getFavoritesResponseItem[] | undefined;

interface UnityPackage {
    assetVersion: number;
    created_at: string;
    id: string;
    performanceRating?: string;
    platform: string;
    scanStatus?: string;
    unityVersion: string;
    variant: string;
    impostorizerVersion?: string;
    assetUrl: string;
    unitySortNumber?: number;
    worldSignature?: string;
    [key: string]: any;
}

interface Performance {
    [platform: string]: string | number;
}

interface Styles {
    primary: null;
    secondary: null;
}

interface getFavoriteAvatarsResponseItem {
    acknowledgements?: null | string;
    authorId: string;
    authorName: string;
    created_at: string;
    description: string;
    favoriteGroup: string;
    favoriteId: string;
    featured: boolean;
    id: string;
    imageUrl: string;
    name: string;
    performance: Performance;
    releaseStatus: string;
    searchable: boolean;
    styles: Styles;
    tags: any[];
    thumbnailImageUrl: string;
    unityPackageUrl: string;
    unityPackageUrlObject: Record<string, any>;
    unityPackages: UnityPackage[];
    updated_at: string;
    version: number;
}

type getFavoriteAvatarsResponseList = getFavoriteAvatarsResponseItem[];

interface getFavoriteWorldsResponseItem {
    id: string;
    name: string;
    authorId: string;
    authorName: string;
    description: string;
    capacity: number;
    recommendedCapacity?: number;
    occupants?: number;
    favorites: number;
    visits: number;
    heat: number;
    popularity: number;
    created_at: string;
    updated_at: string;
    publicationDate?: string;
    releaseStatus: string;
    version: number;
    tags: string[];
    imageUrl: string;
    thumbnailImageUrl: string;
    urlList: string[];
    defaultContentSettings: Record<string, any>;
    unityPackages: UnityPackage[];
    [key: string]: any;
}

type getFavoriteWorldsResponseList = getFavoriteWorldsResponseItem[];

interface addFavoriteResponse {
    favoriteId: string;
    id: string;
    type: 'world' | 'friend' | 'avatar';
    tags: string[];
}
