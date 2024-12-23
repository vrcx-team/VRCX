using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using CefSharp;
using Microsoft.Win32;

namespace VRCX
{
    public partial class AppApiCef : AppApiInterface
    {
        public void OnProcessStateChanged(MonitoredProcess monitoredProcess)
        {
            if (!monitoredProcess.HasName("VRChat") && !monitoredProcess.HasName("vrserver"))
                return;

            CheckGameRunning();
        }

        /// <summary>
        /// Checks if the VRChat game and SteamVR are currently running and updates the browser's JavaScript function $app.updateIsGameRunning with the results.
        /// </summary>
        public void CheckGameRunning()
        {
            var isGameRunning = false;
            var isSteamVRRunning = false;
            
            if (ProcessMonitor.Instance.IsProcessRunning("VRChat"))
            {
                isGameRunning = true;
            }

            if (Wine.GetIfWine())
            {
                var wineTmpPath = Path.Combine(Program.AppDataDirectory, "wine.tmp");
                if (File.Exists(wineTmpPath))
                {
                    var wineTmp = File.ReadAllText(wineTmpPath);
                    if (wineTmp.Contains("isGameRunning=true"))
                    {
                        isGameRunning = true;
                    }
                }
            }

            if (ProcessMonitor.Instance.IsProcessRunning("vrserver"))
            {
                isSteamVRRunning = true;
            }

            var isHmdAfk = Program.VRCXVRInstance.IsHmdAfk;

            // TODO: fix this throwing an exception for being called before the browser is ready. somehow it gets past the checks
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync("$app.updateIsGameRunning", isGameRunning, isSteamVRRunning, isHmdAfk);
        }

        /// <summary>
        /// Kills the VRChat process if it is currently running.
        /// </summary>
        /// <returns>The number of processes that were killed (0 or 1).</returns>
        public int QuitGame()
        {
            var processes = Process.GetProcessesByName("vrchat");
            if (processes.Length == 1)
                processes[0].Kill();

            return processes.Length;
        }

        /// <summary>
        /// Kills the install.exe process after exiting game.
        /// </summary>
        /// <returns>Whether the process is killed (true or false).</returns>
        public bool KillInstall()
        {
            bool isSuccess = false;
            var processes = Process.GetProcessesByName("install");
            foreach (var p in processes)
            {
                // "E:\SteamLibrary\steamapps\common\VRChat\install.exe"
                var match = Regex.Match(GetProcessName(p.Id), "(.+?\\\\VRChat.*)(!?\\\\install.exe)");
                if (match.Success)
                {
                    // Sometimes install.exe is suspended
                    ResumeProcess(p.Id);
                    p.Kill();
                    isSuccess = true;
                    break;
                }
            }

            return isSuccess;
        }

        [DllImport("ntdll.dll")]
        private static extern uint NtResumeProcess([In] IntPtr processHandle);

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern bool QueryFullProcessImageName(IntPtr hProcess, uint dwFlags, [Out, MarshalAs(UnmanagedType.LPTStr)] StringBuilder lpExeName, ref uint lpdwSize);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(uint processAccess, bool inheritHandle, int processId);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle([In] IntPtr handle);

        private static void ResumeProcess(int processId)
        {
            IntPtr hProc = IntPtr.Zero;
            try
            {
                // Gets the handle to the Process
                // 0x800 mean required to suspend or resume a process.
                hProc = OpenProcess(0x800, false, processId);
                if (hProc != IntPtr.Zero)
                    NtResumeProcess(hProc);
            }
            finally
            {
                // close handle.
                if (hProc != IntPtr.Zero)
                    CloseHandle(hProc);
            }
        }

        private static string GetProcessName(int pid)
        {
            IntPtr hProc = IntPtr.Zero;
            try
            {
                // 0x400 mean required to retrieve certain information about a process, such as its token, exit code, and priority class.
                // 0x10 mean required to read memory in a process using ReadProcessMemory.
                hProc = OpenProcess(0x400 | 0x10, false, pid);
                if (hProc != IntPtr.Zero)
                {
                    int lengthSb = 4000;
                    uint lpSize = 65535;
                    var sb = new StringBuilder(lengthSb);
                    string result = String.Empty;
                    if (QueryFullProcessImageName(hProc, 0, sb, ref lpSize))
                    {
                        result = sb.ToString();
                    }
                    return result;
                }
            }
            finally
            {
                if (hProc != IntPtr.Zero)
                    CloseHandle(hProc);
            }
            return String.Empty;
        }

        /// <summary>
        /// Starts the VRChat game process with the specified command-line arguments.
        /// </summary>
        /// <param name="arguments">The command-line arguments to pass to the VRChat game.</param>
        public bool StartGame(string arguments)
        {
            // try stream first
            try
            {
                using var key = Registry.ClassesRoot.OpenSubKey(@"steam\shell\open\command");
                // "C:\Program Files (x86)\Steam\steam.exe" -- "%1"
                var match = Regex.Match(key.GetValue(string.Empty) as string, "^\"(.+?)\\\\steam.exe\"");
                if (match.Success)
                {
                    var path = match.Groups[1].Value;
                    // var _arguments = Uri.EscapeDataString(arguments);
                    Process.Start(new ProcessStartInfo
                    {
                        WorkingDirectory = path,
                        FileName = $"{path}\\steam.exe",
                        UseShellExecute = false,
                        Arguments = $"-applaunch 438100 {arguments}"
                    })
                    ?.Close();
                    return true;
                }
            }
            catch
            {
                logger.Warn("Failed to start VRChat from Steam");
            }

            // fallback
            try
            {
                using var key = Registry.ClassesRoot.OpenSubKey(@"VRChat\shell\open\command");
                // "C:\Program Files (x86)\Steam\steamapps\common\VRChat\launch.exe" "%1" %*
                var match = Regex.Match(key.GetValue(string.Empty) as string, "(?!\")(.+?\\\\VRChat.*)(!?\\\\launch.exe\")");
                if (match.Success)
                {
                    var path = match.Groups[1].Value;
                    return StartGameFromPath(path, arguments);
                }
            }
            catch
            {
                logger.Warn("Failed to start VRChat from registry");
            }

            return false;
        }

        /// <summary>
        /// Starts the VRChat game process with the specified command-line arguments from the given path.
        /// </summary>
        /// <param name="path">The path to the VRChat game executable.</param>
        /// <param name="arguments">The command-line arguments to pass to the VRChat game.</param>
        /// <returns>True if the game was started successfully, false otherwise.</returns>
        public bool StartGameFromPath(string path, string arguments)
        {
            if (!path.EndsWith(".exe"))
                path = Path.Combine(path, "launch.exe");

            if (!path.EndsWith("launch.exe") || !File.Exists(path))
                return false;

            Process.Start(new ProcessStartInfo
            {
                WorkingDirectory = Path.GetDirectoryName(path),
                FileName = path,
                UseShellExecute = false,
                Arguments = arguments
            })?.Close();
            return true;
        }
    }
}