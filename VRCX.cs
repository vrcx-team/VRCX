// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using System;
using System.Windows.Forms;

namespace VRCX
{
    public class VRCX
    {
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

        public void StartGame(string location)
        {
            try
            {
                System.Diagnostics.Process.Start("vrchat://launch?id=" + location);
            }
            catch
            {
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
            VRCXVR.Start();
        }

        public void StopVR()
        {
            VRCXVR.Stop();
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
    }
}