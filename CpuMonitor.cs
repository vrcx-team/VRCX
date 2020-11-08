// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Diagnostics;
using System.Threading;

namespace VRCX
{
    public class CpuMonitor
    {
        public static readonly CpuMonitor Instance;
        public float CpuUsage { get; private set; }
        private readonly PerformanceCounter m_Counter;
        private Thread m_Thread;

        static CpuMonitor()
        {
            Instance = new CpuMonitor();
        }

        public CpuMonitor()
        {
            try
            {
                m_Counter = new PerformanceCounter("Processor Information", "% Processor Utility", "_Total", true);
            }
            catch
            {
            }

            // fallback
            if (m_Counter == null)
            {
                try
                {
                    m_Counter = new PerformanceCounter("Processor", "% Processor Time", "_Total", true);
                }
                catch
                {
                }
            }

            m_Thread = new Thread(ThreadLoop)
            {
                IsBackground = true
            };
        }

        internal void Init()
        {
            m_Thread.Start();
        }

        internal void Exit()
        {
            var thread = m_Thread;
            m_Thread = null;
            thread.Interrupt();
            thread.Join();
            m_Counter?.Dispose();
        }

        private void ThreadLoop()
        {
            while (m_Thread != null)
            {
                if (m_Counter != null)
                {
                    CpuUsage = m_Counter.NextValue();
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
        }
    }
}
