using System;
using System.Diagnostics;
using System.IO;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public override void OnProcessStateChanged(MonitoredProcess monitoredProcess)
        {
            // unused
        }

        /// <summary>
        /// Checks if the VRChat game and SteamVR are currently running and updates the browser's JavaScript function $app.updateIsGameRunning with the results.
        /// </summary>
        public override void CheckGameRunning()
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
        }

        public override bool IsGameRunning()
        {
            var isGameRunning = false;
            var processes = Process.GetProcesses();
            foreach (var process in processes)
            {
                if (process.ProcessName == "VRChat.exe")
                {
                    isGameRunning = true;
                    break;
                }
            }
            return isGameRunning;
        }

        public override bool IsSteamVRRunning()
        {
            var isSteamVRRunning = false;
            var processes = Process.GetProcesses();
            foreach (var process in processes)
            {
                if (process.ProcessName == "vrmonitor" || process.ProcessName == "monado-service")
                {
                    isSteamVRRunning = true;
                    break;
                }
            }
            return isSteamVRRunning;
        }

        public override int QuitGame()
        {
            var processes = Process.GetProcessesByName("vrchat");
            if (processes.Length == 1)
                processes[0].Kill();

            return processes.Length;
        }

        public override bool StartGame(string arguments)
        {
            try
            {
                var steamPath = _steamPath;
                if (string.IsNullOrEmpty(steamPath))
                {
                    logger.Error("Steam path could not be determined.");
                    return false;
                }

                var steamExecutable = Path.Combine(steamPath, "steam.sh");
                if (!File.Exists(steamExecutable))
                {
                    logger.Error("Steam executable not found.");
                    return false;
                }

                Process.Start(new ProcessStartInfo
                {
                    FileName = steamExecutable,
                    Arguments = $"-applaunch 438100 {arguments}",
                    UseShellExecute = false,
                })?.Close();

                return true;
            }
            catch (Exception ex)
            {
                logger.Error($"Failed to start VRChat: {ex.Message}");
                return false;
            }
        }

        public override bool StartGameFromPath(string path, string arguments)
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