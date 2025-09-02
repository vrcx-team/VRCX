using System.IO.Pipes;
using System.Text;
using System.Threading.Tasks;

namespace VRCX;

public class VRCIPC
{
    private const string PipeName = "VRChatURLLaunchPipe";
    private static NamedPipeClientStream _ipcClient;
    
    private static void TryConnect()
    {
        if (_ipcClient != null && _ipcClient.IsConnected)
            return;
        
        _ipcClient = new NamedPipeClientStream(".", PipeName, PipeDirection.InOut);
        _ipcClient.Connect(1000);
    }
    
    public static async Task<bool> Send(string message)
    {
        TryConnect();
        if (_ipcClient == null || !_ipcClient.IsConnected)
        {
            Dispose();
            return false;
        }
        
        var bytes = Encoding.UTF8.GetBytes(message);
        _ipcClient.Write(bytes, 0, bytes.Length);
        var result = new byte[1];
        await _ipcClient.ReadExactlyAsync(result, 0, 1);
        Dispose();
        return result[0] == 1;
    }

    private static void Dispose()
    {
        _ipcClient?.Close();
        _ipcClient = null;
    }
}