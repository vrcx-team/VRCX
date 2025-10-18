// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Globalization;
using System.IO;
using System.IO.Pipes;
using System.Text;
using Newtonsoft.Json;

#if !LINUX
using CefSharp;
#endif


namespace VRCX
{
    public class IPCClient
    {
        private static readonly UTF8Encoding noBomEncoding = new UTF8Encoding(false, false);
        private readonly NamedPipeServerStream _ipcServer;
        private readonly byte[] _recvBuffer = new byte[1024 * 8];
        private readonly MemoryStream memoryStream;
        private readonly byte[] packetBuffer = new byte[1024 * 1024];
        private readonly Newtonsoft.Json.JsonSerializer serializer = new Newtonsoft.Json.JsonSerializer();
        private string _currentPacket = string.Empty;

        public IPCClient(NamedPipeServerStream ipcServer)
        {
            memoryStream = new MemoryStream(packetBuffer);
            serializer.Culture = CultureInfo.InvariantCulture;
            serializer.Formatting = Formatting.None;

            _ipcServer = ipcServer;
        }

        public void BeginRead()
        {
            _ipcServer.BeginRead(_recvBuffer, 0, _recvBuffer.Length, OnRead, _ipcServer);
        }

        public void Send(IPCPacket ipcPacket)
        {
            try
            {
                memoryStream.Seek(0, SeekOrigin.Begin);
                using (var streamWriter = new StreamWriter(memoryStream, noBomEncoding, 65535, true))
                using (var writer = new JsonTextWriter(streamWriter))
                {
                    serializer.Serialize(writer, ipcPacket);
                    streamWriter.Write((char)0x00);
                    streamWriter.Flush();
                }

                var length = (int)memoryStream.Position;
                _ipcServer?.BeginWrite(packetBuffer, 0, length, OnSend, null);
            }
            catch
            {
                IPCServer.Clients.Remove(this);
            }
        }

        private void OnRead(IAsyncResult asyncResult)
        {
            try
            {
                var bytesRead = _ipcServer.EndRead(asyncResult);

                if (bytesRead <= 0)
                {
                    IPCServer.Clients.Remove(this);
                    _ipcServer.Close();
                    return;
                }

                _currentPacket += Encoding.UTF8.GetString(_recvBuffer, 0, bytesRead);

                int delimiterIdx;
                while ((delimiterIdx = _currentPacket.IndexOf((char)0x00)) != -1)
                {
                    var packet = _currentPacket.Substring(0, delimiterIdx);
                    _currentPacket = _currentPacket.Substring(delimiterIdx + 1);

                    if (string.IsNullOrEmpty(packet))
                        continue;

#if !LINUX
                    var browser = MainForm.Instance?.Browser;
                    if (browser == null || browser.IsLoading || !browser.CanExecuteJavascriptInMainFrame) continue;
                    // Dispatch IPC packet to the web app or queue if not ready.
                    const string script = 
                        """
                            (function(packet){
                                try {
                                    if (window?.$pinia?.vrcx) {
                                        window.$pinia.vrcx.ipcEvent(packet);
                                    } else {
                                        window.__ipcQueue = window.__ipcQueue ?? [];
                                        window.__ipcQueue.push(packet);
                                    }
                                } catch (e) {
                                    console.error('IPC dispatch error:', e);
                                }
                            })
                        """;
                    browser.ExecuteScriptAsync(script, packet);
#endif
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            BeginRead();
        }

        public static void OnSend(IAsyncResult asyncResult)
        {
            var ipcClient = (NamedPipeClientStream)asyncResult.AsyncState;
            ipcClient?.EndWrite(asyncResult);
        }

        public static void Close(IAsyncResult asyncResult)
        {
            var ipcClient = (NamedPipeClientStream)asyncResult.AsyncState;
            ipcClient?.EndWrite(asyncResult);
            ipcClient?.Close();
        }
    }
}