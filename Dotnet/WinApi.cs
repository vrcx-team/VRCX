using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using Microsoft.Win32;

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

        [DllImport("ntdll.dll")]
        private static extern int NtQueryInformationProcess(IntPtr processHandle, int processInformationClass, IntPtr processInformation, int processInformationLength, out int returnLength);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr CommandLineToArgvW(string lpCmdLine, out int pNumArgs);

        [DllImport("kernel32.dll")]
        private static extern IntPtr LocalFree(IntPtr hMem);

        private const int ProcessCommandLineInformation = 60;

        /// <summary>
        /// Reads the arguments a running process was started with, straight from Windows.
        /// Uses NtQueryInformationProcess(ProcessCommandLineInformation), which only needs PROCESS_QUERY_LIMITED_INFORMATION,
        /// so it works on anti-cheat protected processes where WMI (Win32_Process.CommandLine) returns nothing.
        /// </summary>
        /// <param name="processId">The process to read.</param>
        /// <returns>The arguments including the executable as the first item, or null if they could not be read.</returns>
        internal static string[] GetProcessArguments(int processId)
        {
            var hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);
            if (hProcess == IntPtr.Zero)
                return null;

            var buffer = IntPtr.Zero;
            try
            {
                // first call reports the size needed
                NtQueryInformationProcess(hProcess, ProcessCommandLineInformation, IntPtr.Zero, 0, out var length);
                if (length <= 0)
                    return null;

                buffer = Marshal.AllocHGlobal(length);
                if (NtQueryInformationProcess(hProcess, ProcessCommandLineInformation, buffer, length, out _) != 0)
                    return null;

                // UNICODE_STRING: ushort Length (bytes), ushort MaximumLength, PWSTR Buffer
                var chars = (ushort)Marshal.ReadInt16(buffer) / 2;
                var text = Marshal.ReadIntPtr(buffer, IntPtr.Size);
                if (chars == 0 || text == IntPtr.Zero)
                    return null;

                return SplitCommandLine(Marshal.PtrToStringUni(text, chars));
            }
            finally
            {
                if (buffer != IntPtr.Zero)
                    Marshal.FreeHGlobal(buffer);
                CloseHandle(hProcess);
            }
        }

        /// <summary>
        /// Splits a command line into arguments with CommandLineToArgvW, the same rules Windows programs use.
        /// </summary>
        private static string[] SplitCommandLine(string commandLine)
        {
            if (string.IsNullOrWhiteSpace(commandLine))
                return null;

            var argv = CommandLineToArgvW(commandLine, out var count);
            if (argv == IntPtr.Zero)
                return null;

            try
            {
                var arguments = new string[count];
                for (var i = 0; i < count; i++)
                    arguments[i] = Marshal.PtrToStringUni(Marshal.ReadIntPtr(argv, i * IntPtr.Size));

                return arguments;
            }
            finally
            {
                LocalFree(argv);
            }
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
