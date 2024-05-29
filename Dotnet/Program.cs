// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using NLog;
using NLog.Targets;
using System;
using System.IO;
using System.Windows.Forms;

namespace VRCX
{
    public static class Program
    {
        public static string BaseDirectory { get; private set; }
        public static string AppDataDirectory;
        public static string ConfigLocation { get; private set; }
        public static string Version { get; private set; }
        public static bool LaunchDebug;
        private static readonly NLog.Logger logger = NLog.LogManager.GetLogger("VRCX");
        
        private static void SetProgramDirectories()
        {
            if (string.IsNullOrEmpty(AppDataDirectory))
                AppDataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX");
            
            BaseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            ConfigLocation = Path.Combine(AppDataDirectory, "VRCX.sqlite3");

            if (!Directory.Exists(AppDataDirectory))
            {
                Directory.CreateDirectory(AppDataDirectory);

                // Migrate config to AppData
                if (File.Exists(Path.Combine(BaseDirectory, "VRCX.json")))
                {
                    File.Move(Path.Combine(BaseDirectory, "VRCX.json"), Path.Combine(AppDataDirectory, "VRCX.json"));
                    File.Copy(Path.Combine(AppDataDirectory, "VRCX.json"), Path.Combine(AppDataDirectory, "VRCX-backup.json"));
                }
                if (File.Exists(Path.Combine(BaseDirectory, "VRCX.sqlite3")))
                {
                    File.Move(Path.Combine(BaseDirectory, "VRCX.sqlite3"), Path.Combine(AppDataDirectory, "VRCX.sqlite3"));
                    File.Copy(Path.Combine(AppDataDirectory, "VRCX.sqlite3"), Path.Combine(AppDataDirectory, "VRCX-backup.sqlite3"));
                }
            }

            // Migrate cache to userdata for Cef 115 update
            var oldCachePath = Path.Combine(AppDataDirectory, "cache");
            if (Directory.Exists(oldCachePath))
            {
                var newCachePath = Path.Combine(AppDataDirectory, "userdata", "cache");
                if (Directory.Exists(newCachePath))
                    Directory.Delete(newCachePath, true);
                Directory.Move(oldCachePath, newCachePath);
            }
        }

        private static void ConfigureLogger()
        {
            NLog.LogManager.Setup().LoadConfiguration(builder =>
            {

                var fileTarget = new FileTarget("fileTarget")
                {
                    FileName = Path.Combine(AppDataDirectory, "logs", "VRCX.log"),
                    //Layout = "${longdate} [${level:uppercase=true}] ${logger} - ${message} ${exception:format=tostring}",
                    // Layout with padding between the level/logger and message so that the message always starts at the same column
                    Layout = "${longdate} [${level:uppercase=true:padding=-5}] ${logger:padding=-20} - ${message} ${exception:format=tostring}",
                    ArchiveFileName = Path.Combine(AppDataDirectory, "logs", "VRCX.{#}.log"),
                    ArchiveNumbering = ArchiveNumberingMode.DateAndSequence,
                    ArchiveEvery = FileArchivePeriod.Day,
                    MaxArchiveFiles = 4,
                    MaxArchiveDays = 7,
                    ArchiveAboveSize = 10000000,
                    ArchiveOldFileOnStartup = true,
                    ConcurrentWrites = true,
                    KeepFileOpen = true,
                    AutoFlush = true,
                    Encoding = System.Text.Encoding.UTF8
                };

                if (Program.LaunchDebug)
                {
                    builder.ForLogger().FilterMinLevel(LogLevel.Debug).WriteTo(fileTarget);
                }
                else
                {
#if DEBUG
                    // Archive maximum of 3 files 10MB each, kept for a maximum of 7 days
                    builder.ForLogger().FilterMinLevel(LogLevel.Debug).WriteTo(fileTarget);
#else
                    builder.ForLogger().FilterMinLevel(LogLevel.Debug).WriteTo(fileTarget);
#endif
                }
            });
        }

        [STAThread]
        private static void Main()
        {
            try
            {
                Run();
            }
            catch (Exception e)
            {
                logger.Fatal(e, "Unhandled Exception, program dying");
                MessageBox.Show(e.ToString(), "PLEASE REPORT IN https://vrcx.pypy.moe/discord", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }

        private static void GetVersion()
        {
            var buildName = "VRCX";
            try
            {
                Version = $"{buildName} {File.ReadAllText(Path.Combine(BaseDirectory, "Version"))}";
            }
            catch (Exception)
            {
                Version = $"{buildName} Build";
            }
            Version = Version.Replace("\r", "").Replace("\n", "");
        }

        private static void Run()
        {
            BrowserSubprocess.Start();
            StartupArgs.ArgsCheck();
            SetProgramDirectories();
            ConfigureLogger();
            Update.Check();
            GetVersion();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            logger.Info("{0} Starting...", Version);
            

            ProcessMonitor.Instance.Init();
            VRCXStorage.Load();
            SQLiteLegacy.Instance.Init();
            CpuMonitor.Instance.Init();
            Discord.Instance.Init();
            WorldDBManager.Instance.Init();
            WebApi.Instance.Init();
            LogWatcher.Instance.Init();
            AutoAppLaunchManager.Instance.Init();

            CefService.Instance.Init();
            IPCServer.Instance.Init();
            VRCXVR.Instance.Init();
            Application.Run(new MainForm());
            logger.Info("{0} Exiting...", Version);
            WebApi.Instance.SaveCookies();
            VRCXVR.Instance.Exit();
            CefService.Instance.Exit();

            AutoAppLaunchManager.Instance.Exit();
            LogWatcher.Instance.Exit();
            WebApi.Instance.Exit();
            WorldDBManager.Instance.Stop();

            Discord.Instance.Exit();
            CpuMonitor.Instance.Exit();
            VRCXStorage.Save();
            SQLiteLegacy.Instance.Exit();
            ProcessMonitor.Instance.Exit();
        }
    }
}