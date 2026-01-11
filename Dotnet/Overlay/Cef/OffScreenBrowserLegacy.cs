using CefSharp;
using CefSharp.Enums;
using CefSharp.OffScreen;
using CefSharp.Structs;
using System;
using System.Runtime.InteropServices;
using System.Threading;
using Silk.NET.Core.Native;
using Silk.NET.Direct3D11;
using Range = CefSharp.Structs.Range;

namespace VRCX
{
    public class OffScreenBrowserLegacy : ChromiumWebBrowser, IRenderHandler
    {
        private readonly ReaderWriterLockSlim _paintBufferLock;
        private GCHandle _paintBuffer;
        private int _width;
        private int _height;

        public OffScreenBrowserLegacy(string address, int width, int height)
            : base(address, automaticallyCreateBrowser: false)
        {
            _paintBufferLock = new ReaderWriterLockSlim();

            var windowInfo = new WindowInfo();
            windowInfo.SetAsWindowless(IntPtr.Zero);
            windowInfo.WindowlessRenderingEnabled = true;
            windowInfo.SharedTextureEnabled = false;
            windowInfo.Width = width;
            windowInfo.Height = height;

            var browserSettings = new BrowserSettings()
            {
                DefaultEncoding = "UTF-8",
                WindowlessFrameRate = 24
            };

            CreateBrowser(windowInfo, browserSettings);

            Size = new System.Drawing.Size(width, height);
            RenderHandler = this;

            JavascriptBindings.ApplyVrJavascriptBindings(JavascriptObjectRepository);
        }

        public new void Dispose()
        {
            RenderHandler = null;
            base.Dispose();

            _paintBufferLock.EnterWriteLock();
            try
            {
                if (_paintBuffer.IsAllocated == true)
                {
                    _paintBuffer.Free();
                }
            }
            finally
            {
                _paintBufferLock.ExitWriteLock();
            }

            _paintBufferLock.Dispose();
        }

        public void RenderToTexture(ComPtr<ID3D11DeviceContext> deviceContext, ComPtr<ID3D11Texture2D> texture)
        {
            // Safeguard against uninitialized texture
            unsafe
            {
                if ((IntPtr)texture.Handle == IntPtr.Zero)
                    return;
            }

            _paintBufferLock.EnterReadLock();
            try
            {
                if (_width > 0 &&
                    _height > 0)
                {
                    MappedSubresource mappedSubresource = default;
                    deviceContext.Map(texture, 0, Map.WriteDiscard, 0, ref mappedSubresource);
                    unsafe
                    {
                        if ((IntPtr)mappedSubresource.PData != IntPtr.Zero)
                        {
                            var sourcePtr = _paintBuffer.AddrOfPinnedObject();
                            var destinationPtr = (IntPtr)mappedSubresource.PData;
                            var pitch = _width * 4;
                            var rowPitch = mappedSubresource.RowPitch;
                            if (pitch == rowPitch)
                            {
                                WinApi.RtlCopyMemory(
                                    destinationPtr,
                                    sourcePtr,
                                    (uint)(_width * _height * 4)
                                );
                            }
                            else
                            {
                                for (var y = _height; y > 0; --y)
                                {
                                    WinApi.RtlCopyMemory(
                                        destinationPtr,
                                        sourcePtr,
                                        (uint)pitch
                                    );
                                    sourcePtr += pitch;
                                    destinationPtr += (IntPtr)rowPitch;
                                }
                            }
                        }

                        deviceContext.Unmap(texture, 0);
                    }
                }
            }
            finally
            {
                _paintBufferLock.ExitReadLock();
            }
        }

        ScreenInfo? IRenderHandler.GetScreenInfo()
        {
            return null;
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
            // NOT USED
        }

        void IRenderHandler.OnCursorChange(IntPtr cursor, CursorType type, CursorInfo customCursorInfo)
        {
        }

        void IRenderHandler.OnImeCompositionRangeChanged(Range selectedRange, Rect[] characterBounds)
        {
        }

        void IRenderHandler.OnPaint(PaintElementType type, Rect dirtyRect, IntPtr buffer, int width, int height)
        {
            if (type == PaintElementType.View)
            {
                _paintBufferLock.EnterWriteLock();
                try
                {
                    if (_width != width ||
                        _height != height)
                    {
                        _width = width;
                        _height = height;
                        if (_paintBuffer.IsAllocated == true)
                        {
                            _paintBuffer.Free();
                        }
                        _paintBuffer = GCHandle.Alloc(
                            new byte[_width * _height * 4],
                            GCHandleType.Pinned
                        );
                    }

                    WinApi.RtlCopyMemory(
                        _paintBuffer.AddrOfPinnedObject(),
                        buffer,
                        (uint)(width * height * 4)
                    );
                }
                finally
                {
                    _paintBufferLock.ExitWriteLock();
                }
            }
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
