using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public override void OnProcessStateChanged(MonitoredProcess monitoredProcess)
        {
            // unused
        }

        /// <summary>
        /// for Cef only, checks if VRChat and SteamVR are currently running and updates the browser using JavaScript with the results.
        /// </summary>
        public override void CheckGameRunning()
        {
        }

        public override bool IsGameRunning()
        {
            var processes = Process.GetProcessesByName("VRChat.exe");
            var isGameRunning = processes.Length > 0;
            foreach (var process in processes)
                process.Dispose();

            return isGameRunning;
        }

        public override bool IsSteamVRRunning()
        {
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
            var isRunning = allProcesses.Any(process => process.ProcessName.EndsWith("wivrn-server"));
            foreach (var process in allProcesses)
                process.Dispose();

            return isRunning;
        }

        public override int QuitGame()
        {
            var processes = Process.GetProcessesByName("VRChat.exe");
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
                Process.Start(new ProcessStartInfo
                {
                    FileName = "steam",
                    Arguments = $"-applaunch 438100 {arguments}",
                    UseShellExecute = false,
                })?.Dispose();
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

        public override Task<bool> TryOpenInstanceInVrc(string launchUrl)
        {
            try
            {
                var pid = FindVRChatPid();
                if (pid <= 0)
                    return Task.FromResult(false);

                var launchExe = Path.Join(_vrcInstallPath, "launch.exe");
                if (!File.Exists(launchExe))
                {
                    logger.Error($"TryOpenInstanceInVrc: launch.exe not found at {launchExe}");
                    return Task.FromResult(false);
                }

                // attach=1 tells launch.exe to forward into the running client instead of cold-starting
                var url = launchUrl.Contains("attach=1") ? launchUrl : launchUrl + "&attach=1";

                // enter the running game's user + mount namespaces (we own the pressure-vessel
                // userns, so no privilege is required), re-import its environment, then run
                // launch.exe inside the container so it reaches VRChat's URL pipe
                const string inner =
                    "while IFS= read -r -d '' kv; do export \"$kv\"; done < \"/proc/$1/environ\"; exec wine \"$2\" \"$3\"";

                var psi = new ProcessStartInfo
                {
                    FileName = "nsenter",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                };
                foreach (var arg in new[]
                         {
                             "-t", pid.ToString(), "-U", "-m", "--preserve-credentials", "--",
                             "/bin/bash", "-c", inner, "_", pid.ToString(), launchExe, url
                         })
                    psi.ArgumentList.Add(arg);

                // launch.exe hands the deeplink to the running client, then exits on wine's
                // own schedule and its exit code is not a reliable success signal, so a clean
                // spawn is treated as success. Gating on the exit code would race the frontend
                // self-invite fallback and fire both. stdout/stderr are left un-redirected so
                // wine log spam cannot fill an undrained pipe and stall the forward.
                using var process = Process.Start(psi);
                return Task.FromResult(process != null);
            }
            catch (Exception e)
            {
                logger.Error($"TryOpenInstanceInVrc failed: {e.Message}");
                return Task.FromResult(false);
            }
        }

        private static int FindVRChatPid()
        {
            var processes = Process.GetProcessesByName("VRChat.exe");
            try
            {
                // prefer the VRChat whose environment points at the 438100 compat prefix
                foreach (var process in processes)
                {
                    try
                    {
                        var environ = File.ReadAllText($"/proc/{process.Id}/environ");
                        if (environ.Contains("compatdata/438100"))
                            return process.Id;
                    }
                    catch
                    {
                        // unreadable environ, skip
                    }
                }

                return processes.Length > 0 ? processes[0].Id : -1;
            }
            finally
            {
                foreach (var process in processes)
                    process.Dispose();
            }
        }
    }
}
