// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
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
        public static readonly Discord Instance;
        private readonly ReaderWriterLockSlim m_Lock;
        private readonly RichPresence m_Presence;
        private DiscordRpcClient m_Client;
        private readonly Timer m_Timer;
        private bool m_Active;
        public static string DiscordAppId;

        static Discord()
        {
            Instance = new Discord();
        }

        public Discord()
        {
            m_Lock = new ReaderWriterLockSlim();
            m_Presence = new RichPresence();
            m_Timer = new Timer(TimerCallback, null, -1, -1);
        }

        public void Init()
        {
            m_Timer.Change(0, 1000);
        }

        public void Exit()
        {
            lock (this)
            {
                m_Timer.Change(-1, -1);
                m_Client?.Dispose();
            }
        }

        private void TimerCallback(object state)
        {
            lock (this)
            {
                try
                {
                    Update();
                }
                catch
                {
                }
            }
        }

        private void Update()
        {
            if (m_Client == null && m_Active)
            {
                m_Client = new DiscordRpcClient(DiscordAppId);
                if (!m_Client.Initialize())
                {
                    m_Client.Dispose();
                    m_Client = null;
                }
            }

            if (m_Client != null && !m_Active)
            {
                m_Client.Dispose();
                m_Client = null;
            }

            if (m_Client != null && !m_Lock.IsWriteLockHeld)
            {
                m_Lock.EnterReadLock();
                try
                {
                    m_Client.SetPresence(m_Presence);
                }
                finally
                {
                    m_Lock.ExitReadLock();
                }
                m_Client.Invoke();
            }
        }

        public bool SetActive(bool active)
        {
            m_Active = active;
            return m_Active;
        }

        // https://stackoverflow.com/questions/1225052/best-way-to-shorten-utf8-string-based-on-byte-length
        private static string LimitByteLength(string str, int maxBytesLength)
        {
            if (str == null)
                return string.Empty;
            var bytesArr = Encoding.UTF8.GetBytes(str);
            var bytesToRemove = 0;
            var lastIndexInString = str.Length - 1;
            while (bytesArr.Length - bytesToRemove > maxBytesLength)
            {
                bytesToRemove += Encoding.UTF8.GetByteCount(new char[] { str[lastIndexInString] });
                --lastIndexInString;
            }
            return Encoding.UTF8.GetString(bytesArr, 0, bytesArr.Length - bytesToRemove);
        }

        public void SetText(string details, string state)
        {
            if (m_Client == null || m_Lock.IsReadLockHeld)
                return;
            
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

        public void SetAssets(string largeKey, string largeText, string smallKey, string smallText, string partyId, int partySize, int partyMax, string buttonText, string buttonUrl, string appId)
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
                    m_Presence.Assets ??= new Assets();
                    m_Presence.Party ??= new Party();
                    m_Presence.Assets.LargeImageKey = largeKey;
                    m_Presence.Assets.LargeImageText = largeText;
                    m_Presence.Assets.SmallImageKey = smallKey;
                    m_Presence.Assets.SmallImageText = smallText;
                    m_Presence.Party.ID = partyId;
                    m_Presence.Party.Size = partySize;
                    m_Presence.Party.Max = partyMax;
                    Button[] buttons = [];
                    if (!string.IsNullOrEmpty(buttonUrl))
                    {
                        buttons =
                        [
                            new Button { Label = buttonText, Url = buttonUrl }
                        ];
                    }
                    m_Presence.Buttons = buttons;
                    if (DiscordAppId != appId)
                    {
                        DiscordAppId = appId;
                        if (m_Client != null)
                        {
                            m_Client.Dispose();
                            m_Client = null;
                        }
                        Update();
                    }
                }
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }
        
        public void SetTimestamps(double startUnixMilliseconds, double endUnixMilliseconds)
        {
            var _startUnixMilliseconds = (ulong)startUnixMilliseconds;
            var _endUnixMilliseconds = (ulong)endUnixMilliseconds;

            m_Lock.EnterWriteLock();
            try
            {
                if (_startUnixMilliseconds == 0)
                {
                    m_Presence.Timestamps = null;
                }
                else
                {
                    m_Presence.Timestamps ??= new Timestamps();
                    m_Presence.Timestamps.StartUnixMilliseconds = _startUnixMilliseconds;

                    if (_endUnixMilliseconds == 0)
                    {
                        m_Presence.Timestamps.End = null;
                    }
                    else
                    {
                        m_Presence.Timestamps.EndUnixMilliseconds = _endUnixMilliseconds;
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