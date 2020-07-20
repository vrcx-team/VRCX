// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using DiscordRPC;
using System.Text;
using System.Threading;

namespace VRCX
{
    public class Discord
    {
        public static Discord Instance { get; private set; }
        private static readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
        private static readonly RichPresence m_Presence = new RichPresence();
        private static Thread m_Thread;
        private static bool m_Active;

        static Discord()
        {
            Instance = new Discord();
        }

        public static void Init()
        {
            m_Thread = new Thread(() =>
            {
                DiscordRpcClient client = null;
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
                    if (client != null)
                    {
                        m_Lock.EnterReadLock();
                        try
                        {
                            client.SetPresence(m_Presence);
                        }
                        finally
                        {
                            m_Lock.ExitReadLock();
                        }
                        client.Invoke();
                    }
                    if (m_Active)
                    {
                        if (client == null)
                        {
                            client = new DiscordRpcClient("525953831020920832");
                            if (!client.Initialize())
                            {
                                client.Dispose();
                                client = null;
                            }
                        }
                    }
                    else if (client != null)
                    {
                        client.Dispose();
                        client = null;
                    }
                }
                client?.Dispose();
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

        public void SetActive(bool active)
        {
            m_Active = active;
        }

        // https://stackoverflow.com/questions/1225052/best-way-to-shorten-utf8-string-based-on-byte-length
        private static string LimitByteLength(string str, int maxBytesLength)
        {
            var bytesArr = Encoding.UTF8.GetBytes(str);
            int bytesToRemove = 0;
            int lastIndexInString = str.Length - 1;
            while (bytesArr.Length - bytesToRemove > maxBytesLength)
            {
                bytesToRemove += Encoding.UTF8.GetByteCount(new char[] { str[lastIndexInString] });
                --lastIndexInString;
            }
            return Encoding.UTF8.GetString(bytesArr, 0, bytesArr.Length - bytesToRemove);
        }

        public void SetText(string details, string state)
        {
            m_Lock.EnterWriteLock();
            try
            {
                m_Presence.Details = LimitByteLength(details, 127);
                m_Presence.State = LimitByteLength(state, 127);
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }

        public void SetAssets(string largeKey, string largeText, string smallKey, string smallText)
        {
            m_Lock.EnterWriteLock();
            try
            {
                if (string.IsNullOrEmpty(largeKey) &&
                    string.IsNullOrEmpty(smallKey))
                {
                    m_Presence.Assets = null;
                }
                else
                {
                    if (m_Presence.Assets == null)
                    {
                        m_Presence.Assets = new Assets();
                    }
                    m_Presence.Assets.LargeImageKey = largeKey;
                    m_Presence.Assets.LargeImageText = largeText;
                    m_Presence.Assets.SmallImageKey = smallKey;
                    m_Presence.Assets.SmallImageText = smallText;
                }
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }

        // JSB Sucks
        public void SetTimestamps(double startUnixMilliseconds, double endUnixMilliseconds)
        {
            SetTimestamps((ulong)startUnixMilliseconds, (ulong)endUnixMilliseconds);
        }

        public static void SetTimestamps(ulong startUnixMilliseconds, ulong endUnixMilliseconds)
        {
            m_Lock.EnterWriteLock();
            try
            {
                if (startUnixMilliseconds == 0)
                {
                    m_Presence.Timestamps = null;
                }
                else
                {
                    if (m_Presence.Timestamps == null)
                    {
                        m_Presence.Timestamps = new Timestamps();
                    }
                    m_Presence.Timestamps.StartUnixMilliseconds = startUnixMilliseconds;
                    if (endUnixMilliseconds == 0)
                    {
                        m_Presence.Timestamps.End = null;
                    }
                    else
                    {
                        m_Presence.Timestamps.EndUnixMilliseconds = endUnixMilliseconds;
                    }
                }
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }
    }
}