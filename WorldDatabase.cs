using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SQLite;

namespace VRCX
{
    [Table("data")]
    public class WorldData
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }
        [Column("world_id"), NotNull]
        public string WorldId { get; set; }
        [Column("key"), NotNull]
        public string Key { get; set; }
        [Column("value"), NotNull]
        public string Value { get; set; }
        [Column("last_accessed")]
        public DateTimeOffset LastAccessed { get; set; }
        [Column("last_modified")]
        public DateTimeOffset LastModified { get; set; }
    }

    [Table("worlds")]
    public class World
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }
        [PrimaryKey, Column("world_id"), NotNull]
        public string WorldId { get; set; }
        [Column("connection_key"), NotNull]
        public string ConnectionKey { get; set; }
        [Column("allow_external_read")]
        public bool AllowExternalRead { get; set; }
    }

    internal class WorldDatabase
    {
        private static SQLiteConnection sqlite;
        private readonly static string dbInitQuery = @"
CREATE TABLE IF NOT EXISTS worlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL UNIQUE,
    connection_key TEXT NOT NULL,
    allow_external_read INTEGER DEFAULT 0
);
\
CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    last_accessed INTEGER DEFAULT (strftime('%s', 'now')),
    last_modified INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (world_id) REFERENCES worlds(world_id) ON DELETE CASCADE,
    UNIQUE (world_id, key)
);
\
CREATE TRIGGER IF NOT EXISTS data_update_trigger
AFTER UPDATE ON data
FOR EACH ROW
BEGIN
    UPDATE data SET last_modified = (strftime('%s', 'now')) WHERE id = OLD.id;
END;
\
CREATE TRIGGER IF NOT EXISTS data_insert_trigger
AFTER INSERT ON data
FOR EACH ROW
BEGIN
    UPDATE data SET last_accessed = (strftime('%s', 'now')), last_modified = (strftime('%s', 'now')) WHERE id = NEW.id;
END;";
        public WorldDatabase(string databaseLocation)
        {
            var options = new SQLiteConnectionString(databaseLocation, true);
            sqlite = new SQLiteConnection(options);
            sqlite.Execute(dbInitQuery);

            // TODO: Split these init queries into their own functions so we can call/update them individually.
            var queries = dbInitQuery.Split('\\');
            sqlite.BeginTransaction();
            foreach (var query in queries)
            {
                sqlite.Execute(query);
            }
            sqlite.Commit();
        }

        /// <summary>
        /// Checks if a world with the specified ID exists in the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to check for.</param>
        /// <returns>True if the world exists in the database, false otherwise.</returns>
        public bool DoesWorldExist(string worldId)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId).Select(w => w.WorldId);

            return query.Any();
        }

        public string GetWorldConnectionKey(string worldId)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId).Select(w => w.ConnectionKey);

            return query.FirstOrDefault();
        }

        public string SetWorldConnectionKey(string worldId, string connectionKey)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId).Select(w => w.ConnectionKey);

            if (query.Any())
            {
                sqlite.Execute("UPDATE worlds SET connection_key = ? WHERE world_id = ?", connectionKey, worldId);
            }
            else
            {
                sqlite.Insert(new World() { WorldId = worldId, ConnectionKey = connectionKey });
            }

            return connectionKey;
        }

        /// <summary>
        /// Adds a new world to the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to add.</param>
        /// <param name="connectionKey">The connection key of the world to add.</param>
        public void AddWorld(string worldId, string connectionKey)
        {
            // * This will throw an error if the world already exists
            sqlite.Insert(new World() { WorldId = worldId, ConnectionKey = connectionKey });
        }

        public void AddDataEntry(string worldId, string key, string value)
        {
            sqlite.InsertOrReplace(new WorldData() { WorldId = worldId, Key = key, Value = value });
        }

        public WorldData GetDataEntry(string worldId, string key)
        {
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId && w.Key == key);

            return query.FirstOrDefault();
        }

        public void Close()
        {
            sqlite.Close();
        }
    }
}
