// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Security.Cryptography.X509Certificates;
using CefSharp;
using NLog;

namespace VRCX
{
    public class CustomRequestHandler : IRequestHandler
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();
        
        public bool OnBeforeBrowse(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IRequest request, bool userGesture, bool isRedirect)
        {
            if (Program.LaunchDebug ||
                request.Url.StartsWith("file://vrcx/") ||
                request.Url.StartsWith("chrome-extension://"))
                return false;
            
            _logger.Error("Blocking navigation to: {Url}", request.Url);
            return true;
        }

        public void OnDocumentAvailableInMainFrame(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
        }

        public bool OnOpenUrlFromTab(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, string targetUrl,
            WindowOpenDisposition targetDisposition, bool userGesture)
        {
            _logger.Debug("Blocking OnOpenUrlFromTab: {TargetUrl}",
                targetUrl);

            return true;
        }

        public IResourceRequestHandler GetResourceRequestHandler(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame,
            IRequest request, bool isNavigation, bool isDownload, string requestInitiator, ref bool disableDefaultHandling)
        {
            return null;
        }

        public bool GetAuthCredentials(IWebBrowser chromiumWebBrowser, IBrowser browser, string originUrl, bool isProxy, string host,
            int port, string realm, string scheme, IAuthCallback callback)
        {
            return false;
        }

        public bool OnCertificateError(IWebBrowser chromiumWebBrowser, IBrowser browser, CefErrorCode errorCode, string requestUrl,
            ISslInfo sslInfo, IRequestCallback callback)
        {
            return true;
        }

        public bool OnSelectClientCertificate(IWebBrowser chromiumWebBrowser, IBrowser browser, bool isProxy, string host, int port,
            X509Certificate2Collection certificates, ISelectClientCertificateCallback callback)
        {
            return false;
        }

        public void OnRenderViewReady(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
        }

        public void OnRenderProcessTerminated(IWebBrowser chromiumWebBrowser, IBrowser browser, CefTerminationStatus status,
            int errorCode, string errorMessage)
        {
            var message = status switch
            {
                CefTerminationStatus.AbnormalTermination => "Browser terminated abnormally.",
                CefTerminationStatus.ProcessWasKilled => "Browser was killed.",
                CefTerminationStatus.ProcessCrashed => "Browser crashed.",
                CefTerminationStatus.OutOfMemory => "Browser out of memory.",
                _ => $"Browser terminated with unhandled status code '{status}'"
            };
            _logger.Error("Render process terminated: {Message} ErrorCode: {ErrorCode} ErrorMessage: {ErrorMessage}",
                message, errorCode, errorMessage);
            StartupArgs.LaunchArguments.LaunchCommand = $"crash/{message}";

            if (chromiumWebBrowser.IsDisposed || chromiumWebBrowser.IsLoading)
                return;

            _logger.Info("Attempting to reload browser...");
            chromiumWebBrowser.Reload();
        }
    }
}
