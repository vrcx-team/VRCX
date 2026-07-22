using System;
using System.Collections.Generic;
using System.Data.SQLite;

namespace DBMerger;

internal static class SqliteExtensions
{
    public static SQLiteCommand CreateCommand(this SQLiteConnection conn, string query, params object[] args)
    {
        var command = conn.CreateCommand();
        command.CommandText = query;

        for (int i = 0; i < args.Length; i++)
        {
            command.Parameters.AddWithValue($"@p{i}", args[i] ?? DBNull.Value);
        }

        return command;
    }

    public static void ExecuteNonQuery(this SQLiteConnection conn, string query, params object[] args)
    {
        using var command = conn.CreateCommand(query, args);
        command.ExecuteNonQuery();
    }

    public static string ReadScalarString(this SQLiteConnection conn, string query, params object[] args)
    {
        using var command = conn.CreateCommand(query, args);
        var value = command.ExecuteScalar();
        return value == null || value is DBNull ? null : value.ToString();
    }

    public static List<string> ReadStrings(this SQLiteConnection conn, string query, params object[] args)
    {
        var results = new List<string>();
        using var command = conn.CreateCommand(query, args);
        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            results.Add(reader.IsDBNull(0) ? null : reader.GetString(0));
        }

        return results;
    }

    public static object[] ReadFirstRow(this SQLiteConnection conn, string query, params object[] args)
    {
        using var command = conn.CreateCommand(query, args);
        using var reader = command.ExecuteReader();

        if (!reader.Read())
        {
            return null;
        }

        var row = new object[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++)
        {
            row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
        }

        return row;
    }
}