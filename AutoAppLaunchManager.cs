using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using System.Windows.Forms;

namespace VRCX
{
    /// <summary>
    /// Planned feature overview
    /// General summary of feature: Automatically launch user-defined apps when VRChat is launched, and close thm when VRChat is closed. 
    /// The feature should: 
    /// - Allow users to add/remove apps to the list of apps to be launched
    /// - Automatically launch apps when VRChat is launched
    /// - Automatically close apps when VRChat is closed
    /// - Monitor the list of apps to be launched for changes
    /// - Allow users to enable/disable the feature
    /// - Monitor the VRChat process/log(?) for changes
    /// </summary>
    public class AutoAppLaunchManager
    {
        public static AutoAppLaunchManager Instance { get; private set; }
        public bool Enabled = true;
        public readonly string AppShortcutDirectory;

        private DateTime startTime = DateTime.Now;
        private string[] shortcutFiles;
        private System.Timers.Timer processMonitorTimer;
        private Process vrchatProcess;
        private List<Process> monitoredProcesses;
        private static readonly byte[] shortcutSignatureBytes = { 0x4C, 0x00, 0x00, 0x00 }; // signature for ShellLinkHeader\

        static AutoAppLaunchManager() 
        {
            Instance = new AutoAppLaunchManager();
        }

        public AutoAppLaunchManager() 
        {
            AppShortcutDirectory = Path.Combine(Program.AppDataDirectory, "startup");

            if (!Directory.Exists(AppShortcutDirectory))
            {
                Directory.CreateDirectory(AppShortcutDirectory);
            }

            // I just realized languages other than English exist! Damn.
            /*string readmePath = Path.Combine(AppShortcutDirectory, "README.txt");
            if (!File.Exists(readmePath))
            {
                File.WriteAllText(readmePath, "Any windows shortcuts placed in this folder will be automatically launched and closed according to the current state of the VRChat process if the feature is enabled.");
            }*/

            processMonitorTimer = new System.Timers.Timer();
            processMonitorTimer.Interval = 1000;
            processMonitorTimer.Elapsed += Timer_Elapsed;

            shortcutFiles = FindShortcutFiles(AppShortcutDirectory);
            monitoredProcesses = new List<Process>();
        }

        internal void Init()
        {
            processMonitorTimer.Start();
        }

        internal void Exit()
        {
            Enabled = false;
            vrchatProcess = null;
            processMonitorTimer.Stop();

            foreach (var process in monitoredProcesses)
            {
                if (!process.HasExited)
                    process.Kill();
            }
        }

        private static string[] FindShortcutFiles(string folderPath)
        {
            DirectoryInfo directoryInfo = new DirectoryInfo(folderPath);
            FileInfo[] files = directoryInfo.GetFiles();
            List<string> ret = new List<string>();

            foreach (FileInfo file in files)
            {
                if (IsShortcutFile(file.FullName))
                {
                    ret.Add(file.FullName);
                }
            }

            return ret.ToArray();
        }

        private static bool IsShortcutFile(string filePath)
        {
            byte[] headerBytes = new byte[4];
            using (FileStream fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                if (fileStream.Length >= 4)
                {
                    fileStream.Read(headerBytes, 0, 4);
                }
            }

            return headerBytes.SequenceEqual(shortcutSignatureBytes);
        }


        private void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            if (!Enabled) return;

            if (vrchatProcess == null)
            {
                var process = Process.GetProcessesByName("VRChat").FirstOrDefault();

                // Make sure the process is newer than the start time of VRCX.
                if (process != null && process.StartTime > this.startTime)
                {
                    vrchatProcess = process;
                }
            }
            else
            {
                if (vrchatProcess.HasExited)
                {
                    vrchatProcess = null;

                    foreach (var process in monitoredProcesses)
                    {
                        if (!process.HasExited)
                            process.Kill();
                    }

                    monitoredProcesses.Clear();

                    return;
                }

                if (shortcutFiles.Length > 0 && monitoredProcesses.Count == 0)
                {
                    foreach (var file in shortcutFiles) 
                    {
                        var process = Process.Start(file);
                        //process.EnableRaisingEvents = true;
                        //process.Exited += ProcessExited;
                        monitoredProcesses.Add(process);
                    }
                }
            }
        }
    }
}
