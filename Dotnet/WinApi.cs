// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;

namespace VRCX
{
    public static class WinApi
    {
        private static List<(List<string>, string, string)> CpuErrorMessages = new List<(List<string>, string, string)>() 
        {
            (["Intel", "Core", "-13"], "VRCX has detected that you're using a 13th or 14th generation Intel CPU.\nThese CPUs are known to have issues which can lead to crashes.\nThis crash was unlikely caused by VRCX itself, therefore limited support can be offered.\nWould you like to open a link with more information?", "https://alderongames.com/intel-crashes"),
            (["Intel", "Core", "-14"], "VRCX has detected that you're using a 13th or 14th generation Intel CPU.\nThese CPUs are known to have issues which can lead to crashes.\nThis crash was unlikely caused by VRCX itself, therefore limited support can be offered.\nWould you like to open a link with more information?", "https://alderongames.com/intel-crashes"),
        };

        [DllImport("kernel32.dll", SetLastError = false)]
        public static extern void RtlCopyMemory(IntPtr destination, IntPtr source, uint length);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        public static extern int SHParseDisplayName([MarshalAs(UnmanagedType.LPWStr)] string pszName, IntPtr pbc, out IntPtr ppidl, uint sfgaoIn, out uint psfgaoOut);
        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SHOpenFolderAndSelectItems(IntPtr pidlFolder, uint cidl, IntPtr[] apidl, uint dwFlags);
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern IntPtr OpenProcess(int dwDesiredAccess, bool bInheritHandle, int dwProcessId);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool GetExitCodeProcess(IntPtr hProcess, out uint lpExitCode);
        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool CloseHandle(IntPtr hObject);

        /// <summary>
        /// Flag that specifies the access rights to query limited information about a process.
        /// This won't throw an exception when we try to access info about an elevated process
        /// </summary>
        private const int PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

        /// <summary>
        /// Determines whether the specified process has exited using WinAPI's GetExitCodeProcess running with PROCESS_QUERY_LIMITED_INFORMATION.
        /// We do this because Process.HasExited in .net framework opens a handle with PROCESS_QUERY_INFORMATION, which will throw an exception if the process is elevated.
        /// GetExitCodeProcess works with PROCESS_QUERY_LIMITED_INFORMATION, which will not throw an exception if the process is elevated.
        /// https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodeprocess
        /// </summary>
        /// <param name="process">The process to check.</param>
        /// <returns>true if the process has exited; otherwise, false.</returns>
        internal static bool HasProcessExited(int processId)
        {
            IntPtr hProcess = WinApi.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);
            if (hProcess == IntPtr.Zero)
            {
                // this is probably fine
                return true;
                //throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            }

            bool exited;

            try
            {
                if (!WinApi.GetExitCodeProcess(hProcess, out uint exitCode))
                {
                    throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                }

                // Fun fact, If a program uses STILL_ACTIVE (259) as an exit code, GetExitCodeProcess will return 259, since it returns... the exit code. This would break this function.
                exited = exitCode != 259;
            }
            finally 
            {
                // Imagine closing process handles.
                WinApi.CloseHandle(hProcess);
            }
            
            
            return exited;
        }

        internal static string GetCpuName()
        {
            return Registry.LocalMachine.OpenSubKey(@"HARDWARE\DESCRIPTION\System\CentralProcessor\0\")?.GetValue("ProcessorNameString").ToString() ?? null;
        }

        internal static (string, string)? GetCpuErrorMessage()
        {
            string cpuName = GetCpuName();
            if (cpuName == null)
                return null;

            foreach (var errorInfo in CpuErrorMessages)
            {
                if (errorInfo.Item1.All(cpuName.Contains))
                    return (errorInfo.Item2, errorInfo.Item3);
            }

            return null;
        }
    }
}
