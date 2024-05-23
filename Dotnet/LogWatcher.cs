// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading;
using CefSharp;

namespace VRCX
{
    /// <summary>
    /// Monitors the VRChat log files for changes and provides access to the log data.
    /// </summary>
    public class LogWatcher
    {
        public static readonly LogWatcher Instance;
        private readonly Dictionary<string, LogContext> m_LogContextMap; // <FileName, LogContext>
        private readonly DirectoryInfo m_LogDirectoryInfo;
        private readonly List<string[]> m_LogList;
        private readonly ReaderWriterLockSlim m_LogListLock;
        private bool m_FirstRun = true;
        private bool m_ResetLog;
        private Thread m_Thread;
        private DateTime tillDate = DateTime.UtcNow;
        public bool VrcClosedGracefully;

        // NOTE
        // FileSystemWatcher() is unreliable

        static LogWatcher()
        {
            Instance = new LogWatcher();
        }

        private LogWatcher()
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

        public void Reset()
        {
            m_ResetLog = true;
            m_Thread?.Interrupt();
        }

        public void SetDateTill(string date)
        {
            tillDate = DateTime.Parse(date, CultureInfo.InvariantCulture, DateTimeStyles.None);
            tillDate = tillDate.ToUniversalTime();
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
                catch (ThreadInterruptedException)
                {
                }
            }
        }

