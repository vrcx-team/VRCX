// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Windows.UI.Notifications;
using CefSharp;
using librsync.net;
using Microsoft.Win32;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace VRCX
{
    public class AppApi
    {
        public static readonly AppApi Instance;

        private static readonly MD5 _hasher = MD5.Create();
        private static bool dialogOpen;

        static AppApi()
        {
            Instance = new AppApi();

            ProcessMonitor.Instance.ProcessStarted += Instance.OnProcessStateChanged;
            ProcessMonitor.Instance.ProcessExited += Instance.OnProcessStateChanged;
        }

        private void OnProcessStateChanged(MonitoredProcess monitoredProcess)
        {
            if (!monitoredProcess.HasName("VRChat") && !monitoredProcess.HasName("vrserver"))
                return;

            CheckGameRunning();
        }

        public string MD5File(string Blob)
        {
            var fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            var md5 = MD5.Create().ComputeHash(fileData);
            return Convert.ToBase64String(md5);
        }

        public string SignFile(string Blob)
        {
            var fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
            var sig = Librsync.ComputeSignature(new MemoryStream(fileData));
            var memoryStream = new MemoryStream();
            sig.CopyTo(memoryStream);
            var sigBytes = memoryStream.ToArray();
            return Convert.ToBase64String(sigBytes);
        }

        public string FileLength(string Blob)
        {
            var fileData = Convert.FromBase64CharArray(Blob.ToCharArray(), 0, Blob.Length);
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

            var cachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
            return cachePath;
        }

        public string GetVRChatCacheLocation()
        {
            return Path.Combine(GetVRChatAppDataLocation(), "Cache-WindowsPlayer");
        }

        public void ShowDevTools()
        {
            MainForm.Instance.Browser.ShowDevTools();
        }

        public void DeleteAllCookies()
        {
            Cef.GetGlobalCookieManager().DeleteCookies();
        }

        public void CheckGameRunning()
        {
            var isGameRunning = false;
            var isSteamVRRunning = false;

            if (ProcessMonitor.Instance.IsProcessRunning("VRChat"))
            {
                isGameRunning = true;
            }

            if (ProcessMonitor.Instance.IsProcessRunning("vrserver"))
            {
                isSteamVRRunning = true;
            }

            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading)
                MainForm.Instance.Browser.ExecuteScriptAsync("$app.updateIsGameRunning", isGameRunning, isSteamVRRunning);
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
                    if (match.Success)
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
                    if (match.Success)
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

        public bool StartGameFromPath(string path, string arguments)
        {
            if (!path.EndsWith(".exe"))
                path = Path.Combine(path, "start_protected_game.exe");

            if (!File.Exists(path))
                return false;

            Process.Start(new ProcessStartInfo
            {
                WorkingDirectory = Path.GetDirectoryName(path),
                FileName = path,
                UseShellExecute = false,
                Arguments = arguments
            })?.Close();
            return true;
        }

        public void OpenLink(string url)
        {
            if (url.StartsWith("http://") ||
                url.StartsWith("https://"))
            {
                Process.Start(url).Close();
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
            VRCXVR.Instance.SetActive(active, hmdOverlay, wristOverlay, menuButton, overlayHand);
        }

        public void RefreshVR()
        {
            VRCXVR.Instance.Restart();
        }

        public void RestartVR()
        {
            VRCXVR.Instance.Restart();
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

        public void DesktopNotification(string BoldText, string Text = "", string Image = "")
        {
            var toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastImageAndText02);
            var stringElements = toastXml.GetElementsByTagName("text");
            var imagePath = Path.Combine(Program.BaseDirectory, "VRCX.ico");
            if (!string.IsNullOrEmpty(Image))
            {
                imagePath = Image;
            }

            stringElements[0].AppendChild(toastXml.CreateTextNode(BoldText));
            stringElements[1].AppendChild(toastXml.CreateTextNode(Text));
            var imageElements = toastXml.GetElementsByTagName("image");
            imageElements[0].Attributes.GetNamedItem("src").NodeValue = imagePath;
            var toast = new ToastNotification(toastXml);
            ToastNotificationManager.CreateToastNotifier("VRCX").Show(toast);
        }

        public void XSNotification(string Title, string Content, int Timeout, string Image = "")
        {
            bool UseBase64Icon;
            string Icon;
            if (string.IsNullOrEmpty(Image))
            {
                UseBase64Icon = true;
                Icon =
                    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAHaGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NTE2MWIyMi1hYzgxLTY3NDYtODAyYi1kODIzYWFmN2RjYjciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZjJjNTA2ZS02YTVhLWRhNGEtOTg5Mi02NDZiMzQ0MGQxZTgiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6NmJmOGE5MTgtY2QzZS03OTRjLTk3NzktMzM0YjYwZWJiNTYyPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6N2YyYzUwNmUtNmE1YS1kYTRhLTk4OTItNjQ2YjM0NDBkMWU4IiBzdEV2dDp3aGVuPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmJhM2ZjODI3LTM0ZjQtYjU0OC05ZGFiLTZhMTZlZmQzZjAxMSIgc3RFdnQ6d2hlbj0iMjAyMS0wNC0wOFQxNTowMTozMSsxMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHN0RXZ0OndoZW49IjIwMjEtMDQtMDhUMTY6MzM6MTArMTI6MDAiIHN0RXZ0OnNv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";
            }
            else
            {
                UseBase64Icon = false;
                Icon = Image;
            }

            var broadcastIP = IPAddress.Parse("127.0.0.1");
            var broadcastSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            var endPoint = new IPEndPoint(broadcastIP, 42069);

            var msg = new XSOMessage();
            msg.messageType = 1;
            msg.title = Title;
            msg.content = Content;
            msg.height = 110f;
            msg.sourceApp = "VRCX";
            msg.timeout = Timeout;
            msg.audioPath = "";
            msg.useBase64Icon = UseBase64Icon;
            msg.icon = Icon;

            var byteBuffer = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(msg);
            broadcastSocket.SendTo(byteBuffer, endPoint);
        }

        public void DownloadVRCXUpdate(string url)
        {
            var Location = Path.Combine(Program.AppDataDirectory, "update.exe");
            var client = new WebClient();
            client.Headers.Add("user-agent", Program.Version);
            client.DownloadFile(new Uri(url), Location);
        }

        public void RestartApplication()
        {
            var VRCXProcess = new Process();
            VRCXProcess.StartInfo.FileName = Path.Combine(Program.BaseDirectory, "VRCX.exe");
            VRCXProcess.StartInfo.UseShellExecute = false;
            VRCXProcess.StartInfo.Arguments = "/Upgrade";
            VRCXProcess.Start();
            Environment.Exit(0);
        }

        public bool CheckForUpdateExe()
        {
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                return true;
            return false;
        }

        public void IPCAnnounceStart()
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VRCXLaunch"
            });
        }

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
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading)
                MainForm.Instance.Browser.ExecuteScriptAsync($"$app.{function}", json);
        }

        public void ExecuteVrFeedFunction(string function, string json)
        {
            if (VRCXVR._browser1 == null) return;
            if (VRCXVR._browser1.IsLoading)
                VRCXVR.Instance.Restart();
            VRCXVR._browser1.ExecuteScriptAsync($"$app.{function}", json);
        }

        public void ExecuteVrOverlayFunction(string function, string json)
        {
            if (VRCXVR._browser2 == null) return;
            if (VRCXVR._browser2.IsLoading)
                VRCXVR.Instance.Restart();
            VRCXVR._browser2.ExecuteScriptAsync($"$app.{function}", json);
        }

        public string GetLaunchCommand()
        {
            var command = StartupArgs.LaunchCommand;
            StartupArgs.LaunchCommand = string.Empty;
            return command;
        }

        public void FocusWindow()
        {
            MainForm.Instance.Invoke(new Action(() => { MainForm.Instance.Focus_Window(); }));
        }

        public string CustomCssPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.css");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

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

        public double GetUptime()
        {
            using (var uptime = new PerformanceCounter("System", "System Up Time"))
            {
                uptime.NextValue();
                return TimeSpan.FromSeconds(uptime.NextValue()).TotalMilliseconds;
            }
        }

        public int GetColourFromUserID(string userId)
        {
            var hash = _hasher.ComputeHash(Encoding.UTF8.GetBytes(userId));
            return (hash[3] << 8) | hash[4];
        }

        public Dictionary<string, int> GetColourBulk(List<object> userIds)
        {
            var output = new Dictionary<string, int>();
            foreach (string userId in userIds)
            {
                output.Add(userId, GetColourFromUserID(userId));
            }

            return output;
        }

        public string GetClipboard()
        {
            var clipboard = string.Empty;
            var thread = new Thread(() => clipboard = Clipboard.GetText());
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();
            return clipboard;
        }

        public object GetVRChatRegistryKey(string key)
        {
            // https://answers.unity.com/questions/177945/playerprefs-changing-the-name-of-keys.html?childToView=208076#answer-208076
            // VRC_GROUP_ORDER_usr_032383a7-748c-4fb2-94e4-bcb928e5de6b_h2810492971
            uint hash = 5381;
            foreach (var c in key)
                hash = (hash * 33) ^ c;
            var keyName = key + "_h" + hash;

            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                var data = regKey?.GetValue(keyName);
                if (data == null)
                    return null;

                var type = regKey.GetValueKind(keyName);
                switch (type)
                {
                    case RegistryValueKind.Binary:
                        return Encoding.ASCII.GetString((byte[])data);

                    case RegistryValueKind.DWord:
                        if (data.GetType() != typeof(long))
                            return data;

                        long.TryParse(data.ToString(), out var longValue);
                        var bytes = BitConverter.GetBytes(longValue);
                        var doubleValue = BitConverter.ToDouble(bytes, 0);
                        return doubleValue;
                }
            }

            return null;
        }

        public bool SetVRChatRegistryKey(string key, string value)
        {
            uint hash = 5381;
            foreach (var c in key)
                hash = (hash * 33) ^ c;
            var keyName = key + "_h" + hash;

            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat", true))
            {
                if (regKey?.GetValue(keyName) == null)
                    return false;

                var type = regKey.GetValueKind(keyName);
                object setValue = null;
                switch (type)
                {
                    case RegistryValueKind.Binary:
                        setValue = Encoding.ASCII.GetBytes(value);
                        break;

                    case RegistryValueKind.DWord:
                        setValue = value;
                        break;
                }

                if (setValue == null)
                    return false;

                regKey.SetValue(keyName, setValue, type);
            }

            return true;
        }

        public Dictionary<string, short> GetVRChatModerations(string currentUserId)
        {
            var filePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + $@"Low\VRChat\VRChat\LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset";
            if (!File.Exists(filePath))
                return null;

            var output = new Dictionary<string, short>();
            using (var reader = new StreamReader(filePath))
            {
                string line;
                int index;
                string userId;
                short type;
                while ((line = reader.ReadLine()) != null)
                {
                    index = line.IndexOf(' ');
                    if (index <= 0)
                        continue;

                    userId = line.Substring(0, index);
                    type = short.Parse(line.Substring(line.Length - 3));
                    output.Add(userId, type);
                }
            }

            return output;
        }

        public short GetVRChatUserModeration(string currentUserId, string userId)
        {
            var filePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + $@"Low\VRChat\VRChat\LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset";
            if (!File.Exists(filePath))
                return 0;

            using (var reader = new StreamReader(filePath))
            {
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    var index = line.IndexOf(' ');
                    if (index <= 0)
                        continue;

                    if (userId == line.Substring(0, index))
                    {
                        return short.Parse(line.Substring(line.Length - 3));
                    }
                }
            }

            return 0;
        }

        public bool SetVRChatUserModeration(string currentUserId, string userId, int type)
        {
            var filePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + $@"Low\VRChat\VRChat\LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset";
            if (!File.Exists(filePath))
                return false;

            var lines = File.ReadAllLines(filePath).ToList();
            var index = lines.FindIndex(x => x.StartsWith(userId));
            if (index >= 0)
                lines.RemoveAt(index);

            if (type != 0)
            {
                var sb = new StringBuilder(userId);
                while (sb.Length < 64)
                    sb.Append(' ');

                sb.Append(type.ToString("000"));
                lines.Add(sb.ToString());
            }

            try
            {
                File.WriteAllLines(filePath, lines);
            }
            catch (Exception)
            {
                return false;
            }

            return true;
        }

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

        public void AddScreenshotMetadata(string path, string metadataString, string worldId, bool changeFilename = false)
        {
            var fileName = Path.GetFileNameWithoutExtension(path);
            if (!File.Exists(path) || !path.EndsWith(".png") || !fileName.StartsWith("VRChat_"))
                return;

            if (changeFilename)
            {
                var newFileName = $"{fileName}_{worldId}";
                var newPath = Path.Combine(Path.GetDirectoryName(path), newFileName + Path.GetExtension(path));
                File.Move(path, newPath);
                path = newPath;
            }

            ScreenshotHelper.WritePNGDescription(path, metadataString);
        }

        // Create a function that opens a file dialog so a user can choose a .png file. Print the name of the file after it is chosen
        public void OpenScreenshotFileDialog()
        {
            if (dialogOpen) return;
            dialogOpen = true;

            var thread = new Thread(() =>
            {
                using (var openFileDialog = new OpenFileDialog())
                {
                    openFileDialog.DefaultExt = ".png";
                    openFileDialog.Filter = "PNG Files (*.png)|*.png";
                    openFileDialog.FilterIndex = 1;
                    openFileDialog.RestoreDirectory = true;

                    var initialPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "VRChat");
                    if (Directory.Exists(initialPath))
                    {
                        openFileDialog.InitialDirectory = initialPath;
                    }

                    if (openFileDialog.ShowDialog() != DialogResult.OK)
                    {
                        dialogOpen = false;
                        return;
                    }

                    dialogOpen = false;

                    var path = openFileDialog.FileName;
                    if (string.IsNullOrEmpty(path))
                        return;

                    GetScreenshotMetadata(path);
                }
            });

            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
        }

        public void GetScreenshotMetadata(string path)
        {
            if (string.IsNullOrEmpty(path))
                return;

            var fileName = Path.GetFileNameWithoutExtension(path);
            var metadata = new JObject();
            if (File.Exists(path) && path.EndsWith(".png"))
            {
                string metadataString = null;
                var readPNGFailed = false;

                try
                {
                    metadataString = ScreenshotHelper.ReadPNGDescription(path);
                }
                catch (Exception ex)
                {
                    metadata.Add("error", $"VRCX encountered an error while trying to parse this file. The file might be an invalid/corrupted PNG file.\n({ex.Message})");
                    readPNGFailed = true;
                }

                if (!string.IsNullOrEmpty(metadataString))
                {
                    if (metadataString.StartsWith("lfs") || metadataString.StartsWith("screenshotmanager"))
                    {
                        try
                        {
                            metadata = ScreenshotHelper.ParseLfsPicture(metadataString);
                        }
                        catch (Exception ex)
                        {
                            metadata.Add("error", $"This file contains invalid LFS/SSM metadata unable to be parsed by VRCX. \n({ex.Message})\nText: {metadataString}");
                        }
                    }
                    else
                    {
                        try
                        {
                            metadata = JObject.Parse(metadataString);
                        }
                        catch (JsonReaderException ex)
                        {
                            metadata.Add("error", $"This file contains invalid metadata unable to be parsed by VRCX. \n({ex.Message})\nText: {metadataString}");
                        }
                    }
                }
                else
                {
                    if (!readPNGFailed)
                        metadata.Add("error", "No metadata found in this file.");
                }
            }
            else
            {
                metadata.Add("error", "Invalid file selected. Please select a valid VRChat screenshot.");
            }

            var files = Directory.GetFiles(Path.GetDirectoryName(path), "*.png");
            var index = Array.IndexOf(files, path);
            if (index > 0)
            {
                metadata.Add("previousFilePath", files[index - 1]);
            }

            if (index < files.Length - 1)
            {
                metadata.Add("nextFilePath", files[index + 1]);
            }

            metadata.Add("fileResolution", ScreenshotHelper.ReadPNGResolution(path));
            var creationDate = File.GetCreationTime(path);
            metadata.Add("creationDate", creationDate.ToString("yyyy-MM-dd HH:mm:ss"));
            metadata.Add("fileName", fileName);
            metadata.Add("filePath", path);
            var fileSizeBytes = new FileInfo(path).Length;
            metadata.Add("fileSizeBytes", fileSizeBytes.ToString());
            metadata.Add("fileSize", $"{(fileSizeBytes / 1024f / 1024f).ToString("0.00")} MB");
            ExecuteAppFunction("displayScreenshotMetadata", metadata.ToString(Formatting.Indented));
        }

        public void GetLastScreenshot()
        {
            // Get the last screenshot taken by VRChat
            var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "VRChat");
            if (!Directory.Exists(path))
                return;

            var lastDirectory = Directory.GetDirectories(path).OrderByDescending(Directory.GetCreationTime).FirstOrDefault();
            if (lastDirectory == null)
                return;

            var lastScreenshot = Directory.GetFiles(lastDirectory, "*.png").OrderByDescending(File.GetCreationTime).FirstOrDefault();
            if (lastScreenshot == null)
                return;

            GetScreenshotMetadata(lastScreenshot);
        }

        public void CopyImageToClipboard(string path)
        {
            // check if the file exists and is any image file type
            if (File.Exists(path) && (path.EndsWith(".png") || path.EndsWith(".jpg") || path.EndsWith(".jpeg") || path.EndsWith(".gif") || path.EndsWith(".bmp") || path.EndsWith(".webp")))
            {
                MainForm.Instance.BeginInvoke(new MethodInvoker(() =>
                {
                    var image = Image.FromFile(path);
                    Clipboard.SetImage(image);
                }));
            }
        }

        public void OpenShortcutFolder()
        {
            var path = AutoAppLaunchManager.Instance.AppShortcutDirectory;
            if (!Directory.Exists(path))
                return;

            OpenFolderAndSelectItem(path, true);
        }

        public void OpenFolderAndSelectItem(string path, bool isFolder = false)
        {
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
                return;
            }

            result = WinApi.SHParseDisplayName(path, IntPtr.Zero, out pidlFile, 0, out psfgaoOut);
            if (result != 0)
            {
                // Free the PIDL we allocated earlier if we failed to parse the display name of the file.
                Marshal.FreeCoTaskMem(pidlFolder);
                return;
            }

            IntPtr[] files = { pidlFile };

            try
            {
                // Open the containing folder and select our file. SHOpenFolderAndSelectItems will respect existing explorer instances, open a new one if none exist, will properly handle paths > 120 chars, and work with third-party filesystem viewers that hook into winapi calls.
                // It can select multiple items, but we only need to select one. 
                WinApi.SHOpenFolderAndSelectItems(pidlFolder, (uint)files.Length, files, 0);
            }
            finally
            {
                // Free the PIDLs we allocated earlier
                Marshal.FreeCoTaskMem(pidlFolder);
                Marshal.FreeCoTaskMem(pidlFile);
            }
        }

        public void FlashWindow()
        {
            MainForm.Instance.BeginInvoke(new MethodInvoker(() => { WinformThemer.Flash(MainForm.Instance); }));
        }

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
    }
}