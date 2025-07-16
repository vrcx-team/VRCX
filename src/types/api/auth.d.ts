// Exported API functions
export type VerifyOTP = (params: { code: string }) => Promise<{
    json: any;
    params: { code: string };
}>;

export type VerifyTOTP = (params: { code: string }) => Promise<{
    json: any;
    params: { code: string };
}>;

export type VerifyEmailOTP = (params: { code: string }) => Promise<{
    json: any;
    params: { code: string };
}>;

export type GetConfig = () => Promise<{
    json: ConfigResponse;
}>;

// Exported interfaces
export interface ConfigResponse {
    CampaignStatus: string;
    DisableBackgroundPreloads: boolean;
    VoiceEnableDegradation: boolean;
    VoiceEnableReceiverLimiting: boolean;
    accessLogsUrls: {
        Default: string;
        Pico: string;
        Quest: string;
        XRElite: string;
    };
    activeDatagramUdpQueue: number;
    address: string;
    ageVerificationInviteVisible: boolean;
    ageVerificationP: boolean;
    ageVerificationStatusVisible: boolean;
    analysisMaxRetries: number;
    analysisRetryInterval: number;
    analyticsSegment_NewUI_PctOfUsers: number;
    analyticsSegment_NewUI_Salt: string;
    announcements: any[];
    availableLanguageCodes: string[];
    availableLanguages: string[];
    avatarPerfLimiter: {
        AndroidMobile: { maxSeats: number };
        PC: { maxSeats: number };
        Pico: { maxSeats: number };
        Quest: { maxSeats: number };
        XRElite: { maxSeats: number };
        iOSMobile: { maxSeats: number };
    };
    behaviourFormat: number;
    bodyHistoryCommunityRelaadventureInternal: number;
    cdnIpv6WhereOauth: string;
    chatboxLogBufferSeconds: number;
    clientApiKey: string;
    clientBPSCeiling: number;
    clientDisconnectTimeout: number;
    clientNetDispatchThread: boolean;
    clientNetDispatchThreadMobile: boolean;
    clientQR: number;
    clientReservedPlayerBPS: number;
    clientSentCountAllowance: number;
    commitHookResponseHeadFeed: {
        alignmentDisplayVideo: number;
        timeoutFarClothRotationTracker: null | any;
    };
    constants: {
        GROUPS: {
            CAPACITY: number;
            GROUP_TRANSFER_REQUIREMENTS: string[];
            MAX_INVITES_REQUESTS: number;
            MAX_JOINED: number;
            MAX_JOINED_PLUS: number;
            MAX_LANGUAGES: number;
            MAX_LINKS: number;
            MAX_MANAGEMENT_ROLES: number;
            MAX_OWNED: number;
            MAX_ROLES: number;
        };
        INSTANCE: {
            POPULATION_BRACKETS: {
                CROWDED: { max: number; min: number };
                FEW: { max: number; min: number };
                MANY: { max: number; min: number };
            };
        };
        LANGUAGE: {
            SPOKEN_LANGUAGE_OPTIONS: {
                [key: string]: string;
            };
        };
    };
    contactEmail: string;
    copyrightEmail: string;
    copyrightFormUrl: string;
    currentPrivacyVersion: number;
    currentTOSVersion: number;
    daemonSignatureHeadpatChumpOffline: boolean;
    defaultAvatar: string;
    defaultStickerSet: string;
    devLanguageCodes: string[];
    devSdkUrl: string;
    devSdkVersion: string;
    'dis-countdown': string;
    disableAVProInProton: boolean;
    disableAvatarCopying: boolean;
    disableAvatarGating: boolean;
    disableCaptcha: boolean;
    disableCommunityLabs: boolean;
    disableCommunityLabsPromotion: boolean;
    disableEmail: boolean;
    disableEventStream: boolean;
    disableFeedbackGating: boolean;
    disableFrontendBuilds: boolean;
    disableGiftDrops: boolean;
    disableHello: boolean;
    disableOculusSubs: boolean;
    disableRegistration: boolean;
    disableSteamNetworking: boolean;
    disableTwoFactorAuth: boolean;
    disableUdon: boolean;
    disableUpgradeAccount: boolean;
    downloadLinkWindows: string;
    downloadUrls: {
        bootstrap: string;
        sdk2: string;
        'sdk3-avatars': string;
        'sdk3-worlds': string;
        vcc: string;
    };
    dynamicWorldRows: Array<{
        index: number;
        name: string;
        platform: string;
        sortHeading: string;
        sortOrder: string;
        sortOwnership: string;
        tag?: string;
    }>;
    economyLedgerBackfill: boolean;
    economyLedgerMode: string;
    economyPauseEnd: string;
    economyPauseStart: string;
    economyState: number;
    events: {
        distanceClose: number;
        distanceFactor: number;
        distanceFar: number;
        groupDistance: number;
        maximumBunchSize: number;
        notVisibleFactor: number;
        playerOrderBucketSize: number;
        playerOrderFactor: number;
        slowUpdateFactorThreshold: number;
        useDirectPlayerSerialization: boolean;
        viewSegmentLength: number;
    };
    forceUseLatestWorld: boolean;
    giftDisplayType: string;
    globalCacheVersion: number;
    globalCacheVersionDefault: number;
    googleApiClientId: string;
    homeWorldId: string;
    homepageRedirectTarget: string;
    hubWorldId: string;
    imageHostUrlList: string[];
    iosAppVersion: string[];
    iosVersion: {
        major: number;
        minor: number;
    };
    jobsEmail: string;
    localizationDeploymentRollback: number;
    managerDynamicSendKernel: number;
    maxUserEmoji: number;
    maxUserStickers: number;
    minSupportedClientBuildNumber: {
        AppStore: MinBuildInfo;
        Default: { minBuildNumber: number };
        Firebase: MinBuildInfo;
        FirebaseiOS: MinBuildInfo;
        GooglePlay: MinBuildInfo;
        PC: MinBuildInfo;
        PicoStore: MinBuildInfo;
        QuestAppLab: MinBuildInfo;
        QuestStore: MinBuildInfo;
        TestFlight: MinBuildInfo;
        XRElite: MinBuildInfo;
    };
    minimumUnityVersionForUploads: string;
    moderationEmail: string;
    moderationTimestampToolboxSoap: number;
    multigrainTokenThrottleEmbed: number;
    ninkilim: boolean;
    notAllowedToSelectAvatarInPrivateWorldMessage: string;
    offlineAnalysis: {
        android: boolean;
        standalonewindows: boolean;
    };
    onlyFpsStringGraphContent: string;
    photonNameserverOverrides: string[];
    photonPublicKeys: string[];
    'player-url-resolver-sha1': string;
    'player-url-resolver-version': string;
    pluginSamlSandwich: boolean;
    propComponentList: string[];
    publicKey: string;
    questMinimumLowMemoryThreshold: {
        [key: string]: number;
    };
    reportCategories: {
        [key: string]: {
            description?: string;
            groupOrder?: number;
            text: string;
            title?: string;
            tooltip: string;
        };
    };
    reportFormUrl: string;
    reportOptions: {
        [key: string]: {
            [key: string]: string[];
        };
    };
    reportReasons: {
        [key: string]: {
            text: string;
            tooltip: string;
        };
    };
    requireAgeVerificationBetaTag: boolean;
    scrollAppend: boolean;
    sdkDeveloperFaqUrl: string;
    sdkDiscordUrl: string;
    sdkNotAllowedToPublishMessage: string;
    sdkUnityVersion: string;
    sessionEthernetPlusStack: number;
    stringHostUrlList: string[];
    supportEmail: string;
    supportFormUrl: string;
    timeOutWorldId: string;
    timekeeping: boolean;
    timestampTagging: boolean;
    tutorialWorldId: string;
    updateRateMsMaximum: number;
    updateRateMsMinimum: number;
    updateRateMsNormal: number;
    updateRateMsUdonManual: number;
    uploadAnalysisPercent: number;
    urlList: string[];
    useReliableUdpForVoice: boolean;
    use_void_requiem_core: boolean;
    virtualFriendDocs: string;
    viveWindowsUrl: string;
    websocketMaxFriendsRefreshDelay: number;
    websocketQuickReconnectTime: number;
    websocketReconnectMaxDelay: number;
    whiteListedAssetUrls: string[];
}

// Internal response types
interface MinBuildInfo {
    minBuildNumber: number;
    redirectionAddress?: string;
}
