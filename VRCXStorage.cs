// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Collections.Generic;
using System.Windows.Forms;

namespace VRCX
{
    public class VRCXStorage
    {
        private static Dictionary<string, string> m_Storage = new Dictionary<string, string>();
        private static bool m_Dirty;

        public static void Load()
        {
            JsonSerializer.Deserialize(Application.StartupPath + "/VRCX.json", ref m_Storage);
        }

        public static void Save()
        {
            JsonSerializer.Serialize(Application.StartupPath + "/VRCX.json", m_Storage);
        }

        public void Clear()
        {
            lock (m_Storage)
            {
                m_Dirty = true;
                m_Storage.Clear();
            }
        }

        public void Flush()
        {
            lock (m_Storage)
            {
                if (m_Dirty)
                {
                    m_Dirty = false;
                    Save();
                }
            }
        }

        public bool Remove(string key)
        {
            lock (m_Storage)
            {
                m_Dirty = true;
                return m_Storage.Remove(key);
            }
        }

        public string Get(string key)
        {
            lock (m_Storage)
            {
                return m_Storage.TryGetValue(key, out string value)
                    ? value
                    : string.Empty;
            }
        }

        public void Set(string key, string value)
        {
            lock (m_Storage)
            {
                m_Dirty = true;
                m_Storage[key] = value;
            }
        }
    }
}