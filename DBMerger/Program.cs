using NLog;
using NLog.Targets;
using SQLite;
using System;

// Use different command line parser for more standardized output
// (like help text)
using System.CommandLine;
using System.CommandLine.Parsing;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;

namespace DBMerger
{
    public class Program
    {
        private static readonly Logger logger = LogManager.GetLogger("DBMerger");

        // TODO: Consider config class?
        public static SQLiteConnection DBConn { get; private set; }
        public static SQLiteConnection OldDBConn { get; private set; }
        public static Config Config { get; private set; }

        public static void Main(string[] args)
        {
            ProcessArgs(args);

            ConfigureLogger();

            if (Config.Debug)
            {
                // Needed? mostly just covering my ass
                logger.Warn(new string('=', 100));
                logger.Warn("WARNING:".PadLeft(46));
                logger.Warn("Debug mode will output some sensitive information (friends list, friend history, etc.)");
                logger.Warn("Only use this mode for debug purposes. Enter `y` to confirm or anything else to exit.");
                logger.Warn(new string('=', 100));
                if (Console.ReadLine() != "y")
                {
                    return;
                }
            }

            var asm = Assembly.GetExecutingAssembly();
            var versionInfo = FileVersionInfo.GetVersionInfo(asm.Location);
            logger.Info($"{versionInfo.ProductName}-{versionInfo.ProductVersion}");
            logger.Info($"by {versionInfo.LegalCopyright}\n");

            if (Path.GetFullPath(Config.NewDBPath) == Path.GetFullPath(Config.OldDBPath))
            {
                logger.Fatal("Database pathes cannot be the same!");
                return;
            }

            try
            {
                logger.Debug("Creating connection to old DB");
                try
                {
                    DBConn = new SQLiteConnection(Config.OldDBPath) { Tracer = logger.Trace, Trace = true };
                }
                catch (SQLiteException)
                {
                    logger.Fatal("Could not connect to old DB. Perhaps passed in db is corrupt or not a valid sqlite db?");
                    return;
                }
            
                logger.Debug("Creating connection to new DB");
                try
                {
                    DBConn.Execute("ATTACH DATABASE ? AS new_db", Config.NewDBPath);
                }
                catch (SQLiteException)
                {
                    logger.Fatal("Could not connect to new DB. Perhaps passed in db is corrupt or not a valid sqlite db?");
                    return;
                }
                logger.Info("Database connections created successfully!");

                CreateBackup();

                try
                {
                    new Merger(DBConn, "main", "new_db", Config).Merge();
                }
                catch (Exception ex)
                {
                    logger.Fatal(ex, "Merge process failed with error:\n");
                }
            }
            finally
            {
                logger.Debug("Closing database connection...");
                DBConn.Close();
            }

        }

        private static void ProcessArgs(string[] args)
        {
            static string validateDBPath(ArgumentResult arg)
            {
                string path = arg.Tokens[0].Value;
                Option option = arg.Argument.Parents.Single() as Option;

                string extension = Path.GetExtension(path);
                if (extension == "")
                {
                    path += Path.ChangeExtension(path, "sqlite3");
                }
                else if (extension != ".sqlite3")
                {
                    arg.ErrorMessage = $"File given to option `{option.Aliases.First()}` is not a sqlite database!";
                    return null;
                }

                if (!File.Exists(path))
                {
                    arg.ErrorMessage = $"File given to option `{option.Aliases.First()}` does not exist!";
                    return null;
                }

                return path;
            }

            var rootCommand = new RootCommand("Merge an old and new VRCX sqlite database into one.");

            var newDBOption = new Option<string>(
                ["-n", "--new-db-path"], 
                description: "The path of the new DB to merge the old onto.",
                parseArgument: validateDBPath
            ) { IsRequired = true };
            rootCommand.AddOption(newDBOption);

            var oldDBOption = new Option<string>(
                ["-o", "--old-db-path"],
                description: "The path of the old DB to merge into the new.",
                parseArgument: validateDBPath
            ) { IsRequired = true };
            rootCommand.AddOption(oldDBOption);
            
            // Add `debug` option to be consistent with args from the main exe
            var debugOption = new Option<bool>(["-v", "--verbose", "-d", "--debug"], () => false, "Add debug information to the output.");
            rootCommand.AddOption(debugOption);

            var importConfigOption = new Option<bool>(["--import-config"], () => false, "Imports the config values from the old database. This will override the config in the new database.");
            rootCommand.AddOption(importConfigOption);

            rootCommand.SetHandler((newDBPath, oldDBPath, debug, importConfig) =>
            {
                Config = new Config(newDBPath, oldDBPath, debug, importConfig);
            }, newDBOption, oldDBOption, debugOption, importConfigOption);

            // If the args weren't parsable or verifiable, exit
            if (rootCommand.Invoke(args) != 0)
            {
                Environment.Exit(0);
            }
        }

        private static void ConfigureLogger()
        {
            LogManager.Setup().LoadConfiguration(builder =>
            {
                var fileTarget = new FileTarget("fileTarget")
                {
                    FileName = "DBMerger.log",
                    Layout = "${longdate} [${level:uppercase=true:padding=-5}] ${logger:padding=-20} - ${message} ${exception:format=tostring}",
                    ArchiveFileName = Path.Combine("DBMerger_Logs", "DBMerger.{#}.log"),
                    ArchiveNumbering = ArchiveNumberingMode.DateAndSequence,
                    ArchiveOldFileOnStartup = true,
                    ConcurrentWrites = true,
                    KeepFileOpen = true,
                    AutoFlush = true,
                    Encoding = System.Text.Encoding.UTF8
                };

                var consoleTarget = new ColoredConsoleTarget()
                {
                    Layout = "[${level:uppercase=true:padding=-5}] ${message} ${exception:format=tostring}",
                    AutoFlush = true,
                    Encoding = System.Text.Encoding.UTF8
                };

                builder.ForLogger().FilterMinLevel(Config.Debug ? LogLevel.Trace : LogLevel.Debug).WriteTo(fileTarget);
                builder.ForLogger().FilterMinLevel(Config.Debug ? LogLevel.Trace : LogLevel.Info).WriteTo(consoleTarget);
            });
        }

        private static void CreateBackup() 
        {
            // Get unique name for backup. Format matches the log file name format
            string date = DateTime.Now.ToString("yyyyMMdd");
            int counter = 0;
            string backupPath;
            do
            {
                backupPath = Path.Combine(Path.GetDirectoryName(Config.NewDBPath), $"VRCX.back.{date}.{counter}.sqlite3");
                counter++;
            }
            while (File.Exists(backupPath));

            File.Copy(Config.NewDBPath, backupPath);
            logger.Info($"Created backup of new DB at {backupPath}");
        }
    }
}
