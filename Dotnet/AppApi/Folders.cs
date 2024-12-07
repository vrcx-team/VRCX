using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Win32;

namespace VRCX
{
    public partial class AppApi
    {
        /// <summary>
        /// Gets the VRChat application data location by reading the config file and checking the cache directory.
        /// If the cache directory is not found in the config file, it returns the default cache path.
        /// </summary>
        /// <returns>The VRChat application data location.</returns>
        public string GetVRChatAppDataLocation()
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

            return Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
        }
        
        public string GetVRChatPhotosLocation()
        {
            var json = ReadConfigFile();
            if (!string.IsNullOrEmpty(json))
            {
                var obj = JsonConvert.DeserializeObject<JObject>(json);
                if (obj["picture_output_folder"] != null)
                {
                    var photosDir = (string)obj["picture_output_folder"];
                    if (!string.IsNullOrEmpty(photosDir) && Directory.Exists(photosDir))
                    {
                        return photosDir;
                    }
                }
            }
            
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "VRChat");
        }
        
        private string GetSteamUserdataPathFromRegistry()
        {
            string steamUserdataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Steam\userdata");

            try
            {
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Valve\Steam"))
                {
                    if (key != null)
                    {
                        object o = key.GetValue("InstallPath");
                        if (o != null)
                        {
                            steamUserdataPath = Path.Combine(o.ToString(), @"userdata");
                        }
                    }
                }
            }
            catch
            {
            }

            return steamUserdataPath;
        }

        public string GetVRChatScreenshotsLocation()
        {
            // program files steam userdata screenshots
            var steamUserdataPath = GetSteamUserdataPathFromRegistry();
            var screenshotPath = string.Empty;
            var latestWriteTime = DateTime.MinValue;
            if (!Directory.Exists(steamUserdataPath)) 
                return screenshotPath;
            
            var steamUserDirs = Directory.GetDirectories(steamUserdataPath);
            foreach (var steamUserDir in steamUserDirs)
            {
                var screenshotDir = Path.Combine(steamUserDir, @"760\remote\438100\screenshots");
                if (!Directory.Exists(screenshotDir))
                    continue;
                    
                var lastWriteTime = File.GetLastWriteTime(screenshotDir);
                if (lastWriteTime <= latestWriteTime)
                    continue;
                        
                latestWriteTime = lastWriteTime;
                screenshotPath = screenshotDir;
            }

            return screenshotPath;
        }

        /// <summary>
        /// Gets the VRChat cache location by combining the VRChat application data location with the cache directory name.
        /// </summary>
        /// <returns>The VRChat cache location.</returns>
        public string GetVRChatCacheLocation()
        {
            return Path.Combine(GetVRChatAppDataLocation(), "Cache-WindowsPlayer");
        }
        
        public bool OpenVrcxAppDataFolder()
        {
            var path = Program.AppDataDirectory;
            if (!Directory.Exists(path))
                return false;
            
            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public bool OpenVrcAppDataFolder()
        {
            var path = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
            if (!Directory.Exists(path))
                return false;
            
            OpenFolderAndSelectItem(path, true);
            return true;
        }
        
        public bool OpenVrcPhotosFolder()
        {
            var path = GetVRChatPhotosLocation();
            if (!Directory.Exists(path))
                return false;
            
            OpenFolderAndSelectItem(path, true);
            return true;
        }
        
        public bool OpenVrcScreenshotsFolder()
        {
            var path = GetVRChatScreenshotsLocation();
            if (!Directory.Exists(path))
                return false;
            
            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public bool OpenCrashVrcCrashDumps()
        {
            var path = Path.Combine(Path.GetTempPath(), "VRChat", "VRChat", "Crashes");
            if (!Directory.Exists(path))
                return false;
            
            OpenFolderAndSelectItem(path, true);
            return true;
        }

        /// <summary>
        /// Opens the folder containing user-defined shortcuts, if it exists.
        /// </summary>
        public void OpenShortcutFolder()
        {
            var path = AutoAppLaunchManager.Instance.AppShortcutDirectory;
            if (!Directory.Exists(path))
                return;

            OpenFolderAndSelectItem(path, true);
        }

        /// <summary>
        /// Opens the folder containing the specified file or folder path and selects the item in the folder.
        /// </summary>
        /// <param name="path">The path to the file or folder to select in the folder.</param>
        /// <param name="isFolder">Whether the specified path is a folder or not. Defaults to false.</param>
        public void OpenFolderAndSelectItem(string path, bool isFolder = false)
        {
            path = Path.GetFullPath(path);
            // I don't think it's quite meant for it, but SHOpenFolderAndSelectItems can open folders by passing the folder path as the item to select, as a child to itself, somehow. So we'll check to see if 'path' is a folder as well.
            if (!File.Exists(path) && !Directory.Exists(path))
                return;

            var folderPath = isFolder ? path : Path.GetDirectoryName(path);
            IntPtr pidlFolder;
            IntPtr pidlFile;
            uint psfgaoOut;

            // Convert our managed strings to PIDLs. PIDLs are essentially pointers to the actual file system objects, separate from the "display name", which is the human-readable path to the file/folder. We're parsing the display name into a PIDL here.
            // The windows shell uses PIDLs to identify objects in winapi calls, so we'll need to use them to open the folder and select the file. Cool stuff!
            var result = WinApi.SHParseDisplayName(folderPath, IntPtr.Zero, out pidlFolder, 0, out psfgaoOut);
            if (result != 0)
            {
                OpenFolderAndSelectItemFallback(path);
                return;
            }

            result = WinApi.SHParseDisplayName(path, IntPtr.Zero, out pidlFile, 0, out psfgaoOut);
            if (result != 0)
            {
                // Free the PIDL we allocated earlier if we failed to parse the display name of the file.
                Marshal.FreeCoTaskMem(pidlFolder);
                OpenFolderAndSelectItemFallback(path);
                return;
            }

            IntPtr[] files = { pidlFile };

            try
            {
                // Open the containing folder and select our file. SHOpenFolderAndSelectItems will respect existing explorer instances, open a new one if none exist, will properly handle paths > 120 chars, and work with third-party filesystem viewers that hook into winapi calls.
                // It can select multiple items, but we only need to select one. 
                WinApi.SHOpenFolderAndSelectItems(pidlFolder, (uint)files.Length, files, 0);
            }
            catch
            {
                OpenFolderAndSelectItemFallback(path);
            }
            finally
            {
                // Free the PIDLs we allocated earlier
                Marshal.FreeCoTaskMem(pidlFolder);
                Marshal.FreeCoTaskMem(pidlFile);
            }
        }
        
        public void OpenFolderAndSelectItemFallback(string path)
        {
            if (!File.Exists(path) && !Directory.Exists(path))
                return;

            if (Directory.Exists(path))
            {
                Process.Start("explorer.exe", path);
            }
            else
            {
                // open folder with file highlighted
                Process.Start("explorer.exe", $"/select,\"{path}\"");
            }
        }
        
        private static readonly Regex _folderRegex = new Regex(string.Format(@"([{0}]*\.+$)|([{0}]+)",
            Regex.Escape(new string(Path.GetInvalidPathChars()))));

        private static readonly Regex _fileRegex = new Regex(string.Format(@"([{0}]*\.+$)|([{0}]+)",
            Regex.Escape(new string(Path.GetInvalidFileNameChars()))));

        public static string MakeValidFileName(string name)
        {
            name = name.Replace("/", "");
            name = name.Replace("\\", "");
            name = _folderRegex.Replace(name, "");
            name = _fileRegex.Replace(name, "");
    
            return name;
        }
    }
}