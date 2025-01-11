using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace VRCX;

internal static class ImageCache
{
    private static readonly string cacheLocation;
    private static readonly HttpClient httpClient;
    private static readonly List<string> _imageHosts =
    [
        "api.vrchat.cloud",
        "files.vrchat.cloud",
        "d348imysud55la.cloudfront.net",
        "assets.vrchat.com"
    ];

    static ImageCache()
    {
        cacheLocation = Path.Combine(Program.AppDataDirectory, "ImageCache");
        var httpClientHandler = new HttpClientHandler();
        if (WebApi.ProxySet)
            httpClientHandler.Proxy = WebApi.Proxy;
            
        httpClient = new HttpClient(httpClientHandler);
        httpClient.DefaultRequestHeaders.Add("User-Agent", Program.Version);
    }

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

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(cookieString))
            request.Headers.Add("Cookie", cookieString);
        
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
        var dirInfo = new DirectoryInfo(cacheLocation);
        var folders = dirInfo.GetDirectories().OrderByDescending(p => p.LastWriteTime).Skip(1000);
        foreach (var folder in folders)
        {
            folder.Delete(true);
        }
    }

    public static async Task<bool> SaveImageToFile(string url, string path)
    {
        var uri = new Uri(url);
        if (!_imageHosts.Contains(uri.Host))
            throw new ArgumentException("Invalid image host", url);
            
        var cookieString = string.Empty;
        if (WebApi.Instance != null && WebApi.Instance._cookieContainer != null)
        {
            var cookies = WebApi.Instance._cookieContainer.GetCookies(new Uri("https://api.vrchat.cloud"));
            foreach (Cookie cookie in cookies)
                cookieString += $"{cookie.Name}={cookie.Value};";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(cookieString))
            request.Headers.Add("Cookie", cookieString);
        
        using var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
            return false;

        await using var fileStream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        await response.Content.CopyToAsync(fileStream);
        return true;
    }
}