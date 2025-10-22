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
            var processes = Process.GetProcessesByName("VRChat");
            var isGameRunning = processes.Length > 0;

            foreach (var process in processes)
                process.Dispose();
            return isGameRunning;
        }

        public override bool IsSteamVRRunning()
        {
            // Check exact matches (fast - no full process scan needed)
            var processNames = new[] { "vrmonitor", "monado-service" };
            foreach (var name in processNames)
            {
                var processes = Process.GetProcessesByName(name);
                var isSteamVRRunning = processes.Length > 0;

                foreach (var process in processes)
                    process.Dispose();
                if (isSteamVRRunning)
                    return true;
            }
            
            // Check for wivrn-server (requires full scan)
            var allProcesses = Process.GetProcesses();
            var isRunning = false;
            foreach (var process in allProcesses)
            {
                if (process.ProcessName.EndsWith("wivrn-server"))
                {
                    isRunning = true;
                    break;
                }
            }

            foreach (var process in allProcesses)
                process.Dispose();
            return isRunning;
        }

        public override int QuitGame()
        {
            var processes = Process.GetProcessesByName("vrchat");
            if (processes.Length == 1)
                processes[0].Kill();

            foreach (var process in processes)
                process.Dispose();
            return processes.Length;
        }

        public override bool StartGame(string arguments)
        {
            try
            {
                var process = Process.Start(new ProcessStartInfo
                {
                    FileName = "steam",
                    Arguments = $"-applaunch 438100 {arguments}",
                    UseShellExecute = false,
                });
                process?.Dispose();
                return true; // Steam accepted launch command (no exception thrown)
            }
            catch (Exception e)
            {
                logger.Error($"Failed to start VRChat: {e.Message}, attempting to start via Steam path.");
            }
            
            try
            {
                var steamPath = _steamPath;
                if (string.IsNullOrEmpty(steamPath))
                {
                    logger.Error("Steam path could not be determined.");
                    return false;
                }

                var steamExecutable = Path.Join(steamPath, "steam.sh");
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
                })?.Dispose();

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
            // This method is not used
            return false;
        }
    }
}
