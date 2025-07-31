// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
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
    public partial class AppApiCef : AppApi
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        /// <summary>
        /// Shows the developer tools for the main browser window.
        /// </summary>
        public override void ShowDevTools()
        {
            MainForm.Instance.Browser.ShowDevTools();
        }

        public override void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
        {
            Program.VRCXVRInstance.SetActive(active, hmdOverlay, wristOverlay, menuButton, overlayHand);
        }

        public override void RefreshVR()
        {
            Program.VRCXVRInstance.Restart();
        }

        public override void RestartVR()
        {
            Program.VRCXVRInstance.Restart();
        }

        public override void SetZoom(double zoomLevel)
        {
            MainForm.Instance.Browser.SetZoomLevel(zoomLevel);
        }

        public override async Task<double> GetZoom()
        {
            return await MainForm.Instance.Browser.GetZoomLevelAsync();
        }

        public override void DesktopNotification(string BoldText, string Text = "", string Image = "")
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

        public override void RestartApplication(bool isUpgrade)
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
                    FileName = Path.Join(Program.BaseDirectory, "VRCX.exe"),
                    Arguments = string.Join(' ', args),
                    UseShellExecute = true,
                    WorkingDirectory = Program.BaseDirectory
                }
            };
            vrcxProcess.Start();
            Environment.Exit(0);
        }

        public override bool CheckForUpdateExe()
        {
            return File.Exists(Path.Join(Program.AppDataDirectory, "update.exe"));
        }

        public override void ExecuteAppFunction(string function, string json)
        {
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync($"$app.{function}", json);
        }

        public override void ExecuteVrFeedFunction(string function, string json)
        {
            Program.VRCXVRInstance.ExecuteVrFeedFunction(function, json);
        }

        public override void ExecuteVrOverlayFunction(string function, string json)
        {
            Program.VRCXVRInstance.ExecuteVrOverlayFunction(function, json);
        }

        public override void FocusWindow()
        {
            MainForm.Instance.Invoke(new Action(() => { MainForm.Instance.Focus_Window(); }));
        }

        public override void ChangeTheme(int value)
        {
            WinformThemer.SetGlobalTheme(value);
        }

        public override void DoFunny()
        {
            WinformThemer.DoFunny();
        }

        public override string GetClipboard()
        {
            var clipboard = string.Empty;
            var thread = new Thread(() => clipboard = Clipboard.GetText());
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return clipboard;
        }

        public override void SetStartup(bool enabled)
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true);
                if (key == null)
                {
                    logger.Warn("Failed to open startup registry key");
                    return;
                }

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
            catch (Exception e)
            {
                logger.Warn(e, "Failed to set startup");
            }
        }

        public override void CopyImageToClipboard(string path)
        {
            if (!File.Exists(path) ||
                (!path.EndsWith(".png") &&
                 !path.EndsWith(".jpg") &&
                 !path.EndsWith(".jpeg") &&
                 !path.EndsWith(".gif") &&
                 !path.EndsWith(".bmp") &&
                 !path.EndsWith(".webp")))
                return;

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

        public override void FlashWindow()
        {
            MainForm.Instance.BeginInvoke(new MethodInvoker(() => { WinformThemer.Flash(MainForm.Instance); }));
        }

        public override void SetUserAgent()
        {
            using var client = MainForm.Instance.Browser.GetDevToolsClient();
            _ = client.Network.SetUserAgentOverrideAsync(Program.Version);
        }
    }
}