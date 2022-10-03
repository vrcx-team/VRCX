// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using System.IO;
using System.Security.Cryptography;
using System.Net;
using Windows.UI.Notifications;
using Windows.Data.Xml.Dom;
using librsync.net;
using System.Net.Sockets;
using System.Text;
using System.Collections.Generic;
using System.Threading;

namespace VRCX
{
    public class AppApi
    {
        public static readonly AppApi Instance;

        static AppApi()
        {
            Instance = new AppApi();
        }

        public string MD5File(string Blob)
        {
            byte[] fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            byte[] md5 = MD5.Create().ComputeHash(fileData);
            return System.Convert.ToBase64String(md5);
        }

        public string SignFile(string Blob)
        {
            byte[] fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            Stream sig = Librsync.ComputeSignature(new MemoryStream(fileData));
            var memoryStream = new MemoryStream();
            sig.CopyTo(memoryStream);
            byte[] sigBytes = memoryStream.ToArray();
            return System.Convert.ToBase64String(sigBytes);
        }

        public string FileLength(string Blob)
        {
            byte[] fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            return fileData.Length.ToString();
        }

        public string ReadConfigFile()
        {
            var logPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat\";
            var configFile = Path.Combine(logPath, @"config.json");
            if (!Directory.Exists(logPath) || !File.Exists(configFile))
            {
                return "";
            }
            var json = File.ReadAllText(configFile);
            return json;
        }

        public void WriteConfigFile(string json)
        {
            var logPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat\";
            var configFile = Path.Combine(logPath, @"config.json");
            File.WriteAllText(configFile, json);
        }

        public void ShowDevTools()
        {
            MainForm.Instance.Browser.ShowDevTools();
        }

        public void DeleteAllCookies()
        {
            Cef.GetGlobalCookieManager().DeleteCookies();
        }

        public bool[] CheckGameRunning()
        {
            var isGameRunning = false;
            var isSteamVRRunning = false;

            if (Process.GetProcessesByName("vrchat").Length > 0)
            {
                isGameRunning = true;
            }
            if (Process.GetProcessesByName("vrserver").Length > 0)
            {
                isSteamVRRunning = true;
            }

            return new bool[]
            {
                isGameRunning,
                isSteamVRRunning
            };
        }

        public int QuitGame()
        {
            var processes = Process.GetProcessesByName("vrchat");
            if (processes.Length == 1)
                processes[0].Kill();

            return processes.Length;
        }

        public void StartGame(string arguments)
        {
            // try stream first
            try
            {
                using (var key = Registry.ClassesRoot.OpenSubKey(@"steam\shell\open\command"))
                {
                    // "C:\Program Files (x86)\Steam\steam.exe" -- "%1"
                    var match = Regex.Match(key.GetValue(string.Empty) as string, "^\"(.+?)\\\\steam.exe\"");
                    if (match.Success == true)
                    {
                        var path = match.Groups[1].Value;
                        // var _arguments = Uri.EscapeDataString(arguments);
                        Process.Start(new ProcessStartInfo
                        {
                            WorkingDirectory = path,
                            FileName = $"{path}\\steam.exe",
                            UseShellExecute = false,
                            Arguments = $"-applaunch 438100 {arguments}"
                        }).Close();
                        return;
                    }
                }
            }
            catch
            {
            }

            // fallback
            try
            {
                using (var key = Registry.ClassesRoot.OpenSubKey(@"VRChat\shell\open\command"))
                {
                    // "C:\Program Files (x86)\Steam\steamapps\common\VRChat\launch.exe" "%1" %*
                    var match = Regex.Match(key.GetValue(string.Empty) as string, "(?!\")(.+?\\\\VRChat.*)(!?\\\\launch.exe\")");
                    if (match.Success == true)
                    {
                        var path = match.Groups[1].Value;
                        StartGameFromPath(path, arguments);
                    }
                }
            }
            catch
            {
            }
        }

