// Exported API functions
export type GetUser = (params: { userId: string }) => Promise<{
    cache?: boolean;
    json: GetUserResponse;
    ref: VrcxUser;
    params: { userId: string };
}>;

export type GetCurrentUser = (params: any) => Promise<{
    json: GetCurrentUserResponse;
    ref: VrcxCurrentUser;
    params: GetCurrentUserResponse;
}>;

export type GetCachedUser = (params: { userId: string }) => Promise<{
    cache?: boolean;
    json: GetUserResponse;
    ref: VrcxUser;
    params: { userId: string };
}>;

export type GetUsers = (params: {
    n: number;
    offset: number;
    search?: string;
    sort?: 'nuisanceFactor' | 'created' | '_created_at' | 'last_login';
    order?: 'ascending' | 'descending';
}) => Promise<{
    json: UserSearchResponse;
    params: any;
}>;

export type AddUserTags = (params: string[]) => Promise<{
    json: GetCurrentUserResponse;
    params: string[];
}>;

// Exported interfaces
export interface VrcxUser extends GetUserResponse {
    $location: {};
    $location_at: number;
    $online_for: number;
    $travelingToTime: number;
    $offline_for: number;
    $active_for: number;
    $isVRCPlus: boolean;
    $isModerator: boolean;
    $isTroll: boolean;
    $isProbableTroll: boolean;
    $trustLevel: string;
    $trustClass: string;
    $userColour: string;
    $trustSortNum: number;
    $languages: string[];
    $joinCount: number;
    $timeSpent: number;
    $lastSeen: string;
    $nickName: string;
    $previousLocation: string;
    $customTag: string;
    $customTagColour: string;
    $friendNumber: number;
    $lastFetch: number;
    $moderations: moderations;
}

export interface moderations {
    isBlocked: boolean;
    isMuted: boolean;
    isAvatarInteractionDisabled: boolean;
    isChatBoxMuted: boolean;
}

export interface VrcxCurrentUser extends GetCurrentUserResponse {
    $online_for?: number;
    $offline_for?: number | null;
    $location_at?: number;
    $travelingToTime?: number;
    $previousAvatarSwapTime?: number | null;
    $homeLocation?: {};
    $isVRCPlus?: boolean;
    $isModerator?: boolean;
    $isTroll?: boolean;
    $isProbableTroll?: boolean;
    $trustLevel?: string;
    $trustClass?: string;
    $userColour?: string;
    $trustSortNum?: number;
    $languages?: string[];
    $locationTag?: string;
    $travelingToLocation?: string;
}

// Type aliases
type UserSearchResponse = UserSearchResponseItem[];

// Internal response types
interface UserSearchResponseItem {
    bio: string;
    bioLinks: string[];
    currentAvatarImageUrl: string;
    currentAvatarTags: any[];
    currentAvatarThumbnailImageUrl: string;
    developerType: string;
    displayName: string;
    id: string;
    isFriend: boolean;
    last_platform: string;
    profilePicOverride: string;
    pronouns?: string;
    status: string;
    statusDescription: string;
    tags: string[];
    userIcon: string;
}

interface GetUserResponse {
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
    friendRequestStatus?: string;
    id: string;
    instanceId?: string;
    isFriend: boolean;
    last_activity: string;
    last_login: string;
    last_mobile: string | null;
    last_platform: string;
    location?: string;
    note?: string;
    platform?: string;
    profilePicOverride: string;
    profilePicOverrideThumbnail: string;
    pronouns: string;
    state: string;
    status: string;
    statusDescription: string;
    tags: string[];
    travelingToInstance?: string;
    travelingToLocation?: string;
    travelingToWorld?: string;
    userIcon: string;
    worldId?: string;
}

interface GetCurrentUserResponse extends GetUserResponse {
    acceptedPrivacyVersion: number;
    acceptedTOSVersion: number;
    accountDeletionDate: string | null;
    accountDeletionLog: string | null;
    activeFriends: string[];
    currentAvatar: string;
    emailVerified: boolean;
    fallbackAvatar: string;
    friendGroupNames: string[];
    friends: string[];
    googleId: string;
    hasBirthday: boolean;
    hasEmail: boolean;
    hasLoggedInFromClient: boolean;
    hasPendingEmail: boolean;
    hideContentFilterSettings: boolean;
    homeLocation: string;
    isAdult: boolean;
    isBoopingEnabled: boolean;
    obfuscatedEmail: string;
    obfuscatedPendingEmail: string;
    oculusId: string;
    offlineFriends: string[];
    onlineFriends: string[];
    pastDisplayNames: { displayName: string; updated_at: string }[];
    picoId: string;
    presence?: {
        avatarThumbnail: string;
        currentAvatarTags: string;
        debugflag: string;
        displayName: string;
        groups: string[];
        id: string;
        instance: string;
        instanceType: string;
        platform: string;
        profilePicOverride: string;
        status: string;
        travelingToInstance: string;
        travelingToWorld: string;
        userIcon: string;
        world: string;
    };
    queuedInstance: string | null;
}
