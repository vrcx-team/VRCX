using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using CefSharp;
using Microsoft.Win32;

namespace VRCX
{
    public partial class AppApi
    {
        private void OnProcessStateChanged(MonitoredProcess monitoredProcess)
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

            if (ProcessMonitor.Instance.IsProcessRunning("vrserver"))
            {
                isSteamVRRunning = true;
            }

            var isHmdAfk = VRCXVR.Instance.IsHmdAfk;

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
                var match = Regex.Match(p.MainModule.FileName, "(.+?\\\\VRChat.*)(!?\\\\install.exe)");
                if (match.Success)
                {
                    p.Kill();
                    isSuccess = true;
                    break;
                }
            }

            return isSuccess;
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