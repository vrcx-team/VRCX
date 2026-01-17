using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using NLog;

namespace VRCX;

internal static class ImageCache
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    private static readonly string cacheLocation;
    private static readonly HttpClient httpClient;
    private static readonly List<string> ImageHosts =
    [
        "api.vrchat.cloud",
        "files.vrchat.cloud",
        "d348imysud55la.cloudfront.net",
        "assets.vrchat.com"
    ];

    static ImageCache()
    {
        cacheLocation = Path.Join(Program.AppDataDirectory, "ImageCache");
        var httpClientHandler = new HttpClientHandler();
        if (WebApi.ProxySet)
            httpClientHandler.Proxy = WebApi.Proxy;
            
        httpClient = new HttpClient(httpClientHandler);
        httpClient.DefaultRequestHeaders.Add("User-Agent", Program.Version);
    }
    
    public static void PopulateImageHosts(List<string> hosts)
    {
        foreach (var host in hosts)
        {
            if (string.IsNullOrEmpty(host))
                continue;
            
            var uri = new Uri(host);
            if (string.IsNullOrEmpty(uri.Host))
                continue;
            
            if (!ImageHosts.Contains(uri.Host))
                ImageHosts.Add(uri.Host);
        }
    }

    private static async Task<Stream> FetchImage(string url)
    {
        var uri = new Uri(url);
        if (!ImageHosts.Contains(uri.Host))
            throw new ArgumentException("Invalid image host", url);
            
        var cookieString = string.Empty;
        if (WebApi.Instance != null &&
            WebApi.Instance.CookieContainer != null &&
            uri.Host == "api.vrchat.cloud")
        {
            CookieCollection cookies = WebApi.Instance.CookieContainer.GetCookies(new Uri("https://api.vrchat.cloud"));
            foreach (Cookie cookie in cookies)
                cookieString += $"{cookie.Name}={cookie.Value};";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrEmpty(cookieString))
            request.Headers.Add("Cookie", cookieString);

        var response = await httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStreamAsync();
    }

    public static async Task<string> GetImage(string url, string fileId, string version)
    {
        var directoryLocation = Path.Join(cacheLocation, fileId);
        var fileLocation = Path.Join(directoryLocation, $"{version}.png");
        
        if (File.Exists(fileLocation) && new FileInfo(fileLocation).Length > 0)
        {
            Directory.SetLastWriteTimeUtc(directoryLocation, DateTime.UtcNow);
            return fileLocation;
        }

        if (Directory.Exists(directoryLocation))
            Directory.Delete(directoryLocation, true);
        Directory.CreateDirectory(directoryLocation);

        try
        {
            await using var stream = await FetchImage(url);
            await using var fileStream =
                new FileStream(fileLocation, FileMode.Create, FileAccess.Write, FileShare.None);
            await stream.CopyToAsync(fileStream);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Failed to fetch image");
            return string.Empty;
        }

        var cacheSize = Directory.GetDirectories(cacheLocation).Length;
        if (cacheSize > 1100)
            CleanImageCache();

        return fileLocation;
    }

    public static async Task SaveImageToFile(string url, string path)
    {
        await using var stream = await FetchImage(url);
        await using var fileStream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream);
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
}