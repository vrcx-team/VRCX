// API functions
export type GetFriends = (params: {
    n: number;
    offline: boolean;
    offset: number;
}) => Promise<{
    json: GetFriendsResponseList;
    params: {
        n: number;
        offline: boolean;
        offset: number;
    };
}>;

// Type aliases
export type GetFriendsResponseList = GetFriendsResponseItem[] | undefined;

// API response types
interface GetFriendsResponseItem {
    bio: string;
    bioLinks: string[];
    currentAvatarImageUrl: string;
    currentAvatarTags: string[];
    currentAvatarThumbnailImageUrl: string;
    developerType: string;
    displayName: string;
    friendKey: string;
    id: string;
    imageUrl: string;
    isFriend: boolean;
    last_activity: string;
    last_login: string;
    last_mobile: string | null;
    last_platform: string;
    location: string;
    platform: string;
    profilePicOverride: string;
    profilePicOverrideThumbnail: string;
    status: string;
    statusDescription: string;
    tags: string[];
    userIcon: string;
}