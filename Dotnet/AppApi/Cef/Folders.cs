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
    public partial class AppApiCef
    {
        public override string GetVRChatAppDataLocation()
        {
            return Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
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
            catch (Exception e)
            {
                logger.Error($"Failed to get Steam userdata path from registry: {e}");
            }

            return steamUserdataPath;
        }

        public override string GetVRChatScreenshotsLocation()
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
            var path = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
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
            var path = Path.Combine(Path.GetTempPath(), "VRChat", "VRChat", "Crashes");
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

        private void OpenFolderAndSelectItemFallback(string path)
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

        public override async Task<string> OpenFolderSelectorDialog(string defaultPath = "")
        {
            var tcs = new TaskCompletionSource<string>();
            var staThread = new Thread(() =>
            {
                try
                {
                    using var openFolderDialog = new FolderBrowserDialog();
                    openFolderDialog.InitialDirectory = Directory.Exists(defaultPath) ? defaultPath : GetVRChatPhotosLocation();

                    var dialogResult = openFolderDialog.ShowDialog(MainForm.nativeWindow);
                    if (dialogResult == DialogResult.OK)
                    {
                        tcs.SetResult(openFolderDialog.SelectedPath);
                    }
                    else
                    {
                        tcs.SetResult(defaultPath);
                    }
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            });

            staThread.SetApartmentState(ApartmentState.STA);
            staThread.Start();

            return await tcs.Task;
        }
        
        public override async Task<string> OpenFileSelectorDialog(string defaultPath = "", string defaultExt = "", string defaultFilter = "All files (*.*)|*.*")
        {
            var tcs = new TaskCompletionSource<string>();
            var staThread = new Thread(() =>
            {
                try
                {
                    using (var openFileDialog = new System.Windows.Forms.OpenFileDialog())
                    {
                        if (Directory.Exists(defaultPath))
                        {
                            openFileDialog.InitialDirectory = defaultPath;
                        }

                        openFileDialog.DefaultExt = defaultExt;
                        openFileDialog.Filter = defaultFilter;

                        var dialogResult = openFileDialog.ShowDialog(MainForm.nativeWindow);
                        if (dialogResult == DialogResult.OK && !string.IsNullOrEmpty(openFileDialog.FileName))
                        {
                            tcs.SetResult(openFileDialog.FileName);
                        }
                        else
                        {
                            tcs.SetResult("");
                        }
                    }
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            });

            staThread.SetApartmentState(ApartmentState.STA);
            staThread.Start();

            return await tcs.Task;
        }
    }
}