// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.Internals;
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Net;
using System.Text;
using System.Windows.Forms;

namespace VRCX
{
    internal class StartupArgs
    {
        public static string LaunchCommand;
        public static string ProxyUrl;
        public static Process[] processList;

        public static void ArgsCheck()
        {
            var args = Environment.GetCommandLineArgs();
            processList = Process.GetProcessesByName("VRCX");
            
            Debug.Assert(Program.LaunchDebug = true);

            var disableClosing = false;
            foreach (var arg in args)
            {
                if (arg == "/Upgrade")
                    disableClosing = true;
                
                if (arg.Length > 12 && arg.Substring(0, 12) == "/uri=vrcx://")
                    LaunchCommand = arg.Substring(12);

                if (arg.Length > 8 && arg.Substring(0, 8) == "--config")
                {
                    var filePath = arg.Substring(9);
                    if (File.Exists(filePath))
                    {
                        MessageBox.Show("Move your \"VRCX.sqlite3\" into a folder then specify the folder in the launch parameter e.g.\n--config=\"C:\\VRCX\\\"", "--config is now a directory", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        Environment.Exit(0);
                    }
                    Program.AppDataDirectory = filePath;
                }

                if (arg.Length >= 7 && arg.Substring(0, 7) == "--debug")
                    Program.LaunchDebug = true;

                if (arg.Length >= 16 && arg.Substring(0, 14) == "--proxy-server")
                    ProxyUrl = arg.Substring(15).Replace("'", string.Empty).Replace("\"", string.Empty);
            }

            var type = CommandLineArgsParser.GetArgumentValue(args, CefSharpArguments.SubProcessTypeArgument);
            if (!string.IsNullOrEmpty(type))
                disableClosing = true; // we're launching a subprocess, allow it

            if (!string.IsNullOrEmpty(Program.AppDataDirectory))
                disableClosing = true; // we're launching with a custom config path, allow it

            // if we're launching a second instance, focus the first instance then exit
            if (!disableClosing && processList.Length > 1)
            {
                IPCToMain();
                Environment.Exit(0);
            }
        }

        private static void IPCToMain()
        {
            new IPCServer().CreateIPCServer();
            var ipcClient = new NamedPipeClientStream(".", "vrcx-ipc", PipeDirection.InOut);
            ipcClient.Connect();

            if (ipcClient.IsConnected)
            {
                var buffer = Encoding.UTF8.GetBytes($"{{\"type\":\"LaunchCommand\",\"command\":\"{LaunchCommand}\"}}" + (char)0x00);
                ipcClient.BeginWrite(buffer, 0, buffer.Length, IPCClient.Close, ipcClient);
            }
        }
    }
}