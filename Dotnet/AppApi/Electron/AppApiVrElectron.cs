using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace VRCX
{
    public class AppApiVrElectron : AppApiVr
    {
        static AppApiVrElectron()
        {
            Instance = new AppApiVrElectron();
        }

        public override void Init()
        {
        }

        public override void VrInit()
        {
        }

        public override List<KeyValuePair<string, string>> GetExecuteVrFeedFunctionQueue()
        {
            var list = new List<KeyValuePair<string, string>>();
            while (Program.VRCXVRInstance.GetExecuteVrFeedFunctionQueue().TryDequeue(out var item))
            {
                list.Add(item);
            }
            return list;
        }

        public override List<KeyValuePair<string, string>> GetExecuteVrOverlayFunctionQueue()
        {
            var list = new List<KeyValuePair<string, string>>();
            while (Program.VRCXVRInstance.GetExecuteVrOverlayFunctionQueue().TryDequeue(out var item))
            {
                list.Add(item);
            }
            return list;
        }

        public override void ToggleSystemMonitor(bool enabled)
        {
            SystemMonitorElectron.Instance.Start(enabled);
        }

        /// <summary>
        /// Returns the current CPU usage as a percentage.
        /// </summary>
        /// <returns>The current CPU usage as a percentage.</returns>
        public override float CpuUsage()
        {
            return SystemMonitorElectron.Instance.CpuUsage;
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
            return SystemMonitorElectron.Instance.UpTime;
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
        public override string CustomVrScript()
        {
            var filePath = Path.Join(Program.AppDataDirectory, "customvr.js");
            if (File.Exists(filePath))
                return File.ReadAllText(filePath);

            return string.Empty;
        }
    }
}
