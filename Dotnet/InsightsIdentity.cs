using System;
using System.IO;

namespace VRCX;

/// <summary>Refuse accidental use of the default official profile.</summary>
internal static class InsightsIdentity
{
    public static void ValidateConfigDirectory(string directory)
    {
        if (string.IsNullOrWhiteSpace(directory)) return;
        var official = Path.GetFullPath(Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX"))
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var requested = Path.GetFullPath(directory)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (requested.Equals(official, StringComparison.OrdinalIgnoreCase) ||
            requested.StartsWith(official + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            Console.Error.WriteLine("VRCX Insights refuses the official VRCX profile. Use an independent test directory.");
            Environment.Exit(2);
        }
    }
}
