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
    public class VRCX
    {
        public static VRCX Instance { get; private set; }

        static VRCX()
        {
            Instance = new VRCX();
        }

        public void ShowDevTools()
        {
            try
            {
                MainForm.Browser.ShowDevTools();
            }
            catch
            {
            }
        }

        public void DeleteAllCookies()
        {
            Cef.GetGlobalCookieManager().DeleteCookies();
        }

        public string LoginWithSteam()
        {
            return VRChatRPC.Update()
                ? VRChatRPC.GetAuthSessionTicket()
                : string.Empty;
        }

        public bool IsGameRunning()
        {
            IntPtr hwnd = WinApi.FindWindow("UnityWndClass", "VRChat");
            if (hwnd == IntPtr.Zero)
            {
                return false;
            }

            String cmdline;
            try
            {
                Int32 pid;
                WinApi.GetWindowThreadProcessId(hwnd, out pid);
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT CommandLine FROM Win32_Process WHERE ProcessId = " + pid))
                using (ManagementObjectCollection objects = searcher.Get())
                {
                    cmdline = objects.Cast<ManagementBaseObject>().SingleOrDefault()?["CommandLine"]?.ToString();
                }
            }
            catch
            {
                return false;
            }

            return !cmdline.Contains("--no-vr");
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
                        var _arguments = Uri.EscapeDataString(arguments);
                        Process.Start(new ProcessStartInfo
                        {
                            WorkingDirectory = path,
                            FileName = path + "\\steam.exe",
                            UseShellExecute = false,
                            Arguments = $"-- \"steam://rungameid/438100//{_arguments}\""
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
                    if (match.Success)
                    {
                        var path = match.Groups[1].Value;
                        Process.Start(new ProcessStartInfo
                        {
                            WorkingDirectory = path,
                            FileName = path + "\\VRChat.exe",
                            UseShellExecute = false,
                            Arguments = $"\"{arguments}\""
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
            if (url.StartsWith("http://") || url.StartsWith("https://"))
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
            VRCXVR.SetActive(true);
        }

        public void StopVR()
        {
            VRCXVR.SetActive(false);
        }

        public void RefreshVR()
        {
            VRCXVR.Refresh();
        }

        public string[][] GetVRDevices()
        {
            return VRCXVR.GetDevices();
        }

        public float CpuUsage()
        {
            return CpuMonitor.CpuUsage;
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
    }
}