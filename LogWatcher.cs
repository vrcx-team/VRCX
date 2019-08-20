// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading;

namespace VRCX
{
    public class LogWatcherFile
    {
        public long Length;
        public long Position;
    }

    public class LogWatcher
    {
        private static readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
        private static List<string[]> m_GameLog = new List<string[]>();
        private static Thread m_Thread;
        private static bool m_Reset;

        // NOTE
        // FileSystemWatcher() is unreliable

        public static void Init()
        {
            m_Thread = new Thread(() =>
            {
                var D = new Dictionary<string, LogWatcherFile>();
                var di = new DirectoryInfo(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat");
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
                    if (m_Reset)
                    {
                        m_Reset = false;
                        D.Clear();
                        m_Lock.EnterWriteLock();
                        try
                        {
                            m_GameLog.Clear();
                        }
                        finally
                        {
                            m_Lock.ExitWriteLock();
                        }
                    }
                    var S = new HashSet<string>(D.Keys);
                    di.Refresh();
                    if (di.Exists)
                    {
                        var files = di.GetFiles("output_log_*.txt", SearchOption.TopDirectoryOnly);
                        Array.Sort(files, (A, B) => A.CreationTimeUtc.CompareTo(B.CreationTimeUtc));
                        var bias = DateTime.UtcNow.AddMinutes(-5d);
                        foreach (var fi in files)
                        {
                            if (bias.CompareTo(fi.LastWriteTimeUtc) <= 0)
                            {
                                fi.Refresh();
                            }
                            if (D.TryGetValue(fi.Name, out LogWatcherFile F))
                            {
                                S.Remove(fi.Name);
                                if (F.Length == fi.Length)
                                {
                                    continue;
                                }
                            }
                            else
                            {
                                F = new LogWatcherFile();
                                D.Add(fi.Name, F);
                            }
                            F.Length = fi.Length;
                            Parse(fi, ref F.Position);
                        }
                    }
                    foreach (var key in S)
                    {
                        D.Remove(key);
                    }
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

        public static void Parse(FileInfo info, ref long position)
        {
            try
            {
                using (var stream = info.Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (var reader = new StreamReader(stream, Encoding.UTF8))
                {
                    stream.Position = position;
                    var s = string.Empty;
                    while ((s = reader.ReadLine()) != null)
                    {
                        if (s.Length > 35)
                        {
                            var c = s[35];
                            if (c == 'R')
                            {
                                // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:6974~private(usr_4f76a584-9d4b-46f6-8209-8305eb683661)~nonce(0000000000000000000000000000000000000000000000000000000000000000)
                                // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining or Creating Room: VRChat Home
                                if (s.Length > 56 &&
                                    string.Compare(s, 34, "[RoomManager] Joining ", 0, "[RoomManager] Joining ".Length, StringComparison.Ordinal) == 0 &&
                                    string.Compare(s, 56, "or ", 0, "or ".Length, StringComparison.Ordinal) != 0)
                                {
                                    var item = new[]
                                    {
                                        ConvertLogTimeToISO8601(s),
                                        "Location",
                                        s.Substring(56)
                                    };
                                    m_Lock.EnterWriteLock();
                                    try
                                    {
                                        m_GameLog.Add(item);
                                    }
                                    finally
                                    {
                                        m_Lock.ExitWriteLock();
                                    }
                                }
                            }
                            else if (c == 'N')
                            {
                                // 2019.07.31 22:41:18 Log        -  [NetworkManager] OnPlayerJoined pypy
                                if (s.Length > 66 &&
                                    string.Compare(s, 34, "[NetworkManager] OnPlayerJoined ", 0, "[NetworkManager] OnPlayerJoined ".Length, StringComparison.Ordinal) == 0)
                                {
                                    var item = new[]
                                    {
                                        ConvertLogTimeToISO8601(s),
                                        "OnPlayerJoined",
                                        s.Substring(66)
                                    };
                                    m_Lock.EnterWriteLock();
                                    try
                                    {
                                        m_GameLog.Add(item);
                                    }
                                    finally
                                    {
                                        m_Lock.ExitWriteLock();
                                    }
                                }
                                // 2019.07.31 22:29:31 Log        -  [NetworkManager] OnPlayerLeft pypy
                                else if (s.Length > 64 &&
                                    string.Compare(s, 34, "[NetworkManager] OnPlayerLeft ", 0, "[NetworkManager] OnPlayerLeft ".Length, StringComparison.Ordinal) == 0)
                                {
                                    var item = new[]
                                    {
                                        ConvertLogTimeToISO8601(s),
                                        "OnPlayerLeft",
                                        s.Substring(64)
                                    };
                                    m_Lock.EnterWriteLock();
                                    try
                                    {
                                        m_GameLog.Add(item);
                                    }
                                    finally
                                    {
                                        m_Lock.ExitWriteLock();
                                    }
                                }
                            }
                        }
                    }
                    position = stream.Position;
                }
            }
            catch
            {
            }
        }

        private static string ConvertLogTimeToISO8601(string s)
        {
            // 2019.07.31 22:26:24
            if (!DateTime.TryParseExact(s.Substring(0, 19),
                "yyyy.MM.dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeLocal,
                out DateTime dt))
            {
                dt = DateTime.UtcNow;
            }
            return $"{dt:yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'}";
        }

        public void Reset()
        {
            if (m_Thread != null)
            {
                m_Reset = true;
                m_Thread.Interrupt();
            }
        }

        public string[][] Get()
        {
            m_Lock.EnterUpgradeableReadLock();
            try
            {
                if (m_Reset ||
                    m_GameLog.Count == 0)
                {
                    return new string[][] { };
                }
                var array = m_GameLog.ToArray();
                m_Lock.EnterWriteLock();
                try
                {
                    m_GameLog.Clear();
                }
                finally
                {
                    m_Lock.ExitWriteLock();
                }
                return array;
            }
            finally
            {
                m_Lock.ExitUpgradeableReadLock();
            }
        }
    }
}