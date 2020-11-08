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
    public class LogWatcher
    {
        private class LogContext
        {
            public long Length;
            public long Position;
        }

        public static readonly LogWatcher Instance;
        private readonly DirectoryInfo m_LogDirectoryInfo;
        private readonly Dictionary<string, LogContext> m_LogContextMap; // <FileName, LogContext>
        private readonly ReaderWriterLockSlim m_LogListLock;
        private readonly List<string[]> m_LogList;
        private Thread m_Thread;
        private bool m_ResetLog;

        // NOTE
        // FileSystemWatcher() is unreliable

        static LogWatcher()
        {
            Instance = new LogWatcher();
        }

        public LogWatcher()
        {
            var logPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat";
            m_LogDirectoryInfo = new DirectoryInfo(logPath);
            m_LogContextMap = new Dictionary<string, LogContext>();
            m_LogListLock = new ReaderWriterLockSlim();
            m_LogList = new List<string[]>();
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
        }

        private void ThreadLoop()
        {
            while (m_Thread != null)
            {
                Update();

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

        private void Update()
        {
            if (m_ResetLog == true)
            {
                m_ResetLog = false;
                m_LogContextMap.Clear();
                m_LogListLock.EnterWriteLock();
                try
                {
                    m_LogList.Clear();
                }
                finally
                {
                    m_LogListLock.ExitWriteLock();
                }
            }

            var deletedNameSet = new HashSet<string>(m_LogContextMap.Keys);
            m_LogDirectoryInfo.Refresh();

            if (m_LogDirectoryInfo.Exists == true)
            {
                var fileInfos = m_LogDirectoryInfo.GetFiles("output_log_*.txt", SearchOption.TopDirectoryOnly);

                // sort by creation time
                Array.Sort(fileInfos, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));

                var bias = DateTime.UtcNow.AddMinutes(-3d);

                foreach (var fileInfo in fileInfos)
                {
                    if (bias.CompareTo(fileInfo.LastWriteTimeUtc) <= 0)
                    {
                        fileInfo.Refresh();
                        if (fileInfo.Exists == false)
                        {
                            continue;
                        }
                    }

                    if (m_LogContextMap.TryGetValue(fileInfo.Name, out LogContext logContext) == true)
                    {
                        deletedNameSet.Remove(fileInfo.Name);
                    }
                    else
                    {
                        logContext = new LogContext();
                        m_LogContextMap.Add(fileInfo.Name, logContext);
                    }

                    if (logContext.Length == fileInfo.Length)
                    {
                        continue;
                    }

                    logContext.Length = fileInfo.Length;
                    ParseLog(fileInfo, logContext);
                }
            }

            foreach (var name in deletedNameSet)
            {
                m_LogContextMap.Remove(name);
            }
        }

        private void ParseLog(FileInfo fileInfo, LogContext logContext)
        {
            try
            {
                using (var fileStream = fileInfo.Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    fileStream.Position = logContext.Position;
                    using (var streamReader = new StreamReader(fileStream, Encoding.UTF8))
                    {
                        while (true)
                        {
                            var line = streamReader.ReadLine();
                            if (line == null)
                            {
                                logContext.Position = fileStream.Position;
                                break;
                            }

                            if (line.Length <= 34 ||
                                line[31] != '-' ||
                                ParseLogOnPlayerJoined(fileInfo, line) == true ||
                                ParseLogOnPlayerLeft(fileInfo, line) == true ||
                                ParseLogNotification(fileInfo, line) == true ||
                                ParseLogLocation(fileInfo, line) == true ||
                                ParseLogHMDModel(fileInfo, line) == true ||
                                ParseLogAuth(fileInfo, line) == true)
                            {
                                continue;
                            }
                        }
                    }
                }
            }
            catch
            {
            }
        }

        private void AppendLog(string[] item)
        {
            m_LogListLock.EnterWriteLock();
            try
            {
                m_LogList.Add(item);
            }
            finally
            {
                m_LogListLock.ExitWriteLock();
            }
        }

        private string ConvertLogTimeToISO8601(string line)
        {
            // 2020.10.31 23:36:22

            if (DateTime.TryParseExact(
                line.Substring(0, 19),
                "yyyy.MM.dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeLocal,
                out DateTime dt
            ) == false)
            {
                dt = DateTime.UtcNow;
            }

            return $"{dt:yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'}";
        }

        private bool ParseLogHMDModel(FileInfo fileInfo, string line)
        {
            // 2020.10.31 23:36:23 Log        -  STEAMVR HMD Model: VIVE_Pro MV

            if (line.Length <= 53 ||
                line[34] != 'S' ||
                string.Compare(line, 34, "STEAMVR HMD Model: ", 0, 19, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            var hmdModel = line.Substring(53);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "hmd-model",
                hmdModel
            });

            return true;
        }

        private bool ParseLogAuth(FileInfo fileInfo, string line)
        {
            // 2020.10.31 23:36:26 Log        -  [VRCFlowNetworkManager] Sending token from provider vrchat as user zetyx

            if (line.Length <= 86 ||
                line[35] != 'V' ||
                string.Compare(line, 34, "[VRCFlowNetworkManager] Sending token from provider ", 0, 41, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            var pos = line.IndexOf(" as user ", 86);
            if (pos < 0)
            {
                return false;
            }

            var loginProvider = line.Substring(86, pos - 86);
            var loginUser = line.Substring(pos + 9);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "auth",
                loginProvider,
                loginUser
            });

            return true;
        }

        private bool ParseLogLocation(FileInfo fileInfo, string line)
        {
            // 2020.10.31 23:36:28 Log        -  [VRCFlowManagerVRC] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2020.10.31 23:36:28 Log        -  [VRCFlowManagerVRC] Destination set: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Entering Room: VRChat Home
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Joining wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:67646~private(usr_4f76a584-9d4b-46f6-8209-8305eb683661)~nonce(D9298A536FEEEDDBB61633661A4BDAA09717C5178DEF865C4C09372FE12E09A6)
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Joining or Creating Room: VRChat Home
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Successfully joined room

            if (line.Length <= 56 ||
                line[35] != 'R' ||
                string.Compare(line, 34, "[RoomManager] Joining ", 0, 22, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            if (string.Compare(line, 56, "or ", 0, 3, StringComparison.Ordinal) != 0)
            {
                var location = line.Substring(56);

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "location",
                    location
                });

                return true;
            }

            var worldName = (line.Length <= 74)
                ? string.Empty
                : line.Substring(74);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "world",
                worldName
            });

            return true;
        }

        private bool ParseLogOnPlayerJoined(FileInfo fileInfo, string line)
        {
            // 2020.10.31 23:36:58 Log        -  [NetworkManager] OnPlayerJoined pypy
            // 2020.10.31 23:36:58 Log        -  [Player] Initialized PlayerAPI "pypy" is local
            // 2020.10.31 23:36:58 Log        -  [NetworkManager] OnPlayerJoined Rize♡
            // 2020.10.31 23:36:58 Log        -  [Player] Initialized PlayerAPI "Rize♡" is remote

            if (line.Length <= 66 ||
                line[35] != 'N' ||
                string.Compare(line, 34, "[NetworkManager] OnPlayerJoined ", 0, 32, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            var userDisplayName = line.Substring(66);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "player-joined",
                userDisplayName
            });

            return true;
        }

        private bool ParseLogOnPlayerLeft(FileInfo fileInfo, string line)
        {
            // 2020.11.01 00:07:01 Log        -  [NetworkManager] OnPlayerLeft Rize♡
            // 2020.11.01 00:07:01 Log        -  [PlayerManager] Removed player 2 / Rize♡
            // 2020.11.01 00:07:02 Log        -  [Player] Unregistering Rize♡

            if (line.Length <= 64 ||
                line[35] != 'N' ||
                string.Compare(line, 34, "[NetworkManager] OnPlayerLeft ", 0, 30, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            var userDisplayName = line.Substring(64);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "player-left",
                userDisplayName
            });

            return true;
        }

        private bool ParseLogNotification(FileInfo fileInfo, string line)
        {
            // 2020.10.31 23:36:28 Log        -  Received Message of type: notification content: {{"id":"not_3a8f66eb-613c-4351-bee3-9980e6b5652c","senderUserId":"usr_4f76a584-9d4b-46f6-8209-8305eb683661","senderUsername":"pypy","type":"friendRequest","message":"","details":"{{}}","seen":false,"created_at":"2020-08-16T11:03:59.291Z"}} received at 10/31/2020 14:36:28 UTC

            if (line.Length <= 82 ||
                line[34] != 'R' ||
                string.Compare(line, 34, "Received Message of type: notification content: ", 0, 48, StringComparison.Ordinal) != 0)
            {
                return false;
            }

            var pos = line.LastIndexOf("}} received at");
            if (pos < 0)
            {
                return false;
            }

            var json = line.Substring(82, pos - 82 + 2); // including brace
            json = json.Replace("{{", "{");
            json = json.Replace("}}", "}");

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "notification",
                json
            });

            return true;
        }

        public void Reset()
        {
            m_ResetLog = true;
            m_Thread?.Interrupt();
        }

        public string[][] Get()
        {
            if (m_ResetLog == false &&
                m_LogList.Count > 0)
            {
                m_LogListLock.EnterWriteLock();
                try
                {
                    string[][] items;

                    if (m_LogList.Count > 1000)
                    {
                        items = new string[1000][];
                        m_LogList.CopyTo(0, items, 0, 1000);
                        m_LogList.RemoveRange(0, 1000);
                    }
                    else
                    {
                        items = m_LogList.ToArray();
                        m_LogList.Clear();
                    }

                    return items;
                }
                finally
                {
                    m_LogListLock.ExitWriteLock();
                }
            }

            return new string[][] { };
        }
    }
}
