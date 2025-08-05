using System;
using System.IO;
using System.IO.Compression;
using System.Text;
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
        private static string _lastCefVersionPath = string.Empty;

        static CefService()
        {
            _lastCefVersionPath = Path.Join(Program.AppDataDirectory, "LastCefVersion");
            Instance = new CefService();
        }

        internal void Init()
        {
            var userDataDir = Path.Join(Program.AppDataDirectory, "userdata");
            // delete userdata if Cef version has been downgraded, fixes VRCX not opening after a downgrade
            CheckCefVersion(userDataDir);
            
            var cefSettings = new CefSettings
            {
                RootCachePath = userDataDir,
                CachePath = Path.Join(userDataDir, "cache"),
                LogSeverity = Program.LaunchDebug ? LogSeverity.Verbose : LogSeverity.Error,
                LogFile = Path.Join(Program.AppDataDirectory, "logs", "cef.log"),
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
                    Path.Join(Program.BaseDirectory, "html"),
                    "file",
                    defaultPage: "index.html"
                ),
                IsLocal = true
            });
            
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

                var extensionsPath = Path.Join(Program.AppDataDirectory, "extensions");
                Directory.CreateDirectory(extensionsPath);
                
                // extract Vue Devtools
                var vueDevtoolsCrxPath = Path.Join(Program.BaseDirectory, @"..\..\build-tools\Vue-js-devtools.crx");
                if (File.Exists(vueDevtoolsCrxPath))
                {
                    var vueDevtoolsPath = Path.Join(extensionsPath, "Vue-js-devtools");
                    if (!Directory.Exists(vueDevtoolsPath))
                    {
                        Directory.CreateDirectory(vueDevtoolsPath);
                        ZipFile.ExtractToDirectory(vueDevtoolsCrxPath, vueDevtoolsPath);
                    }
                }
                
                // load extensions
                var folders = Directory.GetDirectories(extensionsPath);
                foreach (var folder in folders)
                {
                    cefSettings.CefCommandLineArgs.Add("load-extension", folder);
                }
            }
            
            CefSharpSettings.ShutdownOnExit = false;
            CefSharpSettings.ConcurrentTaskExecution = true;
            
            if (Cef.Initialize(cefSettings, false) == false)
            {
                logger.Error("Cef failed to initialize");
                throw new Exception("Cef.Initialize()");
            }
        }

        private void CheckCefVersion(string userDataDir)
        {
            var currentVersion = Cef.ChromiumVersion;
            if (File.Exists(_lastCefVersionPath))
            {
                var lastCefVersion = File.ReadAllText(_lastCefVersionPath).Trim();
                var lastCefVersionParts = lastCefVersion.Split('.');
                var currentVersionParts = currentVersion.Split('.');
                if (lastCefVersionParts.Length != currentVersionParts.Length)
                {
                    logger.Info("Cef version mismatch detected, deleting userdata: {0} -> {1}", lastCefVersion,
                        currentVersion);
                    DeleteUserData(userDataDir);
                }

                for (var i = 0; i < lastCefVersionParts.Length; i++)
                {
                    if (int.TryParse(lastCefVersionParts[i], out var lastPart) &&
                        int.TryParse(currentVersionParts[i], out var currentPart) &&
                        lastPart > currentPart)
                    {
                        logger.Info("Cef downgrade detected, deleting userdata: {0} -> {1}", lastCefVersion,
                            currentVersion);
                        DeleteUserData(userDataDir);
                        break;
                    }
                }
            }

            File.WriteAllBytes(_lastCefVersionPath, Encoding.UTF8.GetBytes(currentVersion));
            logger.Info("Cef version: {0}", currentVersion);
        }
        
        private static void DeleteUserData(string userDataDir)
        {
            if (!Directory.Exists(userDataDir))
                return;
            
            try {
                Directory.Delete(userDataDir, true);
            } catch (Exception ex) {
                logger.Error(ex, "Failed to delete userdata directory: {0}", userDataDir);
            }
        }

        internal void Exit()
        {
            Cef.Shutdown();
        }
    }
}