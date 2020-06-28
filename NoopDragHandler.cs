// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Collections.Generic;
using CefSharp;
using CefSharp.Enums;

namespace VRCX
{
    public class NoopDragHandler : IDragHandler
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