// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp.Internals;
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Management;
using System.Text;
using System.Windows.Forms;

namespace VRCX
{
    internal class StartupArgs
    {
        public static VrcxLaunchArguements LaunchArguements = new();

        public static void ArgsCheck()
        {
            var args = Environment.GetCommandLineArgs();
            
            Debug.Assert(Program.LaunchDebug = true);

            var currentProcessArgs = ParseArgs(args);
            LaunchArguements = currentProcessArgs;

            if (LaunchArguements.IsDebug)
                Program.LaunchDebug = true;

            if (LaunchArguements.ConfigDirectory != null)
            {
                if (File.Exists(LaunchArguements.ConfigDirectory))
                {
                    MessageBox.Show("Move your \"VRCX.sqlite3\" into a folder then specify the folder in the launch parameter e.g.\n--config=\"C:\\VRCX\\\"", "--config is now a directory", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Environment.Exit(0);
                }

                Program.AppDataDirectory = LaunchArguements.ConfigDirectory;
            }

            var disableClosing = false;

            if (LaunchArguements.IsUpgrade || // we're upgrading, allow it
                !string.IsNullOrEmpty(CommandLineArgsParser.GetArgumentValue(args, CefSharpArguments.SubProcessTypeArgument))) // we're launching a subprocess, allow it
                disableClosing = true;

            // if we're launching a second instance with same config directory, focus the first instance then exit
            if (!disableClosing && IsDuplicateProcessRunning(LaunchArguements))
            {
                IPCToMain();
                Environment.Exit(0);
            }
        }

        private static VrcxLaunchArguements ParseArgs(string[] args)
        {
            VrcxLaunchArguements arguements = new VrcxLaunchArguements();
            foreach (var arg in args)
            {
                if (arg == VrcxLaunchArguements.IsUpgradePrefix)
                    arguements.IsUpgrade = true;

                if (arg.StartsWith(VrcxLaunchArguements.IsDebugPrefix))
                    arguements.IsDebug = true;
                
                if (arg.StartsWith(VrcxLaunchArguements.LaunchCommandPrefix) && arg.Length > VrcxLaunchArguements.LaunchCommandPrefix.Length)
                    arguements.LaunchCommand = arg.Substring(VrcxLaunchArguements.LaunchCommandPrefix.Length);

                if (arg.StartsWith(VrcxLaunchArguements.ConfigDirectoryPrefix) && arg.Length > VrcxLaunchArguements.ConfigDirectoryPrefix.Length)
                    arguements.ConfigDirectory = arg.Substring(VrcxLaunchArguements.ConfigDirectoryPrefix.Length + 1);

                if (arg.StartsWith(VrcxLaunchArguements.ProxyUrlPrefix) && arg.Length > VrcxLaunchArguements.ProxyUrlPrefix.Length)
                    arguements.ProxyUrl = arg.Substring(VrcxLaunchArguements.ProxyUrlPrefix.Length + 1).Replace("'", string.Empty).Replace("\"", string.Empty);
            }
            return arguements;
        }

        internal class VrcxLaunchArguements
        {
            public const string IsUpgradePrefix = "/Upgrade";
            public bool IsUpgrade { get; set; } = false;

            public const string IsDebugPrefix = "--debug";
            public bool IsDebug { get; set; } = false;

            public const string LaunchCommandPrefix = "/uri=vrcx://";
            public string LaunchCommand { get; set; } = null;

            public const string ConfigDirectoryPrefix = "--config";
            public string ConfigDirectory { get; set; } = null;

            public const string ProxyUrlPrefix = "--proxy-server";
            public string ProxyUrl { get; set; } = null;
        }

        private static bool IsDuplicateProcessRunning(VrcxLaunchArguements launchArguements)
        {
            var processes = Process.GetProcessesByName("VRCX")
                .Where(x => x.Id != Environment.ProcessId);

            foreach (var process in processes)
            {
                var commandLine = string.Empty;

                try
                {
                    using (var searcher = new ManagementObjectSearcher("SELECT CommandLine FROM Win32_Process WHERE ProcessId = " + process.Id))
                    {
                        using (var objects = searcher.Get())
                        {
                            commandLine = objects.Cast<ManagementBaseObject>().SingleOrDefault()?["CommandLine"]?.ToString() ?? string.Empty;
                        }
                    }
                }
                catch { }

                if (commandLine.Contains(CefSharpArguments.SubProcessTypeArgument)) // ignore subprocesses
                {
                    continue;
                }

                var processArguements = ParseArgs(commandLine.Split(' '));
                if (processArguements.ConfigDirectory == launchArguements.ConfigDirectory)
                {
                    return true;
                }
            }

            return false;
        }

        private static void IPCToMain()
        {
            new IPCServer().CreateIPCServer();
            var ipcClient = new NamedPipeClientStream(".", "vrcx-ipc", PipeDirection.InOut);
            ipcClient.Connect();

            if (ipcClient.IsConnected)
            {
                var buffer = Encoding.UTF8.GetBytes($"{{\"type\":\"LaunchCommand\",\"command\":\"{LaunchArguements.LaunchCommand}\"}}" + (char)0x00);
                ipcClient.BeginWrite(buffer, 0, buffer.Length, IPCClient.Close, ipcClient);
            }
        }
    }
}