        public void StartGameFromPath(string path, string arguments)
        {
            if (!path.EndsWith(".exe"))
                path = Path.Combine(path, "start_protected_game.exe");

            Process.Start(new ProcessStartInfo
            {
                WorkingDirectory = Path.GetDirectoryName(path),
                FileName = path,
                UseShellExecute = false,
                Arguments = arguments
            }).Close();
        }

        public void OpenLink(string url)
        {
            if (url.StartsWith("http://") == true ||
                url.StartsWith("https://") == true)
            {
                Process.Start(url).Close();
            }
        }

        public void ShowVRForm()
        {
            try
            {
                MainForm.Instance.BeginInvoke(new MethodInvoker(() =>
                {
                    if (VRForm.Instance == null)
                    {
                        new VRForm().Show();
                    }
                }));
            }
            catch
            {
            }
        }

        public void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton)
        {
            VRCXVR.Instance.SetActive(active, hmdOverlay, wristOverlay, menuButton);
        }

        public void RefreshVR()
        {
            VRCXVR.Instance.Refresh();
        }

        public string[][] GetVRDevices()
        {
            return VRCXVR.Instance.GetDevices();
        }

        public float CpuUsage()
        {
            return CpuMonitor.Instance.CpuUsage;
        }

        public string GetImage(string url, string fileId, string version)
        {
            return ImageCache.GetImage(url, fileId, version);
        }

