// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using DiscordRPC;

namespace VRCX
{
    public class Discord
    {
        private static RichPresence m_Presence = new RichPresence();
        private static DiscordRpcClient m_Client;
        private static bool m_Active;

        public static void Update()
        {
            if (m_Client != null)
            {
                m_Client.Invoke();
            }
            if (m_Active)
            {
                if (m_Client == null)
                {
                    m_Client = new DiscordRpcClient("525953831020920832");
                    m_Client.Initialize();
                }
                lock (m_Presence)
                {
                    m_Client.SetPresence(m_Presence);
                }
            }
            else if (m_Client != null)
            {
                m_Client.Dispose();
                m_Client = null;
            }
        }

        public void SetActive(bool active)
        {
            m_Active = active;
        }

        public void SetText(string details, string state)
        {
            lock (m_Presence)
            {
                m_Presence.Details = details;
                m_Presence.State = state;
            }
        }

        public void SetAssets(string largeKey, string largeText, string smallKey, string smallText)
        {
            lock (m_Presence)
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
        }

        // JSB Sucks
        public void SetTimestamps(double startUnixMilliseconds, double endUnixMilliseconds)
        {
            SetTimestamps((ulong)startUnixMilliseconds, (ulong)endUnixMilliseconds);
        }

        public static void SetTimestamps(ulong startUnixMilliseconds, ulong endUnixMilliseconds)
        {
            lock (m_Presence)
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
        }
    }
}