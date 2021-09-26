// Copyright(c) 2019-2021 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO.Pipes;

namespace VRCX
{
    class IPCServer
    {
        public static readonly IPCServer Instance;

        static IPCServer()
        {
            Instance = new IPCServer();
        }

        public void Init()
        {
            new IPCServer().CreateIPCServer();
        }

        public void CreateIPCServer()
        {
            var ipcServer = new NamedPipeServerStream("vrcx-ipc", PipeDirection.InOut, NamedPipeServerStream.MaxAllowedServerInstances, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
            ipcServer.BeginWaitForConnection(asyncResult => DoAccept(asyncResult), ipcServer);
        }

        private void DoAccept(IAsyncResult asyncResult)
        {
            var ipcServer = (NamedPipeServerStream)asyncResult.AsyncState;

            try
            {
                ipcServer.EndWaitForConnection(asyncResult);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            new IPCClient(ipcServer).BeginRead();
            CreateIPCServer();
        }
    }
}
