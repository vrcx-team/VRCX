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
        [Column("value_size"), NotNull]
        public int ValueSize { get; set; }
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
        [Column("world_id"), NotNull]
        public string WorldId { get; set; }
        [Column("connection_key"), NotNull]
        public string ConnectionKey { get; set; }
        [Column("total_data_size"), NotNull]
        public int TotalDataSize { get; set; }
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
    total_data_size INTEGER DEFAULT 0,
    allow_external_read INTEGER DEFAULT 0
);
\
CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    value_size INTEGER NOT NULL DEFAULT 0,
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

        /// <summary>
        /// Gets the ID of the world with the specified connection key from the database.
        /// </summary>
        /// <param name="connectionKey">The connection key of the world to get the ID for.</param>
        /// <returns>The ID of the world with the specified connection key, or null if no such world exists in the database.</returns>
        public string GetWorldByConnectionKey(string connectionKey)
        {
            var query = sqlite.Table<World>().Where(w => w.ConnectionKey == connectionKey).Select(w => w.WorldId);

            return query.FirstOrDefault();
        }

        /// <summary>
        /// Gets the connection key for a world from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the connection key for.</param>
        /// <returns>The connection key for the specified world, or null if the world does not exist in the database.</returns>
        public string GetWorldConnectionKey(string worldId)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId).Select(w => w.ConnectionKey);

            return query.FirstOrDefault();
        }

        /// <summary>
        /// Sets the connection key for a world in the database. If the world already exists in the database, the connection key is updated. Otherwise, a new world is added to the database with the specified connection key.
        /// </summary>
        /// <param name="worldId">The ID of the world to set the connection key for.</param>
        /// <param name="connectionKey">The connection key to set for the world.</param>
        /// <returns>The connection key that was set.</returns>
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
        /// Sets the value of the allow_external_read field for the world with the specified ID in the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to set the allow_external_read field for.</param>
        /// <param name="allowExternalRead">The value to set for the allow_external_read field.</param>
        public void SetWorldAllowExternalRead(string worldId, bool allowExternalRead)
        {
            sqlite.Execute("UPDATE worlds SET allow_external_read = ? WHERE world_id = ?", allowExternalRead, worldId);
        }

        /// <summary>
        /// Adds a new world to the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to add.</param>
        /// <param name="connectionKey">The connection key of the world to add.</param>
        /// <exception cref="SQLiteException">Thrown if a world with the specified ID already exists in the database.</exception>
        public void AddWorld(string worldId, string connectionKey)
        {
            // * This will throw an error if the world already exists.. so don't do that
            sqlite.Insert(new World() { WorldId = worldId, ConnectionKey = connectionKey });
        }

        /// <summary>
        /// Gets the world with the specified ID from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get.</param>
        /// <returns>The world with the specified ID, or null if no such world exists in the database.</returns>
        public World GetWorld(string worldId)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId);
            return query.FirstOrDefault();
        }

        /// <summary>
        /// Gets the total data size shared across all rows, in bytes, for the world with the specified ID from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the total data size for.</param>
        /// <returns>The total data size for the world, in bytes.</returns>
        public int GetWorldDataSize(string worldId)
        {
            var query = sqlite.Table<World>().Where(w => w.WorldId == worldId).Select(w => w.TotalDataSize);

            return query.FirstOrDefault();
        }

        /// <summary>
        /// Updates the total data size, in bytes for the world with the specified ID in the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to update the total data size for.</param>
        /// <param name="size">The new total data size for the world, in bytes.</param>
        public void UpdateWorldDataSize(string worldId, int size)
        {
            sqlite.Execute("UPDATE worlds SET total_data_size = ? WHERE world_id = ?", size, worldId);
        }

        /// <summary>
        /// Adds or updates a data entry in the database with the specified world ID, key, and value.
        /// </summary>
        /// <param name="worldId">The ID of the world to add the data entry for.</param>
        /// <param name="key">The key of the data entry to add or replace.</param>
        /// <param name="value">The value of the data entry to add or replace.</param>
        /// <param name="dataSize">The size of the data entry to add or replace, in bytes. If null, the size is calculated from the value automatically.</param>
        public void AddDataEntry(string worldId, string key, string value, int? dataSize = null)
        {
            int byteSize = dataSize ?? Encoding.UTF8.GetByteCount(value);

            // check if entry already exists; 
            // INSERT OR REPLACE(InsertOrReplace method) deletes the old row and creates a new one, incrementing the id, which I don't want
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId && w.Key == key);
            if (query.Any())
            {
                sqlite.Execute("UPDATE data SET value = ?, value_size = ? WHERE world_id = ? AND key = ?", value, byteSize, worldId, key);
            }
            else
            {
                sqlite.Insert(new WorldData() { WorldId = worldId, Key = key, Value = value, ValueSize = byteSize });
            }
        }

        /// <summary>
        /// Gets the data entry with the specified world ID and key from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the data entry for.</param>
        /// <param name="key">The key of the data entry to get.</param>
        /// <returns>The data entry with the specified world ID and key, or null if no such data entry exists in the database.</returns>
        public WorldData GetDataEntry(string worldId, string key)
        {
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId && w.Key == key);

            return query.FirstOrDefault();
        }

        /// <summary>
        /// Gets the data entries with the specified world ID and keys from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the data entries for.</param>
        /// <param name="keys">The keys of the data entries to get.</param>
        /// <returns>An enumerable collection of the data entries with the specified world ID and keys.</returns>
        public IEnumerable<WorldData> GetDataEntries(string worldId, string[] keys)
        {
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId && keys.Contains(w.Key));

            return query.ToList();
        }

        /// <summary>
        /// Gets all data entries for the world with the specified ID from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the data entries for.</param>
        /// <returns>An enumerable collection of all data entries for the world with the specified ID.</returns>
        public IEnumerable<WorldData> GetAllDataEntries(string worldId)
        {
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId);
            return query.ToList();
        }

        /// <summary>
        /// Gets the size of the data entry, in bytes, with the specified world ID and key from the database.
        /// </summary>
        /// <param name="worldId">The ID of the world to get the data entry size for.</param>
        /// <param name="key">The key of the data entry to get the size for.</param>
        /// <returns>The size of the data entry with the specified world ID and key, or 0 if no such data entry exists in the database.</returns>
        public int GetDataEntrySize(string worldId, string key)
        {
            var query = sqlite.Table<WorldData>().Where(w => w.WorldId == worldId && w.Key == key).Select(w => w.ValueSize);

            return query.FirstOrDefault();
        }

        public void Close()
        {
            sqlite.Close();
        }
    }
}
