using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Text.Json.Nodes;
using System.Threading;
using System.Text.Json;

namespace VRCX
{
    public class SQLite
    {
        public static SQLite Instance;
        private readonly ReaderWriterLockSlim m_ConnectionLock;
        private SQLiteConnection m_Connection;

        static SQLite()
        {
            Instance = new SQLite();
        }

        public SQLite()
        {
            m_ConnectionLock = new ReaderWriterLockSlim();
        }

        public void Init()
        {
#if LINUX
            Instance = this;
#endif
            var dataSource = Program.ConfigLocation;
            var jsonDataSource = VRCXStorage.Instance.Get("VRCX_DatabaseLocation");
            if (!string.IsNullOrEmpty(jsonDataSource))
                dataSource = jsonDataSource;

            m_Connection = new SQLiteConnection($"Data Source=\"{dataSource}\";Version=3;PRAGMA locking_mode=NORMAL;PRAGMA busy_timeout=5000;PRAGMA journal_mode=WAL;PRAGMA optimize=0x10002;", true);

            m_Connection.Open();
        }

        public void Exit()
        {
            m_Connection.Close();
            m_Connection.Dispose();
        }

        // for Electron
        public string ExecuteJson(string sql, IDictionary<string, object>? args = null)
        {
            var result = Execute(sql, args);
            return JsonSerializer.Serialize(result);
        }

        public object[][] Execute(string sql, IDictionary<string, object>? args = null)
        {
            m_ConnectionLock.EnterReadLock();
            try
            {
                using var command = new SQLiteCommand(sql, m_Connection);
                if (args != null)
                {
                    foreach (var arg in args)
                    {
                        command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                    }
                }

                using var reader = command.ExecuteReader();
                var result = new List<object[]>();
                while (reader.Read())
                {
                    var values = new object[reader.FieldCount];
                    for (var i = 0; i < reader.FieldCount; i++)
                    {
                        values[i] = reader.GetValue(i);
                    }
                    result.Add(values);
                }
                return result.ToArray();
            }
            finally
            {
                m_ConnectionLock.ExitReadLock();
            }
        }

        public int ExecuteNonQuery(string sql, IDictionary<string, object>? args = null)
        {
            var result = -1;
            m_ConnectionLock.EnterWriteLock();
            try
            {
                using var command = new SQLiteCommand(sql, m_Connection);
                if (args != null)
                {
                    foreach (var arg in args)
                    {
                        command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                    }
                }
                result = command.ExecuteNonQuery();
            }
            finally
            {
                m_ConnectionLock.ExitWriteLock();
            }

            return result;
        }
    }
}
