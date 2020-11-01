using CefSharp;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace VRCX
{
    public class SQLite
    {
        public static SQLite Instance { get; private set; }
        private readonly ReaderWriterLockSlim m_ConnectionLock;
        private readonly SQLiteConnection m_Connection;

        static SQLite()
        {
            Instance = new SQLite();
        }

        public SQLite()
        {
            m_ConnectionLock = new ReaderWriterLockSlim();

            var dataSource = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "VRCX.sqlite3");
            m_Connection = new SQLiteConnection($"Data Source=\"{dataSource}\";Version=3;PRAGMA locking_mode=NORMAL;PRAGMA busy_timeout=5000", true);
        }

        internal void Init()
        {
            m_Connection.Open();
        }

        internal void Exit()
        {
            m_Connection.Close();
            m_Connection.Dispose();
        }

        public int ExecuteNonQuery(string sql, IDictionary<string, object> args = null)
        {
            m_ConnectionLock.EnterWriteLock();
            try
            {
                using (var command = new SQLiteCommand(sql, m_Connection))
                {
                    if (args != null)
                    {
                        foreach (var arg in args)
                        {
                            command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                        }
                    }
                    return command.ExecuteNonQuery();
                }
            }
            finally
            {
                m_ConnectionLock.ExitWriteLock();
            }
        }

        public void Execute(IJavascriptCallback rowCallback, IJavascriptCallback doneCallback, string sql, IDictionary<string, object> args = null)
        {
            m_ConnectionLock.EnterReadLock();
            try
            {
                using (rowCallback)
                using (doneCallback)
                using (var command = new SQLiteCommand(sql, m_Connection))
                {
                    if (args != null)
                    {
                        foreach (var arg in args)
                        {
                            command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                        }
                    }
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read() == true)
                        {
                            var values = new object[reader.FieldCount];
                            reader.GetValues(values);
                            rowCallback.ExecuteAsync(values);
                        }
                        doneCallback.ExecuteAsync();
                    }
                }
            }
            finally
            {
                m_ConnectionLock.ExitReadLock();
            }
        }
    }
}