using CefSharp;
using CefSharp.Enums;
using CefSharp.OffScreen;
using CefSharp.Structs;
using System;
using System.Runtime.InteropServices;
using System.Threading;
using NLog;
using Silk.NET.Core.Native;
using Silk.NET.Direct3D11;
using Range = CefSharp.Structs.Range;

namespace VRCX;

public class OffScreenBrowser : ChromiumWebBrowser, IRenderHandler
{
    // new
    private ComPtr<ID3D11Device1> _device1;
    private ComPtr<ID3D11DeviceContext> _deviceContext;
    private ComPtr<ID3D11Query> _query;
    private ComPtr<ID3D11Texture2D> _renderTarget;
    
    // legacy
    private readonly bool _isLegacy;
    private readonly ReaderWriterLockSlim _paintBufferLock = new();
    private GCHandle _paintBuffer;
    private int _width;
    private int _height;   

    private static readonly Logger logger = LogManager.GetCurrentClassLogger();

    public OffScreenBrowser(string address, int width, int height, bool isLegacy)
        : base(address, automaticallyCreateBrowser: false)
    {
        _isLegacy = isLegacy;
        var windowInfo = new WindowInfo();
        windowInfo.SetAsWindowless(IntPtr.Zero);
        windowInfo.WindowlessRenderingEnabled = true;
        windowInfo.SharedTextureEnabled = !_isLegacy;
        windowInfo.Width = width;
        windowInfo.Height = height;

        var browserSettings = new BrowserSettings()
        {
            DefaultEncoding = "UTF-8",
            WindowlessFrameRate = !_isLegacy ? 60 : 24
        };

        CreateBrowser(windowInfo, browserSettings);

        Size = new System.Drawing.Size(width, height);
        RenderHandler = this;

        JavascriptObjectRepository.NameConverter = null;
        JavascriptObjectRepository.Register("AppApiVr", AppApiVr.Instance);
    }

    // new
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
    
    // legacy
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
            if (_width <= 0 ||
                _height <= 0)
                return;

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
        finally
        {
            _paintBufferLock.ExitReadLock();
        }
    }

    public new void Dispose()
    {
        RenderHandler = null;
        base.Dispose();
        
        // legacy
        _paintBufferLock.EnterWriteLock();
        try
        {
            if (_paintBuffer.IsAllocated)
                _paintBuffer.Free();
        }
        finally
        {
            _paintBufferLock.ExitWriteLock();
        }
        _paintBufferLock.Dispose();
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

    // new
    void IRenderHandler.OnAcceleratedPaint(PaintElementType type, Rect dirtyRect, AcceleratedPaintInfo paintInfo)
    {
        if (_isLegacy)
            return;

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

    // legacy
    void IRenderHandler.OnPaint(PaintElementType type, Rect dirtyRect, IntPtr buffer, int width, int height)
    {
        if (!_isLegacy)
            return;

        if (type != PaintElementType.View)
            return;

        _paintBufferLock.EnterWriteLock();
        try
        {
            if (_width != width ||
                _height != height)
            {
                _width = width;
                _height = height;
                if (_paintBuffer.IsAllocated)
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