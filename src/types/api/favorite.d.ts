import { BaseAvatar, BaseWorld } from '../common';

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
    userId?: string;
    tag?: string;
}) => Promise<{
    json: GetFavoriteWorldsResponseList;
    params: {
        n: number;
        offset: number;
        userId?: string;
        tag?: string;
    };
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

interface GetFavoriteAvatarsResponseItem extends BaseAvatar {
    // Favorite avatar specific fields
    favoriteGroup: string;
    favoriteId: string;
    styles: {
        primary: null;
        secondary: null;
    };
    unityPackageUrlObject: Record<string, any>;
}

interface GetFavoriteWorldsResponseItem extends BaseWorld {
    // Favorite world specific fields
    occupants?: number;
    visits: number;
    version: number;
    urlList: string[];
    defaultContentSettings: Record<string, any>;
    [key: string]: any;
}

interface AddFavoriteResponse {
    favoriteId: string;
    id: string;
    type: 'world' | 'friend' | 'avatar';
    tags: string[];
}
