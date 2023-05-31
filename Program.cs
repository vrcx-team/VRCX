// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VRCX
{
    public static class Program
    {
        public static string BaseDirectory { get; private set; }
        public static string AppDataDirectory { get; private set; }
        public static string ConfigLocation;
        public static string Version { get; private set; }
        public static bool LaunchDebug;
        public static bool GPUFix;
        static Program()
        {
            BaseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            AppDataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX");
            ConfigLocation = Path.Combine(Program.AppDataDirectory, "VRCX.sqlite3");

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
        }

        private static void Run()
        {
            Update.Check();
            StartupArgs.ArgsCheck();
            GetVersion();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // I'll re-do this whole function eventually I swear
            var worldDBServer = new WorldDBManager("http://127.0.0.1:22500/");
            Task.Run(worldDBServer.Start);

            ProcessMonitor.Instance.Init();
            SQLiteLegacy.Instance.Init();
            VRCXStorage.Load();
            LoadFromConfig();
            CpuMonitor.Instance.Init();
            Discord.Instance.Init();
            WebApi.Instance.Init();
            LogWatcher.Instance.Init();
            AutoAppLaunchManager.Instance.Init();

            CefService.Instance.Init();
            IPCServer.Instance.Init();
            VRCXVR.Instance.Init();
            Application.Run(new MainForm());
            WebApi.Instance.SaveCookies();
            VRCXVR.Instance.Exit();
            CefService.Instance.Exit();

            AutoAppLaunchManager.Instance.Exit();
            LogWatcher.Instance.Exit();
            WebApi.Instance.Exit();
            worldDBServer.Stop();

            Discord.Instance.Exit();
            CpuMonitor.Instance.Exit();
            VRCXStorage.Save();
            SQLiteLegacy.Instance.Exit();
            ProcessMonitor.Instance.Exit();
        }

        /// <summary>
        /// Sets GPUFix to true if it is not already set and the VRCX_GPUFix key in the database is true.
        /// </summary>
        private static void LoadFromConfig()
        {
            if (!GPUFix)
                GPUFix = VRCXStorage.Instance.Get("VRCX_GPUFix") == "true";
        }
    }
}