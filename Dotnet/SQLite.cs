#nullable enable
using System;
using System.Collections.Generic;
using System.Threading;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace VRCX
{
    public class SQLite
    {
        public static SQLite Instance;
        private readonly ReaderWriterLockSlim _connectionLock;
        private SqliteConnection _connection;

        static SQLite()
        {
            Instance = new SQLite();
        }

        public SQLite()
        {
            _connectionLock = new ReaderWriterLockSlim();
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

            _connection = new SqliteConnection($"Data Source=\"{dataSource}\";Mode=ReadWriteCreate;Cache=Shared;");
            _connection.Open();
            using var command = _connection.CreateCommand();
            command.CommandText = @"PRAGMA locking_mode=NORMAL;
                                    PRAGMA busy_timeout=5000;
                                    PRAGMA journal_mode=WAL;
                                    PRAGMA optimize=0x10002;";
            command.ExecuteNonQuery();
        }

        public void Exit()
        {
            _connection.Close();
            _connection.Dispose();
        }
        
        // for Electron
        public string ExecuteJson(string sql, IDictionary<string, object>? args = null)
        {
            var result = Execute(sql, args);
            if (result.Item1 != null)
            {
                return JsonSerializer.Serialize(new
                {
                    status = "error",
                    message = result.Item1
                });
            }
            return JsonSerializer.Serialize(new
            {
                status = "success",
                data = result.Item2
            });
        }

        public Tuple<string?, object[][]?> Execute(string sql, IDictionary<string, object>? args = null)
        {
            _connectionLock.EnterReadLock();
            try
            {
                using var command = new SqliteCommand(sql, _connection);
                if (args != null)
                {
                    foreach (var arg in args)
                    {
                        command.Parameters.Add(new SqliteParameter(arg.Key, arg.Value));
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
                return new Tuple<string?, object[][]?>(null, result.ToArray());
            }
            catch (Exception ex)
            {
                return new Tuple<string?, object[][]?>(ex.Message, null);
            }
            finally
            {
                _connectionLock.ExitReadLock();
            }
        }

        public int ExecuteNonQuery(string sql, IDictionary<string, object>? args = null)
        {
            int result = -1;
            _connectionLock.EnterWriteLock();
            try
            {
                using var command = new SqliteCommand(sql, _connection);
                if (args != null)
                {
                    foreach (var arg in args)
                    {
                        command.Parameters.Add(new SqliteParameter(arg.Key, arg.Value));
                    }
                }
                result = command.ExecuteNonQuery();
            }
            finally
            {
                _connectionLock.ExitWriteLock();
            }

            return result;
        }
    }
}
