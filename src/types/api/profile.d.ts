export interface publicProfile {
    ageVerificationStatus: string;
    ageVerified: boolean;
    backgroundTextureId: string;
    backgroundType: string;
    badges: {
        badgeDescription: string;
        badgeId: string;
        badgeImageUrl: string;
        badgeName: string;
        showcased: boolean;
    }[];
    bannerColor: string;
    bannerType: 'avatarBanner' | 'color' | 'customImage';
    bannerUrl: string;
    bio: string;
    bioLinks: string[];
    displayName: string;
    hasVrcPlus: boolean;
    iconFrame: string;
    iconUrl: string;
    id: string;
    isEconomyCreator: boolean;
    languages: string[];
    nameplateEffect: string;
    profileEffect: string;
    pronouns: string;
    representedGroup: {
        bannerUrl: string;
        iconUrl: string;
        id: string;
        name: string;
    } | null;
    themeButtonColor: string;
    themeIconColor: string;
    themeId: string;
    themeSubtextColor: string;
    trustTags: string[];
}

export interface privateProfile {
    activity: {
        instanceId: string;
        last_activity: string;
        last_login: string;
        location: string;
        platform: string;
        state: string;
        travelingToInstance: string;
        travelingToLocation: string;
        travelingToWorld: string;
        worldId: string;
    };
    id: string;
    isFriend: boolean;
    note: string;
    status: string;
    statusDescription: string;
}

export interface selfProfile extends publicProfile {
    backgroundGradientBottom: string;
    backgroundGradientTop: string;
    backgroundTemplateId: string;
    bannerCustomUrl: string;
    currentAvatar: string;
    currentAvatarAuthorName: string;
    currentAvatarImageUrl: string;
    currentAvatarName: string;
    currentAvatarTags: string[];
    currentAvatarThumbnailImageUrl: string;
    status: string;
    statusDescription: string;
    themeButtonColor: string;
    themeIconColor: string;
    themeId: string;
    themeSubtextColor: string;
    themes: {
        buttonColor: string;
        iconColor: string;
        id: string;
        name: string;
        subtextColor: string;
    }[];
    userIcon: string;
}
