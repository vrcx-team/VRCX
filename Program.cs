// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.WinForms;
using System;
using System.IO;
using System.Windows.Forms;

namespace VRCX
{
    public class Program
    {
        public static string BaseDirectory { get; private set; }

        static Program()
        {
            BaseDirectory = AppDomain.CurrentDomain.BaseDirectory;
        }

        [STAThread]
        public static void Main()
        {
            try
            {
                var settings = new CefSettings
                {
                    CachePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "cache"),
                    IgnoreCertificateErrors = true,
                    LogSeverity = LogSeverity.Disable,
                    PersistUserPreferences = true,
                    WindowlessRenderingEnabled = true,
                    PersistSessionCookies = true
                };
                settings.CefCommandLineArgs.Add("ignore-certificate-errors");
                // settings.CefCommandLineArgs.Add("no-proxy-server");
                // settings.CefCommandLineArgs.Add("disable-web-security");
                settings.CefCommandLineArgs.Add("allow-universal-access-from-files");
                settings.CefCommandLineArgs.Add("disable-extensions");
                settings.CefCommandLineArgs.Add("disable-plugins");
                settings.CefCommandLineArgs.Add("disable-pdf-extension");
                settings.CefCommandLineArgs.Add("disable-spell-checking");
                settings.CefCommandLineArgs.Add("disable-gpu");
                settings.CefCommandLineArgs.Add("disable-gpu-vsync");
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

                Cef.EnableHighDPISupport();

                if (Cef.Initialize(settings, true, browserProcessHandler: null))
                {
                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    VRCXStorage.Load();
                    CpuMonitor.Instance.Init();
                    Discord.Instance.Init();
                    SQLite.Instance.Init();
                    WebApi.Instance.Init();
                    LogWatcher.Instance.Init();
                    VRCXVR.Init();
                    Application.Run(new MainForm());
                    VRCXVR.Exit();
                    LogWatcher.Instance.Exit();
                    WebApi.Instance.Exit();
                    SQLite.Instance.Exit();
                    Discord.Instance.Exit();
                    CpuMonitor.Instance.Exit();
                    VRCXStorage.Save();
                    Cef.Shutdown();
                }
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString(), "PLEASE REPORT TO PYPY", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Environment.Exit(0);
            }
        }
    }
}
