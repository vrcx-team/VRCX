export type getUser = (params: { userId: string }) => Promise<{
    cache?: boolean;
    json: getUserResponse;
    ref: vrcxUser;
    params: { userId: string };
}>;

export interface vrcxUser extends getUserResponse {
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
}

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

export type getCurrentUser = (any) => Promise<{
    json: getCurrentUserResponse;
    ref: vrcxCurrentUser;
    params: getCurrentUserResponse;
}>;

export interface vrcxCurrentUser extends getCurrentUserResponse {
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

interface getCurrentUserResponse extends getUserResponse {
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
    pastDisplayNames: { displayName: string; dateChanged: string }[];
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
