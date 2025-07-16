// API functions
export type GetGroup = (params: {
    groupId: string;
    includeRoles?: boolean;
}) => Promise<{
    json: GetGroupResponse;
    params: { groupId: string; includeRoles?: boolean };
}>;

// API response types
interface GetGroupResponse {
    badges: any[];
    bannerId: string;
    bannerUrl: string;
    createdAt: string;
    description: string;
    discriminator: string;
    galleries: any[];
    iconId: string;
    iconUrl: string;
    id: string;
    isVerified: boolean;
    joinState: string;
    languages: string[];
    links: any[];
    memberCount: number;
    memberCountSyncedAt: string;
    membershipStatus: string;
    name: string;
    onlineMemberCount: number;
    ownerId: string;
    privacy: string;
    rules: string;
    shortCode: string;
    tags: string[];
}