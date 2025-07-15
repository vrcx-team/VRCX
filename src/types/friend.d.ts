export type getFriends = (params: {
    n: number;
    offline: boolean;
    offset: number;
}) => Promise<{
    json: getFriendsResponseList;
    params: {
        n: number;
        offline: boolean;
        offset: number;
    };
}>;

type getFriendsResponseList = getFriendsResponseItem[] | undefined;

interface getFriendsResponseItem {
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
