using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Win32;
using System.Threading;
using System.Windows.Forms;
using System.Threading.Tasks;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public static string _homeDirectory;
        public static string _steamPath;
        public static string _steamUserdataPath;
        public static string _vrcPrefixPath;
        public static string _vrcAppDataPath;
        
        static AppApiElectron()
        {
            const string vrchatAppid = "438100";
            _homeDirectory = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            _steamPath = Path.Combine(_homeDirectory, ".local/share/Steam");
            var flatpakSteamPath = Path.Combine(_homeDirectory, ".var/app/com.valvesoftware.Steam/.local/share/Steam");
            if (!Directory.Exists(_steamPath) && Directory.Exists(flatpakSteamPath))
            {
                logger.Info("Flatpak Steam detected.");
                _steamPath = flatpakSteamPath;
            }
            _steamUserdataPath = Path.Combine(_homeDirectory, ".steam/steam/userdata");
            
            var libraryFoldersVdfPath = Path.Combine(_steamPath, "config/libraryfolders.vdf");
            var vrcLibraryPath = GetLibraryWithAppId(libraryFoldersVdfPath, vrchatAppid);
            if (string.IsNullOrEmpty(vrcLibraryPath))
            {
                logger.Warn("Falling back to default VRChat path as libraryfolders.vdf was not found OR libraryfolders.vdf does not contain VRChat's appid (438100)");
                vrcLibraryPath = _steamPath;
            }
            logger.Info($"Using steam library path {vrcLibraryPath}");
            _vrcPrefixPath = Path.Combine(vrcLibraryPath, $"steamapps/compatdata/{vrchatAppid}/pfx");
            _vrcAppDataPath = Path.Combine(_vrcPrefixPath, "drive_c/users/steamuser/AppData/LocalLow/VRChat/VRChat");
        }

        private static string? GetLibraryWithAppId(string libraryFoldersVdfPath, string appId)
        {
            if (!File.Exists(libraryFoldersVdfPath))
                return null;

            string? libraryPath = null;
            foreach (var line in File.ReadLines(libraryFoldersVdfPath))
            {                
                // Assumes line will be \t\t"path"\t\t"pathToLibrary"
                if (line.Contains("\"path\""))
                {
                    var parts = line.Split("\t");
                    if (parts.Length < 4)
                        continue;
                    
                    libraryPath = parts[4].Replace("\"", "");
                }

                if (line.Contains($"\"{appId}\""))
                    return libraryPath;
            }

            return null;
        }
        
        public override string GetVRChatAppDataLocation()
        {
            return _vrcAppDataPath;
        }
                
        public override string GetVRChatCacheLocation()
        {
            var json = ReadConfigFile();
            if (!string.IsNullOrEmpty(json))
            {
                var obj = JsonConvert.DeserializeObject<JObject>(json);
                if (obj["cache_directory"] != null)
                {
                    var cacheDir = (string)obj["cache_directory"];
                    if (!string.IsNullOrEmpty(cacheDir) && Directory.Exists(cacheDir))
                    {
                        return cacheDir;
                    }
                }
            }
            
            return Path.Combine(GetVRChatAppDataLocation(), "Cache-WindowsPlayer");
        }

        public override string GetVRChatPhotosLocation()
        {
            return Path.Combine(_vrcPrefixPath, "drive_c/users/steamuser/Pictures/VRChat");
        }
        
        public override string GetUGCPhotoLocation(string path = "")
        {
            if (string.IsNullOrEmpty(path))
            {
                return GetVRChatPhotosLocation();
            }

            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
                return path;
            }
            catch (Exception e)
            {
                logger.Error(e);
                return GetVRChatPhotosLocation();
            }
        }

        private string GetSteamUserdataPathFromRegistry()
        {
            // TODO: Fix Steam userdata path, for now just get the first folder
            if (Directory.Exists(_steamUserdataPath))
            {
                var steamUserDirs = Directory.GetDirectories(_steamUserdataPath);
                if (steamUserDirs.Length > 0)
                {
                    return steamUserDirs[0];
                }
            }
            return string.Empty;
        }

        public override string GetVRChatScreenshotsLocation()
        {
            // program files steam userdata screenshots
            return Path.Combine(_steamUserdataPath, "760/remote/438100/screenshots");
        }

        public override bool OpenVrcxAppDataFolder()
        {
            var path = Program.AppDataDirectory;
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override bool OpenVrcAppDataFolder()
        {
            var path = _vrcAppDataPath;
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override bool OpenVrcPhotosFolder()
        {
            var path = GetVRChatPhotosLocation();
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override bool OpenUGCPhotosFolder(string ugcPath = "")
        {
            var path = GetUGCPhotoLocation(ugcPath);
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override bool OpenVrcScreenshotsFolder()
        {
            var path = GetVRChatScreenshotsLocation();
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override bool OpenCrashVrcCrashDumps()
        {
            // TODO: get path
            return false;
        }
        
        public override void OpenShortcutFolder()
        {
            var path = AutoAppLaunchManager.Instance.AppShortcutDirectory;
            if (!Directory.Exists(path))
                return;

            OpenFolderAndSelectItem(path, true);
        }
        
        public override void OpenFolderAndSelectItem(string path, bool isFolder = false)
        {
            path = Path.GetFullPath(path);
            if (!File.Exists(path) && !Directory.Exists(path))
                return;
            
            Process.Start("xdg-open", path);
        }

        public override async Task<string> OpenFolderSelectorDialog(string defaultPath = "")
        {
            // TODO: Implement
            return string.Empty;
        }

        public override async Task<string> OpenFileSelectorDialog(string defaultPath = "", string defaultExt = "",
            string defaultFilter = "All files (*.*)|*.*")
        {
            // TODO: Implement
            return string.Empty;
        }
    }
}
