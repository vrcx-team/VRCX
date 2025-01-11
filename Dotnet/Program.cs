// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using NLog;
using NLog.Targets;
using System;
using System.Data.SQLite;
using System.IO;
using System.Threading;
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
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
#if !LINUX
        public static VRCXVRInterface VRCXVRInstance { get; private set; }
#endif
        public static AppApi AppApiInstance { get; private set; }

        private static void SetProgramDirectories()
        {
            if (string.IsNullOrEmpty(AppDataDirectory))
                AppDataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "VRCX");

            BaseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            ConfigLocation = Path.Combine(AppDataDirectory, "VRCX.sqlite3");

            if (!Directory.Exists(AppDataDirectory))
            {
                Directory.CreateDirectory(AppDataDirectory);

                // Migrate config to AppData
                if (File.Exists(Path.Combine(BaseDirectory, "VRCX.json")))
                {
                    File.Move(Path.Combine(BaseDirectory, "VRCX.json"), Path.Combine(AppDataDirectory, "VRCX.json"));
                    File.Copy(Path.Combine(AppDataDirectory, "VRCX.json"),
                        Path.Combine(AppDataDirectory, "VRCX-backup.json"));
                }

                if (File.Exists(Path.Combine(BaseDirectory, "VRCX.sqlite3")))
                {
                    File.Move(Path.Combine(BaseDirectory, "VRCX.sqlite3"),
                        Path.Combine(AppDataDirectory, "VRCX.sqlite3"));
                    File.Copy(Path.Combine(AppDataDirectory, "VRCX.sqlite3"),
                        Path.Combine(AppDataDirectory, "VRCX-backup.sqlite3"));
                }
            }

            // Migrate cache to userdata for Cef 115 update
            var oldCachePath = Path.Combine(AppDataDirectory, "cache");
            var newCachePath = Path.Combine(AppDataDirectory, "userdata", "cache");
            if (Directory.Exists(oldCachePath) && !Directory.Exists(newCachePath))
            {
                Directory.CreateDirectory(Path.Combine(AppDataDirectory, "userdata"));
                Directory.Move(oldCachePath, newCachePath);
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

        private static void ConfigureLogger()
        {
            LogManager.Setup().LoadConfiguration(builder =>
            {
                var fileTarget = new FileTarget("fileTarget")
                {
                    FileName = Path.Combine(AppDataDirectory, "logs", "VRCX.log"),
                    //Layout = "${longdate} [${level:uppercase=true}] ${logger} - ${message} ${exception:format=tostring}",
                    // Layout with padding between the level/logger and message so that the message always starts at the same column
                    Layout =
                        "${longdate} [${level:uppercase=true:padding=-5}] ${logger:padding=-20} - ${message} ${exception:format=tostring}",
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
                builder.ForLogger().FilterMinLevel(LogLevel.Debug).WriteTo(fileTarget);
                
                var consoleTarget = new ConsoleTarget("consoleTarget")
                {
                    Layout = "${longdate} [${level:uppercase=true:padding=-5}] ${logger:padding=-20} - ${message} ${exception:format=tostring}",
                    DetectConsoleAvailable = true
                };
                builder.ForLogger("VRCX").FilterMinLevel(LogLevel.Info).WriteTo(consoleTarget);
            });
        }

#if !LINUX
        [STAThread]
        private static void Main()
        {
            if (Wine.GetIfWine())
            {
                MessageBox.Show(
                    "VRCX Cef has detected Wine.\nPlease switch to our native Electron build for Linux.",
                    "Wine Detected", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            try
            {
                Run();
            }

            #region Handle CEF Explosion

            catch (FileNotFoundException e)
            {
                logger.Error(e, "Handled Exception, Missing file found in Handle Cef Explosion.");

                var result = MessageBox.Show(
                    "VRCX has encountered an error with the CefSharp backend,\nthis is typically caused by missing files or dependencies.\nWould you like to try autofix by automatically installing vc_redist?.",
                    "VRCX CefSharp not found.", MessageBoxButtons.YesNo, MessageBoxIcon.Error);
                switch (result)
                {
                    case DialogResult.Yes:
                        logger.Fatal("Handled Exception, user selected auto install of vc_redist.");
                        Update.DownloadInstallRedist();
                        MessageBox.Show(
                            "vc_redist has finished installing, if the issue persists upon next restart, please reinstall VRCX From GitHub,\nVRCX Will now restart.",
                            "vc_redist installation complete", MessageBoxButtons.OK);
                        Thread.Sleep(5000);
                        AppApiInstance.RestartApplication(false);
                        break;

                    case DialogResult.No:
                        logger.Fatal("Handled Exception, user chose manual.");
                        MessageBox.Show(
                            "VRCX will now close, try reinstalling VRCX using the setup from Github as a potential fix.",
                            "VRCX CefSharp not found", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        Thread.Sleep(5000);
                        Environment.Exit(0);
                        break;
                }
            }

            #endregion

            #region Handle Database Error

            catch (SQLiteException e)
            {
                logger.Fatal(e, "Unhandled SQLite Exception, closing.");
                var messageBoxResult = MessageBox.Show(
                    "A fatal database error has occured.\n" +
                    "Please try to repair your database by following the steps in the provided repair guide, or alternatively rename your \"%AppData%\\VRCX\" folder to reset VRCX. " +
                    "If the issue still persists after following the repair guide please join the Discord (https://vrcx.app/discord) for further assistance. " +
                    "Would you like to open the webpage for database repair steps?\n" +
                    e, "Database error", MessageBoxButtons.YesNo, MessageBoxIcon.Error);
                if (messageBoxResult == DialogResult.Yes)
                {
                    AppApiInstance.OpenLink("https://github.com/vrcx-team/VRCX/wiki#how-to-repair-vrcx-database");
                }
            }

            #endregion

            catch (Exception e)
            {
                var cpuError = WinApi.GetCpuErrorMessage();
                if (cpuError != null)
                {
                    var messageBoxResult = MessageBox.Show(cpuError.Value.Item1, "Potentially Faulty CPU Detected",
                        MessageBoxButtons.YesNo, MessageBoxIcon.Error);
                    if (messageBoxResult == DialogResult.Yes)
                    {
                        AppApiInstance.OpenLink(cpuError.Value.Item2);
                    }
                }

                logger.Fatal(e, "Unhandled Exception, program dying");
                MessageBox.Show(e.ToString(), "PLEASE REPORT IN https://vrcx.app/discord", MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }

        private static void Run()
        {
            StartupArgs.ArgsCheck();
            SetProgramDirectories();
            VRCXStorage.Instance.Load();
            BrowserSubprocess.Start();
            ConfigureLogger();
            GetVersion();
            Update.Check();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            logger.Info("{0} Starting...", Version);
            logger.Debug("Wine detection: {0}", Wine.GetIfWine());

            SQLiteLegacy.Instance.Init();
            AppApiInstance = new AppApiCef();

            AppApiVr.Instance.Init();
            ProcessMonitor.Instance.Init();
            Discord.Instance.Init();
            WorldDBManager.Instance.Init();
            WebApi.Instance.Init();
            LogWatcher.Instance.Init();
            AutoAppLaunchManager.Instance.Init();
            CefService.Instance.Init();
            IPCServer.Instance.Init();

            if (VRCXStorage.Instance.Get("VRCX_DisableVrOverlayGpuAcceleration") == "true")
                VRCXVRInstance = new VRCXVRLegacy();
            else
                VRCXVRInstance = new VRCXVR();
            VRCXVRInstance.Init();

            Application.Run(new MainForm());
            logger.Info("{0} Exiting...", Version);
            WebApi.Instance.SaveCookies();
            VRCXVRInstance.Exit();
            CefService.Instance.Exit();

            AutoAppLaunchManager.Instance.Exit();
            LogWatcher.Instance.Exit();
            WebApi.Instance.Exit();
            WorldDBManager.Instance.Stop();

            Discord.Instance.Exit();
            SystemMonitor.Instance.Exit();
            VRCXStorage.Instance.Save();
            SQLiteLegacy.Instance.Exit();
            ProcessMonitor.Instance.Exit();
        }
#else
        public static void PreInit(string version)
        {
            Version = version;
            StartupArgs.ArgsCheck();
            SetProgramDirectories();
        }

        public static void Init()
        {
            ConfigureLogger();
            Update.Check();

            logger.Info("{0} Starting...", Version);

            AppApiInstance = new AppApiElectron();
            // ProcessMonitor.Instance.Init();
        }
#endif
    }

#if LINUX
    public class ProgramElectron
    {
        public void PreInit(string version)
        {
            Program.PreInit(version);
        }

        public void Init()
        {
            Program.Init();
        }
    }
#endif
}
