// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.OffScreen;
using SharpDX.Direct3D11;
using System;
using System.Drawing;

namespace VRCX
{
    public class Browser : ChromiumWebBrowser
    {
        private Texture2D m_Texture;

        public Browser(Texture2D texture, string address)
            : base(address, new BrowserSettings()
            {
                DefaultEncoding = "UTF-8"
            })
        {
            m_Texture = texture;
            Size = new Size(texture.Description.Width, texture.Description.Height);
            RenderHandler.Dispose();
            RenderHandler = new RenderHandler(this);
            var options = new BindingOptions()
            {
                CamelCaseJavascriptNames = false
            };
            JavascriptObjectRepository.Register("VRCX", new VRCX(), true, options);
            JavascriptObjectRepository.Register("VRCXStorage", new VRCXStorage(), false, options);
        }

        public void Render()
        {
            var handler = (RenderHandler)RenderHandler;
            lock (handler.BufferLock)
            {
                if (handler.Buffer.IsAllocated)
                {
                    var context = m_Texture.Device.ImmediateContext;
                    var box = context.MapSubresource(m_Texture, 0, MapMode.WriteDiscard, MapFlags.None);
                    if (box.DataPointer != IntPtr.Zero)
                    {
                        var width = handler.Width;
                        var height = handler.Height;
                        if (box.RowPitch == width * 4)
                        {
                            WinApi.CopyMemory(box.DataPointer, handler.Buffer.AddrOfPinnedObject(), (uint)handler.BufferSize);
                        }
                        else
                        {
                            var dest = box.DataPointer;
                            var src = handler.Buffer.AddrOfPinnedObject();
                            var pitch = box.RowPitch;
                            var length = width * 4;
                            for (var i = 0; i < height; ++i)
                            {
                                WinApi.CopyMemory(dest, src, (uint)length);
                                dest += pitch;
                                src += length;
                            }
                        }
                    }
                    context.UnmapSubresource(m_Texture, 0);
                }
            }
        }
    }
}