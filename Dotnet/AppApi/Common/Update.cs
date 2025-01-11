using System.Threading.Tasks;

namespace VRCX;

public partial class AppApi
{
    public async Task DownloadUpdate(string fileUrl, string fileName, string hashUrl, int downloadSize)
    {
        await Update.DownloadUpdate(fileUrl, fileName, hashUrl, downloadSize);
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