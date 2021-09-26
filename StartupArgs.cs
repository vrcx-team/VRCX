// Copyright(c) 2019-2021 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text;

namespace VRCX
{
    class StartupArgs
    {
        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool ShowWindow(IntPtr hWnd, int flags);

        [DllImport("user32.dll")]
        private static extern int SetForegroundWindow(IntPtr hwnd);

        public static string LaunchCommand;

        public static void ArgsCheck()
        {
            string[] args = Environment.GetCommandLineArgs();
            if (args.Length == 0)
                return;

            foreach (string arg in args)
            {
                if (arg.Length > 12 && arg.Substring(0, 12) == "/uri=vrcx://")
                {
                    LaunchCommand = arg.Substring(12);
                    ProcessCheck(LaunchCommand);
                }
            }
        }

        private static void ProcessCheck(string command)
        {
            Process currentProcess = Process.GetCurrentProcess();
            Process[] processList = Process.GetProcessesByName("VRCX");

            if (processList.Length > 1)
            {
                new IPCServer().CreateIPCServer();
                var ipcClient = new NamedPipeClientStream(".", "vrcx-ipc", PipeDirection.InOut);
                ipcClient.Connect();

                if (ipcClient.IsConnected)
                {
                    var buffer = Encoding.UTF8.GetBytes($"{{\"type\":\"LaunchCommand\",\"command\":\"{command}\"}}" + (char)0x00);
                    ipcClient.BeginWrite(buffer, 0, buffer.Length, IPCClient.OnSend, ipcClient);
                }

                foreach (Process process in processList)
                {
                    if (process.Id != currentProcess.Id)
                    {
                        IntPtr handle = process.MainWindowHandle;
                        ShowWindow(handle, 9);
                        SetForegroundWindow(handle);
                    }
                }

                Environment.Exit(0);
            }
        }
    }
}
