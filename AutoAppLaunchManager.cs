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
        public static readonly string VRChatProcessName = "VRChat";

        public bool Enabled = false;
        /// <summary> Whether or not to kill child processes when VRChat closes. </summary>
        public bool KillChildrenOnExit = true;
        public readonly string AppShortcutDirectory;

        private DateTime startTime = DateTime.Now;
        private Dictionary<string, Process> startedProcesses = new Dictionary<string, Process>();
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
            if (startedProcesses.Count == 0 || !monitoredProcess.HasName(VRChatProcessName))
                return;

            if (KillChildrenOnExit)
                KillChildProcesses();
        }

        private void OnProcessStarted(MonitoredProcess monitoredProcess)
        {
            if (!Enabled || !monitoredProcess.HasName(VRChatProcessName) || monitoredProcess.Process.StartTime < startTime)
                return;

            if (KillChildrenOnExit)
                KillChildProcesses();

            var shortcutFiles = FindShortcutFiles(AppShortcutDirectory);

            foreach (var file in shortcutFiles)
            {
                if (!IsChildProcessRunning(file))
                {
                    StartChildProcess(file);
                }
            }
        }

        /// <summary>
        /// Kills all running child processes.
        /// </summary>
        internal void KillChildProcesses()
        {
            foreach (var pair in startedProcesses)
            {
                var process = pair.Value;

                if (!process.HasExited)
                    process.Kill();
            }

            startedProcesses.Clear();
        }

        /// <summary>
        /// Starts a new child process.
        /// </summary>
        /// <param name="path">The path.</param>
        internal void StartChildProcess(string path)
        {
            var process = Process.Start(path);
            startedProcesses.Add(path, process);
        }

        /// <summary>
        /// Updates the child processes list.
        /// Removes any processes that have exited.
        /// </summary>
        internal void UpdateChildProcesses()
        {
            foreach (var pair in startedProcesses.ToList())
            {
                var process = pair.Value;
                if (process.HasExited)
                    startedProcesses.Remove(pair.Key);
            }
        }

        /// <summary>
        /// Checks to see if a given file matches a current running child process.
        /// </summary>
        /// <param name="path">The path.</param>
        /// <returns>
        ///   <c>true</c> if child process running; otherwise, <c>false</c>.
        /// </returns>
        internal bool IsChildProcessRunning(string path)
        {
            return startedProcesses.ContainsKey(path);
        }

        internal void Init()
        {
            // What are you lookin at?
        }

        internal void Exit()
        {
            Enabled = false;

            KillChildProcesses();
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
