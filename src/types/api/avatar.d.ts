import { UnityPackage } from '../common';

// API functions
export type GetAvatar = (params: { avatarId: string }) => Promise<{
    json: GetAvatarResponse;
    params: { avatarId: string };
}>;

// API response types
interface GetAvatarResponse {
    acknowledgements: string | null;
    authorId: string;
    authorName: string;
    created_at: string;
    description: string;
    featured: boolean;
    id: string;
    imageUrl: string;
    name: string;
    pendingUpload: boolean;
    performance: {
        standalonewindows: string;
        'standalonewindows-sort': number;
    };
    releaseStatus: string;
    searchable: boolean;
    styles: {
        primary: string | null;
        secondary: string | null;
    };
    tags: string[];
    thumbnailImageUrl: string;
    unityPackageUrl: string;
    unityPackageUrlObject: {
        unityPackageUrl: string;
    };
    unityPackages: UnityPackage[];
    updated_at: string;
    version: number;
}