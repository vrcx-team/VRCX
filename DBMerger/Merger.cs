using NLog;
using SQLite;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace DBMerger
{
    public partial class Merger(SQLiteConnection dbConn, string oldDBName, string newDBName, Config config)
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly Regex userIDRegex = UserIDRegex();

        // This list of table names will be slowly emptied by specific
        // handlers until only unrecognied tables are left
        private List<string> unMergedTables;

        public void Merge()
        {
            logger.Info("Starting merge process...");

            logger.Debug("Creating transaction for databases");
            dbConn.BeginTransaction();
            try
            {
                MergeInternal();

                //throw new Exception("AHHH GOD PLEASE MAKE IT STOP");
            }
            catch
            {
                logger.Warn("Encoutered error! Rolling back changes to databases");
                dbConn.Rollback();

                throw;
            }

            logger.Debug("Committing changes to database");
            dbConn.Commit();

            logger.Info("Optimizing database size...");
            dbConn.Execute("VACUUM new_db;");
            logger.Info("Merge completed without any major issues!");
        }

        private void MergeInternal()
        {
            unMergedTables = dbConn.QueryScalars<string>($"SELECT name FROM {oldDBName}.sqlite_schema WHERE type='table';");
            
            // Holds sensitive information. Burn it with fire so no sensitive
            // data gets leaked
            unMergedTables.Remove("cookies");

            // Get any tables in the old db that arent in the new db
            logger.Info("Creating tables not present on new database that are present on old database...");
            var newDBTables = dbConn.QueryScalars<string>($"SELECT name FROM {newDBName}.sqlite_schema WHERE type='table';").ToHashSet();
            for (int i = 0; i < unMergedTables.Count; i++)
            {
                var table = unMergedTables[i];
                if (newDBTables.Contains(table) || table == "configs")
                {
                    continue;
                }
                unMergedTables.RemoveAt(i);
                i--;

                // Then just tack them on
                // Get command to create the table
                logger.Info($"Adding table: {table}...");
                var createQuery = dbConn.ExecuteScalar<string>($"SELECT sql FROM {oldDBName}.sqlite_schema WHERE type='table' AND name=?;", table);

                // Insert name of new database into create table query
                createQuery = createQuery[..13] + newDBName + "." + createQuery[13..];
                logger.Debug($"Using command: {createQuery}");
                dbConn.Execute(createQuery);

                // Then add the rows
                logger.Debug("Addings rows to table");
                dbConn.Execute($"INSERT INTO {newDBName}.{table} SELECT * FROM {oldDBName}.{table};");
            }

            logger.Info("Merging memos into new database...");
            MergeMemos();

            logger.Info("Merging favorites into new database...");
            MergeFavorites();

            logger.Info("Merging avatar and world cache into new database...");
            MergeCaches();

            logger.Info("Merging gamelog into new database...");
            MergeGamelog();

            logger.Info("Merging user feed tables into new database...");
            MergeUsers();

            if (config.ImportConfig)
            {
                logger.Info("Importing config from old database...");
                ImportConfig();
            }
            else
            {
                unMergedTables.Remove("configs");
            }

            foreach (var table in unMergedTables)
            {
                logger.Warn("Found unmerged table: " + table);
            }
        }

        private void MergeMemos()
        {
            MergeTable(
                table => table.EndsWith("memos"),
                [0],
                (old, existing) =>
                {
                    if (existing == null)
                    {
                        logger.Trace("Inserting new memo");
                        return old;
                    }

                    logger.Trace("Replacing memo");

                    // Pick newer edited_at time
                    var oldDateTime = DateTime.Parse((string)old[1]);
                    var newDateTime = DateTime.Parse((string)existing[1]);
                    old[1] = oldDateTime > newDateTime ? oldDateTime : newDateTime;
                    old[1] = ((DateTime)old[1]).ToString("o");

                    // Don't concatenate memos if they're the exact same or
                    // the new memo ends with the old one (suggesting import
                    // has already been run)
                    old[2] = existing[2] == old[2] || ((string)existing[2]).EndsWith((string)old[2])
                        ? existing[2] : old[2] + "\n" + existing[2];

                    return old;
                }
            );
        }

        private void MergeFavorites()
        {
            MergeTable(
                table => table.StartsWith("favorite_"),
                [2, 3],
                (old, existing) =>
                {
                    // Let sqlite generate the new pk
                    old[0] = null;

                    if (existing == null)
                    {
                        logger.Trace("Inserting new favorite");
                        return old;
                    }

                    logger.Trace("Replacing favorite");

                    // Favorites are the same, so just pick the older create
                    // time and add it
                    var oldDateTime = DateTime.Parse((string)old[1]);
                    var newDateTime = DateTime.Parse((string)existing[1]);
                    var updatedDateTime = oldDateTime < newDateTime ? oldDateTime : newDateTime;
                    old[1] = updatedDateTime;

                    return old;
                }
            );
        }

        private void MergeCaches()
        {
            MergeTable(
                table => table.StartsWith("cache_"),
                [0],
                (old, existing) =>
                {
                    if (existing == null)
                    {
                        logger.Trace("Inserting new cache entry");
                        return old;
                    }

                    logger.Trace("Replacing cache entry");

                    // old and existing have the same pk, so pick the newer
                    // cache entry
                    var oldDateTime = DateTime.Parse((string)old[1]);
                    var newDateTime = DateTime.Parse((string)existing[1]);

                    return oldDateTime > newDateTime ? old : existing;
                }
            );
        }

        private void MergeGamelog()
        {
            // While this could be handled throw a single query, I would like to
            // log anything determined to be a duplicate in case this doens't
            // work
            MergeTable(
                table => table.StartsWith("gamelog_") && table != "gamelog_join_leave",
                // These tables can be merged just fine by checking the created
                // date and first col of information because we just need to
                // know if 2 rows are the same
                [1, 2],
                // Literally just place back in what's already there
                // created_at times should be pretty consistent, so we can trust
                // that no duplicates will be created
                (old, existing) => 
                {
                    if (existing != null)
                    {
                        logger.Trace("Determined these rows to be the same: ");
                        logger.Trace(string.Join(", ", old));
                        logger.Trace(string.Join(", ", existing));
                    }
                    return old;
                },
                table => SortTable(dbConn, newDBName, table, GetTableColumnNames(dbConn, table)[1])
            );

            MergeTable(
                table => table == "gamelog_join_leave",
                [1, 3],
                (old, existing) =>
                {
                    if (existing != null)
                    {
                        logger.Trace("Determined these rows to be the same: ");
                        logger.Trace(string.Join(", ", old));
                        logger.Trace(string.Join(", ", existing));
                    }
                    return old;
                },
                table => SortTable(dbConn, newDBName, table, GetTableColumnNames(dbConn, table)[1])
            );
        }

        private void MergeUsers()
        {
            MergeTable(
                table => userIDRegex.IsMatch(table) 
                         && (table.EndsWith("_avatar_history") 
                            || table.EndsWith("_notifications") 
                            || table.EndsWith("_moderation")),
                [0],
                (old, existing) =>
                {
                    if (existing == null)
                    {
                        logger.Trace("Inserting new feed entry");
                        return old;
                    }

                    logger.Trace("Replacing feed entry");

                    // old and existing have the same pk, so pick the newer
                    // cache entry
                    var oldDateTime = DateTime.Parse((string)old[1]);
                    var newDateTime = DateTime.Parse((string)existing[1]);

                    return oldDateTime > newDateTime ? old : existing;
                }
            );

            for (int i = 0; i < unMergedTables.Count; i++)
            {
                // All other feed tables shouldve been merged, so just by
                // matching user we should get all the rest of the user tables
                string table = unMergedTables[i];
                if (!userIDRegex.IsMatch(table))
                {
                    continue;
                }
                unMergedTables.RemoveAt(i);
                i--;

                // Skip friend log current for obvious reasons
                if (table.EndsWith("_friend_log_current"))
                {
                    continue;
                }

                logger.Debug($"Merging table `{table}` into new database");

                List<string> colNames = GetTableColumnNames(dbConn, table);

                // Find min value of new db table and max value of old db table
                var oldestInNew = dbConn.ExecuteScalar<string>($"SELECT MIN({colNames[1]}) FROM {newDBName}.{table};");
                var newestInOld = dbConn.ExecuteScalar<string>($"SELECT MAX({colNames[1]}) FROM {oldDBName}.{table};");

                // If either tables are empty or the oldest value in the new
                // table is still newer than the newest value in the old
                // (the tables don't overlap in time at all)
                if (oldestInNew == null || newestInOld == null || DateTime.Parse(oldestInNew) > DateTime.Parse(newestInOld))
                {
                    logger.Debug($"User tables {table} has no overlap");
                    // Then we can just combine them since there is no data
                    // overlap
                    var columnsClause = string.Join(", ", colNames.Skip(1));
                    dbConn.Execute(
                        $"INSERT INTO {newDBName}.{table}({columnsClause})" +
                            $"SELECT {columnsClause} FROM {oldDBName}.{table};"
                    );
                    SortTable(dbConn, newDBName, table, colNames[1]);
                }
                else
                {
                    logger.Debug($"User tables {table} has overlap");
                    // uhhh shit yourself idk
                }
            }
        }

        private void ImportConfig()
        {
            unMergedTables.Remove("configs");

            // Skip saved credentials to avoid accidentally exposing sensitive
            // information somehow
            dbConn.Execute(
                $"INSERT OR REPLACE INTO {newDBName}.configs " +
                    $"SELECT * FROM {oldDBName}.configs " +
                        $"WHERE key!=?;", "config:savedcredentials"
            );
        }

        /// <summary>
        /// A method that automates various processes of merging.
        /// 
        /// It first finds a table that matches the `tableMatcher` predicate,
        /// then removes it from `unMergedTables`.
        /// Then it loops over every row in the old database table, checking if
        /// the row exists in the new table. It does this by checking if the
        /// column indices passed into `colIndicesToMatch` are the same.
        /// Then for each row, it calls `rowTransformer`, passing in the old 
        /// rows and existing new rows. `rowTransformer` should return the row 
        /// to insert into the new database or null.
        /// </summary>
        /// <param name="tableMatcher">A predicate to check if a table is one to edit</param>
        /// <param name="colIndicesToMatch">The column indices to match to see if old and new rows are the same</param>
        /// <param name="rowTransformer">An func called on every row</param>
        /// <param name="finalizer">An action called once all rows have been iterated</param>
        private void MergeTable(
            Predicate<string> tableMatcher,
            int[] colIndicesToMatch,
            Func<object[], object[], object[]> rowTransformer,
            Action<string> finalizer = null
        ) {
            for (int i = 0; i < unMergedTables.Count; i++)
            {
                // Find table that we want to merge
                string table = unMergedTables[i];
                if (!tableMatcher(table))
                {
                    continue;
                }
                unMergedTables.RemoveAt(i);
                i--;

                logger.Debug($"Merging table `{table}` into new database");

                // Prepare queries
                var colNames = GetTableColumnNames(dbConn, table);

                var valuesClause = string.Join(',', new string('?', colNames.Count).ToCharArray());
                var insertQuery = $"INSERT INTO {newDBName}.{table} VALUES ({valuesClause});";

                var whereClause = string.Join(" AND ", colIndicesToMatch.Select(i => colNames[i] + "=?"));
                var existsQuery = $"DELETE FROM {newDBName}.{table} WHERE {whereClause} RETURNING *;";

                // Loop over every row on table in old database
                var rowsCommand = dbConn.CreateCommand($"SELECT * FROM {oldDBName}.{table};");
                foreach (object[] oldRow in rowsCommand.ExecuteQueryScalars())
                {
                    // Find existing row (if it exists at all) and remove it
                    object[] colsToMatch = colIndicesToMatch.Select(i => oldRow[i]).ToArray();
                    var existingRow = dbConn.QueryScalars(existsQuery, colsToMatch).FirstOrDefault();

                    // Insert new row in place of the existing row
                    var newRow = rowTransformer(oldRow, existingRow);
                    dbConn.Execute(insertQuery, newRow);
                }

                finalizer?.Invoke(table);
            }
        }

        private static List<string> GetTableColumnNames(SQLiteConnection conn, string table)
            => conn.QueryScalars<string>("SELECT name FROM pragma_table_info(?);", table);

        private static void SortTable(SQLiteConnection conn, string db, string table, string sortCol)
        {
            logger.Debug($"Sorting table {db}.{table}");

            // Just to ensure name is unique
            var time = DateTime.Now.Ticks;
            var newTableName = table + time.ToString();
            logger.Debug($"Creating new table: " + newTableName);

            // Split create query into words
            var createQuery = conn.ExecuteScalar<string>($"SELECT sql FROM {db}.sqlite_schema WHERE type='table' AND name=?;", table);
            var words = createQuery.Split(' ');
            // Third word is table name
            words[2] = db + "." + newTableName;
            createQuery = string.Join(' ', words);

            logger.Debug("Creating table with command: " + createQuery);
            conn.Execute(createQuery);

            logger.Debug("Adding rows...");
            conn.Execute($"INSERT INTO {db}.{newTableName} SELECT * FROM {db}.{table} ORDER BY {sortCol} DESC;");

            logger.Debug("Dropping old and renaming");
            conn.Execute($"DROP TABLE {db}.{table}");
            conn.Execute($"ALTER TABLE {db}.{newTableName} RENAME TO {table}");
        }

        [GeneratedRegex("^([A-Za-z0-9]{10}|usr[0-9A-Fa-f]{32})")]
        private static partial Regex UserIDRegex();
    }
}
