// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.Enums;
using CefSharp.OffScreen;
using CefSharp.Structs;
using System;
using System.Threading;
using NLog;
using Silk.NET.Core.Native;
using Silk.NET.Direct3D11;
using Range = CefSharp.Structs.Range;

namespace VRCX
{
    public class OffScreenBrowser : ChromiumWebBrowser, IRenderHandler
    {
        private ComPtr<ID3D11Device1> _device1;
        private ComPtr<ID3D11DeviceContext> _deviceContext;
        private ComPtr<ID3D11Query> _query;
        private ComPtr<ID3D11Texture2D> _renderTarget;

        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

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

        public void UpdateRender(ComPtr<ID3D11Device> device, ComPtr<ID3D11DeviceContext> deviceContext, ComPtr<ID3D11Texture2D> renderTarget)
        {
            _device1.Dispose();
            _device1 = device.QueryInterface<ID3D11Device1>();
            _deviceContext = deviceContext;
            _renderTarget = renderTarget;

            _query.Dispose();
            device.CreateQuery(new QueryDesc
            {
                Query = Query.Event,
                MiscFlags = 0
            }, ref _query);
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

            unsafe
            {
                if ((IntPtr)_device1.Handle == IntPtr.Zero)
                    return;
                
                if ((IntPtr)_deviceContext.Handle == IntPtr.Zero)
                    return;
                
                if ((IntPtr)_query.Handle == IntPtr.Zero)
                    return;
                
                if ((IntPtr)_renderTarget.Handle == IntPtr.Zero)
                    return;
                
                _deviceContext.Begin(_query);
                using ComPtr<ID3D11Texture2D> cefTexture =
                    _device1.OpenSharedResource1<ID3D11Texture2D>(paintInfo.SharedTextureHandle.ToPointer());
                _deviceContext.CopyResource(_renderTarget, cefTexture);
                _deviceContext.End(_query);
                _deviceContext.Flush();
                
                while (_deviceContext.GetData(_query, IntPtr.Zero.ToPointer(), 0, 0) == 1)
                {
                    Thread.Yield();
                }
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
