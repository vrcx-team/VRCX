// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using CefSharp;
using librsync.net;
using Microsoft.Toolkit.Uwp.Notifications;
using Microsoft.Win32;
using NLog;

namespace VRCX
{
    public partial class AppApi
    {
        public static readonly AppApi Instance;

        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly MD5 _hasher = MD5.Create();

        static AppApi()
        {
            Instance = new AppApi();

            ProcessMonitor.Instance.ProcessStarted += Instance.OnProcessStateChanged;
            ProcessMonitor.Instance.ProcessExited += Instance.OnProcessStateChanged;
        }
        
        public void Init()
        {
            // Create Instance before Cef tries to bind it
        }
        
        /// <summary>
        /// Computes the MD5 hash of the file represented by the specified base64-encoded string.
        /// </summary>
        /// <param name="Blob">The base64-encoded string representing the file.</param>
        /// <returns>The MD5 hash of the file as a base64-encoded string.</returns>
        public string MD5File(string Blob)
        {
            var fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            using (var md5 = MD5.Create())
            {
                var md5Hash = md5.ComputeHash(fileData);
                return Convert.ToBase64String(md5Hash);
            }
        }

        public string ResizeImageToFitLimits(string base64data)
        {
            return Convert.ToBase64String(ResizeImageToFitLimits(Convert.FromBase64String(base64data), false));
        }

        public byte[] ResizeImageToFitLimits(byte[] imageData, bool matchingDimensions, int maxWidth = 2000, int maxHeight = 2000, long maxSize = 10_000_000)
        {
            using var fileMemoryStream = new MemoryStream(imageData);
            var image = new Bitmap(fileMemoryStream);
            
            // for APNG, check if image is png format and less than maxSize
            if ((!matchingDimensions || image.Width == image.Height) &&
                image.RawFormat.Equals(System.Drawing.Imaging.ImageFormat.Png) &&
                imageData.Length < maxSize &&
                image.Width <= maxWidth &&
                image.Height <= maxHeight)
            {
                return imageData;
            }
            
            if (image.Width > maxWidth)
            {
                var sizingFactor = image.Width / (double)maxWidth;
                var newHeight = (int)Math.Round(image.Height / sizingFactor);
                image = new Bitmap(image, maxWidth, newHeight);
            }
            if (image.Height > maxHeight)
            {
                var sizingFactor = image.Height / (double)maxHeight;
                var newWidth = (int)Math.Round(image.Width / sizingFactor);
                image = new Bitmap(image, newWidth, maxHeight);
            }
            if (matchingDimensions && image.Width != image.Height)
            {
                var newSize = Math.Max(image.Width, image.Height);
                var newImage = new Bitmap(newSize, newSize);
                using (var graphics = Graphics.FromImage(newImage))
                {
                    graphics.Clear(Color.Transparent);
                    graphics.DrawImage(image, new Rectangle((newSize - image.Width) / 2, (newSize - image.Height) / 2, image.Width, image.Height));
                }
                image.Dispose();
                image = newImage;
            }
            
            SaveToFileToUpload();
            for (int i = 0; i < 250 && imageData.Length > maxSize; i++)
            {
                SaveToFileToUpload();
                if (imageData.Length < maxSize)
                    break;
                
                int newWidth;
                int newHeight;
                if (image.Width > image.Height)
                {
                    newWidth = image.Width - 25;
                    newHeight = (int)Math.Round(image.Height / (image.Width / (double)newWidth));
                }
                else
                {
                    newHeight = image.Height - 25;
                    newWidth = (int)Math.Round(image.Width / (image.Height / (double)newHeight));
                }
                image = new Bitmap(image, newWidth, newHeight);
            }

            if (imageData.Length > maxSize)
            {
                throw new Exception("Failed to get image into target filesize.");
            }

            return imageData;

            void SaveToFileToUpload()
            {
                using var imageSaveMemoryStream = new MemoryStream();
                image.Save(imageSaveMemoryStream, System.Drawing.Imaging.ImageFormat.Png);
                imageData = imageSaveMemoryStream.ToArray();
            }
        }

