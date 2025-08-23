using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Timers;
using NLog;

namespace VRCX
{
    /// <summary>
    /// The class responsible for launching user-defined applications when VRChat opens/closes.
    /// </summary>
    public class AutoAppLaunchManager
    {
        public static AutoAppLaunchManager Instance { get; private set; }
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        public static readonly string VRChatProcessName = "VRChat";

        public bool Enabled = false;
        /// <summary> Whether or not to kill child processes when VRChat closes. </summary>
        public bool KillChildrenOnExit = true;
        public bool RunProcessOnce = true;
        public readonly string AppShortcutDirectory;

        private DateTime startTime = DateTime.Now;
        private Dictionary<string, HashSet<int>> startedProcesses = new Dictionary<string, HashSet<int>>();
        private readonly Timer childUpdateTimer;
        private int timerTicks = 0;
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
            AppShortcutDirectory = Path.Join(Program.AppDataDirectory, "startup");

            if (!Directory.Exists(AppShortcutDirectory))
            {
                Directory.CreateDirectory(AppShortcutDirectory);
            }

            ProcessMonitor.Instance.ProcessStarted += OnProcessStarted;
            ProcessMonitor.Instance.ProcessExited += OnProcessExited;

            childUpdateTimer = new Timer();
            childUpdateTimer.Interval = 60000;
            childUpdateTimer.Elapsed += ChildUpdateTimer_Elapsed;
        }

        private void OnProcessExited(MonitoredProcess monitoredProcess)
        {
            if (!monitoredProcess.HasName(VRChatProcessName))
                return;

            lock (startedProcesses)
            {
                if (KillChildrenOnExit)
                {
                    childUpdateTimer.Stop();

                    KillChildProcesses();
                }
                else
                    UpdateChildProcesses();
            }
        }

        private void OnProcessStarted(MonitoredProcess monitoredProcess)
        {
            if (!Enabled || !monitoredProcess.HasName(VRChatProcessName) || monitoredProcess.Process.StartTime < startTime)
                return;

            lock (startedProcesses)
            {
                if (KillChildrenOnExit)
                    KillChildProcesses();
                else
                    UpdateChildProcesses();

                var shortcutFiles = FindShortcutFiles(AppShortcutDirectory);
                foreach (var file in shortcutFiles)
                {
                    if (RunProcessOnce && IsProcessRunning(file))
                        continue;
                    
                    if (IsChildProcessRunning(file))
                        continue;
                    
                    StartChildProcess(file);
                }

                if (shortcutFiles.Length == 0)
                    return;

                timerTicks = 0;
                childUpdateTimer.Interval = 1000;
                childUpdateTimer.Start();
            }
        }

        /// <summary>
        /// Kills all running child processes.
        /// </summary>
        private void KillChildProcesses()
        {
            UpdateChildProcesses(); // Ensure the list contains all current child processes.

            foreach (var pair in startedProcesses)
            {
                var processes = pair.Value;

                foreach (var pid in processes)
                {
                    if (!WinApi.HasProcessExited(pid))
                        KillProcessTree(pid);
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
        /// Returns the child processes of a process.
        /// </summary>
        /// <param name="pid">The process ID of the parent process.</param>
        public static List<int> FindChildProcesses(int pid, bool recursive = true)
        {
            List<int> pids = new List<int>();

            IntPtr snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if (snapshot == IntPtr.Zero)
            {
                return pids;
            }

            // Gonna be honest, not gonna spin up a 32bit windows VM to make sure this works. but it should.
            // Does VRCX even run on 32bit windows?
            PROCESSENTRY32 procEntry = new PROCESSENTRY32();
            procEntry.dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32));

            if (Process32First(snapshot, ref procEntry))
            {
                do
                {
                    if (procEntry.th32ParentProcessID == pid)
                    {
                        pids.Add((int)procEntry.th32ProcessID);

                        if(recursive) // Recursively find child processes
                            pids.AddRange(FindChildProcesses((int)procEntry.th32ProcessID));
                    }
                }
                while (Process32Next(snapshot, ref procEntry));
            }

            return pids;
        }

        /// <summary>
        /// Kills a process and all of its child processes.
        /// </summary>
        /// <param name="pid">The process ID of the parent process.</param>
        public static void KillProcessTree(int pid)
        {
            var pids = FindChildProcesses(pid);
            pids.Add(pid); // Kill parent

            foreach (int p in pids)
            {
                try
                {
                    using (Process proc = Process.GetProcessById(p))
                        proc.Kill();
                }
                catch
                {
                }
            }
        }

        /// <summary>
        /// Starts a new child process.
        /// </summary>
        /// <param name="path">The path.</param>
        private void StartChildProcess(string path)
        {
            try
            {
                var process = new Process();
                process.StartInfo = new ProcessStartInfo(path)
                {
                    UseShellExecute = true
                };
                process.Start();
                if (process.Id != 0)
                    startedProcesses.Add(path, new HashSet<int>() { process.Id });
            }
            catch (Exception ex)
            {
                logger.Error(ex);
            }
        }

        /// <summary>
        /// Updates the child processes list.
        /// Removes any processes that have exited.
        /// </summary>
        private void UpdateChildProcesses()
        {
            foreach (var pair in startedProcesses.ToArray())
            {
                var processes = pair.Value;
                foreach (var pid in processes.ToArray())
                {
                    bool recursiveChildSearch = processes.Count == 1; // Disable recursion when this list may already contain the entire process tree
                    var childProcesses = FindChildProcesses(pid, recursiveChildSearch);

                    foreach (int childPid in childProcesses) // Monitor child processes
                        processes.Add(childPid); // HashSet will prevent duplication

                    if (WinApi.HasProcessExited(pid))
                        processes.Remove(pid);
                }

                if (processes.Count == 0) // All processes associated with the shortcut have exited.
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
        private bool IsChildProcessRunning(string path)
        {
            return startedProcesses.ContainsKey(path);
        }
        
        private bool IsProcessRunning(string filePath)
        {
            try
            {
                var processName = Path.GetFileNameWithoutExtension(filePath);
                return Process.GetProcessesByName(processName).Length != 0;
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error checking if process is running: {0}", filePath);
                return false;
            }
        }

        public void Init()
        {
            // What are you lookin at? :eyes:
        }

        public void Exit()
        {
            childUpdateTimer.Stop();

            Enabled = false;

            // people thought this behavior was a bug
            // lock (startedProcesses)
            //     KillChildProcesses();
        }

        private void ChildUpdateTimer_Elapsed(object sender, ElapsedEventArgs e)
        {
            lock (startedProcesses)
                UpdateChildProcesses();

            if (timerTicks < 5)
            {
                timerTicks++;

                if(timerTicks == 5)
                    childUpdateTimer.Interval = 60000;
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
