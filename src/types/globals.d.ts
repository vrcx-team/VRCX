declare global {
    const WINDOWS: boolean;
    const LINUX: boolean;

    const CefSharp: {
        PostMessage: (message: any) => void;
        BindObjectAsync: (name: string) => Promise<any>;
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
        GetLogLinesL(): Array<any>;
        Reset(): Promise<void>;
    };

    const Discord: {
        SetTimestamps(startTimestamp: number, endTimestamp: number): void;
        SetAssets(
            bigIcon: string,
            bigIconText: string,
            smallIcon: string,
            smallIconText: string,
            partyId: string,
            partySize: number,
            partyMaxSize: number,
            buttonText: string,
            buttonUrl: string,
            appId: string,
            activityType: number
        ): void;
        SetText(details: string, state: string): void;
        SetActive(active: boolean): Promise<boolean>;
    };

    const AppApi: {
        // Basic App Functions
        ShowDevTools(): void;
        SetVR(
            active: boolean,
            hmdOverlay: boolean,
            wristOverlay: boolean,
            menuButton: boolean,
            overlayHand: number
        ): void;
        RefreshVR(): void;
        RestartVR(): void;
        SetZoom(zoomLevel: number): void;
        GetZoom(): Promise<number>;
        DesktopNotification(
            boldText: string,
            text?: string,
            image?: string
        ): void;
        RestartApplication(isUpgrade: boolean): void;
        CheckForUpdateExe(): boolean;
        ExecuteAppFunction(key: string, json: string): void;
        ExecuteVrFeedFunction(key: string, json: string): void;
        ExecuteVrOverlayFunction(key: string, json: string): void;
        FocusWindow(): void;
        ChangeTheme(value: number): void;
        DoFunny(): void;
        GetClipboard(): string;
        SetStartup(enabled: boolean): void;
        CopyImageToClipboard(path: string): void;
        FlashWindow(): void;
        SetUserAgent(): void;
        IsRunningUnderWine(): boolean;

        // Common Functions
        MD5File(blob: string): string;
        GetColourFromUserID(userId: string): number;
        SignFile(blob: string): string;
        FileLength(blob: string): string;
        OpenLink(url: string): void;
        GetLaunchCommand(): string;
        IPCAnnounceStart(): void;
        SendIpc(type: string, data: string): void;
        CustomCssPath(): string;
        CustomScriptPath(): string;
        CurrentCulture(): string;
        CurrentLanguage(): string;
        GetVersion(): string;
        VrcClosedGracefully(): boolean;
        GetColourBulk(userIds: string[]): Record<string, number>;
        SetAppLauncherSettings(enabled: boolean, killOnExit: boolean): void;
        GetFileBase64(path: string): string | null;

        // Folders
        GetVRChatAppDataLocation(): string;
        GetVRChatPhotosLocation(): string;
        GetUGCPhotoLocation(path?: string): string;
        GetVRChatScreenshotsLocation(): string;
        GetVRChatCacheLocation(): string;
        OpenVrcxAppDataFolder(): boolean;
        OpenVrcAppDataFolder(): boolean;
        OpenVrcPhotosFolder(): boolean;
        OpenUGCPhotosFolder(ugcPath?: string): boolean;
        OpenVrcScreenshotsFolder(): boolean;
        OpenCrashVrcCrashDumps(): boolean;
        OpenShortcutFolder(): void;
        OpenFolderAndSelectItem(path: string, isFolder?: boolean): void;
        OpenFolderSelectorDialog(defaultPath?: string): Promise<string>;
        OpenFileSelectorDialog(
            defaultPath?: string,
            defaultExt?: string,
            defaultFilter?: string
        ): Promise<string>;

        // Game Handler
        OnProcessStateChanged(monitoredProcess: any): void;
        CheckGameRunning(): void;
        IsGameRunning(): boolean;
        IsSteamVRRunning(): boolean;
        QuitGame(): number;
        StartGame(arguments: string): boolean;
        StartGameFromPath(path: string, arguments: string): boolean;

        // Registry
        GetVRChatRegistryKey(key: string): any;
        GetVRChatRegistryKeyString(key: string): string;
        SetVRChatRegistryKey(key: string, value: any, typeInt: number): boolean;
        GetVRChatRegistry(): Record<string, Record<string, any>>;
        SetVRChatRegistry(json: string): void;
        HasVRChatRegistryFolder(): boolean;
        DeleteVRChatRegistryFolder(): void;
        ReadVrcRegJsonFile(filepath: string): string;

        // Image Functions
        PopulateImageHosts(json: string): void;
        GetImage(url: string, fileId: string, version: string): Promise<string>;
        ResizeImageToFitLimits(base64data: string): string;
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
        ): string;
        GetExtraScreenshotData(path: string, carouselCache: boolean): string;
        GetScreenshotMetadata(path: string): string;
        FindScreenshotsBySearch(
            searchQuery: string,
            searchType?: number
        ): string;
        GetLastScreenshot(): string;

        // Moderations
        GetVRChatModerations(
            currentUserId: string
        ): Record<string, number> | null;
        GetVRChatUserModeration(currentUserId: string, userId: string): number;
        SetVRChatUserModeration(
            currentUserId: string,
            userId: string,
            type: number
        ): boolean;

        // VRC Config
        ReadConfigFile(): string;
        ReadConfigFileSafe(): string;
        WriteConfigFile(json: string): void;

        // Update
        DownloadUpdate(
            fileUrl: string,
            fileName: string,
            hashUrl: string,
            downloadSize: number
        ): Promise<void>;
        CancelUpdate(): void;
        CheckUpdateProgress(): number;

        // Notifications
        XSNotification(
            title: string,
            content: string,
            timeout: number,
            opacity: number,
            image?: string
        ): void;
        OVRTNotification(
            hudNotification: boolean,
            wristNotification: boolean,
            title: string,
            body: string,
            timeout: number,
            opacity: number,
            image?: string
        ): void;
    };

    const AppApiVr: {
        Init(): void;
        VrInit(): void;
        ToggleSystemMonitor(enabled: boolean): void;
        CpuUsage(): number;
        GetVRDevices(): string[][];
        GetUptime(): number;
        CurrentCulture(): string;
        CustomVrScriptPath(): string;
        IsRunningUnderWine(): boolean;
    };

    const WebApi: {
        ClearCookies(): void;
        GetCookies(): string;
        SetCookies(cookie: string): void;
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
    };

    const webApiService: {
        clearCookies(): void;
        getCookies(): string;
        setCookies(cookie: string): void;
        execute(options: {
            url: string;
            method: string;
            headers?: Record<string, string>;
            data?: any;
        }): Promise<{ status: number; data: string }>;
    };

    // simple node.js process type definitions
    const process: {
        env: Record<string, string | undefined>;
        platform: string;
        version: string;
        versions: Record<string, string>;
        argv: string[];
        cwd(): string;
        exit(code?: number): never;
        nextTick(callback: (...args: any[]) => void): void;
    };
}

export {};
