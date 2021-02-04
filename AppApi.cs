// Copyright(c) 2019-2020 pypy. All rights reserved.
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
using System.Net;
using Windows.UI.Notifications;
using Windows.Data.Xml.Dom;
using System.Windows;

namespace VRCX
{
    public class AppApi
    {
        public static readonly AppApi Instance;

        static AppApi()
        {
            Instance = new AppApi();
        }

        public void CloseMainWindow()
        {
            try
            {
                MainWindow.Instance.Dispatcher.BeginInvoke(new MethodInvoker(() =>
                {
                    MainWindow.Instance.Close();
                }));
            }
            catch
            {
            }
        }

        public void MinimizeMainWindow()
        {
            try
            {
                MainWindow.Instance.Dispatcher.BeginInvoke(new MethodInvoker(() =>
                {
                    MainWindow.Instance.WindowState = WindowState.Minimized;
                }));
            }
            catch
            {
            }
        }

        public void ToggleMaximizeMainWindow()
        {
            try
            {
                MainWindow.Instance.Dispatcher.BeginInvoke(new MethodInvoker(() =>
                {
                    var mainWindow = MainWindow.Instance;
                    if (mainWindow.WindowState == WindowState.Maximized)
                    {
                        mainWindow.WindowState = WindowState.Normal;
                    }
                    else
                    {
                        mainWindow.WindowState = WindowState.Maximized;
                    }
                }));
            }
            catch
            {
            }
        }

        public void ShowDevTools()
        {
            MainWindow.Instance.Browser.ShowDevTools();
        }

        public void DeleteAllCookies()
        {
            Cef.GetGlobalCookieManager().DeleteCookies();
        }

        public string LoginWithSteam()
        {
            var rpc = VRChatRPC.Instance;
            return rpc.Update() == true
                ? rpc.GetAuthSessionTicket()
                : string.Empty;
        }

        public bool[] CheckGameRunning()
        {
            var isGameRunning = false;
            var isGameNoVR = false;

            var hwnd = WinApi.FindWindow("UnityWndClass", "VRChat");
            if (hwnd != IntPtr.Zero)
            {
                var cmdline = string.Empty;

                try
                {
                    WinApi.GetWindowThreadProcessId(hwnd, out uint pid);
                    using (var searcher = new ManagementObjectSearcher($"SELECT CommandLine FROM Win32_Process WHERE ProcessId = {pid}"))
                    using (var objects = searcher.Get())
                    {
                        cmdline = objects.Cast<ManagementBaseObject>().SingleOrDefault()?["CommandLine"]?.ToString();
                    }
                }
                catch
                {
                }

                isGameRunning = true;
                isGameNoVR = cmdline.Contains("--no-vr");
            }

            return new bool[]
            {
                isGameRunning,
                isGameNoVR
            };
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
                    // "C:\Program Files (x86)\Steam\steamapps\common\VRChat\launch.bat" "C:\Program Files (x86)\Steam\steamapps\common\VRChat" "%1"
                    var match = Regex.Match(key.GetValue(string.Empty) as string, "^\"(.+?)\\\\launch.bat\"");
                    if (match.Success == true)
                    {
                        var path = match.Groups[1].Value;
                        Process.Start(new ProcessStartInfo
                        {
                            WorkingDirectory = path,
                            FileName = $"{path}\\VRChat.exe",
                            UseShellExecute = false,
                            Arguments = arguments
                        }).Close();
                    }
                }
            }
            catch
            {
            }
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
                /*MainForm.Instance.BeginInvoke(new MethodInvoker(() =>
                {
                    if (VRForm.Instance == null)
                    {
                        new VRForm().Show();
                    }
                }));*/
            }
            catch
            {
            }
        }

        public void StartVR()
        {
            VRCXVR.Instance.SetActive(true);
        }

        public void StopVR()
        {
            VRCXVR.Instance.SetActive(false);
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

        public void DesktopNotification(string BoldText, string Text, string ImageURL = "")
        {
            XmlDocument toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastImageAndText02);
            XmlNodeList stringElements = toastXml.GetElementsByTagName("text");
            String imagePath = Path.Combine(Program.BaseDirectory, "cache\\toast");
            if (ImageURL == String.Empty)
            {
                imagePath = Path.Combine(Program.BaseDirectory, "VRCX.ico");
            }
            else
            {
                using (var client = new WebClient())
                {
                    client.DownloadFile(ImageURL, imagePath);
                }
            }
            stringElements[0].AppendChild(toastXml.CreateTextNode(BoldText));
            stringElements[1].AppendChild(toastXml.CreateTextNode(Text));
            XmlNodeList imageElements = toastXml.GetElementsByTagName("image");
            imageElements[0].Attributes.GetNamedItem("src").NodeValue = imagePath;
            ToastNotification toast = new ToastNotification(toastXml);
            ToastNotificationManager.CreateToastNotifier("VRCX").Show(toast);
        }

        public void SetStartup(bool enabled)
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (enabled == true)
                    {
                        var path = System.Reflection.Assembly.GetExecutingAssembly().Location;
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
