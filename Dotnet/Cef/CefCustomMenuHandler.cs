using CefSharp;

namespace VRCX
{
    public class CustomMenuHandler : IContextMenuHandler
    {
        public void OnBeforeContextMenu(IWebBrowser browserControl, IBrowser browser, IFrame frame, IContextMenuParams parameters, IMenuModel model)
        {
            if (!browser.IsSame(MainForm.Instance.Browser?.GetBrowser()))
            {
                // allow devtools
                return;
            }
            // remove default right click when not in debug mode
            if (!Program.LaunchDebug &&
                !parameters.TypeFlags.HasFlag(ContextMenuType.Selection) &&
                !parameters.TypeFlags.HasFlag(ContextMenuType.Editable))
                model.Clear();
        }

        public bool OnContextMenuCommand(IWebBrowser browserControl, IBrowser browser, IFrame frame, IContextMenuParams parameters, CefMenuCommand commandId, CefEventFlags eventFlags)
        {
            return false;
        }

        public void OnContextMenuDismissed(IWebBrowser browserControl, IBrowser browser, IFrame frame)
        {
        }

        public bool RunContextMenu(IWebBrowser browserControl, IBrowser browser, IFrame frame, IContextMenuParams parameters, IMenuModel model, IRunContextMenuCallback callback)
        {
            return false;
        }
    }
}