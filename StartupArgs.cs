// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Diagnostics;
using System.IO.Pipes;
using System.Text;
using System.Windows.Forms;

namespace VRCX
{
    class StartupArgs
    {
        public static string LaunchCommand;
        public static Process[] processList;

        public static void ArgsCheck()
        {
            string[] args = Environment.GetCommandLineArgs();
            processList = Process.GetProcessesByName("VRCX");

            foreach (string arg in args)
            {
                if (arg.Length > 12 && arg.Substring(0, 12) == "/uri=vrcx://")
                    LaunchCommand = arg.Substring(12);

                if (arg.Length > 12 && arg.Substring(0, 8) == "--config")
                    Program.ConfigLocation = arg.Substring(9);
            }

            if (processList.Length > 1 && String.IsNullOrEmpty(LaunchCommand))
            {
                var result = MessageBox.Show("VRCX is already running, start another instance?", "VRCX", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (result == DialogResult.Yes)
                    return;
            }

            if (processList.Length > 1)
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
                ipcClient.BeginWrite(buffer, 0, buffer.Length, IPCClient.OnSend, ipcClient);
            }
        }
    }
}