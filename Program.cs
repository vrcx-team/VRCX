// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.WinForms;
using System;
using System.Windows.Forms;

namespace VRCX
{
    public static class Program
    {
        [STAThread]
        public static void Main()
        {
            try
            {
                var settings = new CefSettings
                {
                    CachePath = "cache",
                    PersistUserPreferences = true,
                    PersistSessionCookies = true,
                    WindowlessRenderingEnabled = true
                };
                settings.CefCommandLineArgs.Add("ignore-certificate-errors", "1");
                settings.CefCommandLineArgs.Add("disable-web-security", "1");
                // settings.CefCommandLineArgs.Add("no-proxy-server", "1");
                settings.CefCommandLineArgs.Add("disable-plugins-discovery", "1");
                settings.CefCommandLineArgs.Add("disable-extensions", "1");
                settings.CefCommandLineArgs.Add("disable-pdf-extension", "1");
                // settings.CefCommandLineArgs.Add("disable-gpu", "1");
                settings.CefCommandLineArgs.Add("disable-direct-write", "1");
                settings.LogSeverity = LogSeverity.Disable;
                settings.DisableGpuAcceleration();
                /*settings.RegisterScheme(new CefCustomScheme
                {
                    SchemeName = "vrcx",
                    DomainName = "app",
                    SchemeHandlerFactory = new FolderSchemeHandlerFactory(Application.StartupPath + "/../../../html")
                });*/

                // MUST TURN ON (Error when creating a browser on certain systems.)
                CefSharpSettings.WcfEnabled = true;

                CefSharpSettings.ShutdownOnExit = false;
                CefSharpSettings.SubprocessExitIfParentProcessClosed = true;

                // Cef.EnableHighDPISupport();

                if (Cef.Initialize(settings, true, browserProcessHandler: null))
                {
                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    VRCXStorage.Load();
                    SQLite.Init();
                    CpuMonitor.Init();
                    Discord.Init();
                    LogWatcher.Init();
                    VRCXVR.Init();
                    Application.Run(new MainForm());
                    VRCXVR.Exit();
                    LogWatcher.Exit();
                    Discord.Exit();
                    CpuMonitor.Exit();
                    SQLite.Exit();
                    VRCXStorage.Save();
                    Cef.Shutdown();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"{ex.Message}\n{ex.StackTrace}", "PLEASE REPORT TO PYPY", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }
    }
}