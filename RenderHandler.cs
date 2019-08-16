// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Runtime.InteropServices;
using CefSharp;
using CefSharp.Enums;
using CefSharp.OffScreen;
using CefSharp.Structs;

namespace VRCX
{
    public class RenderHandler : IRenderHandler
    {
        private ChromiumWebBrowser m_Browser;
        public readonly object BufferLock = new object();
        public int BufferSize { get; private set; }
        public GCHandle Buffer { get; private set; }
        public int Width { get; private set; }
        public int Height { get; private set; }

        public RenderHandler(ChromiumWebBrowser browser)
        {
            m_Browser = browser;
        }

        public void Dispose()
        {
            lock (BufferLock)
            {
                if (Buffer.IsAllocated)
                {
                    Buffer.Free();
                }
            }
            m_Browser = null;
        }

        public virtual ScreenInfo? GetScreenInfo()
        {
            return new ScreenInfo { DeviceScaleFactor = 1f };
        }

        public virtual Rect GetViewRect()
        {
            return new Rect(0, 0, m_Browser.Size.Width, m_Browser.Size.Height);
        }

        public virtual bool GetScreenPoint(int viewX, int viewY, out int screenX, out int screenY)
        {
            screenX = viewX;
            screenY = viewY;
            return false;
        }

        public virtual void OnAcceleratedPaint(PaintElementType type, Rect dirtyRect, IntPtr sharedHandle)
        {
            // NOT USED
        }

        public virtual void OnPaint(PaintElementType type, Rect dirtyRect, IntPtr buffer, int width, int height)
        {
            if (type == PaintElementType.View)
            {
                lock (BufferLock)
                {
                    if (!Buffer.IsAllocated ||
                        width != Width ||
                        height != Height)
                    {
                        Width = width;
                        Height = height;
                        BufferSize = width * height * 4;
                        if (Buffer.IsAllocated)
                        {
                            Buffer.Free();
                        }
                        Buffer = GCHandle.Alloc(new byte[BufferSize], GCHandleType.Pinned);
                    }
                    WinApi.CopyMemory(Buffer.AddrOfPinnedObject(), buffer, (uint)BufferSize);
                }
            }
        }

        public virtual void OnCursorChange(IntPtr cursor, CursorType type, CursorInfo customCursorInfo)
        {
        }

        public virtual bool StartDragging(IDragData dragData, DragOperationsMask mask, int x, int y)
        {
            return false;
        }

        public virtual void UpdateDragCursor(DragOperationsMask operation)
        {
        }

        public virtual void OnPopupShow(bool show)
        {
        }

        public virtual void OnPopupSize(Rect rect)
        {
        }

        public virtual void OnImeCompositionRangeChanged(Range selectedRange, Rect[] characterBounds)
        {
        }

        public virtual void OnVirtualKeyboardRequested(IBrowser browser, TextInputMode inputMode)
        {
        }
    }
}