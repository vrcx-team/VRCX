export type getGroup = (params: {
    groupId: string;
    includeRoles?: boolean;
}) => Promise<{
    json: getGroupResponse;
    params: { groupId: string; includeRoles?: boolean };
}>;

interface Group {
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