        /// <summary>
        /// Computes the signature of the file represented by the specified base64-encoded string using the librsync library.
        /// </summary>
        /// <param name="Blob">The base64-encoded string representing the file.</param>
        /// <returns>The signature of the file as a base64-encoded string.</returns>
        public string SignFile(string Blob)
        {
            var fileData = Convert.FromBase64String(Blob);
            using (var sig = Librsync.ComputeSignature(new MemoryStream(fileData)))
            using (var memoryStream = new MemoryStream())
            {
                sig.CopyTo(memoryStream);
                var sigBytes = memoryStream.ToArray();
                return Convert.ToBase64String(sigBytes);
            }
        }

        /// <summary>
        /// Returns the length of the file represented by the specified base64-encoded string.
        /// </summary>
        /// <param name="Blob">The base64-encoded string representing the file.</param>
        /// <returns>The length of the file in bytes.</returns>
        public string FileLength(string Blob)
        {
            var fileData = Convert.FromBase64String(Blob);
            return fileData.Length.ToString();
        }

        /// <summary>
        /// Shows the developer tools for the main browser window.
        /// </summary>
        public void ShowDevTools()
        {
            MainForm.Instance.Browser.ShowDevTools();
        }

        /// <summary>
        /// Deletes all cookies from the global cef cookie manager.
        /// </summary>
        public void DeleteAllCookies()
        {
            Cef.GetGlobalCookieManager().DeleteCookies();
        }

        /// <summary>
        /// Opens the specified URL in the default browser.
        /// </summary>
        /// <param name="url">The URL to open.</param>
        public void OpenLink(string url)
        {
            if (url.StartsWith("http://") ||
                url.StartsWith("https://"))
            {
                Process.Start(new ProcessStartInfo(url)
                {
                    UseShellExecute = true
                });
            }
        }

        // broken since adding ExecuteVrFeedFunction(
        // public void ShowVRForm()
        // {
        //     try
        //     {
        //         MainForm.Instance.BeginInvoke(new MethodInvoker(() =>
        //         {
        //             if (VRForm.Instance == null)
        //             {
        //                 new VRForm().Show();
        //             }
        //         }));
        //     }
        //     catch
        //     {
        //     }
        // }

        public void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
        {
            Program.VRCXVRInstance.SetActive(active, hmdOverlay, wristOverlay, menuButton, overlayHand);
        }

        public void RefreshVR()
        {
            Program.VRCXVRInstance.Restart();
        }

        public void RestartVR()
        {
            Program.VRCXVRInstance.Restart();
        }

        public void SetZoom(double zoomLevel)
        {
            MainForm.Instance.Browser.SetZoomLevel(zoomLevel);
        }
        
        public async Task<double> GetZoom()
        {
            return await MainForm.Instance.Browser.GetZoomLevelAsync();
        }

        /// <summary>
        /// Retrieves an image from the VRChat API and caches it for future use. The function will return the cached image if it already exists.
        /// </summary>
        /// <param name="url">The URL of the image to retrieve.</param>
        /// <param name="fileId">The ID of the file associated with the image.</param>
        /// <param name="version">The version of the file associated with the image.</param>
        /// <returns>A string representing the file location of the cached image.</returns>
        public async Task<string> GetImage(string url, string fileId, string version)
        {
            return await ImageCache.GetImage(url, fileId, version);
        }

        /// <summary>
        /// Displays a desktop notification with the specified bold text, optional text, and optional image.
        /// </summary>
        /// <param name="BoldText">The bold text to display in the notification.</param>
        /// <param name="Text">The optional text to display in the notification.</param>
        /// <param name="Image">The optional image to display in the notification.</param>
        public void DesktopNotification(string BoldText, string Text = "", string Image = "")
        {
            try
            {
                ToastContentBuilder builder = new ToastContentBuilder();

                if (Uri.TryCreate(Image, UriKind.Absolute, out Uri uri))
                    builder.AddAppLogoOverride(uri);

                if (!string.IsNullOrEmpty(BoldText))
                    builder.AddText(BoldText);

                if (!string.IsNullOrEmpty(Text))
                    builder.AddText(Text);

                builder.Show();
            }
            catch (System.AccessViolationException ex)
            {
                logger.Warn(ex, "Unable to send desktop notification");
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Unknown error when sending desktop notification");
            }
        }

