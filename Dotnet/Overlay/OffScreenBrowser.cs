// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.Enums;
using CefSharp.OffScreen;
using CefSharp.Structs;
using SharpDX.Direct3D11;
using System;
using System.Threading;
using SharpDX.Direct3D;
using SharpDX.Mathematics.Interop;
using Range = CefSharp.Structs.Range;

namespace VRCX
{
    public class OffScreenBrowser : ChromiumWebBrowser, IRenderHandler
    {
        private Device _device;
        private Device1 _device1;
        private DeviceMultithread _deviceMultithread;
        private Query _query;
        private Texture2D _renderTarget;

        public OffScreenBrowser(string address, int width, int height)
            : base(address, automaticallyCreateBrowser: false)
        {
            var windowInfo = new WindowInfo();
            windowInfo.SetAsWindowless(IntPtr.Zero);
            windowInfo.WindowlessRenderingEnabled = true;
            windowInfo.SharedTextureEnabled = true;
            windowInfo.Width = width;
            windowInfo.Height = height;
            
            var browserSettings = new BrowserSettings()
            {
                DefaultEncoding = "UTF-8",
                WindowlessFrameRate = 60
            };
            
            CreateBrowser(windowInfo, browserSettings);

            Size = new System.Drawing.Size(width, height);
            RenderHandler = this;
            
            JavascriptBindings.ApplyVrJavascriptBindings(JavascriptObjectRepository);
        }

        public void UpdateRender(Device device, Texture2D renderTarget)
        {
            _device = device;
            _device1 = _device.QueryInterface<Device1>();
            
            _deviceMultithread?.Dispose();
            _deviceMultithread = _device.QueryInterfaceOrNull<DeviceMultithread>();
            _deviceMultithread?.SetMultithreadProtected(true);

            _renderTarget = renderTarget;
            
            _query?.Dispose();
            _query = new Query(_device, new QueryDescription
            {
                Type = QueryType.Event,
                Flags = QueryFlags.None
            });
        }

        public new void Dispose()
        {
            RenderHandler = null;
            base.Dispose();
        }

        ScreenInfo? IRenderHandler.GetScreenInfo()
        {
            return new ScreenInfo
            {
                DeviceScaleFactor = 1.0F
            };
        }

        bool IRenderHandler.GetScreenPoint(int viewX, int viewY, out int screenX, out int screenY)
        {
            screenX = viewX;
            screenY = viewY;
            return false;
        }

        Rect IRenderHandler.GetViewRect()
        {
            return new Rect(0, 0, Size.Width, Size.Height);
        }

        void IRenderHandler.OnAcceleratedPaint(PaintElementType type, Rect dirtyRect, AcceleratedPaintInfo paintInfo)
        {
            if (type != PaintElementType.View)
                return;

            if (_device == null)
                return;
            
            using Texture2D cefTexture = _device1.OpenSharedResource1<Texture2D>(paintInfo.SharedTextureHandle);
            _device.ImmediateContext.CopyResource(cefTexture, _renderTarget);
            _device.ImmediateContext.End(_query);
            _device.ImmediateContext.Flush();

            RawBool q = _device.ImmediateContext.GetData<RawBool>(_query, AsynchronousFlags.DoNotFlush);

            while (!q)
            {
                Thread.Yield();
                q = _device.ImmediateContext.GetData<RawBool>(_query, AsynchronousFlags.DoNotFlush);
            }
        }

        void IRenderHandler.OnCursorChange(IntPtr cursor, CursorType type, CursorInfo customCursorInfo)
        {
        }

        void IRenderHandler.OnImeCompositionRangeChanged(Range selectedRange, Rect[] characterBounds)
        {
        }

        void IRenderHandler.OnPaint(PaintElementType type, Rect dirtyRect, IntPtr buffer, int width, int height)
        {
        }

        void IRenderHandler.OnPopupShow(bool show)
        {
        }

        void IRenderHandler.OnPopupSize(Rect rect)
        {
        }

        void IRenderHandler.OnVirtualKeyboardRequested(IBrowser browser, TextInputMode inputMode)
        {
        }

        bool IRenderHandler.StartDragging(IDragData dragData, DragOperationsMask mask, int x, int y)
        {
            return false;
        }

        void IRenderHandler.UpdateDragCursor(DragOperationsMask operation)
        {
        }
    }
}
