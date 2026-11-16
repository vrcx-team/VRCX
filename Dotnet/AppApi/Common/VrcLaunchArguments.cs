using System;
using System.Collections.Generic;
using System.Linq;
using NLog;

namespace VRCX
{
    /// <summary>
    /// Remembers the arguments the running VRChat was started with, so a crash relaunch can use the same ones.
    /// They are read from the VRChat process itself, never from its log: worlds can write lines into the log,
    /// but only whoever starts the process can set its command line.
    /// </summary>
    public static class VrcLaunchArguments
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        // arguments of the VRChat process being watched right now
        private static string running = string.Empty;

        /// <summary>
        /// The arguments of the VRChat process that exited last, ready to pass to a new launch, or an empty string.
        /// </summary>
        public static string Value { get; private set; } = string.Empty;

        /// <summary>
        /// Reads the arguments of the given VRChat process. Any failure leaves nothing stored,
        /// so a relaunch falls back to the configured launch options.
        /// </summary>
        /// <param name="processId">The VRChat process that just started.</param>
        public static void Capture(int processId)
        {
            running = string.Empty;
            try
            {
                var arguments = WinApi.GetProcessArguments(processId);
                if (arguments == null)
                {
                    logger.Warn("Could not read the arguments of VRChat (PID: {0})", processId);
                    return;
                }

                running = Format(arguments) ?? string.Empty;
            }
            catch (Exception e)
            {
                logger.Warn(e, "Failed to read the arguments of VRChat (PID: {0})", processId);
            }
        }

        /// <summary>
        /// Call when the watched VRChat process exits. Its arguments become the ones a relaunch uses, so a second
        /// VRChat that is picked up right afterwards (--allowMultiple) can't replace them.
        /// </summary>
        public static void MarkExited()
        {
            Value = running;
            running = string.Empty;
        }

        /// <summary>
        /// Turns a process's arguments into the arguments for a relaunch.
        /// </summary>
        /// <param name="arguments">Arguments of the process, the executable first.</param>
        /// <returns>The arguments joined into one string, or null if they can't be passed on safely.</returns>
        internal static string Format(IReadOnlyList<string> arguments)
        {
            var kept = new List<string>();

            // the first argument is the executable
            foreach (var argument in arguments.Skip(1))
            {
                // the relaunch supplies its own launch URL and VRChat adds its own startup timestamp
                if (argument.Length == 0 ||
                    argument.StartsWith("vrchat://", StringComparison.OrdinalIgnoreCase) ||
                    argument.StartsWith("--startup-begin-ts=", StringComparison.Ordinal))
                    continue;

                // the arguments travel on as one string, so anything that could change how that string is split
                // back into arguments is refused instead of escaped
                if (argument.Any(c => c == '"' || char.IsControl(c)))
                {
                    logger.Warn("Not reusing VRChat's launch arguments, one contains a quote or control character");
                    return null;
                }

                kept.Add(Quote(argument));
            }

            return string.Join(" ", kept);
        }

        /// <summary>
        /// Wraps an argument in quotes when it contains whitespace, so it stays one argument.
        /// </summary>
        private static string Quote(string argument)
        {
            if (!argument.Any(char.IsWhiteSpace))
                return argument;

            // backslashes right before the closing quote would escape it, so they are doubled
            var trailingBackslashes = argument.Length - argument.TrimEnd('\\').Length;
            return $"\"{argument}{new string('\\', trailingBackslashes)}\"";
        }
    }
}
