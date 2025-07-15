using SQLite;
using SQLitePCL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace DBMerger
{
    // This class is made of mostly hardcoded copies from the sqlite lib.
    // Normally this would be very bad, but since the library is long since
    // unmaintained it shouldn't matter
    internal static class SqliteExtensions
    {
        // The prepare method is private, so fetch it here
        private static readonly MethodInfo _prepareMethod = typeof(SQLiteCommand).GetMethod("Prepare", BindingFlags.NonPublic | BindingFlags.Instance);

        /// <summary>
        /// Creates a SQLiteCommand given the command text (SQL) with arguments. Place a '?'
        /// in the command text for each of the arguments and then executes that command.
        /// It returns each row as an array of object primitives.
        /// </summary>
        /// <param name="query">
        /// The fully escaped SQL.
        /// </param>
        /// <param name="args">
        /// Arguments to substitute for the occurences of '?' in the query.
        /// </param>
        /// <returns>
        /// An enumerable with one object array for each row.
        /// </returns>
        public static List<object[]> QueryScalars(this SQLiteConnection conn, string query, params object[] args)
        {
            var cmd = conn.CreateCommand(query, args);
            return cmd.ExecuteQueryScalars(conn).ToList();
        }

        public static IEnumerable<object[]> ExecuteQueryScalars(this SQLiteCommand cmd, SQLiteConnection conn)
        {
            if (conn.Trace)
            {
                conn.Tracer?.Invoke("Executing Query: " + cmd);
            }
            var stmt = _prepareMethod.Invoke(cmd, []) as sqlite3_stmt;
            try
            {
                int columnCount = SQLite3.ColumnCount(stmt);
                if (SQLite3.ColumnCount(stmt) < 1)
                {
                    throw new InvalidOperationException("QueryScalars should return at least one column");
                }
                while (SQLite3.Step(stmt) == SQLite3.Result.Row)
                {
                    var row = new object[columnCount];
                    for (int i = 0; i < columnCount; i++)
                    {
                        var colType = SQLite3.ColumnType(stmt, i);
                        row[i] = colType switch
                        {
                            SQLite3.ColType.Integer => SQLite3.ColumnInt(stmt, i),
                            SQLite3.ColType.Float => (float)SQLite3.ColumnDouble(stmt, i),
                            SQLite3.ColType.Text => SQLite3.ColumnString(stmt, i),
                            SQLite3.ColType.Blob => SQLite3.ColumnByteArray(stmt, i),
                            SQLite3.ColType.Null or _ => null
                        };
                    }
                    yield return row;
                }
            }
            finally
            {
                SQLite3.Finalize(stmt);
            }
        }

    }
}
