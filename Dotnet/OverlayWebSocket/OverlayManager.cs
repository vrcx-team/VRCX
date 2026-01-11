using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using NLog;

namespace VRCX;

public class OverlayManager
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    
    private static Process _process;

    public static void StartOverlay()
    {
        if (OverlayServer.IsConnected() ||
            _process != null && !_process.HasExited)
        {
            logger.Error("Overlay server already started");
            return;
        }

        StartOverlayProcess();
    }
    
    private static void StartOverlayProcess()
    {
        if (Environment.ProcessPath == null)
        {
            logger.Error("Cannot start Overlay process without a process path");
            return;
        }
        
        var args = new List<string>();
        args.Add(StartupArgs.VrcxLaunchArguments.Overlay);
        if (Program.LaunchDebug)
            args.Add(StartupArgs.VrcxLaunchArguments.IsDebugPrefix);
        if (StartupArgs.LaunchArguments.ConfigDirectory != null)
            args.Add($"{StartupArgs.VrcxLaunchArguments.ConfigDirectoryPrefix}={StartupArgs.LaunchArguments.ConfigDirectory}");

        var startInfo = new ProcessStartInfo
        {
            FileName = Environment.ProcessPath,
            Arguments = string.Join(' ', args),
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = Program.BaseDirectory
        };
        _process = Process.Start(startInfo);
        logger.Info("Overlay process started");
    }
}