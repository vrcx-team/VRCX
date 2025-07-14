using System;
using System.Collections.Generic;
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
        public static string _vrcCrashesPath;

        static AppApiElectron()
        {
            const string vrchatAppid = "438100";
            _homeDirectory = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            _steamUserdataPath = Path.Join(_homeDirectory, ".steam/steam/userdata");
            _steamPath = Path.Join(_homeDirectory, ".local/share/Steam");

            var flatpakSteamPath = Path.Join(_homeDirectory, ".var/app/com.valvesoftware.Steam/.local/share/Steam");
            if (!Directory.Exists(_steamPath) && Directory.Exists(flatpakSteamPath))
            {
                logger.Info("Flatpak Steam detected.");
                _steamPath = flatpakSteamPath;
            }

            var legacySteamPath = Path.Join(_homeDirectory, ".steam/steam");
            if (!Directory.Exists(_steamPath) && Directory.Exists(legacySteamPath))
            {
                logger.Info("Legacy Steam path detected.");
                _steamPath = legacySteamPath;
            }

            var libraryFoldersVdfPath = Path.Join(_steamPath, "config/libraryfolders.vdf");
            var vrcLibraryPath = GetLibraryWithAppId(libraryFoldersVdfPath, vrchatAppid);
            if (string.IsNullOrEmpty(vrcLibraryPath))
            {
                logger.Warn("Falling back to default VRChat path as libraryfolders.vdf was not found OR libraryfolders.vdf does not contain VRChat's appid (438100)");
                vrcLibraryPath = _steamPath;
            }
            logger.Info($"Using steam library path {vrcLibraryPath}");
            _vrcPrefixPath = Path.Join(vrcLibraryPath, $"steamapps/compatdata/{vrchatAppid}/pfx");
            _vrcAppDataPath = Path.Join(_vrcPrefixPath, "drive_c/users/steamuser/AppData/LocalLow/VRChat/VRChat");
            _vrcCrashesPath = Path.Join(_vrcPrefixPath, "drive_c/users/steamuser/AppData/Local/Temp/VRChat/VRChat/Crashes");
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

                if (line.Contains($"\"{appId}\"") && Directory.Exists(libraryPath))
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
            var defaultPath = Path.Join(GetVRChatAppDataLocation(), "Cache-WindowsPlayer");
            try
            {
                var json = ReadConfigFile();
                if (string.IsNullOrEmpty(json))
                    return defaultPath;

                var obj = JsonConvert.DeserializeObject<JObject>(json, JsonSerializerSettings);
                if (obj["cache_directory"] == null)
                    return defaultPath;

                var cacheDir = (string)obj["cache_directory"];
                if (string.IsNullOrEmpty(cacheDir))
                    return defaultPath;

                var cachePath = Path.Join(cacheDir, "Cache-WindowsPlayer");
                if (!Directory.Exists(cacheDir))
                    return defaultPath;

                return cachePath;
            }
            catch (Exception e)
            {
                logger.Error($"Error reading VRChat config file for cache location: {e}");
            }
            return defaultPath;
        }

        public override string GetVRChatPhotosLocation()
        {
            var defaultPath = Path.Join(_vrcPrefixPath, "drive_c/users/steamuser/Pictures/VRChat");
            try
            {
                var json = ReadConfigFile();
                if (string.IsNullOrEmpty(json))
                    return defaultPath;

                var obj = JsonConvert.DeserializeObject<JObject>(json, JsonSerializerSettings);
                if (obj["picture_output_folder"] == null)
                    return defaultPath;

                var photosDir = (string)obj["picture_output_folder"];
                if (string.IsNullOrEmpty(photosDir) || !Directory.Exists(photosDir))
                    return defaultPath;

                return photosDir;
            }
            catch (Exception e)
            {
                logger.Error($"Error reading VRChat config file for photos location: {e}");
            }
            return defaultPath;
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
            return Path.Join(_steamUserdataPath, "760/remote/438100/screenshots");
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
            var path = _vrcCrashesPath;
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
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
            if (!File.Exists(path) && !Directory.Exists(path))
                return;

            string directoryPath = isFolder ? path : Path.GetDirectoryName(path);
            var commandAttempt = new Dictionary<string, string>
            {
                { "nautilus", $"\"{path}\"" },
                { "nemo", $"\"{path}\"" },
                { "thunar", $"\"{path}\"" },
                { "caja", $"--select \"{path}\"" },
                { "pcmanfm-qt", $"\"{directoryPath}\"" },
                { "pcmanfm", $"\"{directoryPath}\"" },
                { "dolphin", $"--select \"{path}\"" },
                { "konqueror", $"--select \"{path}\"" },
                { "xdg-open", $"\"{directoryPath}\"" }
            };

            foreach (var command in commandAttempt)
            {
                if (!IsCommandAvailable(command.Key))
                    continue;

                try
                {
                    var process = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = command.Key,
                            Arguments = command.Value,
                            UseShellExecute = false,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true,
                        }
                    };
                    process.Start();
                    return; // Assume first successful start is enough
                }
                catch
                {
                    // Ignore and try next
                }
            }
        }

        private bool IsCommandAvailable(string command)
        {
            try
            {
                var which = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "which",
                        Arguments = command,
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                which.Start();
                string result = which.StandardOutput.ReadToEnd();
                which.WaitForExit();
                return which.ExitCode == 0 && !string.IsNullOrWhiteSpace(result);
            }
            catch
            {
                return false;
            }
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
