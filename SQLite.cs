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
        private static readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
        private static SQLiteConnection m_Connection;

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

        public void Execute(string sql, IDictionary<string, object> param = null)
        {
            m_Lock.EnterWriteLock();
            try
            {
                if (m_Connection.State != ConnectionState.Open)
                {
                    m_Connection.Close();
                    m_Connection.Open();
                }
                using (var C = new SQLiteCommand(sql, m_Connection))
                {
                    if (param != null)
                    {
                        foreach (var prop in param)
                        {
                            C.Parameters.Add(new SQLiteParameter("@" + prop.Key, prop.Value));
                        }
                    }
                    C.ExecuteNonQuery();
                }
            }
            finally
            {
                m_Lock.ExitWriteLock();
            }
        }

        public void ExecuteQuery(IJavascriptCallback callback, string sql, IDictionary<string, object> param = null)
        {
            m_Lock.EnterReadLock();
            try
            {
                if (m_Connection.State != ConnectionState.Open)
                {
                    m_Connection.Close();
                    m_Connection.Open();
                }
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