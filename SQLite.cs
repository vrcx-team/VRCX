using CefSharp;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.Threading;
using System.Windows.Forms;

namespace VRCX
{
    public class SQLite
    {
        public static SQLite Instance { get; private set; }
        private static readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
        private static SQLiteConnection m_Connection;

        static SQLite()
        {
            Instance = new SQLite();
        }

        public static void Init()
        {
            m_Connection = new SQLiteConnection($"Data Source={Application.StartupPath}/VRCX.sqlite;Version=3");
            m_Connection.Open();
        }

        public static void Exit()
        {
            m_Connection.Close();
            m_Connection.Dispose();
        }

        public int ExecuteNonQuery(string sql, IDictionary<string, object> param = null)
        {
            m_Lock.EnterWriteLock();
            try
            {
                using (var C = new SQLiteCommand(sql, m_Connection))
                {
                    if (param != null)
                    {
                        foreach (var prop in param)
                        {
                            C.Parameters.Add(new SQLiteParameter("@" + prop.Key, prop.Value));
                        }
                    }
                    return C.ExecuteNonQuery();
                }
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }

        public void Execute(IJavascriptCallback callback, string sql, IDictionary<string, object> param = null)
        {
            m_Lock.EnterReadLock();
            try
            {
                using (var C = new SQLiteCommand(sql, m_Connection))
                {
                    if (param != null)
                    {
                        foreach (var prop in param)
                        {
                            C.Parameters.Add(new SQLiteParameter("@" + prop.Key, prop.Value));
                        }
                    }
                    using (var R = C.ExecuteReader())
                    {
                        while (R.Read())
                        {
                            var row = new object[R.FieldCount];
                            R.GetValues(row);
                            callback.ExecuteAsync(row);
                        }
                    }
                }
            }
            finally
            {
                m_Lock.ExitReadLock();
            }
        }
    }
}