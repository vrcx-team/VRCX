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

        public static void Init()
        {
            m_Thread = new Thread(() =>
            {
                PerformanceCounter counter = null;
                try
                {
                    counter = new PerformanceCounter("Processor Information", "% Processor Utility", "_Total", true);
                }
                catch
                {
                }
                try
                {
                    if (counter == null)
                    {
                        counter = new PerformanceCounter("Processor", "% Processor Time", "_Total", true);
                    }
                }
                catch
                {
                }
                if (counter != null)
                {
                    while (m_Thread != null)
                    {
                        try
                        {
                            Thread.Sleep(1000);
                        }
                        catch
                        {
                            // ThreadInterruptedException
                        }
                        CpuUsage = counter.NextValue();
                    }
                    counter.Dispose();
                }
            })
            {
                IsBackground = true
            };
            m_Thread.Start();
        }

        public static void Exit()
        {
            var T = m_Thread;
            m_Thread = null;
            T.Interrupt();
            T.Join();
        }
    }
}