/// <reference types="node" />
/// <reference types="jest" />

declare global {
    const WINDOWS: boolean;
    const LINUX: boolean;

    interface Window {
        $app: any;
        AppApi: AppApi;
        AppApiVr: AppApiVr;
        WebApi: WebApi;
        VRCXStorage: VRCXStorage;
        SQLite: SQLite;
        LogWatcher: LogWatcher;
        Discord: Discord;
        AssetBundleManager: AssetBundleManager;
        webApiService: webApiService;
        request: any;
        configRepository: any;
        datebase: any;
        gameLogService: any;
        crypto: any;
        sqliteService: any;
        interopApi: {
            callDotNetMethod: (
                className: any,
                methodName: any,
                args: any
            ) => Promise<any>;
        };
        electron: {
            openFileDialog: () => Promise<string>;
            openDirectoryDialog: () => Promise<string>;
            desktopNotification: (
                displayName: string,
                body?: string,
                image?: string
            ) => Promise<void>;
            onWindowPositionChanged: (
                Function: (
                    event: any,
                    position: { x: number; y: number }
                ) => void
            ) => void;
            onWindowSizeChanged: (
                Function: (
                    event: any,
                    size: { width: number; height: number }
                ) => void
            ) => void;
            onWindowStateChange: (
                Function: (event: any, state: { windowState: any }) => void
            ) => void;
            restartApp: () => Promise<void>;
            getWristOverlayWindow: () => Promise<boolean>;
            getHmdOverlayWindow: () => Promise<boolean>;
            updateVr: (
                active: bool,
                hmdOverlay: bool,
                wristOverlay: bool,
                menuButton: bool,
                overlayHand: int
            ) => Promise<void>;
        };
        __APP_GLOBALS__: AppGlobals;
    }

    interface AppGlobals {
        debug: boolean;
        debugWebSocket: boolean;
        debugUserDiff: boolean;
        debugPhotonLogging: boolean;
        debugGameLog: boolean;
        debugWebRequests: boolean;
        debugFriendState: boolean;
        errorNoty: any;
        dontLogMeOut: boolean;
        endpointDomain: string;
        endpointDomainVrchat: string;
        websocketDomain: string;
        websocketDomainVrchat: string;
    }

    const CefSharp: {
        PostMessage: (message: any) => void;
        BindObjectAsync: (...args: string[]) => Promise<any>;
        BindObject: (name: string) => any;
        ExecuteScriptAsync: (script: string) => Promise<any>;
        ExecuteScript: (script: string) => any;
        RemoveObjectFromCache?: (name: string) => void;
        DeleteBoundObject?: (name: string) => void;
    };

    const VRCXStorage: {
        Get(key: string): Promise<string>;
        Set(key: string, value: string): Promise<void>;
        Remove(key: string): Promise<void>;
        GetAll(): Promise<string>;
        Flush(): Promise<void>;
        Save(): Promise<void>;
        Load(): Promise<void>;
        GetArray(key: string): Promise<any[]>;
        SetArray(key: string, value: any[]): Promise<void>;
        GetObject(key: string): Promise<object>;
        SetObject(key: string, value: object): Promise<void>;
    };

    const SQLite: {
        Execute: (
            sql: string,
            args: string
        ) => Promise<{ Item1: any; Item2: any[] }>;
        ExecuteJson: (sql: string, args: string) => Promise<string>;
        ExecuteNonQuery: (sql: string, args: string) => Promise<void>;
    };

    const LogWatcher: {
        Get(): Promise<Array<[string, string, string, ...any[]]>>;
        SetDateTill(date: string): Promise<void>;
        GetLogLines(): Array<any>;
        Reset(): Promise<void>;
    };

    const Discord: {
        SetAssets(
            details: string,
            state: string,
            detailsUrl: string,
            bigIcon: string,
            bigIconText: string,
            smallIcon: string,
            smallIconText: string,
            startTime: number,
            endTime: number,
            partyId: string,
            partySize: number,
            partyMaxSize: number,
            buttonText: string,
            buttonUrl: string,
            appId: string,
            activityType: number
        ): Promise<void>;
        SetActive(active: boolean): Promise<boolean>;
    };

    const AppApi: {
        // Basic App Functions
        ShowDevTools(): Promise<void>;
        SetVR(
            active: boolean,
            hmdOverlay: boolean,
            wristOverlay: boolean,
            menuButton: boolean,
            overlayHand: number
        ): Promise<void>;
        RefreshVR(): Promise<void>;
        RestartVR(): Promise<void>;
        SetZoom(zoomLevel: number): Promise<void>;
        GetZoom(): Promise<number>;
        DesktopNotification(
            boldText: string,
            text?: string,
            image?: string
        ): Promise<void>;
        RestartApplication(isUpgrade: boolean): Promise<void>;
        CheckForUpdateExe(): Promise<boolean>;
        ExecuteAppFunction(key: string, json: string): Promise<void>;
        ExecuteVrFeedFunction(key: string, json: string): Promise<void>;
        ExecuteVrOverlayFunction(key: string, json: string): Promise<void>;
        FocusWindow(): Promise<void>;
        ChangeTheme(value: number): Promise<void>;
        DoFunny(): Promise<void>;
        GetClipboard(): Promise<string>;
        SetStartup(enabled: boolean): Promise<void>;
        CopyImageToClipboard(path: string): Promise<void>;
        FlashWindow(): Promise<void>;
        SetUserAgent(): Promise<void>;
        IsRunningUnderWine(): Promise<boolean>;

        // Common Functions
        MD5File(blob: string): Promise<string>;
        GetColourFromUserID(userId: string): Promise<number>;
        SignFile(blob: string): Promise<string>;
        FileLength(blob: string): Promise<string>;
        OpenLink(url: string): Promise<void>;
        GetLaunchCommand(): Promise<string>;
        IPCAnnounceStart(): Promise<void>;
        SendIpc(type: string, data: string): Promise<void>;
        CustomCss(): Promise<string>;
        CustomScript(): Promise<string>;
        CurrentCulture(): Promise<string>;
        CurrentLanguage(): Promise<string>;
        GetVersion(): Promise<string>;
        VrcClosedGracefully(): Promise<boolean>;
        GetColourBulk(userIds: string[]): Promise<Record<string, number>>;
        SetAppLauncherSettings(
            enabled: boolean,
            killOnExit: boolean
        ): Promise<void>;
        GetFileBase64(path: string): Promise<string | null>;

        // Folders
        GetVRChatAppDataLocation(): Promise<string>;
        GetVRChatPhotosLocation(): Promise<string>;
        GetUGCPhotoLocation(path?: string): Promise<string>;
        GetVRChatScreenshotsLocation(): Promise<string>;
        GetVRChatCacheLocation(): Promise<string>;
        OpenVrcxAppDataFolder(): Promise<boolean>;
        OpenVrcAppDataFolder(): Promise<boolean>;
        OpenVrcPhotosFolder(): Promise<boolean>;
        OpenUGCPhotosFolder(ugcPath?: string): Promise<boolean>;
        OpenVrcScreenshotsFolder(): Promise<boolean>;
        OpenCrashVrcCrashDumps(): Promise<boolean>;
        OpenShortcutFolder(): Promise<void>;
        OpenFolderAndSelectItem(
            path: string,
            isFolder?: boolean
        ): Promise<void>;
        OpenFolderSelectorDialog(defaultPath?: string): Promise<string>;
        OpenFileSelectorDialog(
            defaultPath?: string,
            defaultExt?: string,
            defaultFilter?: string
        ): Promise<string>;

        // Game Handler
        OnProcessStateChanged(monitoredProcess: any): Promise<void>;
        CheckGameRunning(): Promise<void>;
        IsGameRunning(): Promise<boolean>;
        IsSteamVRRunning(): Promise<boolean>;
        QuitGame(): Promise<number>;
        StartGame(arguments: string): Promise<boolean>;
        StartGameFromPath(path: string, arguments: string): Promise<boolean>;

        // Registry
        GetVRChatRegistryKey(key: string): Promise<any>;
        GetVRChatRegistryKeyString(key: string): Promise<string>;
        SetVRChatRegistryKey(
            key: string,
            value: any,
            typeInt: number
        ): Promise<boolean>;
        GetVRChatRegistry(): Promise<Record<string, Record<string, any>>>;
        SetVRChatRegistry(json: string): Promise<void>;
        HasVRChatRegistryFolder(): Promise<boolean>;
        DeleteVRChatRegistryFolder(): Promise<void>;
        ReadVrcRegJsonFile(filepath: string): Promise<string>;
        GetVRChatRegistryJson: () => Promise<string>;

        // Image Functions
        PopulateImageHosts(json: string): Promise<void>;
        GetImage(url: string, fileId: string, version: string): Promise<string>;
        ResizeImageToFitLimits(base64data: string): Promise<string>;
        CropAllPrints(ugcFolderPath: string): Promise<void>;
        CropPrintImage(path: string): Promise<boolean>;
        SavePrintToFile(
            url: string,
            ugcFolderPath: string,
            monthFolder: string,
            fileName: string
        ): Promise<string>;
        SaveStickerToFile(
            url: string,
            ugcFolderPath: string,
            monthFolder: string,
            fileName: string
        ): Promise<string>;
        SaveEmojiToFile(
            url: string,
            ugcFolderPath: string,
            monthFolder: string,
            fileName: string
        ): Promise<string>;

        // Screenshot
        AddScreenshotMetadata(
            path: string,
            metadataString: string,
            worldId: string,
            changeFilename?: boolean
        ): Promise<string>;
        GetExtraScreenshotData(
            path: string,
            carouselCache: boolean
        ): Promise<string>;
        GetScreenshotMetadata(path: string): Promise<string>;
        FindScreenshotsBySearch(
            searchQuery: string,
            searchType?: number
        ): Promise<string>;
        GetLastScreenshot(): Promise<string>;
        DeleteScreenshotMetadata(path: string): Promise<boolean>;
        DeleteAllScreenshotMetadata(): Promise<void>;

        // Moderations
        GetVRChatModerations(
            currentUserId: string
        ): Promise<Record<string, number> | null>;
        GetVRChatUserModeration(
            currentUserId: string,
            userId: string
        ): Promise<number>;
        SetVRChatUserModeration(
            currentUserId: string,
            userId: string,
            type: number
        ): Promise<boolean>;

        // VRC Config
        ReadConfigFile(): Promise<string>;
        ReadConfigFileSafe(): Promise<string>;
        WriteConfigFile(json: string): Promise<void>;

        // Update
        DownloadUpdate(
            fileUrl: string,
            hashString: string,
            downloadSize: number
        ): Promise<void>;
        CancelUpdate(): Promise<void>;
        CheckUpdateProgress(): Promise<number>;

        // Notifications
        XSNotification(
            title: string,
            content: string,
            timeout: number,
            opacity: number,
            image?: string
        ): Promise<void>;
        OVRTNotification(
            hudNotification: boolean,
            wristNotification: boolean,
            title: string,
            body: string,
            timeout: number,
            opacity: number,
            image?: string
        ): Promise<void>;
    };

    const AppApiVr: {
        Init(): Promise<void>;
        VrInit(): Promise<void>;
        ToggleSystemMonitor(enabled: boolean): Promise<void>;
        CpuUsage(): Promise<number>;
        GetVRDevices(): Promise<string[][]>;
        GetUptime(): Promise<number>;
        CurrentCulture(): Promise<string>;
        CustomVrScript(): Promise<string>;
        IsRunningUnderWine(): Promise<boolean>;
        GetExecuteVrFeedFunctionQueue(): Promise<Map<string, string>>;
        GetExecuteVrOverlayFunctionQueue(): Promise<Map<string, string>>;
    };

    const WebApi: {
        ClearCookies(): Promise<void>;
        GetCookies(): Promise<string>;
        SetCookies(cookie: string): Promise<void>;
        Execute(options: any): Promise<{ Item1: number; Item2: string }>;
        ExecuteJson(requestJson: string): Promise<string>;
    };

    const AssetBundleManager: {
        SweepCache(): Promise<string>;
        GetCacheSize(): Promise<number>;
        GetVRChatCacheFullLocation(
            fileId: string,
            fileVersion: number,
            variant: string,
            variantVersion: number
        ): Promise<string>;
        CheckVRChatCache(
            fileId: string,
            fileVersion: number,
            variant: string,
            variantVersion: number
        ): Promise<{ Item1: number; Item2: boolean; Item3: string }>;
        DeleteCache(
            fileId: string,
            fileVersion: number,
            variant: string,
            variantVersion: number
        ): Promise<void>;
        DeleteAllCache: () => Promise<void>;
    };

    const webApiService: {
        clearCookies(): Promise<void>;
        getCookies(): Promise<string>;
        setCookies(cookie: string): Promise<void>;
        execute(options: {
            url: string;
            method?: string;
            uploadFilePUT?: boolean;
            fileData?: string;
            fileMIME?: string;
            headers?: Record<string, string>;
            data?: any;
        }): Promise<{ status: number; data: string }>;
    };
}

export {};
