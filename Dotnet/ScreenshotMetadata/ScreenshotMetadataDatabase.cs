using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace VRCX
{
    public class MetadataCache
    {
        public int Id { get; set; }
        public string FilePath { get; set; }
        public string? Metadata { get; set; }
        public DateTimeOffset CachedAt { get; set; }
    }

    // Imagine using SQLite to store json strings in one table lmao
    // Couldn't be me... oh wait
    internal class ScreenshotMetadataDatabase
    {
        private readonly SQLiteConnection _sqlite;

        public ScreenshotMetadataDatabase(string databaseLocation)
        {
            _sqlite = new SQLiteConnection($"Data Source=\"{databaseLocation}\";Version=3;PRAGMA locking_mode=NORMAL;PRAGMA busy_timeout=5000;PRAGMA journal_mode=WAL;PRAGMA optimize=0x10002;", true);
            _sqlite.Open();
            using var cmd = new SQLiteCommand(_sqlite);
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS cache (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    file_path TEXT NOT NULL UNIQUE,
                                    metadata TEXT,
                                    cached_at INTEGER NOT NULL
                                );";
            cmd.ExecuteNonQuery();
        }

        public void AddMetadataCache(string filePath, string metadata)
        {
            // old table schema didn't have filePath as unique
            var isFileCached = IsFileCached(filePath);
            if (isFileCached != -1)
                return;
            
            var cache = new MetadataCache()
            {
                FilePath = filePath,
                Metadata = metadata,
                CachedAt = DateTimeOffset.Now
            };
            const string sql = "INSERT OR REPLACE INTO cache (file_path, metadata, cached_at) VALUES (@FilePath, @Metadata, @CachedAt);";
            using var command = new SQLiteCommand(sql, _sqlite);
            command.Parameters.AddWithValue("@FilePath", cache.FilePath);
            command.Parameters.AddWithValue("@Metadata", cache.Metadata);
            command.Parameters.AddWithValue("@CachedAt", cache.CachedAt.Ticks);
            command.ExecuteNonQuery();
        }

        public void BulkAddMetadataCache(IEnumerable<MetadataCache> cache)
        {
            using var transaction = _sqlite.BeginTransaction();
            using var command = new SQLiteCommand(_sqlite);
            const string sql = "INSERT OR REPLACE INTO cache (file_path, metadata, cached_at) VALUES (@FilePath, @Metadata, @CachedAt);";
            command.CommandText = sql;
            var filePathParam = command.Parameters.Add("@FilePath", System.Data.DbType.String);
            var metadataParam = command.Parameters.Add("@Metadata", System.Data.DbType.String);
            var cachedAtParam = command.Parameters.Add("@CachedAt", System.Data.DbType.Int64);
            foreach (var item in cache)
            {
                var isFileCached = IsFileCached(item.FilePath);
                if (isFileCached != -1)
                    continue;
                
                filePathParam.Value = item.FilePath;
                metadataParam.Value = item.Metadata;
                cachedAtParam.Value = item.CachedAt.Ticks;
                command.ExecuteNonQuery();
            }
            transaction.Commit();
        }

        public int IsFileCached(string filePath)
        {
            const string sql = "SELECT id FROM cache WHERE file_path = @FilePath;";
            using var command = new SQLiteCommand(sql, _sqlite);
            command.Parameters.AddWithValue("@FilePath", filePath);
            using var reader = command.ExecuteReader();
            var result = new List<int>();
            while (reader.Read())
            {
                result.Add(reader.GetInt32(0));
            }
            if (result.Count > 0)
            {
                return result[0];
            }
            return -1;
        }

        public string? GetMetadata(string filePath)
        {
            const string sql = "SELECT id, file_path, metadata, cached_at FROM cache WHERE file_path = @FilePath;";
            using var command = new SQLiteCommand(sql, _sqlite);
            command.Parameters.AddWithValue("@FilePath", filePath);
            using var reader = command.ExecuteReader();
            var result = new List<MetadataCache>();
            while (reader.Read())
            {
                result.Add(new MetadataCache()
                {
                    Id = reader.GetInt32(0),
                    FilePath = reader.GetString(1),
                    Metadata = reader.IsDBNull(2) ? null : reader.GetString(2),
                    CachedAt = new DateTime(reader.GetInt64(3))
                });
            }
            if (result.Count > 0)
            {
                return result[0].Metadata;
            }
            return null;
        }

        public string? GetMetadataById(int id)
        {
            const string sql = "SELECT id, file_path, metadata, cached_at FROM cache WHERE id = @Id;";
            using var command = new SQLiteCommand(sql, _sqlite);
            command.Parameters.AddWithValue("@Id", id);
            using var reader = command.ExecuteReader();
            var result = new List<MetadataCache>();
            while (reader.Read())
            {
                result.Add(new MetadataCache()
                {
                    Id = reader.GetInt32(0),
                    FilePath = reader.GetString(1),
                    Metadata = reader.IsDBNull(2) ? null : reader.GetString(2),
                    CachedAt = new DateTime(reader.GetInt64(3))
                });
            }
            if (result.Count > 0)
            {
                return result[0].Metadata;
            }
            return null;
        }

        public void Close()
        {
            _sqlite.Close();
        }
    }
}