        /// <summary>
        /// Updates the log watcher by checking for new log files and updating the log list.
        /// </summary>
        private void Update()
        {
            if (m_ResetLog)
            {
                m_FirstRun = true;
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

            if ((m_LogDirectoryInfo.LinkTarget == null && m_LogDirectoryInfo.Exists) || Directory.Exists(m_LogDirectoryInfo.LinkTarget))
            {
                var fileInfos = m_LogDirectoryInfo.GetFiles("output_log_*.txt", SearchOption.TopDirectoryOnly);

                // sort by creation time
                Array.Sort(fileInfos, (a, b) => a.CreationTimeUtc.CompareTo(b.CreationTimeUtc));

                foreach (var fileInfo in fileInfos)
                {
                    fileInfo.Refresh();
                    if (fileInfo.Exists == false)
                    {
                        continue;
                    }

                    if (DateTime.Compare(fileInfo.LastWriteTimeUtc, tillDate) < 0)
                    {
                        continue;
                    }

                    if (m_LogContextMap.TryGetValue(fileInfo.Name, out var logContext))
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

            m_FirstRun = false;
        }

        /// <summary>
        /// Parses the log file starting from the current position and updates the log context.
        /// </summary>
        /// <param name="fileInfo">The file information of the log file to parse.</param>
        /// <param name="logContext">The log context to update.</param>
        private void ParseLog(FileInfo fileInfo, LogContext logContext)
        {
            try
            {
                using (var stream = new FileStream(fileInfo.FullName, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, 65536, FileOptions.SequentialScan))
                {
                    stream.Position = logContext.Position;
                    using (var streamReader = new StreamReader(stream, Encoding.UTF8))
                    {
                        while (true)
                        {
                            var line = streamReader.ReadLine();
                            if (line == null)
                            {
                                logContext.Position = stream.Position;
                                break;
                            }

                            if (line.Length == 0)
                            {
                                continue;
                            }

                            // 2020.10.31 23:36:28 Log        -  [VRCFlowManagerVRC] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
                            // 2021.02.03 10:18:58 Log        -  [ǄǄǅǅǅǄǄǅǅǄǅǅǅǅǄǄǄǅǅǄǄǅǅǅǅǄǅǅǅǅǄǄǄǄǄǅǄǅǄǄǄǅǅǄǅǅǅ] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd

                            if (ParseLogUdonException(fileInfo, line))
                                continue;

                            if (line.Length <= 36 ||
                                line[31] != '-')
                            {
                                ParseDesktopModeOld(fileInfo, line);
                                continue;
                            }

                            if (DateTime.TryParseExact(
                                    line.Substring(0, 19),
                                    "yyyy.MM.dd HH:mm:ss",
                                    CultureInfo.InvariantCulture,
                                    DateTimeStyles.None,
                                    out var lineDate
                                ))
                            {
                                lineDate = lineDate.ToUniversalTime();
                                if (DateTime.Compare(lineDate, tillDate) <= 0)
                                {
                                    continue;
                                }
                            }

                            var offset = 34;
                            if (line[offset] == '[')
                            {
                                if (ParseLogOnPlayerJoinedOrLeft(fileInfo, logContext, line, offset) ||
                                    ParseLogLocation(fileInfo, logContext, line, offset) ||
                                    ParseLogLocationDestination(fileInfo, logContext, line, offset) ||
                                    ParseLogPortalSpawn(fileInfo, logContext, line, offset) ||
                                    ParseLogNotification(fileInfo, logContext, line, offset) ||
                                    ParseLogAPIRequest(fileInfo, logContext, line, offset) ||
                                    ParseLogAvatarChange(fileInfo, logContext, line, offset) ||
                                    ParseLogJoinBlocked(fileInfo, logContext, line, offset) ||
                                    ParseLogAvatarPedestalChange(fileInfo, logContext, line, offset) ||
                                    ParseLogVideoError(fileInfo, logContext, line, offset) ||
                                    ParseLogVideoChange(fileInfo, logContext, line, offset) ||
                                    ParseLogAVProVideoChange(fileInfo, logContext, line, offset) ||
                                    ParseLogUsharpVideoPlay(fileInfo, logContext, line, offset) ||
                                    ParseLogUsharpVideoSync(fileInfo, logContext, line, offset) ||
                                    ParseLogWorldVRCX(fileInfo, logContext, line, offset) ||
                                    ParseLogWorldDataVRCX(fileInfo, logContext, line, offset) ||
                                    ParseLogOnAudioConfigurationChanged(fileInfo, logContext, line, offset) ||
                                    ParseLogScreenshot(fileInfo, logContext, line, offset) ||
                                    ParseLogStringDownload(fileInfo, logContext, line, offset) ||
                                    ParseLogImageDownload(fileInfo, logContext, line, offset) ||
                                    ParseVoteKick(fileInfo, logContext, line, offset) ||
                                    ParseFailedToJoin(fileInfo, logContext, line, offset))
                                {
                                }
                            }
                            else
                            {
                                if (ParseLogShaderKeywordsLimit(fileInfo, logContext, line, offset) ||
                                    ParseLogSDK2VideoPlay(fileInfo, logContext, line, offset) ||
                                    ParseApplicationQuit(fileInfo, logContext, line, offset) ||
                                    ParseOpenVRInit(fileInfo, logContext, line, offset) ||
                                    ParseDesktopMode(fileInfo, logContext, line, offset) ||
                                    ParseOscFailedToStart(fileInfo, logContext, line, offset))
                                {
                                }
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
                if (!m_FirstRun)
                {
                    var logLine = System.Text.Json.JsonSerializer.Serialize(item);
                    if (MainForm.Instance != null && MainForm.Instance.Browser != null)
                        MainForm.Instance.Browser.ExecuteScriptAsync("$app.addGameLogEvent", logLine);
                }

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
                    DateTimeStyles.None,
                    out var dt
                ))
            {
                dt = dt.ToUniversalTime();
            }
            else
            {
                dt = DateTime.UtcNow;
            }

            // ISO 8601
            return dt.ToString("yyyy'-'MM'-'dd'T'HH':'mm':'ss'.'fff'Z'", CultureInfo.InvariantCulture);
        }

        private bool ParseLogLocation(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2020.10.31 23:36:28 Log        -  [VRCFlowManagerVRC] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2020.10.31 23:36:28 Log        -  [VRCFlowManagerVRC] Destination set: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Entering Room: VRChat Home
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Joining wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:67646~private(usr_4f76a584-9d4b-46f6-8209-8305eb683661)~nonce(D9298A536FEEEDDBB61633661A4BDAA09717C5178DEF865C4C09372FE12E09A6)
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Joining or Creating Room: VRChat Home
            // 2020.10.31 23:36:31 Log        -  [RoomManager] Successfully joined room
            // 2021.02.03 10:18:58 Log        -  [ǄǄǅǅǅǄǄǅǅǄǅǅǅǅǄǄǄǅǅǄǄǅǅǅǅǄǅǅǅǅǄǄǄǄǄǅǄǅǄǄǄǅǅǄǅǅǅ] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2021.06.23 12:02:56 Log        -  [Behaviour] Entering Room: VRChat Home

            if (line.Contains("[Behaviour] Entering Room: "))
            {
                var lineOffset = line.LastIndexOf("] Entering Room: ");
                if (lineOffset < 0)
                    return true;
                lineOffset += 17;
                if (lineOffset >= line.Length)
                    return true;

                var worldName = line.Substring(lineOffset);
                logContext.RecentWorldName = worldName;
                return true;
            }

            if (line.Contains("[Behaviour] Joining ") && !line.Contains("] Joining or Creating Room: ") && !line.Contains("] Joining friend: "))
            {
                var lineOffset = line.LastIndexOf("] Joining ");
                if (lineOffset < 0)
                    return true;
                lineOffset += 10;
                if (lineOffset >= line.Length)
                    return true;

                var location = line.Substring(lineOffset);

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "location",
                    location,
                    logContext.RecentWorldName
                });

                // logContext.onJoinPhotonDisplayName = string.Empty;
                // logContext.onJoinPhotonDisplayNameDate = string.Empty;
                logContext.LastAudioDevice = string.Empty;
                logContext.LastVideoError = string.Empty;
                logContext.locationDestination = string.Empty;
                VrcClosedGracefully = false;

                return true;
            }

            return false;
        }

        private bool ParseLogScreenshot(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // This won't work with VRChat's new "Multi Layer" camera mode, since it doesn't output any logs like normal pictures.
            // 2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\Users\Tea\Pictures\VRChat\2023-02\VRChat_2023-02-08_12-31-35.104_1920x1080.png
            if (!line.Contains("[VRC Camera] Took screenshot to: "))
                return false;

            var lineOffset = line.LastIndexOf("] Took screenshot to: ");
            if (lineOffset < 0)
                return true;

            var screenshotPath = line.Substring(lineOffset + 22);
            AppendLog(new[] { fileInfo.Name, ConvertLogTimeToISO8601(line), "screenshot", screenshotPath });
            return true;
        }

        private bool ParseLogLocationDestination(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.09.02 00:02:12 Log        -  [Behaviour] Destination set: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:15609~private(usr_032383a7-748c-4fb2-94e4-bcb928e5de6b)~nonce(72CC87D420C1D49AEFFBEE8824C84B2DF0E38678E840661E)
            // 2021.09.02 00:49:15 Log        -  [Behaviour] Destination fetching: wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd
            // 2022.08.13 18:57:00 Log        -  [Behaviour] OnLeftRoom

            if (line.Contains("[Behaviour] OnLeftRoom"))
            {
                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "location-destination",
                    logContext.locationDestination
                });

                logContext.locationDestination = string.Empty;

                return true;
            }

            if (line.Contains("[Behaviour] Destination fetching: "))
            {
                var lineOffset = line.LastIndexOf("] Destination fetching: ");
                if (lineOffset < 0)
                    return true;
                lineOffset += 24;
                if (lineOffset >= line.Length)
                    return true;

                logContext.locationDestination = line.Substring(lineOffset);

                return true;
            }

            return false;
        }

        private bool ParseLogOnPlayerJoinedOrLeft(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2020.10.31 23:36:58 Log        -  [NetworkManager] OnPlayerJoined pypy
            // 2020.10.31 23:36:58 Log        -  [Player] Initialized PlayerAPI "pypy" is local
            // 2020.10.31 23:36:58 Log        -  [NetworkManager] OnPlayerJoined Rize♡
            // 2020.10.31 23:36:58 Log        -  [Player] Initialized PlayerAPI "Rize♡" is remote

            // 2020.11.01 00:07:01 Log        -  [NetworkManager] OnPlayerLeft Rize♡
            // 2020.11.01 00:07:01 Log        -  [PlayerManager] Removed player 2 / Rize♡
            // 2020.11.01 00:07:02 Log        -  [Player] Unregistering Rize♡

            // 2021.06.23 11:41:16 Log        -  [Behaviour] Initialized PlayerAPI "Natsumi-sama" is local

            // 2021.12.12 11:47:22 Log        -  [Behaviour] OnPlayerJoined Natsumi-sama
            // 2021.12.12 11:47:22 Log        -  [Behaviour] OnPlayerJoined:Unnamed
            // 2021.12.12 11:53:14 Log        -  [Behaviour] OnPlayerLeftRoom

            if (line.Contains("[Behaviour] OnPlayerJoined") && !line.Contains("] OnPlayerJoined:"))
            {
                var lineOffset = line.LastIndexOf("] OnPlayerJoined");
                if (lineOffset < 0)
                    return true;
                lineOffset += 17;
                if (lineOffset > line.Length)
                    return true;

                var userDisplayName = line.Substring(lineOffset);

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "player-joined",
                    userDisplayName
                });

                return true;
            }

            if (line.Contains("[Behaviour] OnPlayerLeft") && !line.Contains("] OnPlayerLeftRoom") && !line.Contains("] OnPlayerLeft:"))
            {
                var lineOffset = line.LastIndexOf("] OnPlayerLeft");
                if (lineOffset < 0)
                    return true;
                lineOffset += 15;
                if (lineOffset > line.Length)
                    return true;

                var userDisplayName = line.Substring(lineOffset);

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "player-left",
                    userDisplayName
                });

