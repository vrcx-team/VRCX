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
    public partial class AppApiCef
    {
        public override void OnProcessStateChanged(MonitoredProcess monitoredProcess)
        {
            if (!monitoredProcess.HasName("VRChat") && !monitoredProcess.HasName("vrserver"))
                return;

            CheckGameRunning();
        }

        public override void CheckGameRunning()
        {
            var isGameRunning = false;
            var isSteamVRRunning = false;
            var isHmdAfk = false;

            if (ProcessMonitor.Instance.IsProcessRunning("VRChat"))
                isGameRunning = true;

            if (ProcessMonitor.Instance.IsProcessRunning("vrserver"))
                isSteamVRRunning = true;

            if (Program.VRCXVRInstance != null)
                isHmdAfk = Program.VRCXVRInstance.IsHmdAfk;

            // TODO: fix this throwing an exception for being called before the browser is ready. somehow it gets past the checks
            if (MainForm.Instance?.Browser != null && !MainForm.Instance.Browser.IsLoading && MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                MainForm.Instance.Browser.ExecuteScriptAsync("$app.store.game.updateIsGameRunning", isGameRunning, isSteamVRRunning, isHmdAfk);
        }

        public override bool IsGameRunning()
        {
            // unused
            return ProcessMonitor.Instance.IsProcessRunning("VRChat");
        }

        public override bool IsSteamVRRunning()
        {
            // unused
            return ProcessMonitor.Instance.IsProcessRunning("vrserver");
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

        public override bool StartGameFromPath(string path, string arguments)
        {
            if (!path.EndsWith(".exe"))
                path = Path.Join(path, "launch.exe");

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