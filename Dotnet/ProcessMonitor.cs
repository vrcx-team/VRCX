using NLog;
using System;
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
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        static ProcessMonitor()
        {
            Instance = new ProcessMonitor();
            Instance.ProcessStarted += Program.AppApiInstance.OnProcessStateChanged;
            Instance.ProcessExited += Program.AppApiInstance.OnProcessStateChanged;
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

        private void MonitorProcessTimer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var processesNeedingUpdate = new List<MonitoredProcess>();

            // Check if any of the monitored processes have been opened or closed.
            foreach (var keyValuePair in monitoredProcesses)
            {
                var monitoredProcess = keyValuePair.Value;

                if (monitoredProcess.IsRunning)
                {
                    if (monitoredProcess.Process == null || WinApi.HasProcessExited(monitoredProcess.Process.Id))
                    {
                        monitoredProcess.ProcessExited();
                        ProcessExited?.Invoke(monitoredProcess);
                        logger.Info($"Monitored process {monitoredProcess.ProcessName} (PID: {(monitoredProcess.Process?.Id.ToString() ?? "null")}) exited.");
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

                // We are also checking to see if the process is exiting before adding it, otherwise we'll keep adding it and then removing it constantly in an endless loop.
                if (process == null || WinApi.HasProcessExited(process.Id))
                    continue;
                
                monitoredProcess.ProcessStarted(process);
                ProcessStarted?.Invoke(monitoredProcess);
                logger.Info($"Monitored process {monitoredProcess.ProcessName} (PID: {process.Id}) started.");
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
            if (!monitoredProcesses.TryGetValue(processName, out var process))
                return false;

            if (ensureCheck && process.Process == null)
                return Process.GetProcessesByName(processName).FirstOrDefault() != null;

            return process.IsRunning;

        }

        /// <summary>
        ///     Adds a process to be monitored.
        /// </summary>
        /// <param name="process"></param>
        public void AddProcess(Process process)
        {
            var processName = process.ProcessName.ToLower();
            if (monitoredProcesses.ContainsKey(processName))
                return;

            monitoredProcesses.Add(processName, new MonitoredProcess(process));
            logger.Debug($"Added process {processName} to process monitor.");
        }

        /// <summary>
        ///     Adds a process to be monitored.
        /// </summary>
        /// <param name="processName"></param>
        public void AddProcess(string processName)
        {
            processName = processName.ToLower();
            if (monitoredProcesses.ContainsKey(processName))
                return;

            monitoredProcesses.Add(processName, new MonitoredProcess(processName));
            logger.Debug($"Added process {processName} to process monitor.");
        }

        /// <summary>
        ///     Removes a process from being monitored.
        /// </summary>
        /// <param name="processName"></param>
        public void RemoveProcess(string processName)
        {
            processName = processName.ToLower();
            monitoredProcesses.Remove(processName);
            logger.Debug($"Removed process {processName} from process monitor.");
        }
    }

    public class MonitoredProcess
    {
        public MonitoredProcess(Process process)
        {
            Process = process;
            ProcessName = process.ProcessName.ToLower();

            if (!WinApi.HasProcessExited(process.Id))
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