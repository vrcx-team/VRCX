import { BaseAvatar } from '../common';

// Exported API functions
export type GetAvatar = (params: { avatarId: string }) => Promise<{
    json: GetAvatarResponse;
    params: { avatarId: string };
}>;

export type GetAvatars = (params: {
    n: number;
    offset: number;
    search?: string;
    userId?: string;
    user?: 'me' | 'friends';
    sort?: 'created' | 'updated' | 'order' | '_created_at' | '_updated_at';
    order?: 'ascending' | 'descending';
    releaseStatus?: 'public' | 'private' | 'hidden' | 'all';
    featured?: boolean;
}) => Promise<{
    json: any;
    params: any;
}>;

// Internal response types
interface GetAvatarResponse extends BaseAvatar {
    // Avatar-specific additional fields
    performance: {
        standalonewindows: string;
        'standalonewindows-sort': number;
    };
}

export type SaveAvatar = (params: {
    id: string;
    releaseStatus?: 'public' | 'private';
    name?: string;
    description?: string;
    imageUrl?: string;
    tags?: string[];
}) => Promise<{
    json: any;
    params: any;
}>;