        public void DesktopNotification(string BoldText, string Text, string Image)
        {
            XmlDocument toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastImageAndText02);
            XmlNodeList stringElements = toastXml.GetElementsByTagName("text");
            String imagePath = Path.Combine(Program.BaseDirectory, "VRCX.ico");
            if (!String.IsNullOrEmpty(Image))
            {
                imagePath = Image;
            }
            stringElements[0].AppendChild(toastXml.CreateTextNode(BoldText));
            stringElements[1].AppendChild(toastXml.CreateTextNode(Text));
            XmlNodeList imageElements = toastXml.GetElementsByTagName("image");
            imageElements[0].Attributes.GetNamedItem("src").NodeValue = imagePath;
            ToastNotification toast = new ToastNotification(toastXml);
            ToastNotificationManager.CreateToastNotifier("VRCX").Show(toast);
        }

        private struct XSOMessage
        {
            public int messageType { get; set; }
            public int index { get; set; }
            public float volume { get; set; }
            public string audioPath { get; set; }
            public float timeout { get; set; }
            public string title { get; set; }
            public string content { get; set; }
            public string icon { get; set; }
            public float height { get; set; }
            public float opacity { get; set; }
            public bool useBase64Icon { get; set; }
            public string sourceApp { get; set; }
        }

        public void XSNotification(string Title, string Content, int Timeout, string Image)
        {
            bool UseBase64Icon;
            string Icon;
            if (String.IsNullOrEmpty(Image))
            {
                UseBase64Icon = true;
                Icon = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAHaGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NTE2MWIyMi1hYzgxLTY3NDYtODAyYi1kODIzYWFmN2RjYjciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZjJjNTA2ZS02YTVhLWRhNGEtOTg5Mi02NDZiMzQ0MGQxZTgiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6NmJmOGE5MTgtY2QzZS03OTRjLTk3NzktMzM0YjYwZWJiNTYyPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6N2YyYzUwNmUtNmE1YS1kYTRhLTk4OTItNjQ2YjM0NDBkMWU4IiBzdEV2dDp3aGVuPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmJhM2ZjODI3LTM0ZjQtYjU0OC05ZGFiLTZhMTZlZmQzZjAxMSIgc3RFdnQ6d2hlbj0iMjAyMS0wNC0wOFQxNTowMTozMSsxMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHN0RXZ0OndoZW49IjIwMjEtMDQtMDhUMTY6MzM6MTArMTI6MDAiIHN0RXZ0OnNv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";
            }
            else
            {
                UseBase64Icon = false;
                Icon = Image;
            }

            IPAddress broadcastIP = IPAddress.Parse("127.0.0.1");
            Socket broadcastSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            IPEndPoint endPoint = new IPEndPoint(broadcastIP, 42069);

            XSOMessage msg = new XSOMessage();
            msg.messageType = 1;
            msg.title = Title;
            msg.content = Content;
            msg.height = 110f;
            msg.sourceApp = "VRCX";
            msg.timeout = Timeout;
            msg.audioPath = "";
            msg.useBase64Icon = UseBase64Icon;
            msg.icon = Icon;

            byte[] byteBuffer = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(msg);
            broadcastSocket.SendTo(byteBuffer, endPoint);
        }

        public void DownloadVRCXUpdate(string url)
        {
            var Location = Path.Combine(Program.AppDataDirectory, "update.exe");
            WebClient client = new WebClient();
            client.Headers.Add("user-agent", Program.Version);
            client.DownloadFile(new Uri(url), Location);
        }

        public void RestartApplication()
        {
            Process VRCXProcess = new Process();
            VRCXProcess.StartInfo.FileName = Path.Combine(Program.BaseDirectory, "VRCX.exe");
            VRCXProcess.StartInfo.UseShellExecute = false;
            VRCXProcess.Start();
            Environment.Exit(0);
        }

        public bool CheckForUpdateExe()
        {
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                return true;
            return false;
        }

        public void ExecuteAppFunction(string function, string json)
        {
            if (MainForm.Instance != null)
                MainForm.Instance.Browser.ExecuteScriptAsync($"$app.{function}", json);
        }

        public void ExecuteVrFeedFunction(string function, string json)
        {
            if (VRCXVR._browser1 != null)
                VRCXVR._browser1.ExecuteScriptAsync($"$app.{function}", json);
        }

        public void ExecuteVrOverlayFunction(string function, string json)
        {
            if (VRCXVR._browser2 != null)
                VRCXVR._browser2.ExecuteScriptAsync($"$app.{function}", json);
        }

        public string GetLaunchCommand()
        {
            string command = StartupArgs.LaunchCommand;
            StartupArgs.LaunchCommand = string.Empty;
            return command;
        }

        public void FocusWindow()
        {
            MainForm.Instance.Invoke(new Action(() =>
            {
                if (MainForm.Instance.WindowState == FormWindowState.Minimized)
                    MainForm.Instance.WindowState = FormWindowState.Normal;

                MainForm.Instance.Show();
                MainForm.Instance.Activate();
            }));
        }

        public string CustomCssPath()
        {
            var output = String.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.css");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        public string CurrentCulture()
        {
            return System.Globalization.CultureInfo.CurrentCulture.ToString();
        }

        public string GetVersion()
        {
            return Program.Version;
        }

        public void ChangeTheme(int value)
        {
            WinformThemer.SetGlobalTheme(value);
        }

        public void DoFunny()
        {
            WinformThemer.DoFunny();
        }

        public double GetUptime()
        {
            using (var uptime = new PerformanceCounter("System", "System Up Time"))
            {
                uptime.NextValue();
                return TimeSpan.FromSeconds(uptime.NextValue()).TotalMilliseconds;
            }
        }

        private static readonly MD5 _hasher = MD5.Create();
        public int GetColourFromUserID(string userId)
        {
            var hash = _hasher.ComputeHash(Encoding.UTF8.GetBytes(userId));
            return hash[3] << 8 | hash[4];
        }

        public Dictionary<string, int> GetColourBulk(List<Object> userIds)
        {
            Dictionary<string, int> output = new Dictionary<string, int>();
            foreach (string userId in userIds)
            {
                output.Add(userId, GetColourFromUserID(userId));
            }
            return output;
        }

        public string GetClipboard()
        {
            var clipboard = String.Empty;
            Thread thread = new Thread(() => clipboard = Clipboard.GetText());
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return clipboard;
        }

        public void SetStartup(bool enabled)
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (enabled == true)
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
    }
}
