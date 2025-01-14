using System;
using System.IO;
using CefSharp;
using CefSharp.SchemeHandler;
using CefSharp.WinForms;
using NLog;

namespace VRCX
{
    public class CefService
    {
        public static readonly CefService Instance;
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        static CefService()
        {
            Instance = new CefService();
        }

        internal void Init()
        {
            var userDataDir = Path.Combine(Program.AppDataDirectory, "userdata");
            var cefSettings = new CefSettings
            {
                RootCachePath = userDataDir,
                CachePath = Path.Combine(userDataDir, "cache"),
                LogSeverity = LogSeverity.Disable,
                WindowlessRenderingEnabled = true,
                PersistSessionCookies = true,
                UserAgent = Program.Version,
                BrowserSubprocessPath = Environment.ProcessPath,
                BackgroundColor = 0xFF101010
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
            cefSettings.CefCommandLineArgs.Add("disk-cache-size", "2147483647");
            cefSettings.CefCommandLineArgs.Add("unsafely-disable-devtools-self-xss-warnings");

            if (WebApi.ProxySet)
            {
                cefSettings.CefCommandLineArgs["proxy-server"] = WebApi.ProxyUrl;
            }
            
            if (VRCXStorage.Instance.Get("VRCX_DisableGpuAcceleration") == "true")
            {
                cefSettings.CefCommandLineArgs.Add("disable-gpu");
            }

            if (Program.LaunchDebug)
            {
                // chrome://inspect/#devices
                // Discover network targets, Configure...
                // Add Remote Target: localhost:8089
                logger.Info("Debug mode enabled");
                cefSettings.RemoteDebuggingPort = 8089;
                cefSettings.CefCommandLineArgs["remote-allow-origins"] = "*";
            }
            
            CefSharpSettings.ShutdownOnExit = false;
            CefSharpSettings.ConcurrentTaskExecution = true;

            if (Cef.Initialize(cefSettings, false) == false)
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