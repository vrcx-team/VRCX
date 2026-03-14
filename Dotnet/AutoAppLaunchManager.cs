using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.Win32;
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
        public readonly string AppShortcutDesktop;
        public readonly string AppShortcutVR;

        private DateTime startTime = DateTime.Now;
        private Dictionary<string, HashSet<int>> startedProcesses = new();
        private readonly Timer childUpdateTimer;
        private int timerTicks = 0;
        private static readonly byte[] shortcutSignatureBytes = { 0x4C, 0x00, 0x00, 0x00 }; // signature for ShellLinkHeader
        private static readonly byte[] urlShortcutHeader = "[{000214A0-0000-0000-C000-000000000046}]"u8.ToArray(); // .url file header

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
            AppShortcutDesktop = Path.Join(AppShortcutDirectory, "desktop");
            AppShortcutVR = Path.Join(AppShortcutDirectory, "vr");

            Directory.CreateDirectory(AppShortcutDirectory);
            Directory.CreateDirectory(AppShortcutDesktop);
            Directory.CreateDirectory(AppShortcutVR);

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

        [SupportedOSPlatform("windows")]
        private void OnProcessStarted(MonitoredProcess monitoredProcess)
        {
            if (!Enabled || !monitoredProcess.HasName(VRChatProcessName) || monitoredProcess.Process.StartTime < startTime)
                return;

            // Start auto start processes
            lock (startedProcesses)
            {
                if (KillChildrenOnExit)
                    KillChildProcesses();
                else
                    UpdateChildProcesses();

                var (shortcutFiles, steamIds) = FindShortcutFiles(AppShortcutDirectory);
                var (platformShortcutFiles, platformSteamIds) = FindShortcutFiles(Program.AppApiInstance.IsSteamVRRunning() ? AppShortcutVR : AppShortcutDesktop);
                shortcutFiles.AddRange(platformShortcutFiles);
                steamIds.AddRange(platformSteamIds);
                foreach (var file in shortcutFiles)
                {
                    if (RunProcessOnce && IsProcessRunning(file))
                        continue;
                    
                    if (IsChildProcessRunning(file))
                        continue;
                    
                    StartChildProcess(file);
                }
                foreach (var steamId in steamIds)
                {
                    StartSteamGame(steamId);
                }

                if (shortcutFiles.Count == 0 && steamIds.Count == 0)
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

            // Stop auto start processes
            Parallel.ForEach(startedProcesses.ToArray(), pair =>
            {
                var processes = pair.Value;
                var pids = processes.ToArray();
                foreach (var pid in pids)
                {
                    if (!WinApi.HasProcessExited(pid))
                        KillProcessTree(pid);
                }
            });

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
            
            PROCESSENTRY32 procEntry = new PROCESSENTRY32();
            procEntry.dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32));

            if (Process32First(snapshot, ref procEntry))
            {
                do
                {
                    if (procEntry.th32ParentProcessID == pid)
                    {
                        pids.Add((int)procEntry.th32ProcessID);

                        if (recursive) // Recursively find child processes
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

            foreach (var p in pids)
            {
                try
                {
                    using var proc = Process.GetProcessById(p);
                    if (proc.HasExited)
                        continue;

                    // breaks some apps
                    // if (proc.CloseMainWindow())
                    //     continue;
                    //
                    // if (proc.WaitForExit(1000))
                    //     continue;

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
                var processes = Process.GetProcessesByName(processName);
                var isProcessRunning = processes.Length != 0;
                foreach (var process in processes)
                    process.Dispose();

                return isProcessRunning;
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
        private static Tuple<List<string>, List<string>> FindShortcutFiles(string folderPath)
        {
            var directoryInfo = new DirectoryInfo(folderPath);
            var files = directoryInfo.GetFiles();
            var shortcuts = new List<string>();
            var steamIds = new List<string>();

            foreach (var file in files)
            {
                if (IsShortcutFile(file.FullName))
                {
                    shortcuts.Add(file.FullName);
                    continue;
                }
                if (IsUrlShortcutFile(file.FullName))
                {
                    try
                    {
                        const string urlPrefix = "URL=steam://rungameid/";
                        var lines = File.ReadAllLines(file.FullName);
                        var urlLine = lines.FirstOrDefault(l => l.StartsWith(urlPrefix));
                        if (urlLine == null)
                            continue;
                        
                        var appId = urlLine[urlPrefix.Length..].Trim();
                        steamIds.Add(appId);
                    }
                    catch (Exception ex)
                    {
                        logger.Error(ex, "Error reading shortcut file: {0}", file.FullName);
                    }
                }
            }

            return new Tuple<List<string>, List<string>>(shortcuts, steamIds);
        }
        
        

        /// <summary>
        /// Determines whether the specified file path is a shortcut by checking the file header.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <returns><c>true</c> if the given file path is a shortcut, otherwise <c>false</c></returns>
        private static bool IsShortcutFile(string filePath)
        {
            var headerBytes = new byte[4];
            using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fileStream.Length < 4)
                return false;
            fileStream.ReadExactly(headerBytes, 0, 4);

            return headerBytes.SequenceEqual(shortcutSignatureBytes);
        }
        
        private static bool IsUrlShortcutFile(string filePath)
        {
            var headerBytes = new byte[urlShortcutHeader.Length];
            using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fileStream.Length < headerBytes.Length)
                return false;
            fileStream.ReadExactly(headerBytes, 0, headerBytes.Length);

            return headerBytes.SequenceEqual(urlShortcutHeader);
        }
        
        // Steam shortcuts

        [SupportedOSPlatform("windows")]
        public async Task StartSteamGame(string appId)
        {
            try
            {
                var process = new Process();
                process.StartInfo = new ProcessStartInfo($"steam://launch/{appId}")
                {
                    UseShellExecute = true
                };
                process.Start();
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Error starting steam game with appid {0}", appId);
            }

            var appDirPath = GetPathWithAppId(appId);
            if (appDirPath == null)
                return;

            // wait for Steam to start the process
            const int retryLimit = 10;
            for (var i = 0; i < retryLimit; i++)
            {
                // find running process from path
                var processes = Process.GetProcesses();
                var foundProcess = processes.FirstOrDefault(p =>
                {
                    try
                    {
                        return !p.HasExited &&
                               p.MainModule?.FileName != null &&
                               p.MainModule.FileName.StartsWith(appDirPath, StringComparison.OrdinalIgnoreCase);
                    }
                    catch
                    {
                        return false;
                    }
                });
                if (foundProcess?.MainModule?.FileName == null)
                {
                    await Task.Delay(1000);
                    continue;
                }

                var processPath = foundProcess.MainModule.FileName;
                logger.Info("Found process for appid {0}: {1} (PID: {2})", appId, processPath, foundProcess.Id);
                lock (startedProcesses)
                {
                    startedProcesses.Add(processPath, new HashSet<int>() { foundProcess.Id });
                }

                return;
            }
            logger.Error("Failed to find process for appid {0} after starting. Steam may have failed to launch the game or it may have taken too long to start.", appId);
        }

        [SupportedOSPlatform("windows")]
        private static string? GetPathWithAppId(string appId)
        {
            string? steamPath = null;
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Wow6432Node\Valve\Steam");
                if (key?.GetValue("InstallPath") is string path)
                    steamPath = path;
            }
            catch
            {
                // Ignored
            }

            if (steamPath == null)
            {
                try
                {
                    using var key = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam");
                    if (key?.GetValue("SteamPath") is string path)
                        steamPath = path.Replace("/", "\\");
                }
                catch
                {
                    // Ignored
                }
            }

            if (steamPath == null)
            {
                logger.Error("Cant find Steam install path");
                return null;
            }
            var libraryFoldersVdfPath = Path.Join(steamPath, @"config\libraryfolders.vdf");
            if (!File.Exists(libraryFoldersVdfPath))
            {
                logger.Error("Cant find Steam libraryfolders.vdf");
                return null;
            }

            var libraryFolders = new List<string>();
            foreach (var line in File.ReadLines(libraryFoldersVdfPath))
            {
                if (!line.Contains("\"path\""))
                    continue;

                var parts = line.Split("\t");
                if (parts.Length < 4)
                    continue;

                var basePath = parts[4].Replace("\"", "").Replace(@"\\", @"\");
                var path = Path.Join(basePath, @"steamapps");
                if (Directory.Exists(path))
                    libraryFolders.Add(path);
            }

            foreach (var libraryPath in libraryFolders)
            {
                var appManifestFiles = Directory.GetFiles(libraryPath, "appmanifest_*.acf");
                foreach (var file in appManifestFiles)
                {
                    try
                    {
                        var acf = File.ReadAllText(file);
                        var idMatch = Regex.Match(acf, @"""appid""\s+""(\d+)""");
                        var dirMatch = Regex.Match(acf, @"""installdir""\s+""([^""]+)""");
                        if (!idMatch.Success || !dirMatch.Success)
                            continue;

                        var foundAppId = idMatch.Groups[1].Value;
                        if (foundAppId != appId)
                            continue;

                        var fullPath = Path.Join(libraryPath, "common", dirMatch.Groups[1].Value);
                        if (Directory.Exists(fullPath))
                            return fullPath;
                    }
                    catch
                    {
                        // ignore
                    }
                }
            }

            logger.Error("Could not find install dir for appid {0}", appId);
            return null;
        }
    }
}
