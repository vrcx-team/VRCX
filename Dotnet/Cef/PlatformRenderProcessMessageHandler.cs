using CefSharp;

namespace VRCX;

public sealed class PlatformRenderProcessMessageHandler : IRenderProcessMessageHandler
{
    public static readonly PlatformRenderProcessMessageHandler Instance = new();

    public void OnContextCreated(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame)
    {
        if (frame.IsMain)
            frame.ExecuteJavaScriptAsync("window.WINDOWS = true; window.LINUX = false;");
    }

    public void OnContextReleased(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame)
    {
    }

    public void OnFocusedNodeChanged(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IDomNode node)
    {
    }

    public void OnUncaughtException(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame,
        JavascriptException exception)
    {
    }
}
