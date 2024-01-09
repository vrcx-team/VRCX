using System;
using System.Diagnostics;
using System.Globalization;
using CefSharp;

namespace VRCX
{
    public class AppApiVr
    {
        public static readonly AppApiVr Instance;

        static AppApiVr()
        {
            Instance = new AppApiVr();
        }
        
        public void VrInit()
        {
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync("$app.vrInit", "");
        }
        
        /// <summary>
        /// Returns the current CPU usage as a percentage.
        /// </summary>
        /// <returns>The current CPU usage as a percentage.</returns>
        public float CpuUsage()
        {
            return CpuMonitor.Instance.CpuUsage;
        }
        
        /// <summary>
        /// Returns an array of arrays containing information about the connected VR devices.
        /// Each sub-array contains the type of device and its current state
        /// </summary>
        /// <returns>An array of arrays containing information about the connected VR devices.</returns>
        public string[][] GetVRDevices()
        {
            return VRCXVR.Instance.GetDevices();
        }
        
        /// <summary>
        /// Returns the number of milliseconds that the system has been running.
        /// </summary>
        /// <returns>The number of milliseconds that the system has been running.</returns>
        public double GetUptime()
        {
            using var uptime = new PerformanceCounter("System", "System Up Time");
            uptime.NextValue();
            return TimeSpan.FromSeconds(uptime.NextValue()).TotalMilliseconds;
        }
        
        /// <summary>
        /// Returns the current language of the operating system.
        /// </summary>
        /// <returns>The current language of the operating system.</returns>
        public string CurrentCulture()
        {
            return CultureInfo.CurrentCulture.ToString();
        }
    }
}