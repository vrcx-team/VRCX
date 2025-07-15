using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using CefSharp;

namespace VRCX
{
    public class AppApiVrCef : AppApiVr
    {
        static AppApiVrCef()
        {
            Instance = new AppApiVrCef();
        }

        public override void Init()
        {
            // Create Instance before Cef tries to bind it
        }

        public override void VrInit()
        {
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync("$app.store.vr.vrInit", "");
        }

        public override void ToggleSystemMonitor(bool enabled)
        {
            SystemMonitorCef.Instance.Start(enabled);
        }

        /// <summary>
        /// Returns the current CPU usage as a percentage.
        /// </summary>
        /// <returns>The current CPU usage as a percentage.</returns>
        public override float CpuUsage()
        {
            return SystemMonitorCef.Instance.CpuUsage;
        }

        /// <summary>
        /// Returns an array of arrays containing information about the connected VR devices.
        /// Each sub-array contains the type of device and its current state
        /// </summary>
        /// <returns>An array of arrays containing information about the connected VR devices.</returns>
        public override string[][] GetVRDevices()
        {
            return Program.VRCXVRInstance.GetDevices();
        }

        /// <summary>
        /// Returns the number of milliseconds that the system has been running.
        /// </summary>
        /// <returns>The number of milliseconds that the system has been running.</returns>
        public override double GetUptime()
        {
            return SystemMonitorCef.Instance.UpTime;
        }

        /// <summary>
        /// Returns the current language of the operating system.
        /// </summary>
        /// <returns>The current language of the operating system.</returns>
        public override string CurrentCulture()
        {
            return CultureInfo.CurrentCulture.ToString();
        }

        /// <summary>
        /// Returns the file path of the custom user js file, if it exists.
        /// </summary>
        /// <returns>The file path of the custom user js file, or an empty string if it doesn't exist.</returns>
        public override string CustomVrScriptPath()
        {
            var output = string.Empty;
            var filePath = Path.Join(Program.AppDataDirectory, "customvr.js");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        public override bool IsRunningUnderWine()
        {
            return Wine.GetIfWine();
        }
        
        public override List<KeyValuePair<string, string>> GetExecuteVrFeedFunctionQueue()
        {
            throw new NotImplementedException("GetExecuteVrFeedFunctionQueue is not implemented in AppApiVrCef.");
        }

        public override List<KeyValuePair<string, string>> GetExecuteVrOverlayFunctionQueue()
        {
            throw new NotImplementedException("GetExecuteVrOverlayFunctionQueue is not implemented in AppApiVrCef.");
        }
    }
}