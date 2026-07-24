export interface publicProfile {
    ageVerificationStatus: string;
    ageVerified: boolean;
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
    themeId: string;
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
