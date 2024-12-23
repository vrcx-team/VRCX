using System.Collections.Generic;
using System.Threading.Tasks;

namespace VRCX;

public interface AppApiInterface
{
    // AppApi
    string MD5File(string blob);
    string ResizeImageToFitLimits(string base64data);
    byte[] ResizeImageToFitLimits(byte[] imageData, bool matchingDimensions, int maxWidth = 2000,
        int maxHeight = 2000, long maxSize = 10_000_000);
    byte[] ResizePrintImage(byte[] imageData);
    string SignFile(string blob);
    string FileLength(string blob);
    void ShowDevTools();
    void DeleteAllCookies();
    public void OpenLink(string url);
    void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand);
    void RefreshVR();
    void RestartVR();
    void SetZoom(double zoomLevel);
    Task<double> GetZoom();
    Task<string> GetImage(string url, string fileId, string version);
    void DesktopNotification(string BoldText, string Text = "", string Image = "");
    void RestartApplication(bool isUpgrade);
    bool CheckForUpdateExe();
    void IPCAnnounceStart();
    void SendIpc(string type, string data);
    void ExecuteAppFunction(string function, string json);
    void ExecuteVrFeedFunction(string function, string json);
    void ExecuteVrOverlayFunction(string function, string json);
    string GetLaunchCommand();
    void FocusWindow();
    string CustomCssPath();
    string CustomScriptPath();
    string CurrentCulture();
    string CurrentLanguage();
    string GetVersion();
    bool VrcClosedGracefully();
    void ChangeTheme(int value);
    void DoFunny();
    int GetColourFromUserID(string userId);
    Dictionary<string, int> GetColourBulk(List<object> userIds);
    string GetClipboard();
    void SetStartup(bool enabled);
    void SetAppLauncherSettings(bool enabled, bool killOnExit);
    void CopyImageToClipboard(string path);
    void FlashWindow();
    void SetUserAgent();
    string GetFileBase64(string path);
    Task<bool> SavePrintToFile(string url, string ugcFolderPath, string monthFolder, string fileName);
    Task<bool> SaveStickerToFile(string url, string ugcFolderPath, string monthFolder, string fileName);
    bool IsRunningUnderWine();

    // Folders
    string GetVRChatAppDataLocation();
    string GetVRChatPhotosLocation();
    string GetUGCPhotoLocation(string path = "");
    string GetVRChatScreenshotsLocation();
    string GetVRChatCacheLocation();
    bool OpenVrcxAppDataFolder();
    bool OpenVrcAppDataFolder();
    bool OpenVrcPhotosFolder();
    bool OpenUGCPhotosFolder(string ugcPath = "");
    bool OpenVrcScreenshotsFolder();
    bool OpenCrashVrcCrashDumps();
    void OpenShortcutFolder();
    void OpenFolderAndSelectItem(string path, bool isFolder = false);
    void OpenFolderAndSelectItemFallback(string path);
    Task<string> OpenFolderSelectorDialog(string defaultPath = "");
    string MakeValidFileName(string name);
    
    // GameHandler
    void OnProcessStateChanged(MonitoredProcess monitoredProcess);
    void CheckGameRunning();
    int QuitGame();
    bool KillInstall();
    bool StartGame(string arguments);
    bool StartGameFromPath(string path, string arguments);
    
    // LocalPlayerModerations
    Dictionary<string, short> GetVRChatModerations(string currentUserId);
    short GetVRChatUserModeration(string currentUserId, string userId);
    bool SetVRChatUserModeration(string currentUserId, string userId, int type);
    
    // OVRToolKit
    void OVRTNotification(bool hudNotification, bool wristNotification, string title, string body, int timeout,
        string image = "");
    
    // XSOverlay
    void XSNotification(string title, string content, int timeout, string image = "");
    
    // RegistryPlayerPrefs
    object GetVRChatRegistryKey(string key);
    bool SetVRChatRegistryKey(string key, object value, int typeInt);
    void SetVRChatRegistryKey(string key, byte[] value);
    Dictionary<string, Dictionary<string, object>> GetVRChatRegistry();
    void SetVRChatRegistry(string json);
    bool HasVRChatRegistryFolder();
    void DeleteVRChatRegistryFolder();
    void OpenVrcRegJsonFileDialog();
    
    // Screenshot
    string AddScreenshotMetadata(string path, string metadataString, string worldId, bool changeFilename = false);
    void OpenScreenshotFileDialog();
    string GetExtraScreenshotData(string path, bool carouselCache);
    string GetScreenshotMetadata(string path);
    string FindScreenshotsBySearch(string searchQuery, int searchType = 0);
    string GetLastScreenshot();
    
    // VrcConfigFile
    string ReadConfigFile();
    void WriteConfigFile(string json);
}