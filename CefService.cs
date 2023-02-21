using System;
using System.IO;
using CefSharp;
using CefSharp.SchemeHandler;
using CefSharp.WinForms;

namespace VRCX
{
    public class CefService
    {
        public static readonly CefService Instance;

        static CefService()
        {
            Instance = new CefService();
        }

        internal void Init()
        {
            var cefSettings = new CefSettings
            {
                CachePath = Path.Combine(Program.AppDataDirectory, "cache"),
                UserDataPath = Path.Combine(Program.AppDataDirectory, "userdata"),
                LogSeverity = LogSeverity.Disable,
                WindowlessRenderingEnabled = true,
                PersistSessionCookies = true,
                PersistUserPreferences = true,
                UserAgent = Program.Version
            };

            cefSettings.RegisterScheme(new CefCustomScheme
            {
                SchemeName = "file",
                DomainName = "vrcx",
                SchemeHandlerFactory = new FolderSchemeHandlerFactory(
                    Path.Combine(Program.BaseDirectory, "html"),
                    "file",
                    defaultPage: "index.html"
                ),
                IsLocal = true
            });

            // cefSettings.CefCommandLineArgs.Add("allow-universal-access-from-files");
            // cefSettings.CefCommandLineArgs.Add("ignore-certificate-errors");
            // cefSettings.CefCommandLineArgs.Add("disable-plugins");
            cefSettings.CefCommandLineArgs.Add("disable-spell-checking");
            cefSettings.CefCommandLineArgs.Add("disable-pdf-extension");
            cefSettings.CefCommandLineArgs["autoplay-policy"] = "no-user-gesture-required";
            cefSettings.CefCommandLineArgs.Add("disable-web-security");
            cefSettings.SetOffScreenRenderingBestPerformanceArgs(); // causes white screen sometimes?

            if (Program.LaunchDebug)
                cefSettings.RemoteDebuggingPort = 8088;

            CefSharpSettings.WcfEnabled = true; // TOOD: REMOVE THIS LINE YO (needed for synchronous configRepository)
            CefSharpSettings.ShutdownOnExit = false;

            // Enable High-DPI support on Windows 7 or newer
            Cef.EnableHighDPISupport();

            if (Cef.Initialize(cefSettings) == false)
            {
                throw new Exception("Cef.Initialize()");
            }
        }

        internal void Exit()
        {
            Cef.Shutdown();
        }
    }
}