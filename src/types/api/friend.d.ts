// Exported API functions
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

export type SendFriendRequest = (params: { userId: string }) => Promise<{
    json: any;
    params: { userId: string };
}>;

export type CancelFriendRequest = (params: { userId: string }) => Promise<{
    json: any;
    params: { userId: string };
}>;

export type DeleteFriend = (params: { userId: string }) => Promise<{
    json: any;
    params: { userId: string };
}>;

export type GetFriendStatus = (params: { userId: string }) => Promise<{
    json: FriendStatusResponse;
    params: { userId: string };
}>;

export type DeleteHiddenFriendRequest = (
    params: any,
    userId: string
) => Promise<{
    json: any;
    params: any;
    userId: string;
}>;

// Exported interfaces
export interface FriendStatusResponse {
    isFriend: boolean;
    outgoingRequest: boolean;
    incomingRequest: boolean;
}

// Type aliases
type GetFriendsResponseList = GetFriendsResponseItem[] | undefined;

// Internal response types
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
