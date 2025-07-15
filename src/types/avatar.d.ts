export type getAvatar = (params: { avatarId: string }) => Promise<{
    json: getAvatarResponse;
    params: { avatarId: string };
}>;

interface getAvatarResponse {
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
    performance: Performance;
    releaseStatus: string;
    searchable: boolean;
    styles: Styles;
    tags: string[];
    thumbnailImageUrl: string;
    unityPackageUrl: string;
    unityPackageUrlObject: UnityPackageUrlObject;
    unityPackages: UnityPackage[];
    updated_at: string;
    version: number;
}

interface Performance {
    standalonewindows: string;
    'standalonewindows-sort': number;
}

interface Styles {
    primary: string | null;
    secondary: string | null;
}

interface UnityPackageUrlObject {
    unityPackageUrl: string;
}

interface UnityPackage {
    assetUrl: string;
    assetVersion: number;
    created_at: string;
    id: string;
    performanceRating: string;
    platform: string;
    scanStatus: string;
    unitySortNumber: number;
    unityVersion: string;
    variant: string;
}
