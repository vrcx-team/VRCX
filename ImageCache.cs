using System;
using System.IO;
using System.Net;
using System.Linq;

namespace VRCX
{
    class ImageCache
    {
        private static readonly string cacheLocation = Path.Combine(Program.AppDataDirectory, "ImageCache");

        public static string GetImage(string url, string fileId, string version, string appVersion)
        {
            var imageHost = "api.vrchat.cloud";
            var imageHost1 = "files.vrchat.cloud";
            var imageHost2 = "d348imysud55la.cloudfront.net";
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

            Uri uri = new Uri(url);
            if (uri.Host != imageHost && uri.Host != imageHost1 && uri.Host != imageHost2)
                throw new ArgumentException("Invalid image host", url);

            using (var client = new WebClient())
            {
                string cookieString = String.Empty;
                if (WebApi.Instance != null && WebApi.Instance._cookieContainer != null)
                {
                    CookieCollection cookies = WebApi.Instance._cookieContainer.GetCookies(new Uri($"https://{imageHost}"));
                    foreach (Cookie cookie in cookies)
                        cookieString += $"{cookie.Name}={cookie.Value};";
                }

                client.Headers.Add(HttpRequestHeader.Cookie, cookieString);
                client.Headers.Add("user-agent", appVersion);
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