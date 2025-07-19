// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.Threading;
using NLog;

namespace VRCX
{
    public class SystemMonitorElectron
    {
        public static readonly SystemMonitorElectron Instance;
        public float CpuUsage;
        public double UpTime;
        private bool _enabled;
        private long _lastTotalTime;
        private long _lastIdleTime;
        private bool _firstReading = true; // Add this flag
        private Thread _thread;
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        static SystemMonitorElectron()
        {
            Instance = new SystemMonitorElectron();
        }

        public void Init()
        {
        }

        public void Start(bool enabled)
        {
            if (enabled == _enabled)
                return;

            _enabled = enabled;
            if (enabled)
                StartThread();
            else
                Exit();
        }

        internal void Exit()
        {
            CpuUsage = 0;
            UpTime = 0;
            _firstReading = true; // Reset flag
            try
            {
                if (_thread != null)
                {
                    _thread.Interrupt();
                    _thread.Join();
                    _thread = null;
                }
            }
            catch (ThreadInterruptedException)
            {
            }
        }

        private void StartThread()
        {
            Exit();

            try
            {
                ReadCpuInfo();
            }
            catch (Exception ex)
            {
                logger.Error($"Failed to initialize CPU monitoring: {ex}");
                return;
            }

            _thread = new Thread(ThreadProc)
            {
                IsBackground = true
            };
            _thread.Start();
        }

        private void ThreadProc()
        {
            try
            {
                while (_enabled)
                {
                    UpdateMetrics();
                    Thread.Sleep(1000);
                }
            }
            catch (Exception ex)
            {
                logger.Warn($"SystemMonitor thread exception: {ex}");
            }

            Exit();
        }

        private void UpdateMetrics()
        {
            try
            {
                CpuUsage = GetCpuUsage();
                UpTime = GetUptime();
            }
            catch (Exception ex)
            {
                logger.Warn($"Error updating metrics: {ex}");
            }
        }

        private float GetCpuUsage()
        {
            try
            {
                var cpuInfo = ReadCpuInfo();
                if (cpuInfo == null) return 0;

                var totalTime = cpuInfo.Value.TotalTime;
                var idleTime = cpuInfo.Value.IdleTime;

                // Skip the first reading to establish baseline
                if (_firstReading)
                {
                    _lastTotalTime = totalTime;
                    _lastIdleTime = idleTime;
                    _firstReading = false;
                    return 0; // Return 0 for first reading
                }

                var totalTimeDiff = totalTime - _lastTotalTime;
                var idleTimeDiff = idleTime - _lastIdleTime;

                if (totalTimeDiff > 0)
                {
                    var cpuUsage = 100.0f * (1.0f - (float)idleTimeDiff / totalTimeDiff);
                    _lastTotalTime = totalTime;
                    _lastIdleTime = idleTime;

                    // Clamp to reasonable range
                    return Math.Max(0, Math.Min(100, cpuUsage));
                }

                return 0;
            }
            catch (Exception ex)
            {
                logger.Warn($"Error reading CPU usage: {ex}");
                return 0;
            }
        }

        private double GetUptime()
        {
            try
            {
                var uptimeContent = File.ReadAllText("/proc/uptime");
                var parts = uptimeContent.Split(' ');
                if (parts.Length > 0 && double.TryParse(parts[0], out var uptimeSeconds))
                {
                    return TimeSpan.FromSeconds(uptimeSeconds).TotalMilliseconds;
                }
            }
            catch (Exception ex)
            {
                logger.Warn($"Error reading uptime: {ex}");
            }
            return 0;
        }

        private (long TotalTime, long IdleTime)? ReadCpuInfo()
        {
            try
            {
                var statContent = File.ReadAllText("/proc/stat");
                var lines = statContent.Split('\n');

                foreach (var line in lines)
                {
                    if (line.StartsWith("cpu "))
                    {
                        var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 5)
                        {
                            // CPU time values: user, nice, system, idle, iowait, irq, softirq, steal, guest, guest_nice
                            var user = long.Parse(parts[1]);
                            var nice = long.Parse(parts[2]);
                            var system = long.Parse(parts[3]);
                            var idle = long.Parse(parts[4]);
                            var iowait = parts.Length > 5 ? long.Parse(parts[5]) : 0;
                            var irq = parts.Length > 6 ? long.Parse(parts[6]) : 0;
                            var softirq = parts.Length > 7 ? long.Parse(parts[7]) : 0;
                            var steal = parts.Length > 8 ? long.Parse(parts[8]) : 0;

                            var totalTime = user + nice + system + idle + iowait + irq + softirq + steal;
                            return (totalTime, idle);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Warn($"Error reading /proc/stat: {ex}");
            }
            return null;
        }
    }
}