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