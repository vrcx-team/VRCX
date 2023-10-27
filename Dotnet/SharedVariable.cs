// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Collections.Generic;
using System.Threading;

namespace VRCX
{
    public class SharedVariable
    {
        public static readonly SharedVariable Instance;
        private readonly ReaderWriterLockSlim m_MapLock;
        private readonly Dictionary<string, string> m_Map;

        static SharedVariable()
        {
            Instance = new SharedVariable();
        }

        public SharedVariable()
        {
            m_MapLock = new ReaderWriterLockSlim();
            m_Map = new Dictionary<string, string>();
        }

        public void Clear()
        {
            m_MapLock.EnterWriteLock();
            try
            {
                m_Map.Clear();
            }
            finally
            {
                m_MapLock.ExitWriteLock();
            }
        }

        public string Get(string key)
        {
            m_MapLock.EnterReadLock();
            try
            {
                if (m_Map.TryGetValue(key, out string value) == true)
                {
                    return value;
                }
            }
            finally
            {
                m_MapLock.ExitReadLock();
            }

            return null;
        }

        public void Set(string key, string value)
        {
            m_MapLock.EnterWriteLock();
            try
            {
                m_Map[key] = value;
            }
            finally
            {
                m_MapLock.ExitWriteLock();
            }
        }

        public bool Remove(string key)
        {
            m_MapLock.EnterWriteLock();
            try
            {
                return m_Map.Remove(key);
            }
            finally
            {
                m_MapLock.ExitWriteLock();
            }
        }
    }
}
