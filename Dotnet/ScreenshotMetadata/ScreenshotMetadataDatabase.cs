using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SQLite;

namespace VRCX
{
    [Table("cache")]
    public class MetadataCache
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }
        [Column("file_path"), NotNull, Indexed]
        public string FilePath { get; set; }
        [Column("metadata")]
        public string Metadata { get; set; }
        [Column("cached_at"), NotNull]
        public DateTimeOffset CachedAt { get; set; }
    }

    // Imagine using SQLite to store json strings in one table lmao
    // Couldn't be me... oh wait
    internal class ScreenshotMetadataDatabase
    {
        private SQLiteConnection sqlite;

        public ScreenshotMetadataDatabase(string databaseLocation)
        {
            var options = new SQLiteConnectionString(databaseLocation, true);
            sqlite = new SQLiteConnection(options);

            sqlite.CreateTable<MetadataCache>();
        }

        public void AddMetadataCache(string filePath, string metadata)
        {
            var cache = new MetadataCache()
            {
                FilePath = filePath,
                Metadata = metadata,
                CachedAt = DateTimeOffset.Now
            };
            sqlite.Insert(cache);
        }

        public void BulkAddMetadataCache(IEnumerable<MetadataCache> cache)
        {
            sqlite.InsertAll(cache, runInTransaction: true);
        }

        public int IsFileCached(string filePath)
        {
            var query = sqlite.Table<MetadataCache>().Where(c => c.FilePath == filePath).Select(c => c.Id);

            if (query.Any())
            {
                return query.First();
            }
            else
            {
                return -1;
            }
        }

        public string GetMetadata(string filePath)
        {
            var query = sqlite.Table<MetadataCache>().Where(c => c.FilePath == filePath).Select(c => c.Metadata);
            return query.FirstOrDefault();
        }

        public string GetMetadataById(int id)
        {
            var query = sqlite.Table<MetadataCache>().Where(c => c.Id == id).Select(c => c.Metadata);
            return query.FirstOrDefault();
        }

        public void Close()
        {
            sqlite.Close();
        }
    }
}
