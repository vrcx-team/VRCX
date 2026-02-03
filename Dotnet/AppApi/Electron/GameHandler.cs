using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

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
            {
                var processes = Process.GetProcessesByName("vrmonitor");
                var isSteamVRRunning = processes.Length > 0;
                foreach (var process in processes)
                    process.Dispose();

                if (isSteamVRRunning)
                    return true;
            }
            #if LINUX
            var xr_config = Environment.GetEnvironmentVariable("XDG_CONFIG_HOME")+"/openxr/1/active_runtime.json";
            if (Path.Exists(xr_config)){

                var wivrn_pipe = Environment.GetEnvironmentVariable("XDG_RUNTIME_DIR")+"/wivrn/comp_ipc";
                //both need to be checked as the pipe is created before the headset connects but openxr apps won't work without the config
                if (Path.Exists(wivrn_pipe)){
                    return true;
                }else{
                    var processes = Process.GetProcessesByName("monado-service");
                    var isSteamVRRunning = processes.Length > 0;
                    foreach (var process in processes)
                        process.Dispose();
                    if (isSteamVRRunning)
                        return true;
                }
            }
            #endif
            return false;
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
    }
}
