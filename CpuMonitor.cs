// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Diagnostics;
using System.Threading;

namespace VRCX
{
    public static class CpuMonitor
    {
        public static float CpuUsage { get; private set; }
        private static Thread m_Thread;

        public static void Start()
        {
            if (m_Thread == null)
            {
                m_Thread = new Thread(() =>
                {
                    PerformanceCounter cpuCounter = null;
                    try
                    {
                        cpuCounter = new PerformanceCounter("Processor Information", "% Processor Utility", "_Total", true);
                    }
                    catch
                    {
                    }
                    try
                    {
                        if (cpuCounter == null)
                        {
                            cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total", true);
                        }
                    }
                    catch
                    {
                    }
                    while (m_Thread != null)
                    {
                        if (cpuCounter != null)
                        {
                            CpuUsage = cpuCounter.NextValue();
                        }
                        try
                        {
                            Thread.Sleep(1000);
                        }
                        catch
                        {
                            // ThreadInterruptedException
                        }
                    }
                    if (cpuCounter != null)
                    {
                        cpuCounter.Dispose();
                    }
                });
                m_Thread.Start();
            }
        }

        public static void Stop()
        {
            var thread = m_Thread;
            if (thread != null)
            {
                m_Thread = null;
                try
                {
                    thread.Interrupt();
                    thread.Join();
                }
                catch
                {
                }
            }
        }
    }
}