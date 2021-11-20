using System;
using System.IO;
using System.Net;
using System.Linq;

namespace VRCX
{
    class ImageCache
    {
        private static readonly string cacheLocation = Path.Combine(Program.AppDataDirectory, "ImageCache");

        public static string GetImage(string url, string fileId, string version)
        {
            var directoryLocation = Path.Combine(cacheLocation, fileId);
            var fileLocation = Path.Combine(directoryLocation, $"{version}.png");

            if (File.Exists(fileLocation))
            {
                Directory.SetLastWriteTime(directoryLocation, DateTime.Now);
                return fileLocation;
            }

            if (Directory.Exists(directoryLocation))
                Directory.Delete(directoryLocation, true);
            Directory.CreateDirectory(directoryLocation);

            using (var client = new WebClient())
            {
                client.Headers.Add("user-agent", "VRCX");
                client.DownloadFile(url, fileLocation);
            }

            int cacheSize = Directory.GetDirectories(cacheLocation).Length;
            if (cacheSize > 1100)
                CleanImageCache();

            return fileLocation;
        }

        private static void CleanImageCache()
        {
            DirectoryInfo dirInfo = new DirectoryInfo(cacheLocation);
            var folders = dirInfo.GetDirectories().OrderBy(p => p.LastWriteTime);
            int i = 0;
            foreach (DirectoryInfo folder in folders.Reverse())
            {
                i++;
                if (i > 1000)
                    folder.Delete(true);
            }
        }
    }
}