using CefSharp;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Threading;

namespace VRCX
{
    // I don't want to deal with refactoring everything that uses SQLite right now so we're just going to create a new class for this and worry about replacing it later
    public class SQLiteWorld
    {
        private readonly ReaderWriterLockSlim m_ConnectionLock;
        private readonly SQLiteConnection m_Connection;

        public SQLiteWorld(string databaseLocation)
        {
            m_ConnectionLock = new ReaderWriterLockSlim();

            SQLiteConnectionStringBuilder connectionStringBuilder = new SQLiteConnectionStringBuilder
            {
                DataSource = databaseLocation,
                Version = 3,
                DefaultTimeout = 5000,
                BusyTimeout = 5000,
            };
            m_Connection = new SQLiteConnection(connectionStringBuilder.ToString());
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

        public void Execute(IJavascriptCallback callback, string sql, IDictionary<string, object> args = null)
        {
            try
            {
                m_ConnectionLock.EnterReadLock();
                try
                {
                    using (SQLiteCommand command = new SQLiteCommand(sql, m_Connection))
                    {
                        if (args != null)
                        {
                            foreach (KeyValuePair<string, object> arg in args)
                            {
                                _ = command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                            }
                        }
                        using (SQLiteDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                object[] values = new object[reader.FieldCount];
                                _ = reader.GetValues(values);
                                if (callback.CanExecute)
                                {
                                    _ = callback.ExecuteAsync(null, values);
                                }
                            }
                        }
                    }
                    if (callback.CanExecute)
                    {
                        _ = callback.ExecuteAsync(null, null);
                    }
                }
                finally
                {
                    m_ConnectionLock.ExitReadLock();
                }
            }
            catch (Exception e)
            {
                if (callback.CanExecute)
                {
                    _ = callback.ExecuteAsync(e.Message, null);
                }
            }
            finally
            {
                callback.Dispose();
            }
        }

        public void Execute(Action<object[]> callback, string sql, IDictionary<string, object> args = null)
        {
            m_ConnectionLock.EnterReadLock();
            try
            {
                using (SQLiteCommand command = new SQLiteCommand(sql, m_Connection))
                {
                    if (args != null)
                    {
                        foreach (KeyValuePair<string, object> arg in args)
                        {
                            _ = command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                        }
                    }
                    using (SQLiteDataReader reader = command.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            while (reader.Read())
                            {
                                object[] values = new object[reader.FieldCount];
                                _ = reader.GetValues(values);
                                callback(values);
                            }
                        }
                        else
                        {
                            callback(new object[0]);
                        }
                    }
                }
            }
            catch
            {
                // We really need to stop swallowing exceptions... eventually.
            }
            finally
            {
                m_ConnectionLock.ExitReadLock();
            }
        }

        public int ExecuteNonQuery(string sql, IDictionary<string, object> args = null)
        {
            int result = -1;

            m_ConnectionLock.EnterWriteLock();
            try
            {
                using (SQLiteCommand command = new SQLiteCommand(sql, m_Connection))
                {
                    if (args != null)
                    {
                        foreach (KeyValuePair<string, object> arg in args)
                        {
                            _ = command.Parameters.Add(new SQLiteParameter(arg.Key, arg.Value));
                        }
                    }
                    result = command.ExecuteNonQuery();
                }
            }
            finally
            {
                m_ConnectionLock.ExitWriteLock();
            }

            return result;
        }
    }
}
