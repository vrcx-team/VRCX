using System;
using System.IO;
using System.Net;
using System.Linq;

namespace VRCX
{
    class ImageCache
    {
        private static readonly string cacheLocation = Path.Combine(Program.AppDataDirectory, "ImageCache");
        private static readonly WebClient webClient = new WebClient();

        private const string IMAGE_HOST1 = "api.vrchat.cloud";
        private const string IMAGE_HOST2 = "files.vrchat.cloud";
        private const string IMAGE_HOST3 = "d348imysud55la.cloudfront.net";

        public static string GetImage(string url, string fileId, string version)
        {
            var directoryLocation = Path.Combine(cacheLocation, fileId);
            var fileLocation = Path.Combine(directoryLocation, $"{version}.png");

            if (File.Exists(fileLocation))
            {
                Directory.SetLastWriteTimeUtc(directoryLocation, DateTime.UtcNow);
                return fileLocation;
            }

            if (Directory.Exists(directoryLocation))
                Directory.Delete(directoryLocation, true);
            Directory.CreateDirectory(directoryLocation);

            Uri uri = new Uri(url);
            if (uri.Host != IMAGE_HOST1 && uri.Host != IMAGE_HOST2 && uri.Host != IMAGE_HOST3)
                throw new ArgumentException("Invalid image host", url);
            
            string cookieString = string.Empty;
            if (WebApi.Instance != null && WebApi.Instance._cookieContainer != null)
            {
                CookieCollection cookies = WebApi.Instance._cookieContainer.GetCookies(new Uri($"https://{IMAGE_HOST1}"));
                foreach (Cookie cookie in cookies)
                    cookieString += $"{cookie.Name}={cookie.Value};";
            }

            webClient.Headers[HttpRequestHeader.Cookie] = cookieString;
            webClient.Headers[HttpRequestHeader.UserAgent] = Program.Version;
            webClient.DownloadFile(url, fileLocation);

            int cacheSize = Directory.GetDirectories(cacheLocation).Length;
            if (cacheSize > 1100)
                CleanImageCache();

            return fileLocation;
        }

        private static void CleanImageCache()
        {
            DirectoryInfo dirInfo = new DirectoryInfo(cacheLocation);
            var folders = dirInfo.GetDirectories().OrderByDescending(p => p.LastWriteTime).Skip(1000);
            foreach (DirectoryInfo folder in folders)
            {
                folder.Delete(true);
            }
        }
    }
}