// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;

namespace VRCX
{
    public class VRCX_LogWatcher
    {
        private static List<string[]> m_GameLog = new List<string[]>();
        private static Thread m_Thread;
        private static bool m_Reset;

        public static void Start()
        {
            if (m_Thread == null)
            {
                m_Thread = new Thread(() =>
                {
                    var lastPosition = 0L;
                    var firstLine = string.Empty;
                    while (m_Thread != null)
                    {
                        if (m_Reset)
                        {
                            m_Reset = false;
                            firstLine = string.Empty;
                            lastPosition = 0;
                        }
                        var info = new DirectoryInfo(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat");
                        if (info != null &&
                            info.Exists)
                        {
                            var files = info.GetFiles("output_log_*.txt", SearchOption.TopDirectoryOnly);
                            if (files != null &&
                                files.Length >= 1)
                            {
                                Array.Sort(files, (A, B) => B.LastWriteTime.CompareTo(A.LastWriteTime));
                                if (firstLine == string.Empty)
                                {
                                    for (var i = files.Length - 1; i >= 1; --i)
                                    {
                                        using (var stream = files[i].Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                                        using (var reader = new StreamReader(stream, Encoding.UTF8))
                                        {
                                            var line = string.Empty;
                                            while ((line = reader.ReadLine()) != null)
                                            {
                                                if (line.Length > 32 &&
                                                    line[31] == '-')
                                                {
                                                    ParseLine(line);
                                                }
                                            }
                                        }
                                    }
                                }
                                using (var stream = files[0].Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                                using (var reader = new StreamReader(stream, Encoding.UTF8))
                                {
                                    var line = reader.ReadLine();
                                    if (line != null)
                                    {
                                        if (string.Equals(firstLine, line))
                                        {
                                            stream.Position = lastPosition;
                                        }
                                        else
                                        {
                                            firstLine = line;
                                        }
                                        do
                                        {
                                            lastPosition = stream.Position;
                                            ParseLine(line);
                                        }
                                        while ((line = reader.ReadLine()) != null);
                                    }
                                }
                            }
                        }
                        try
                        {
                            Thread.Sleep(3000);
                        }
                        catch
                        {
                            // ThreadInterruptedException
                        }
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

        private static string ConvertLogTimeToISO8601(string s)
        {
            // 2019.07.31 22:26:24
            var dt = new DateTime(
                int.Parse(s.Substring(0, 4)),
                int.Parse(s.Substring(5, 2)),
                int.Parse(s.Substring(8, 2)),
                int.Parse(s.Substring(11, 2)),
                int.Parse(s.Substring(14, 2)),
                int.Parse(s.Substring(17, 2)),
                DateTimeKind.Local
            ).ToUniversalTime();
            return $"{dt:yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'}";
        }

        private static void ParseLine(string line)
        {
            try
            {
                // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:6974~private(usr_4f76a584-9d4b-46f6-8209-8305eb683661)~nonce(0000000000000000000000000000000000000000000000000000000000000000)
                // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining or Creating Room: VRChat Home
                if (string.Compare(line, 34, "[RoomManager] Joining ", 0, "[RoomManager] Joining ".Length) == 0 &&
                    string.Compare(line, 56, "or ", 0, "or ".Length) != 0)
                {
                    lock (m_GameLog)
                    {
                        m_GameLog.Add(new[]
                        {
                            ConvertLogTimeToISO8601(line),
                            "Location",
                            line.Substring(56)
                        });
                    }
                }
                // 2019.07.31 22:41:18 Log        -  [NetworkManager] OnPlayerJoined pypy
                else if (string.Compare(line, 34, "[NetworkManager] OnPlayerJoined ", 0, "[NetworkManager] OnPlayerJoined ".Length) == 0)
                {
                    lock (m_GameLog)
                    {
                        m_GameLog.Add(new[]
                        {
                            ConvertLogTimeToISO8601(line),
                            "OnPlayerJoined",
                            line.Substring(66)
                        });
                    }
                }
                // 2019.07.31 22:29:31 Log        -  [NetworkManager] OnPlayerLeft pypy
                else if (string.Compare(line, 34, "[NetworkManager] OnPlayerLeft ", 0, "[NetworkManager] OnPlayerLeft ".Length) == 0)
                {
                    lock (m_GameLog)
                    {
                        m_GameLog.Add(new[]
                        {
                            ConvertLogTimeToISO8601(line),
                            "OnPlayerLeft",
                            line.Substring(64)
                        });
                    }
                }
            }
            catch
            {
            }
        }

        public void Reset()
        {
            lock (m_GameLog)
            {
                m_Reset = true;
                m_GameLog.Clear();
            }
            m_Thread.Interrupt();
        }

        public string[][] GetLogs()
        {
            lock (m_GameLog)
            {
                var array = m_GameLog.ToArray();
                m_GameLog.Clear();
                return array;
            }
        }

        public bool HasLog()
        {
            lock (m_GameLog)
            {
                return m_GameLog.Count > 0;
            }
        }
    }
}