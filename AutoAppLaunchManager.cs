using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

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
        private static readonly byte[] shortcutSignatureBytes = { 0x4C, 0x00, 0x00, 0x00 }; // signature for ShellLinkHeader

        private const uint TH32CS_SNAPPROCESS = 2;

        // Requires access rights 'PROCESS_QUERY_INFORMATION' and 'PROCESS_VM_READ'
        [DllImport("kernel32.dll")]
        public static extern IntPtr CreateToolhelp32Snapshot(uint dwFlags, uint th32ProcessID);

        [DllImport("kernel32.dll")]
        public static extern bool Process32First(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);

        [DllImport("kernel32.dll")]
        public static extern bool Process32Next(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);

        [StructLayout(LayoutKind.Sequential)]
        public struct PROCESSENTRY32
        {
            public uint dwSize;
            public uint cntUsage;
            public uint th32ProcessID;
            public IntPtr th32DefaultHeapID;
            public uint th32ModuleID;
            public uint cntThreads;
            public uint th32ParentProcessID;
            public int pcPriClassBase;
            public uint dwFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
            public string szExeFile;
        };

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
                {
                    KillProcessTree(process.Id);
                    //process.Kill();
                }
            }

            startedProcesses.Clear();
        }

        // TODO: Proper error handling for winapi calls.
        // Will fail if process is protected, has admin rights, user account is limited(?), or process is dead
        // catch win32exceptions

        // This is a recursive function that kills a process and all of its children.
        // It uses the CreateToolhelp32Snapshot winapi func to get a snapshot of all running processes, loops through them with Process32First/Process32Next, and kills any processes that have the given pid as their parent.
        
        /// <summary>
        /// Kills a process and all of its child processes.
        /// </summary>
        /// <param name="pid">The process ID of the parent process.</param>
        public static void KillProcessTree(int pid)
        {
            IntPtr snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if (snapshot == IntPtr.Zero)
            {
                return;
            }

            // Gonna be honest, not gonna spin up a 32bit windows VM to make sure this works. but it should.
            PROCESSENTRY32 procEntry = new PROCESSENTRY32();
            procEntry.dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32));

            if (Process32First(snapshot, ref procEntry))
            {
                do
                {
                    if (procEntry.th32ParentProcessID == pid)
                    {
                        KillProcessTree((int)procEntry.th32ProcessID);  // Recursively kill child processes
                    }
                }
                while (Process32Next(snapshot, ref procEntry));
            }

            try
            {
                Process proc = Process.GetProcessById(pid);
                proc.Kill();
            }
            catch (Exception ex)
            {

            }
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
