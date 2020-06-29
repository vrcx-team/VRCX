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
        public string Tag;
    }

    public class LogWatcher
    {
        public static LogWatcher Instance { get; private set; }
        private static readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
        private static List<string[]> m_GameLog = new List<string[]>();
        private static Thread m_Thread;
        private static bool m_Reset;

        // NOTE
        // FileSystemWatcher() is unreliable

        static LogWatcher()
        {
            Instance = new LogWatcher();
        }

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
                            Parse(fi, F);
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

        public static void Parse(FileInfo info, LogWatcherFile F)
        {
            try
            {
                using (var stream = info.Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    stream.Position = F.Position;
                    using (var reader = new StreamReader(stream, Encoding.UTF8))
                    {
                        var s = string.Empty;
                        while ((s = reader.ReadLine()) != null)
                        {
                            s = s.Trim();
                            if (s.Length <= 35)
                            {
                                continue;
                            }
                            var c = s[35];
                            if (c == 'P')
                            {
                                if (s.Length > 66 &&
                                    string.Compare(s, 34, "[Player] Initialized PlayerAPI \"", 0, 32, StringComparison.Ordinal) == 0)
                                {
                                    // 2020.04.02 20:59:08 Log        -  [Player] Initialized PlayerAPI "pypy" is local
                                    var time = ConvertLogTimeToISO8601(s);
                                    var data = s.Substring(66);
                                    var pos = data.LastIndexOf('"');
                                    if (pos >= 0)
                                    {
                                        data = data.Substring(0, pos);
                                    }
                                    m_Lock.EnterWriteLock();
                                    try
                                    {
                                        m_GameLog.Add(new[]
                                        {
                                            time,
                                            "OnPlayerJoined",
                                            data
                                        });
                                    }
                                    finally
                                    {
                                        m_Lock.ExitWriteLock();
                                    }
                                }
                            }
                            else if (c == 'R')
                            {
                                if (s.Length > 56 &&
                                    string.Compare(s, 34, "[RoomManager] Joining ", 0, 22, StringComparison.Ordinal) == 0)
                                {
                                    if (string.Compare(s, 56, "or ", 0, 3, StringComparison.Ordinal) == 0)
                                    {
                                        // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining or Creating Room: VRChat Home
                                        var time = ConvertLogTimeToISO8601(s);
                                        var data = string.Empty;
                                        if (s.Length > 74)
                                        {
                                            data = s.Substring(74);
                                        }
                                        m_Lock.EnterWriteLock();
                                        try
                                        {
                                            m_GameLog.Add(new[]
                                            {
                                                time,
                                                "Location",
                                                F.Tag,
                                                data
                                            });
                                        }
                                        finally
                                        {
                                            m_Lock.ExitWriteLock();
                                        }
                                    }
                                    else
                                    {
                                        // 2019.07.31 22:26:24 Log        -  [RoomManager] Joining wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:6974~private(usr_4f76a584-9d4b-46f6-8209-8305eb683661)~nonce(0000000000000000000000000000000000000000000000000000000000000000)
                                        F.Tag = s.Substring(56);
                                    }
                                }
                            }
                            else if (c == 'e')
                            {
                                if (s.Length > 82 &&
                                    string.Compare(s, 34, "Received Message of type: notification content: ", 0, 48, StringComparison.Ordinal) == 0)
                                {
                                    // 2020.06.28 06:28:18 Log        -  Received Message of type: notification content: {{"id":"not_7ba7c14f-e9e4-4e2f-a2e7-f5ccb7ffdad5","type":"invite","senderUserId":"usr_4f76a584-9d4b-46f6-8209-8305eb683661","senderUsername":"pypy","receiverUserId":"usr_f38006b4-eab5-4243-bcb1-206138e629d8","message":"This is a generated invite","details":{{"worldId":"wrld_03f52086-965c-456f-a5e9-4ba6df473173:72562~friends(usr_8a2f5b19-4f97-4642-b0fe-d8b338691b47)~nonce(1158A2215996CF893F29D270E47681DED8B6C226BCEF9B767F66EB7B55144E58)","worldName":"Shy Avatars"}},"created_at":"2020-06-27T21:28:18.520Z"}} received at 2020-06-27 PM 9:28:18 UTC
                                    // 2020.06.28 06:28:18 Log        -  Received Notification: <Notification from username:pypy, sender user id:usr_4f76a584-9d4b-46f6-8209-8305eb683661 to usr_f38006b4-eab5-4243-bcb1-206138e629d8 of type: invite, id: not_7ba7c14f-e9e4-4e2f-a2e7-f5ccb7ffdad5, created at: 2020-06-27 PM 9:28:18 UTC, details: {{worldId=wrld_03f52086-965c-456f-a5e9-4ba6df473173:72562~friends(usr_8a2f5b19-4f97-4642-b0fe-d8b338691b47)~nonce(1158A2215996CF893F29D270E47681DED8B6C226BCEF9B767F66EB7B55144E58), worldName=Shy Avatars}}, type:invite, m seen:False, message: "This is a generated invite"> received at 2020-06-27 PM 9:28:18 UTC
                                    var time = ConvertLogTimeToISO8601(s);
                                    var data = s.Substring(82);
                                    var pos = data.LastIndexOf('}');
                                    if (pos >= 0)
                                    {
                                        data = data.Substring(0, pos + 1); // including brace
                                    }
                                    m_Lock.EnterWriteLock();
                                    try
                                    {
                                        m_GameLog.Add(new[]
                                        {
                                            time,
                                            "Notification",
                                            data
                                        });
                                    }
                                    finally
                                    {
                                        m_Lock.ExitWriteLock();
                                    }
                                }
                            }
                        }
                        F.Position = stream.Position;
                    }
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