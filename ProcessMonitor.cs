﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Timers;

namespace VRCX
{
    // I don't think this applies to our use case, but I'm leaving it here for reference.
    // https://stackoverflow.com/questions/2519673/process-hasexited-returns-true-even-though-process-is-running
    // "When a process is started, it is assigned a PID. If the User is then prompted with the User Account Control dialog and selects 'Yes', the process is re-started and assigned a new PID."
    // There's no docs for this, but Process.HasExited also seems to be checked every time the property is accessed, so it's not cached. Which means Process.Refresh() is not needed for our use case.

    /// <summary>
    ///     A class that monitors given processes and raises events when they are started or exited.
    ///     Intended to be used to monitor VRChat and VRChat-related processes.
    /// </summary>
    internal class ProcessMonitor
    {
        private readonly Dictionary<string, MonitoredProcess> monitoredProcesses;
        private readonly Timer monitorProcessTimer;

        static ProcessMonitor()
        {
            Instance = new ProcessMonitor();
        }

        public ProcessMonitor()
        {
            monitoredProcesses = new Dictionary<string, MonitoredProcess>();

            monitorProcessTimer = new Timer();
            monitorProcessTimer.Interval = 1000;
            monitorProcessTimer.Elapsed += MonitorProcessTimer_Elapsed;
        }

        public static ProcessMonitor Instance { get; private set; }

        /// <summary>
        ///     Raised when a monitored process is started.
        /// </summary>
        public event Action<MonitoredProcess> ProcessStarted;

        /// <summary>
        ///     Raised when a monitored process is exited.
        /// </summary>
        public event Action<MonitoredProcess> ProcessExited;

        /// <summary>
        /// Flag that specifies the access rights to query limited information about a process.
        /// This won't throw an exception when we try to access info about an elevated process
        /// </summary>
        private const int PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

        public void Init()
        {
            AddProcess("vrchat");
            AddProcess("vrserver");
            monitorProcessTimer.Start();
        }

        public void Exit()
        {
            monitorProcessTimer.Stop();
            monitoredProcesses.Values.ToList().ForEach(x => x.ProcessExited());
        }

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
            if (!WinApi.GetExitCodeProcess(hProcess, out uint exitCode))
            {
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            }

            // Fun fact, If a program uses STILL_ACTIVE (259) as an exit code, GetExitCodeProcess will return 259, since it returns... the exit code. This would break this function.
            exited = exitCode != 259;
            return exited;
        }

        private void MonitorProcessTimer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var processesNeedingUpdate = new List<MonitoredProcess>();

            // Check if any of the monitored processes have been opened or closed.
            foreach (var keyValuePair in monitoredProcesses)
            {
                var monitoredProcess = keyValuePair.Value;
                var process = monitoredProcess.Process;
                var name = monitoredProcess.ProcessName;

                if (monitoredProcess.IsRunning)
                {
                    if (monitoredProcess.Process == null || HasProcessExited(monitoredProcess.Process.Id))
                    {
                        monitoredProcess.ProcessExited();
                        ProcessExited?.Invoke(monitoredProcess);
                    }
                }
                else
                {
                    processesNeedingUpdate.Add(monitoredProcess);
                }
            }

            // We do it this way so we're not constantly polling for processes if we don't actually need to (aka, all processes are already accounted for).
            if (processesNeedingUpdate.Count == 0)
                return;

            var processes = Process.GetProcesses();
            foreach (var monitoredProcess in processesNeedingUpdate)
            {
                var process = processes.FirstOrDefault(p => string.Equals(p.ProcessName, monitoredProcess.ProcessName, StringComparison.OrdinalIgnoreCase));
                if (process != null)
                {
                    monitoredProcess.ProcessStarted(process);
                    ProcessStarted?.Invoke(monitoredProcess);
                }
            }
        }

        /// <summary>
        ///     Checks if a process if currently being monitored and if it is running.
        /// </summary>
        /// <param name="processName">The name of the process to check for.</param>
        /// <param name="ensureCheck">If true, will manually check if the given process is running should the the monitored process not be initialized yet.</param>
        /// <returns>Whether the given process is monitored and currently running.</returns>
        public bool IsProcessRunning(string processName, bool ensureCheck = false)
        {
            processName = processName.ToLower();
            if (monitoredProcesses.ContainsKey(processName))
            {
                var process = monitoredProcesses[processName];

                if (ensureCheck && process.Process == null)
                    return Process.GetProcessesByName(processName).FirstOrDefault() != null;

                return process.IsRunning;
            }

            return false;
        }

        /// <summary>
        ///     Adds a process to be monitored.
        /// </summary>
        /// <param name="process"></param>
        public void AddProcess(Process process)
        {
            if (monitoredProcesses.ContainsKey(process.ProcessName.ToLower()))
                return;

            monitoredProcesses.Add(process.ProcessName.ToLower(), new MonitoredProcess(process));
        }

        /// <summary>
        ///     Adds a process to be monitored.
        /// </summary>
        /// <param name="processName"></param>
        public void AddProcess(string processName)
        {
            if (monitoredProcesses.ContainsKey(processName.ToLower()))
            {
                return;
            }

            monitoredProcesses.Add(processName, new MonitoredProcess(processName));
        }

        /// <summary>
        ///     Removes a process from being monitored.
        /// </summary>
        /// <param name="processName"></param>
        public void RemoveProcess(string processName)
        {
            if (monitoredProcesses.ContainsKey(processName.ToLower()))
            {
                monitoredProcesses.Remove(processName);
            }
        }
    }

    internal class MonitoredProcess
    {
        public MonitoredProcess(Process process)
        {
            Process = process;
            ProcessName = process.ProcessName.ToLower();

            if (process != null && !ProcessMonitor.HasProcessExited(process.Id))
                IsRunning = true;
        }

        public MonitoredProcess(string processName)
        {
            ProcessName = processName;
            IsRunning = false;
        }

        public Process Process { get; private set; }
        public string ProcessName { get; private set; }
        public bool IsRunning { get; private set; }

        public bool HasName(string processName)
        {
            return ProcessName.Equals(processName, StringComparison.OrdinalIgnoreCase);
        }

        public void ProcessExited()
        {
            IsRunning = false;
            Process?.Dispose();
            Process = null;
        }

        public void ProcessStarted(Process process)
        {
            Process = process;
            ProcessName = process.ProcessName.ToLower();
            IsRunning = true;
        }
    }
}