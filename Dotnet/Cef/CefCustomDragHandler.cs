using CefSharp.Enums;
using CefSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VRCX
{
    /// <summary>
    /// This class is used to 'handle' drag and drop events.
    /// All it does is call a function in the app with the file name of the file being dragged into the window, since chromium doesn't have access to the full file path on regular drop events.
    /// </summary>
    public class CustomDragHandler : IDragHandler
    {
        public bool OnDragEnter(IWebBrowser chromiumWebBrowser, IBrowser browser, IDragData dragData, DragOperationsMask mask)
        {
            if (dragData.IsFile && dragData.FilePaths != null && dragData.FilePaths.Count > 0)
            {
                string file = dragData.FilePaths[0];
                if (!file.EndsWith(".png") && !file.EndsWith(".jpg") && !file.EndsWith(".jpeg"))
                {
                    dragData.Dispose();
                    return true;
                }

                // forgive me father for i have sinned once again
                Program.AppApiInstance.ExecuteAppFunction("dragEnterCef", file);
                dragData.Dispose();
                return false;
            }

            dragData.Dispose();
            return true;
        }

        public void OnDraggableRegionsChanged(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IList<DraggableRegion> regions)
        {

        }
    }
}
