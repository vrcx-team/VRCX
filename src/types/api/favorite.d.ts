import { UnityPackage } from '../common';

// API functions
export type GetFavorites = (params: { n: number; offset: number }) => Promise<{
    json: GetFavoritesResponseList;
    params: { n: number; offset: number };
}>;

export type GetFavoriteAvatars = (params: {
    n: number;
    offset: number;
    tag: string;
}) => Promise<{
    json: GetFavoriteAvatarsResponseList;
    params: { n: number; offset: number; tag: string };
}>;

export type GetFavoriteWorlds = (params: {
    n: number;
    offset: number;
}) => Promise<{
    json: GetFavoriteWorldsResponseList;
    params: { n: number; offset: number };
}>;

export type AddFavorite = (params: {
    type: string;
    favoriteId: string;
    tags: string;
}) => Promise<{
    json: AddFavoriteResponse;
    params: {
        type: string;
        favoriteId: string;
        tags: string;
    };
}>;

// Type aliases
export type GetFavoritesResponseList = GetFavoritesResponseItem[] | undefined;
export type GetFavoriteAvatarsResponseList = GetFavoriteAvatarsResponseItem[];
export type GetFavoriteWorldsResponseList = GetFavoriteWorldsResponseItem[];

// API response types
interface GetFavoritesResponseItem {
    favoriteId: string;
    id: string;
    tags: string[];
    type: string;
}

interface GetFavoriteAvatarsResponseItem {
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
    performance: {
        [platform: string]: string | number;
    };
    releaseStatus: string;
    searchable: boolean;
    styles: {
        primary: null;
        secondary: null;
    };
    tags: any[];
    thumbnailImageUrl: string;
    unityPackageUrl: string;
    unityPackageUrlObject: Record<string, any>;
    unityPackages: UnityPackage[];
    updated_at: string;
    version: number;
}

interface GetFavoriteWorldsResponseItem {
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

interface AddFavoriteResponse {
    favoriteId: string;
    id: string;
    type: 'world' | 'friend' | 'avatar';
    tags: string[];
}