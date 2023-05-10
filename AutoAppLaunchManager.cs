using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace VRCX
{
    /// <summary>
    /// The class responsible for launching user-defined applications when VRChat opens/closes.
    /// </summary>
    public class AutoAppLaunchManager
    {
        public static AutoAppLaunchManager Instance { get; private set; }
        public bool Enabled = true;
        public readonly string AppShortcutDirectory;

        private DateTime startTime = DateTime.Now;
        private List<Process> startedProcesses = new List<Process>();
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

            ProcessMonitor.Instance.ProcessStarted += OnProcessStarted;
            ProcessMonitor.Instance.ProcessExited += OnProcessExited;
        }

        private void OnProcessExited(MonitoredProcess monitoredProcess)
        {
            if (startedProcesses.Count == 0 || !monitoredProcess.HasName("VRChat"))
                return;

            foreach (var process in startedProcesses)
            {
                if (!process.HasExited)
                    process.Kill();
            }

            startedProcesses.Clear();
        }

        private void OnProcessStarted(MonitoredProcess monitoredProcess)
        {
            if (!monitoredProcess.HasName("VRChat") || monitoredProcess.Process.StartTime < startTime) 
                return;

            if (startedProcesses.Count > 0)
            {
                foreach (var process in startedProcesses)
                {
                    if (!process.HasExited)
                        process.Kill();
                }

                startedProcesses.Clear();
            }

            var shortcutFiles = FindShortcutFiles(AppShortcutDirectory);

            if (shortcutFiles.Length > 0)
            {
                foreach (var file in shortcutFiles)
                {
                    var process = Process.Start(file);
                    startedProcesses.Add(process);
                }
            }
        }

        internal void Init()
        {
            // What are you lookin at?
        }

        internal void Exit()
        {
            Enabled = false;

            foreach (var process in startedProcesses)
            {
                if (!process.HasExited)
                    process.Kill();
            }
        }

        /// <summary>
        /// Finds windows shortcut files in a given folder.
        /// </summary>
        /// <param name="folderPath">The folder path.</param>
        /// <returns>An array of shortcut paths. If none, then empty.</returns>
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

        /// <summary>
        /// Determines whether the specified file path is a shortcut by checking the file header.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <returns><c>true</c> if the given file path is a shortcut, otherwise <c>false</c></returns>
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
    }
}
