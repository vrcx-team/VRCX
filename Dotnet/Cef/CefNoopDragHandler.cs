using System.Collections.Generic;
using CefSharp;
using CefSharp.Enums;

namespace VRCX
{
    public class CefNoopDragHandler : IDragHandler
    {
        bool IDragHandler.OnDragEnter(IWebBrowser chromiumWebBrowser, IBrowser browser, IDragData dragData, DragOperationsMask mask)
        {
            return true;
        }

        void IDragHandler.OnDraggableRegionsChanged(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IList<DraggableRegion> regions)
        {
        }
    }
}
