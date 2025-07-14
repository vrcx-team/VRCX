export type getUser = (params: { userId: string }) => Promise<{
    json: getUserResponse;
    params: { userId: string };
}>;

interface getUserResponse {
    ageVerificationStatus: string;
    ageVerified: boolean;
    allowAvatarCopying: boolean;
    badges: {
        badgeDescription: string;
        badgeId: string;
        badgeImageUrl: string;
        badgeName: string;
        showcased: boolean;
    }[];
    bio: string;
    bioLinks: string[];
    currentAvatarImageUrl: string;
    currentAvatarTags: string[];
    currentAvatarThumbnailImageUrl: string;
    date_joined: string;
    developerType: string;
    displayName: string;
    friendKey: string;
    friendRequestStatus: string;
    id: string;
    instanceId: string;
    isFriend: boolean;
    last_activity: string;
    last_login: string;
    last_mobile: string | null;
    last_platform: string;
    location: string;
    note: string;
    platform: string;
    profilePicOverride: string;
    profilePicOverrideThumbnail: string;
    pronouns: string;
    state: string;
    status: string;
    statusDescription: string;
    tags: string[];
    travelingToInstance: string;
    travelingToLocation: string;
    travelingToWorld: string;
    userIcon: string;
    worldId: string;
}
