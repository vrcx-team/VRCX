// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Text;
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
            return WinApi.FindWindow("UnityWndClass", "VRChat") != IntPtr.Zero;
        }

        public void StartGame(string location, bool desktop)
        {
            try
            {
                using (var key = Registry.ClassesRoot.OpenSubKey(@"VRChat\shell\open\command"))
                {
                    // "C:\Program Files (x86)\Steam\steamapps\common\VRChat\launch.bat" "C:\Program Files (x86)\Steam\steamapps\common\VRChat" "%1"
                    var match = Regex.Match(key.GetValue(string.Empty) as string, "^\"(.+\\\\VRChat)\\\\launch.bat\"");
                    if (match.Success)
                    {
                        var path = match.Groups[1].Value;
                        var args = new StringBuilder();
                        if (desktop)
                        {
                            args.Append("--no-vr ");
                        }
                        args.Append("--enable-debug-gui ");
                        args.Append("\"vrchat://launch?id=");
                        args.Append(location);
                        args.Append('"');
                        Process.Start(new ProcessStartInfo
                        {
                            WorkingDirectory = path,
                            FileName = path + "\\VRChat.exe",
                            UseShellExecute = false,
                            Arguments = args.ToString()
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