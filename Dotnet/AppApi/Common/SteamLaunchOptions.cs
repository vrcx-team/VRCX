using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;
using NLog;

namespace VRCX
{
    /// <summary>
    /// Reads VRChat's launch options from Steam, which Steam appends to every "steam -applaunch 438100" launch.
    /// </summary>
    public static class SteamLaunchOptions
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly Regex LaunchOptionsRegex = new("\"LaunchOptions\"\\s+\"((?:\\\\.|[^\"\\\\])*)\"", RegexOptions.Compiled);

        /// <summary>
        /// Removes the arguments Steam will append itself, so a Steam launch does not pass them twice.
        /// </summary>
        /// <param name="steamPath">Steam install folder.</param>
        /// <param name="arguments">Arguments VRCX is about to pass to VRChat.</param>
        /// <returns>The arguments without the ones in VRChat's Steam launch options.</returns>
        public static string RemoveFrom(string steamPath, string arguments)
        {
            if (string.IsNullOrWhiteSpace(arguments))
                return arguments;

            try
            {
                var steamOptions = Split(Read(steamPath));
                if (steamOptions.Count == 0)
                    return arguments;

                // "VAR=1 %command% --foo": Steam only passes what follows %command% to the game
                var commandIndex = steamOptions.IndexOf("%command%");
                if (commandIndex >= 0)
                    steamOptions = steamOptions.Skip(commandIndex + 1).ToList();

                var kept = new List<string>();
                foreach (var argument in Split(arguments, keepQuotes: true))
                {
                    var index = steamOptions.IndexOf(argument.Trim('"'));
                    if (index >= 0)
                        steamOptions.RemoveAt(index);   // remove each Steam option once
                    else
                        kept.Add(argument);
                }

                return string.Join(" ", kept);
            }
            catch (Exception e)
            {
                logger.Warn(e, "Failed to read VRChat launch options from Steam");
                return arguments;
            }
        }

        /// <summary>
        /// Reads VRChat's launch options from the signed-in Steam user's localconfig.vdf.
        /// </summary>
        private static string Read(string steamPath)
        {
            if (string.IsNullOrEmpty(steamPath))
                return string.Empty;

            var userData = Path.Join(steamPath, "userdata");
            if (!Directory.Exists(userData))
                return string.Empty;

            // the signed-in account's config; with no signed-in account (Steam not running),
            // fall back to the config Steam wrote to last
            var activeUser = GetActiveUser();
            var activeConfig = new FileInfo(Path.Join(userData, activeUser.ToString(), "config", "localconfig.vdf"));
            var localConfig = activeUser != 0 && activeConfig.Exists
                ? activeConfig
                : Directory.GetDirectories(userData)
                    .Select(dir => new FileInfo(Path.Join(dir, "config", "localconfig.vdf")))
                    .Where(file => file.Exists)
                    .OrderByDescending(file => file.LastWriteTimeUtc)
                    .FirstOrDefault();
            if (localConfig == null)
                return string.Empty;

            var vdf = File.ReadAllText(localConfig.FullName);
            var appStart = vdf.IndexOf("\"438100\"", StringComparison.Ordinal);
            while (appStart >= 0)
            {
                var body = ReadBlock(vdf, appStart + 8);
                if (body != null)
                {
                    var match = LaunchOptionsRegex.Match(body);
                    if (match.Success)
                        return Regex.Unescape(match.Groups[1].Value);
                }

                appStart = vdf.IndexOf("\"438100\"", appStart + 8, StringComparison.Ordinal);
            }

            return string.Empty;
        }

        /// <summary>
        /// Returns the account ID of the Steam user signed in right now (the userdata folder name), or 0 if none.
        /// </summary>
        private static uint GetActiveUser()
        {
            if (!OperatingSystem.IsWindows())
                return 0;

            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam\ActiveProcess");
                return key?.GetValue("ActiveUser") is int activeUser ? unchecked((uint)activeUser) : 0;
            }
            catch (Exception e)
            {
                logger.Warn(e, "Failed to read the active Steam user");
                return 0;
            }
        }

        /// <summary>
        /// Returns the top level of the { } block that starts after <paramref name="start"/>, without nested blocks.
        /// </summary>
        private static string? ReadBlock(string vdf, int start)
        {
            var open = start;
            while (open < vdf.Length && char.IsWhiteSpace(vdf[open]))
                open++;
            if (open >= vdf.Length || vdf[open] != '{')
                return null;

            var body = new StringBuilder();
            var depth = 0;
            var inString = false;
            for (var i = open; i < vdf.Length; i++)
            {
                var c = vdf[i];
                if (inString)
                {
                    if (c == '\\' && i + 1 < vdf.Length)
                    {
                        if (depth == 1)
                            body.Append(c).Append(vdf[i + 1]);
                        i++;
                        continue;
                    }
                    if (c == '"')
                        inString = false;
                }
                else if (c == '"')
                {
                    inString = true;
                }
                else if (c == '{')
                {
                    depth++;
                    continue;
                }
                else if (c == '}')
                {
                    if (--depth == 0)
                        return body.ToString();
                    continue;
                }

                if (depth == 1)
                    body.Append(c);
            }

            return null;
        }

        /// <summary>
        /// Splits a command line on whitespace, keeping "quoted parts" together.
        /// </summary>
        private static List<string> Split(string commandLine, bool keepQuotes = false)
        {
            var parts = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;
            foreach (var c in commandLine)
            {
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                    if (keepQuotes)
                        current.Append(c);
                    continue;
                }
                if (char.IsWhiteSpace(c) && !inQuotes)
                {
                    if (current.Length > 0)
                        parts.Add(current.ToString());
                    current.Clear();
                    continue;
                }
                current.Append(c);
            }
            if (current.Length > 0)
                parts.Add(current.ToString());

            return parts;
        }
    }
}