        /// <summary>
        /// Restarts the VRCX application for an update by launching a new process with the upgrade argument and exiting the current process.
        /// </summary>
        public void RestartApplication(bool isUpgrade)
        {
            var args = new List<string>();
            
            if (isUpgrade)
                args.Add(StartupArgs.VrcxLaunchArguments.IsUpgradePrefix);

            if (StartupArgs.LaunchArguments.IsDebug)
                args.Add(StartupArgs.VrcxLaunchArguments.IsDebugPrefix);

            if (!string.IsNullOrWhiteSpace(StartupArgs.LaunchArguments.ConfigDirectory))
                args.Add($"{StartupArgs.VrcxLaunchArguments.ConfigDirectoryPrefix}={StartupArgs.LaunchArguments.ConfigDirectory}");

            if (!string.IsNullOrWhiteSpace(StartupArgs.LaunchArguments.ProxyUrl))
                args.Add($"{StartupArgs.VrcxLaunchArguments.ProxyUrlPrefix}={StartupArgs.LaunchArguments.ProxyUrl}");

            var vrcxProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = Path.Combine(Program.BaseDirectory, "VRCX.exe"),
                    Arguments = string.Join(' ', args),
                    UseShellExecute = true,
                    WorkingDirectory = Program.BaseDirectory
                }
            };
            vrcxProcess.Start();
            Environment.Exit(0);
        }

        /// <summary>
        /// Checks if the VRCX update executable exists in the AppData directory.
        /// </summary>
        /// <returns>True if the update executable exists, false otherwise.</returns>
        public bool CheckForUpdateExe()
        {
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                return true;
            return false;
        }

        /// <summary>
        /// Sends an IPC packet to announce the start of VRCX.
        /// </summary>
        public void IPCAnnounceStart()
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VRCXLaunch",
                MsgType = "VRCXLaunch"
            });
        }

        /// <summary>
        /// Sends an IPC packet with a specified message type and data.
        /// </summary>
        /// <param name="type">The message type to send.</param>
        /// <param name="data">The data to send.</param>
        public void SendIpc(string type, string data)
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VrcxMessage",
                MsgType = type,
                Data = data
            });
        }

        public void ExecuteAppFunction(string function, string json)
        {
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync($"$app.{function}", json);
        }

        public void ExecuteVrFeedFunction(string function, string json)
        {
            Program.VRCXVRInstance.ExecuteVrFeedFunction(function, json);
        }

        public void ExecuteVrOverlayFunction(string function, string json)
        {
            Program.VRCXVRInstance.ExecuteVrOverlayFunction(function, json);
        }

        /// <summary>
        /// Gets the launch command from the startup arguments and clears the launch command.
        /// </summary>
        /// <returns>The launch command.</returns>
        public string GetLaunchCommand()
        {
            var command = StartupArgs.LaunchArguments.LaunchCommand;
            StartupArgs.LaunchArguments.LaunchCommand = string.Empty;
            return command;
        }

        /// <summary>
        /// Focuses the main window of the VRCX application.
        /// </summary>
        public void FocusWindow()
        {
            MainForm.Instance.Invoke(new Action(() => { MainForm.Instance.Focus_Window(); }));
        }

        /// <summary>
        /// Returns the file path of the custom user CSS file, if it exists.
        /// </summary>
        /// <returns>The file path of the custom user CSS file, or an empty string if it doesn't exist.</returns>
        public string CustomCssPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.css");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        /// <summary>
        /// Returns the file path of the custom user js file, if it exists.
        /// </summary>
        /// <returns>The file path of the custom user js file, or an empty string if it doesn't exist.</returns>
        public string CustomScriptPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.js");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        public string CurrentCulture()
        {
            return CultureInfo.CurrentCulture.ToString();
        }

        public string CurrentLanguage()
        {
            return CultureInfo.InstalledUICulture.Name;
        }

        public string GetVersion()
        {
            return Program.Version;
        }

        /// <summary>
        /// Returns whether or not the VRChat client was last closed gracefully. According to the log file, anyway.
        /// </summary>
        /// <returns>True if the VRChat client was last closed gracefully, false otherwise.</returns>
        public bool VrcClosedGracefully()
        {
            return LogWatcher.Instance.VrcClosedGracefully;
        }

        public void ChangeTheme(int value)
        {
            WinformThemer.SetGlobalTheme(value);
        }

        public void DoFunny()
        {
            WinformThemer.DoFunny();
        }

        /// <summary>
        /// Returns a color value derived from the given user ID.
        /// This is, essentially, and is used for, random colors.
        /// </summary>
        /// <param name="userId">The user ID to derive the color value from.</param>
        /// <returns>A color value derived from the given user ID.</returns>
        public int GetColourFromUserID(string userId)
        {
            var hash = _hasher.ComputeHash(Encoding.UTF8.GetBytes(userId));
            return (hash[3] << 8) | hash[4];
        }

        /// <summary>
        /// Returns a dictionary of color values derived from the given list of user IDs.
        /// </summary>
        /// <param name="userIds">The list of user IDs to derive the color values from.</param>
        /// <returns>A dictionary of color values derived from the given list of user IDs.</returns>
        public Dictionary<string, int> GetColourBulk(List<object> userIds)
        {
            var output = new Dictionary<string, int>();
            foreach (string userId in userIds)
            {
                output.Add(userId, GetColourFromUserID(userId));
            }

            return output;
        }

        /// <summary>
        /// Retrieves the current text from the clipboard.
        /// </summary>
        /// <returns>The current text from the clipboard.</returns>
        public string GetClipboard()
        {
            var clipboard = string.Empty;
            var thread = new Thread(() => clipboard = Clipboard.GetText());
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return clipboard;
        }

        /// <summary>
        /// Sets whether or not the application should start up automatically with Windows.
        /// </summary>
        /// <param name="enabled">True to enable automatic startup, false to disable it.</param>
        public void SetStartup(bool enabled)
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (enabled)
                    {
                        var path = Application.ExecutablePath;
                        key.SetValue("VRCX", $"\"{path}\" --startup");
                    }
                    else
                    {
                        key.DeleteValue("VRCX", false);
                    }
                }
            }
            catch
            {
            }
        }

        // what the fuck even is this
        // refactor when
        // #AppApiLivesDontMatter
        public void SetAppLauncherSettings(bool enabled, bool killOnExit)
        {
            AutoAppLaunchManager.Instance.Enabled = enabled;
            AutoAppLaunchManager.Instance.KillChildrenOnExit = killOnExit;
        }

        /// <summary>
        /// Copies an image file to the clipboard if it exists and is of a supported image file type.
        /// </summary>
        /// <param name="path">The path to the image file to copy to the clipboard.</param>
        public void CopyImageToClipboard(string path)
        {
            // check if the file exists and is any image file type
            if (File.Exists(path) && (path.EndsWith(".png") || path.EndsWith(".jpg") || path.EndsWith(".jpeg") || path.EndsWith(".gif") || path.EndsWith(".bmp") || path.EndsWith(".webp")))
            {
                MainForm.Instance.BeginInvoke(new MethodInvoker(() =>
                {
                    var image = Image.FromFile(path);
                    // Clipboard.SetImage(image);
                    var data = new DataObject();
                    data.SetData(DataFormats.Bitmap, image);
                    data.SetFileDropList(new StringCollection { path });
                    Clipboard.SetDataObject(data, true);
                }));
            }
        }
        
        /// <summary>
        /// Flashes the window of the main form.
        /// </summary>
        public void FlashWindow()
        {
            MainForm.Instance.BeginInvoke(new MethodInvoker(() => { WinformThemer.Flash(MainForm.Instance); }));
        }

        /// <summary>
        /// Sets the user agent string for the browser.
        /// </summary>
        public void SetUserAgent()
        {
            using (var client = MainForm.Instance.Browser.GetDevToolsClient())
            {
                _ = client.Network.SetUserAgentOverrideAsync(Program.Version);
            }
        }

        public string GetFileBase64(string path)
        {
            if (File.Exists(path))
            {
                return Convert.ToBase64String(File.ReadAllBytes(path));
            }

            return null;
        }

        public async Task<bool> SavePrintToFile(string url, string path, string fileName)
        {
            var folder = Path.Combine(GetVRChatPhotosLocation(), "Prints", MakeValidFileName(path));
            Directory.CreateDirectory(folder);
            var filePath = Path.Combine(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return false;

            return await ImageCache.SaveImageToFile(url, filePath);
        }
    }
}