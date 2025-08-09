using System.Threading.Tasks;

namespace VRCX;

public partial class AppApi
{
    public async Task DownloadUpdate(string fileUrl, string hashString, int downloadSize)
    {
        await Update.DownloadUpdate(fileUrl, hashString, downloadSize);
    }

    public void CancelUpdate()
    {
        Update.CancelUpdate();
    }
    
    public int CheckUpdateProgress()
    {
        return Update.UpdateProgress;
    }
}