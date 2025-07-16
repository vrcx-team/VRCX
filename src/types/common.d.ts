// Common interfaces
export interface UnityPackage {
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

// Base content types
export interface BaseContent {
    id: string;
    name: string;
    authorId: string;
    authorName: string;
    description: string;
    imageUrl: string;
    thumbnailImageUrl: string;
    created_at: string;
    updated_at: string;
    releaseStatus: string;
    tags: string[];
    featured: boolean;
    unityPackages: UnityPackage[];
}

// Base Avatar - core avatar properties
export interface BaseAvatar extends BaseContent {
    acknowledgements: string | null;
    pendingUpload: boolean;
    performance: {
        [platform: string]: string | number;
    };
    searchable: boolean;
    styles: {
        primary: string | null;
        secondary: string | null;
    };
    unityPackageUrl: string;
    unityPackageUrlObject: {
        unityPackageUrl: string;
    };
    version: number;
}

// Base World - core world properties
export interface BaseWorld extends BaseContent {
    capacity: number;
    recommendedCapacity: number;
    favorites: number;
    heat: number;
    popularity: number;
    previewYoutubeId: string | null;
    publicationDate: string;
    labsPublicationDate: string;
    organization: string;
    udonProducts: any[];
}