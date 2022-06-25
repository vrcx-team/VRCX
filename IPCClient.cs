// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using CefSharp;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO.Pipes;
using System.Text;

namespace VRCX
{
    internal class IPCClient
    {
        private NamedPipeServerStream _ipcServer;
        private byte[] _recvBuffer = new byte[1024 * 8];
        private string _currentPacket;

        public IPCClient(NamedPipeServerStream ipcServer)
        {
            _ipcServer = ipcServer;
        }

        public void BeginRead()
        {
            _ipcServer.BeginRead(_recvBuffer, 0, _recvBuffer.Length, OnRead, _ipcServer);
        }

        private void OnRead(IAsyncResult asyncResult)
        {
            try
            {
                var bytesRead = _ipcServer.EndRead(asyncResult);

                if (bytesRead <= 0)
                {
                    _ipcServer.Close();
                    return;
                }

                _currentPacket += Encoding.UTF8.GetString(_recvBuffer, 0, bytesRead);

                if (_currentPacket[_currentPacket.Length - 1] == (char)0x00)
                {
                    var packets = _currentPacket.Split((char)0x00);

                    foreach (var packet in packets)
                    {
                        if (string.IsNullOrEmpty(packet))
                            continue;

                        MainForm.Instance.Browser.ExecuteScriptAsync("$app.ipcEvent", packet);
                    }

                    _currentPacket = string.Empty;
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
            ipcClient.EndWrite(asyncResult);
        }
    }
}