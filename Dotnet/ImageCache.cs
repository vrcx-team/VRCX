using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace VRCX
{
    class ImageCache
    {
        private static readonly string cacheLocation = Path.Combine(Program.AppDataDirectory, "ImageCache");
        private static readonly HttpClientHandler httpClientHandler = new HttpClientHandler(){ Proxy = WebApi.Proxy };
        private static readonly HttpClient httpClient = new HttpClient(httpClientHandler);
        private static readonly List<string> _imageHosts =
        [
            "api.vrchat.cloud",
            "files.vrchat.cloud",
            "d348imysud55la.cloudfront.net",
            "assets.vrchat.com"
        ];

        public static async Task<string> GetImage(string url, string fileId, string version)
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

            var uri = new Uri(url);
            if (!_imageHosts.Contains(uri.Host))
                throw new ArgumentException("Invalid image host", url);
            
            var cookieString = string.Empty;
            if (WebApi.Instance != null && WebApi.Instance._cookieContainer != null)
            {
                CookieCollection cookies = WebApi.Instance._cookieContainer.GetCookies(new Uri("https://api.vrchat.cloud"));
                foreach (Cookie cookie in cookies)
                    cookieString += $"{cookie.Name}={cookie.Value};";
            }
            
            var request = new HttpRequestMessage(HttpMethod.Get, url)
            {
                Headers =
                {
                    { "Cookie", cookieString },
                    { "User-Agent", Program.Version }
                }
            };
            using (var response = await httpClient.SendAsync(request))
            {
                response.EnsureSuccessStatusCode();
                await using (var fileStream = new FileStream(fileLocation, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await response.Content.CopyToAsync(fileStream);
                }
            }

            var cacheSize = Directory.GetDirectories(cacheLocation).Length;
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