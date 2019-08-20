// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using CefSharp.OffScreen;
using SharpDX.Direct3D11;
using System.Drawing;
using System.Threading;

namespace VRCX
{
    public class Browser : ChromiumWebBrowser
    {
        private readonly ReaderWriterLockSlim m_Lock = new ReaderWriterLockSlim();
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
            RenderHandler = new RenderHandler(this, m_Lock);
            var options = new BindingOptions()
            {
                CamelCaseJavascriptNames = false
            };
            JavascriptObjectRepository.Register("VRCX", new VRCX(), true, options);
            JavascriptObjectRepository.Register("VRCXStorage", new VRCXStorage(), false, options);
            JavascriptObjectRepository.Register("SQLite", new SQLite(), true, options);
        }

        public new void Dispose()
        {
            RenderHandler.Dispose();
            RenderHandler = null;
            base.Dispose();
        }

        public void Render()
        {
            m_Lock.EnterReadLock();
            try
            {
                var H = (RenderHandler)RenderHandler;
                if (H.Buffer.IsAllocated)
                {
                    var context = m_Texture.Device.ImmediateContext;
                    var box = context.MapSubresource(m_Texture, 0, MapMode.WriteDiscard, MapFlags.None);
                    if (!box.IsEmpty)
                    {
                        if (box.RowPitch == H.Width * 4)
                        {
                            WinApi.CopyMemory(box.DataPointer, H.Buffer.AddrOfPinnedObject(), (uint)H.BufferSize);
                        }
                        else
                        {
                            var dest = box.DataPointer;
                            var src = H.Buffer.AddrOfPinnedObject();
                            var pitch = box.RowPitch;
                            var length = H.Width * 4;
                            var height = H.Height;
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
            finally
            {
                m_Lock.ExitReadLock();
            }
        }
    }
}