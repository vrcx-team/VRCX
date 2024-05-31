using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using CefSharp;

namespace VRCX
{
    public class AppApiVr
    {
        public static readonly AppApiVr Instance;
        private static readonly PerformanceCounter Uptime;

        static AppApiVr()
        {
            Instance = new AppApiVr();

            try
            {
                Uptime = new PerformanceCounter("System", "System Up Time");
            }
            catch
            {
                Uptime = null;
            }
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
            if (Uptime == null)
                return 0;

            Uptime.NextValue();
            return TimeSpan.FromSeconds(Uptime.NextValue()).TotalMilliseconds;
        }
        
        /// <summary>
        /// Returns the current language of the operating system.
        /// </summary>
        /// <returns>The current language of the operating system.</returns>
        public string CurrentCulture()
        {
            return CultureInfo.CurrentCulture.ToString();
        }
        
        /// <summary>
        /// Returns the file path of the custom user js file, if it exists.
        /// </summary>
        /// <returns>The file path of the custom user js file, or an empty string if it doesn't exist.</returns>
        public string CustomVrScriptPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\customvr.js");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }
    }
}