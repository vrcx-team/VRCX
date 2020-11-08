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

namespace VRCX
{
    public class AppApi
    {
        public static readonly AppApi Instance;

        static AppApi()
        {
            Instance = new AppApi();
        }

        public void ShowDevTools()
        {
            MainForm.Instance.Browser.ShowDevTools();
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