                return true;
            }

            return false;
        }

        private bool ParseLogPortalSpawn(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.06 11:25:45 Log        -  [Network Processing] RPC invoked ConfigurePortal on (Clone [1600004] Portals/PortalInternalDynamic) for Natsumi-sama
            // 2021.07.19 04:24:28 Log        -  [Behaviour] Will execute SendRPC/AlwaysBufferOne on (Clone [100004] Portals/PortalInternalDynamic) (UnityEngine.GameObject) for Natsumi-sama: S: "ConfigurePortal" I: 7 F: 0 B: 255 (local master owner)
            // 2022.07.29 18:40:37 Log        -  [Behaviour] Instantiated a (Clone [800004] Portals/PortalInternalDynamic)
            // 2023 - deadge

            if (line.Contains("[Behaviour] Instantiated a (Clone [") && line.Contains("] Portals/PortalInternalDynamic)"))
            {
                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "portal-spawn"
                });
                return true;
            }

            return false;
        }

        private bool ParseLogShaderKeywordsLimit(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.04 12:21:06 Error      -  Maximum number (256) of shader keywords exceeded, keyword _TOGGLESIMPLEBLUR_ON will be ignored.
            // 2021.08.20 04:20:69 Error      -  Maximum number (384) of shader global keywords exceeded, keyword _FOG_EXP2 will be ignored.

            if (line.Contains("Maximum number (384) of shader global keywords exceeded"))
            {
                if (logContext.ShaderKeywordsLimitReached)
                    return true;

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "event",
                    "Shader Keyword Limit has been reached"
                });
                logContext.ShaderKeywordsLimitReached = true;

                return true;
            }

            return false;
        }

        private bool ParseLogJoinBlocked(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.07 09:34:37 Error      -  [Behaviour] Master is not sending any events! Moving to a new instance.

            if (!line.Contains("] Master is not sending any events! Moving to a new instance."))
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                "Joining instance blocked by master"
            });

            return true;
        }

        private bool ParseLogAvatarPedestalChange(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.05.07 10:48:19 Log        -  [Network Processing] RPC invoked SwitchAvatar on AvatarPedestal for User

            if (string.Compare(line, offset, "[Network Processing] RPC invoked SwitchAvatar on AvatarPedestal for ", 0, 68, StringComparison.Ordinal) != 0)
                return false;

            var data = line.Substring(offset + 68);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                $"{data} changed avatar pedestal"
            });

            return true;
        }

        private bool ParseLogVideoError(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.08 06:37:45 Error -  [Video Playback] ERROR: Video unavailable
            // 2021.04.08 06:40:07 Error -  [Video Playback] ERROR: Private video

            if (string.Compare(line, offset, "[Video Playback] ERROR: ", 0, 24, StringComparison.Ordinal) != 0)
                return false;

            var data = line.Substring(offset + 24);
            if (data == logContext.LastVideoError)
                return true;
            logContext.LastVideoError = data;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                "VideoError: " + data
            });

            return true;
        }

        private bool ParseLogWorldVRCX(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // [VRCX] VideoPlay(PyPyDance) "https://jd.pypy.moe/api/v1/videos/-Q3pdlsQxOk.mp4",0.5338666,260.6938,"1339 : Le Freak (Random)"

            if (string.Compare(line, offset, "[VRCX] ", 0, 7, StringComparison.Ordinal) != 0)
                return false;

            var data = line.Substring(offset + 7);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "vrcx",
                data
            });

            return true;
        }

        private bool ParseLogWorldDataVRCX(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // [VRCX-World] store:test:testvalue

            if (string.Compare(line, offset, "[VRCX-World] ", 0, 13, StringComparison.Ordinal) != 0)
                return false;

            var data = line.Substring(offset + 13);

            WorldDBManager.Instance.ProcessLogWorldDataRequest(data);
            return true;
        }

        private bool ParseLogVideoChange(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.20 13:37:69 Log        -  [Video Playback] Attempting to resolve URL 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

            if (string.Compare(line, offset, "[Video Playback] Attempting to resolve URL '", 0, 44, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf("'");
            if (pos < 0)
                return false;

            var data = line.Substring(offset + 44);
            data = data.Remove(data.Length - 1);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "video-play",
                data
            });

            return true;
        }

        private bool ParseLogAVProVideoChange(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.05.12 15:53:48 Log        -  [Video Playback] Resolving URL 'rtspt://topaz.chat/live/kiriri520'

            if (string.Compare(line, offset, "[Video Playback] Resolving URL '", 0, 32, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf("'");
            if (pos < 0)
                return false;

            var data = line.Substring(offset + 32);
            data = data.Remove(data.Length - 1);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "video-play",
                data
            });

            return true;
        }

        private bool ParseLogSDK2VideoPlay(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.04.23 13:12:25 Log        -  User Natsumi-sama added URL https://www.youtube.com/watch?v=dQw4w9WgXcQ

            if (string.Compare(line, offset, "User ", 0, 5, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf(" added URL ");
            if (pos < 0)
                return false;

            var displayName = line.Substring(offset + 5, pos - (offset + 5));
            var data = line.Substring(pos + 11);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "video-play",
                data,
                displayName
            });

            return true;
        }

        private bool ParseLogUsharpVideoPlay(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.12.12 05:51:58 Log        -  [USharpVideo] Started video load for URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s, requested by ʜ ᴀ ᴘ ᴘ ʏ

            if (string.Compare(line, offset, "[USharpVideo] Started video load for URL: ", 0, 42, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf(", requested by ");
            if (pos < 0)
                return false;

            var data = line.Substring(offset + 42, pos - (offset + 42));
            var displayName = line.Substring(pos + 15);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "video-play",
                data,
                displayName
            });

            return true;
        }

        private bool ParseLogUsharpVideoSync(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2022.01.16 05:20:23 Log        -  [USharpVideo] Syncing video to 2.52

            if (string.Compare(line, offset, "[USharpVideo] Syncing video to ", 0, 31, StringComparison.Ordinal) != 0)
                return false;

            var data = line.Substring(offset + 31);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "video-sync",
                data
            });

            return true;
        }

        private bool ParseLogNotification(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.01.03 05:48:58 Log        -  [API] Received Notification: < Notification from username:pypy, sender user id:usr_4f76a584-9d4b-46f6-8209-8305eb683661 to of type: friendRequest, id: not_3a8f66eb-613c-4351-bee3-9980e6b5652c, created at: 01/14/2021 15:38:40 UTC, details: {{}}, type:friendRequest, m seen:False, message: ""> received at 01/02/2021 16:48:58 UTC

            if (string.Compare(line, offset, "[API] Received Notification: <", 0, 30, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf("> received at ");
            if (pos < 0)
                return false;

            var data = line.Substring(offset + 30, pos - (offset + 30));

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "notification",
                data
            });

            return true;
        }

        private bool ParseLogAPIRequest(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2021.10.03 09:49:50 Log        -  [API] [110] Sending Get request to https://api.vrchat.cloud/api/1/worlds?apiKey=JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26&organization=vrchat&userId=usr_032383a7-748c-4fb2-94e4-bcb928e5de6b&n=99&order=descending&offset=0&releaseStatus=public&maxUnityVersion=2019.4.31f1&minUnityVersion=5.5.0f1&maxAssetVersion=4&minAssetVersion=0&platform=standalonewindows
            // 2021.10.03 09:48:43 Log        -  [API] [101] Sending Get request to https://api.vrchat.cloud/api/1/users/usr_032383a7-748c-4fb2-94e4-bcb928e5de6b?apiKey=JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26&organization=vrchat

            if (string.Compare(line, offset, "[API] [", 0, 7, StringComparison.Ordinal) != 0)
                return false;

            var pos = line.LastIndexOf("] Sending Get request to ");
            if (pos < 0)
                return false;

            var data = line.Substring(pos + 25);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "api-request",
                data
            });

            return true;
        }

        private bool ParseLogAvatarChange(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.11.05 14:45:57 Log        -  [Behaviour] Switching K․MOG to avatar MoeSera
            
            if (string.Compare(line, offset, "[Behaviour] Switching ", 0, 22, StringComparison.Ordinal) != 0)
                return false;
            
            var pos = line.LastIndexOf(" to avatar ");
            if (pos < 0)
                return false;
            
            var displayName = line.Substring(offset + 22, pos - (offset + 22));
            var avatarName = line.Substring(pos + 11);
            
            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "avatar-change",
                displayName,
                avatarName
            });
            
            return true;
        }

        // private bool ParseLogPhotonId(FileInfo fileInfo, LogContext logContext, string line, int offset)
        // {
        //     // 2021.11.02 02:21:41 Log        -  [Behaviour] Configuring remote player VRCPlayer[Remote] 22349737 1194
        //     // 2021.11.02 02:21:41 Log        -  [Behaviour] Initialized player Natsumi-sama
        //
        //     // 2021.11.10 08:10:28 Log        -  [Behaviour] Initialize Limb Avatar (UnityEngine.Animator) VRCPlayer[Remote] 78614426 59 (ǄǄǄǅǄǅǅǄǅǄǄǅǅǄǅǄǅǅǅǄǄǄǅǄǄǅǅǄǅǅǄǅǅǄǅǅǅǅǄǅǄǅǄǄǄǄǅ) False Loading
        //     // 2021.11.10 08:57:32 Log        -  [Behaviour] Initialize Limb Avatar (UnityEngine.Animator) VRCPlayer[Local] 59136629 1 (ǄǄǄǅǄǅǅǄǅǄǄǅǅǄǅǄǅǅǅǄǄǄǅǄǄǅǅǄǅǅǄǅǅǄǅǅǅǅǄǅǄǅǄǄǄǄǅ) True Loading
        //
        //     // 2022.03.05 11:29:16 Log        -  [Behaviour] Initialize ThreePoint Avatar (UnityEngine.Animator) VRCPlayer[Local] 50608765 1 (ǄǅǄǄǄǅǄǅǅǄǅǄǄǅǅǄǄǄǅǄǄǄǅǄǅǄǅǅǄǄǄǄǅǅǄǄǄǄǅǅǄǄǅǄǄǅǅ) True Custom
        //
        //     if (line.Contains("] Initialize ") && line.Contains(" Avatar (UnityEngine.Animator) VRCPlayer["))
        //     {
        //         var pos = -1;
        //
        //         if (line.Contains(" Avatar (UnityEngine.Animator) VRCPlayer[Remote] "))
        //         {
        //             pos = line.LastIndexOf(" Avatar (UnityEngine.Animator) VRCPlayer[Remote] ");
        //             pos += 49;
        //         }
        //
        //         if (line.Contains(" Avatar (UnityEngine.Animator) VRCPlayer[Local] "))
        //         {
        //             pos = line.LastIndexOf(" Avatar (UnityEngine.Animator) VRCPlayer[Local] ");
        //             pos += 48;
        //         }
        //
        //         if (pos < 0)
        //             return false;
        //
        //         if (!string.IsNullOrEmpty(logContext.onJoinPhotonDisplayName))
        //         {
        //             var endPos = line.LastIndexOf(" (");
        //             var photonId = line.Substring(pos + 9, endPos - (pos + 9));
        //
        //             AppendLog(new[]
        //             {
        //                 fileInfo.Name,
        //                 ConvertLogTimeToISO8601(line),
        //                 "photon-id",
        //                 logContext.onJoinPhotonDisplayName,
        //                 photonId
        //             });
        //             logContext.onJoinPhotonDisplayName = string.Empty;
        //
        //             return true;
        //         }
        //     }
        //
        //     if (line.Contains("[Behaviour] Initialized player "))
        //     {
        //         var pos = line.LastIndexOf("[Behaviour] Initialized player ");
        //         if (pos < 0)
        //             return false;
        //
        //         pos += 31;
        //         if (pos >= line.Length)
        //             return false;
        //         
        //         var displayName = line.Substring(pos, line.Length - pos);
        //         logContext.onJoinPhotonDisplayName = displayName;
        //         logContext.onJoinPhotonDisplayNameDate = ConvertLogTimeToISO8601(line);
        //
        //         return true;
        //     }
        //
        //     if (line.Contains("[Behaviour] Configuring remote player VRCPlayer[Remote] "))
        //     {
        //         if (string.IsNullOrEmpty(logContext.onJoinPhotonDisplayName) || 
        //             logContext.onJoinPhotonDisplayNameDate != ConvertLogTimeToISO8601(line))
        //             return false;
        //
        //         var pos = line.LastIndexOf("[Behaviour] Configuring remote player VRCPlayer[Remote] ");
        //         if (pos < 0)
        //             return false;
        //
        //         pos += 56;
        //         var startPos = pos + 9;
        //         var length = line.Length - startPos;
        //         var photonId = line.Substring(startPos, length);
        //
        //         AppendLog(new[]
        //         {
        //             fileInfo.Name,
        //             ConvertLogTimeToISO8601(line),
        //             "photon-id",
        //             logContext.onJoinPhotonDisplayName,
        //             photonId
        //         });
        //         logContext.onJoinPhotonDisplayName = string.Empty;
        //         logContext.onJoinPhotonDisplayNameDate = string.Empty;
        //
        //         return true;
        //     }
        //
        //     return false;
        // }

        private bool ParseLogOnAudioConfigurationChanged(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2022.03.15 03:40:34 Log        -  [Always] uSpeak: SetInputDevice 0 (3 total) 'Index HMD Mic (Valve VR Radio & HMD Mic)'
            // 2022.03.15 04:02:22 Log        -  [Always] uSpeak: OnAudioConfigurationChanged - devicesChanged = True, resetting mic..
            // 2022.03.15 04:02:22 Log        -  [Always] uSpeak: SetInputDevice by name 'Index HMD Mic (Valve VR Radio & HMD Mic)' (3 total)

            if (line.Contains("[Always] uSpeak: OnAudioConfigurationChanged"))
            {
                logContext.AudioDeviceChanged = true;
                return true;
            }

            if (line.Contains("[Always] uSpeak: SetInputDevice 0"))
            {
                var lineOffset = line.LastIndexOf(") '");
                if (lineOffset < 0)
                    return true;
                lineOffset += 3;
                var endPos = line.Length - 1;
                var audioDevice = line.Substring(lineOffset, endPos - lineOffset);
                if (string.IsNullOrEmpty(logContext.LastAudioDevice))
                {
                    logContext.AudioDeviceChanged = false;
                    logContext.LastAudioDevice = audioDevice;
                    return true;
                }

                if (!logContext.AudioDeviceChanged || logContext.LastAudioDevice == audioDevice)
                    return true;

                AppendLog(new[]
                {
                    fileInfo.Name,
                    ConvertLogTimeToISO8601(line),
                    "event",
                    $"Audio device changed, mic set to '{audioDevice}'"
                });

                logContext.LastAudioDevice = audioDevice;
                logContext.AudioDeviceChanged = false;

                return true;
            }

            return false;
        }

        private bool ParseLogUdonException(FileInfo fileInfo, string line)
        {
            // 2022.11.29 04:27:33 Error      -  [UdonBehaviour] An exception occurred during Udon execution, this UdonBehaviour will be halted.
            // VRC.Udon.VM.UdonVMException: An exception occurred in an UdonVM, execution will be halted. --->VRC.Udon.VM.UdonVMException: An exception occurred during EXTERN to 'VRCSDKBaseVRCPlayerApi.__get_displayName__SystemString'. --->System.NullReferenceException: Object reference not set to an instance of an object.
            var lineOffset = line.IndexOf(" ---> VRC.Udon.VM.UdonVMException: ");
            if (lineOffset < 0)
                return false;

            var data = line.Substring(lineOffset);

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "udon-exception",
                data
            });

            return true;
        }

        private bool ParseApplicationQuit(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2022.06.12 01:51:46 Log        -  VRCApplication: OnApplicationQuit at 1603.499

            if (string.Compare(line, offset, "VRCApplication: OnApplicationQuit at ", 0, 37, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "vrc-quit"
            });

            VrcClosedGracefully = true;

            return true;
        }

        private bool ParseOpenVRInit(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2022.07.29 02:52:14 Log        -  OpenVR initialized!

            // 2023.04.22 16:52:28 Log        -  Initializing VRSDK.
            // 2023.04.22 16:52:29 Log        -  StartVRSDK: Open VR Loader

            if (string.Compare(line, offset, "OpenVR initialized!", 0, 19, StringComparison.Ordinal) != 0 &&
                string.Compare(line, offset, "Initializing VRSDK.", 0, 19, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "openvr-init"
            });

            return true;
        }

        private bool ParseDesktopMode(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.04.22 16:54:18 Log        -  VR Disabled

            if (string.Compare(line, offset, "VR Disabled", 0, 11, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "desktop-mode"
            });

            return true;
        }

        private bool ParseDesktopModeOld(FileInfo fileInfo, string line)
        {
            //    XR Device: None

            if (string.Compare(line, 0, "    XR Device: None", 0, 19, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "desktop-mode"
            });

            return true;
        }

        private bool ParseLogStringDownload(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.03.23 11:37:21 Log        -  [String Download] Attempting to load String from URL 'https://pastebin.com/raw/BaW6NL2L'
            var check = "] Attempting to load String from URL '";
            if (!line.Contains(check))
                return false;

            var lineOffset = line.LastIndexOf(check);
            if (lineOffset < 0)
                return true;

            var stringData = line.Substring(lineOffset + check.Length);
            stringData = stringData.Remove(stringData.Length - 1);

            if (stringData.StartsWith("http://127.0.0.1:22500") || stringData.StartsWith("http://localhost:22500"))
                return true; // ignore own requests
            
            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "resource-load-string",
                stringData
            });
            return true;
        }

        private bool ParseLogImageDownload(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.03.23 11:32:25 Log        -  [Image Download] Attempting to load image from URL 'https://i.imgur.com/lCfUMX0.jpeg'
            var check = "] Attempting to load image from URL '";
            if (!line.Contains(check))
                return false;

            var lineOffset = line.LastIndexOf(check);
            if (lineOffset < 0)
                return true;

            var imageData = line.Substring(lineOffset + check.Length);
            imageData = imageData.Remove(imageData.Length - 1);
            
            if (imageData.StartsWith("http://127.0.0.1:22500") || imageData.StartsWith("http://localhost:22500"))
                return true; // ignore own requests
            
            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "resource-load-image",
                imageData
            });
            return true;
        }
        
        private bool ParseVoteKick(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.06.02 01:08:04 Log        -  [Behaviour] Received executive message: You have been kicked from the instance by majority vote
            // 2023.06.02 01:11:58 Log        -  [Behaviour] You have been kicked from this world for an hour.

            if (string.Compare(line, offset, "[Behaviour] Received executive message: ", 0, 40, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                line.Substring(offset + 40)
            });
            return true;
        }
        
        private bool ParseFailedToJoin(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.09.01 10:42:19 Warning    -  [Behaviour] Failed to join instance 'wrld_78eb6b52-fd5a-4954-ba28-972c92c8cc77:82384~hidden(usr_a9bf892d-b447-47ce-a572-20c83dbfffd8)~region(eu)' due to 'That instance is using an outdated version of VRChat. You won't be able to join them until they update!'

            if (string.Compare(line, offset, "[Behaviour] Failed to join instance ", 0, 36, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                line.Substring(offset + 12)
            });
            return true;
        }

        private bool ParseOscFailedToStart(FileInfo fileInfo, LogContext logContext, string line, int offset)
        {
            // 2023.09.26 04:12:57 Warning    -  Could not Start OSC: Address already in use
            
            if (string.Compare(line, offset, "Could not Start OSC: ", 0, 21, StringComparison.Ordinal) != 0)
                return false;

            AppendLog(new[]
            {
                fileInfo.Name,
                ConvertLogTimeToISO8601(line),
                "event",
                $"VRChat could not start OSC server, You may be affected by (https://vrchat.canny.io/bug-reports/p/installexe-breaks-osc-port-binding) \"{line.Substring(offset)}\""
            });
            return true;
        }

        public string[][] Get()
        {
            Update();

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

        private class LogContext
        {
            public bool AudioDeviceChanged;
            public string LastAudioDevice;
            public string LastVideoError;
            public long Length;
            public string locationDestination;
            public long Position;
            public string RecentWorldName;
            public bool ShaderKeywordsLimitReached;
        }
    }
}