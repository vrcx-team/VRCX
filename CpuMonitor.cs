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
        public float CpuUsage;
        private PerformanceCounter _performanceCounter;
        private Thread _thread;

        static CpuMonitor()
        {
            Instance = new CpuMonitor();
        }

        public CpuMonitor()
        {
            try
            {
                _performanceCounter = new PerformanceCounter(
                    "Processor Information",
                    "% Processor Utility",
                    "_Total",
                    true
                );
            }
            catch
            {
            }

            // fallback
            if (_performanceCounter == null)
            {
                try
                {
                    _performanceCounter = new PerformanceCounter(
                        "Processor",
                        "% Processor Time",
                        "_Total",
                        true
                    );
                }
                catch
                {
                }
            }

            _thread = new Thread(ThreadLoop)
            {
                IsBackground = true
            };
        }

        internal void Init()
        {
            _thread.Start();
        }

        internal void Exit()
        {
            var thread = _thread;
            _thread = null;
            thread.Interrupt();
            thread.Join();
            _performanceCounter?.Dispose();
        }

        private void ThreadLoop()
        {
            while (_thread != null)
            {
                if (_performanceCounter != null)
                {
                    CpuUsage = _performanceCounter.NextValue();
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
