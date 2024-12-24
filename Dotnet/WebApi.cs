using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Cookie = System.Net.Cookie;
using NLog;
using Timer = System.Threading.Timer;

#if !LINUX
using CefSharp;
using System.Windows.Forms;
#endif

namespace VRCX
{
    public class WebApi
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        public static readonly WebApi Instance;
        
        public static bool ProxySet;
        public static string ProxyUrl = "";
        public static IWebProxy Proxy = WebRequest.DefaultWebProxy;
        
        public CookieContainer _cookieContainer;
        private bool _cookieDirty;
        private Timer _timer;

        static WebApi()
        {
            Instance = new WebApi();
            ServicePointManager.DefaultConnectionLimit = 10;
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        }

        public WebApi()
        {
            _cookieContainer = new CookieContainer();
            _timer = new Timer(TimerCallback, null, -1, -1);
        }

        private void TimerCallback(object state)
        {
            try
            {
                SaveCookies();
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to save cookies: {e.Message}");
            }
        }

        public void Init()
        {
            SetProxy();
            LoadCookies();
            _timer.Change(1000, 1000);
        }

        private void SetProxy()
        {
            if (!string.IsNullOrEmpty(StartupArgs.LaunchArguments.ProxyUrl))
                ProxyUrl = StartupArgs.LaunchArguments.ProxyUrl;

            if (string.IsNullOrEmpty(ProxyUrl))
            {
                var proxyUrl = VRCXStorage.Instance.Get("VRCX_ProxyServer");
                if (!string.IsNullOrEmpty(proxyUrl))
                    ProxyUrl = proxyUrl;
            }

            if (string.IsNullOrEmpty(ProxyUrl))
                return;

            try
            {
                ProxySet = true;
                Proxy = new WebProxy(ProxyUrl);
            }
            catch (UriFormatException)
            {
                VRCXStorage.Instance.Set("VRCX_ProxyServer", string.Empty);
                var message = "The proxy server URI you used is invalid.\nVRCX will close, please correct the proxy URI.";
#if !LINUX
                MessageBox.Show(message, "Invalid Proxy URI", MessageBoxButton.OK);
#endif
                Logger.Error(message);
                Environment.Exit(0);
            }
        }

        public void Exit()
        {
            _timer.Change(-1, -1);
            SaveCookies();
        }

        public void ClearCookies()
        {
            _cookieContainer = new CookieContainer();
            SaveCookies();
        }

        private void LoadCookies()
        {
            SQLiteLegacy.Instance.ExecuteNonQuery("CREATE TABLE IF NOT EXISTS `cookies` (`key` TEXT PRIMARY KEY, `value` TEXT)");
            var values = SQLiteLegacy.Instance.Execute("SELECT `value` FROM `cookies` WHERE `key` = @key",
                new Dictionary<string, object>
                {
                    { "@key", "default" }
                }
            );
            try
            {
                var item = (object[])values.Item2[0];
                using var stream = new MemoryStream(Convert.FromBase64String((string)item[0]));
                _cookieContainer = new CookieContainer();
                _cookieContainer.Add(System.Text.Json.JsonSerializer.Deserialize<CookieCollection>(stream));
                // _cookieContainer = (CookieContainer)new BinaryFormatter().Deserialize(stream); // from .NET framework
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to load cookies: {e.Message}");
            }
        }

        private void SaveCookies()
        {
            if (_cookieDirty == false)
            {
                return;
            }
            foreach (Cookie cookie in _cookieContainer.GetAllCookies())
            {
                cookie.Expires = DateTime.MaxValue;
            }
            try
            {
                using (var memoryStream = new MemoryStream())
                {
                    System.Text.Json.JsonSerializer.Serialize(memoryStream, _cookieContainer.GetAllCookies());
                    //new BinaryFormatter().Serialize(memoryStream, _cookieContainer);
                    SQLiteLegacy.Instance.ExecuteNonQuery(
                        "INSERT OR REPLACE INTO `cookies` (`key`, `value`) VALUES (@key, @value)",
                        new Dictionary<string, object>() {
                            {"@key", "default"},
                            {"@value", Convert.ToBase64String(memoryStream.ToArray())}
                        }
                    );
                }
                _cookieDirty = false;
            }
            catch (Exception e)
            {
                Logger.Error($"Failed to save cookies: {e.Message}");
            }
        }

        public string GetCookies()
        {
            _cookieDirty = true; // force cookies to be saved for lastUserLoggedIn

            using var memoryStream = new MemoryStream();
            System.Text.Json.JsonSerializer.Serialize(memoryStream, _cookieContainer.GetAllCookies());
            return Convert.ToBase64String(memoryStream.ToArray());
        }

        public void SetCookies(string cookies)
        {
            using (var stream = new MemoryStream(Convert.FromBase64String(cookies)))
            {
                _cookieContainer = new CookieContainer();
                _cookieContainer.Add(System.Text.Json.JsonSerializer.Deserialize<CookieCollection>(stream));
            }

            _cookieDirty = true; // force cookies to be saved for lastUserLoggedIn
        }

        private static async Task LegacyImageUpload(HttpWebRequest request, IDictionary<string, object> options)
        {
            if (ProxySet)
                request.Proxy = Proxy;

            request.AutomaticDecompression = DecompressionMethods.All;
            request.Method = "POST";
            string boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            request.ContentType = "multipart/form-data; boundary=" + boundary;
            Stream requestStream = request.GetRequestStream();
            if (options.TryGetValue("postData", out object postDataObject) == true)
            {
                Dictionary<string, string> postData = new Dictionary<string, string>();
                postData.Add("data", (string)postDataObject);
                string FormDataTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"\r\n\r\n{2}\r\n";
                foreach (string key in postData.Keys)
                {
                    string item = string.Format(FormDataTemplate, boundary, key, postData[key]);
                    byte[] itemBytes = Encoding.UTF8.GetBytes(item);
                    await requestStream.WriteAsync(itemBytes, 0, itemBytes.Length);
                }
            }
            var imageData = options["imageData"] as string;
            byte[] fileToUpload = Program.AppApiInstance.ResizeImageToFitLimits(Convert.FromBase64String(imageData), false);
            string fileFormKey = "image";
            string fileName = "image.png";
            string fileMimeType = "image/png";
            string HeaderTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"; filename=\"{2}\"\r\nContent-Type: {3}\r\n\r\n";
            string header = string.Format(HeaderTemplate, boundary, fileFormKey, fileName, fileMimeType);
            byte[] headerbytes = Encoding.UTF8.GetBytes(header);
            await requestStream.WriteAsync(headerbytes, 0, headerbytes.Length);
            using (MemoryStream fileStream = new MemoryStream(fileToUpload))
            {
                byte[] buffer = new byte[1024];
                int bytesRead = 0;
                while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                {
                    await requestStream.WriteAsync(buffer, 0, bytesRead);
                }
                fileStream.Close();
            }
            byte[] newlineBytes = Encoding.UTF8.GetBytes("\r\n");
            await requestStream.WriteAsync(newlineBytes, 0, newlineBytes.Length);
            byte[] endBytes = Encoding.UTF8.GetBytes("--" + boundary + "--");
            await requestStream.WriteAsync(endBytes, 0, endBytes.Length);
            requestStream.Close();
        }

        private static async Task UploadFilePut(HttpWebRequest request, IDictionary<string, object> options)
        {
            if (ProxySet)
                request.Proxy = Proxy;

            request.AutomaticDecompression = DecompressionMethods.All;
            request.Method = "PUT";
            request.ContentType = options["fileMIME"] as string;
            var fileData = options["fileData"] as string;
            var sentData = Convert.FromBase64CharArray(fileData.ToCharArray(), 0, fileData.Length);
            request.ContentLength = sentData.Length;
            using (var sendStream = request.GetRequestStream())
            {
                await sendStream.WriteAsync(sentData, 0, sentData.Length);
                sendStream.Close();
            }
        }
        
        private static async Task ImageUpload(HttpWebRequest request, IDictionary<string, object> options)
        {
            if (ProxySet)
                request.Proxy = Proxy;

            request.AutomaticDecompression = DecompressionMethods.All;
            request.Method = "POST";
            string boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            request.ContentType = "multipart/form-data; boundary=" + boundary;
            Stream requestStream = request.GetRequestStream();
            if (options.TryGetValue("postData", out object postDataObject))
            {
                var jsonPostData = (JObject)JsonConvert.DeserializeObject((string)postDataObject);
                string formDataTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"\r\n\r\n{2}\r\n";
                if (jsonPostData != null)
                {
                    foreach (var data in jsonPostData)
                    {
                        string item = string.Format(formDataTemplate, boundary, data.Key, data.Value);
                        byte[] itemBytes = Encoding.UTF8.GetBytes(item);
                        await requestStream.WriteAsync(itemBytes, 0, itemBytes.Length);
                    }
                }
            }
            var imageData = options["imageData"] as string;
            var matchingDimensions = options["matchingDimensions"] as bool? ?? false;
            byte[] fileToUpload = Program.AppApiInstance.ResizeImageToFitLimits(Convert.FromBase64String(imageData), matchingDimensions);

            string fileFormKey = "file";
            string fileName = "blob";
            string fileMimeType = "image/png";
            string HeaderTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"; filename=\"{2}\"\r\nContent-Type: {3}\r\n\r\n";
            string header = string.Format(HeaderTemplate, boundary, fileFormKey, fileName, fileMimeType);
            byte[] headerbytes = Encoding.UTF8.GetBytes(header);
            await requestStream.WriteAsync(headerbytes, 0, headerbytes.Length);
            using (MemoryStream fileStream = new MemoryStream(fileToUpload))
            {
                byte[] buffer = new byte[1024];
                int bytesRead = 0;
                while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                {
                    await requestStream.WriteAsync(buffer, 0, bytesRead);
                }
                fileStream.Close();
            }
            byte[] newlineBytes = Encoding.UTF8.GetBytes("\r\n");
            await requestStream.WriteAsync(newlineBytes, 0, newlineBytes.Length);
            byte[] endBytes = Encoding.UTF8.GetBytes("--" + boundary + "--");
            await requestStream.WriteAsync(endBytes, 0, endBytes.Length);
            requestStream.Close();
        }
        
        private static async Task PrintImageUpload(HttpWebRequest request, IDictionary<string, object> options)
        {
            if (ProxySet)
                request.Proxy = Proxy;

            request.AutomaticDecompression = DecompressionMethods.All;
            request.Method = "POST";
            var boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            request.ContentType = "multipart/form-data; boundary=" + boundary;
            var requestStream = request.GetRequestStream();
            var imageData = options["imageData"] as string;
            var fileToUpload = Program.AppApiInstance.ResizePrintImage(Convert.FromBase64String(imageData));
            const string fileFormKey = "image";
            const string fileName = "image";
            const string fileMimeType = "image/png";
            var fileSize = fileToUpload.Length;
            const string headerTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"; filename=\"{2}\"\r\nContent-Type: {3}\r\nContent-Length: {4}\r\n";
            var header = string.Format(headerTemplate, boundary, fileFormKey, fileName, fileMimeType, fileSize);
            var headerBytes = Encoding.UTF8.GetBytes(header);
            await requestStream.WriteAsync(headerBytes);
            var newlineBytes = Encoding.UTF8.GetBytes("\r\n");
            await requestStream.WriteAsync(newlineBytes);
            using (var fileStream = new MemoryStream(fileToUpload))
            {
                var buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                {
                    await requestStream.WriteAsync(buffer.AsMemory(0, bytesRead));
                }
                fileStream.Close();
            }
            const string textContentType = "text/plain; charset=utf-8";
            const string formDataTemplate = "--{0}\r\nContent-Disposition: form-data; name=\"{1}\"\r\nContent-Type: {2}\r\nContent-Length: {3}\r\n\r\n{4}\r\n";
            await requestStream.WriteAsync(newlineBytes);
            if (options.TryGetValue("postData", out var postDataObject))
            {
                var jsonPostData = JsonConvert.DeserializeObject<Dictionary<string, string>>(postDataObject.ToString());
                if (jsonPostData != null)
                {
                    foreach (var (key, value) in jsonPostData)
                    {
                        var section = string.Format(formDataTemplate, boundary, key, textContentType, value.Length, value);
                        var sectionBytes = Encoding.UTF8.GetBytes(section);
                        await requestStream.WriteAsync(sectionBytes);
                    }
                }
            }
            var endBytes = Encoding.UTF8.GetBytes("--" + boundary + "--");
            await requestStream.WriteAsync(endBytes);
            requestStream.Close();
        }

#pragma warning disable CS4014

        public async void Execute(IDictionary<string, object> options, IJavascriptCallback callback)
        {
            try
            {
#pragma warning disable SYSLIB0014 // Type or member is obsolete
                var request = WebRequest.CreateHttp((string)options["url"]);
#pragma warning restore SYSLIB0014 // Type or member is obsolete
                if (ProxySet)
                    request.Proxy = Proxy;
                
                request.CookieContainer = _cookieContainer;
                request.KeepAlive = true;
                request.UserAgent = Program.Version;
                request.AutomaticDecompression = DecompressionMethods.All;

                if (options.TryGetValue("headers", out object headers))
                {
                    foreach (var header in (IEnumerable<KeyValuePair<string, object>>)headers)
                    {
                        var key = header.Key;
                        var value = header.Value.ToString();

                        if (string.Compare(key, "Content-Type", StringComparison.OrdinalIgnoreCase) == 0)
                        {
                            request.ContentType = value;
                        }
                        else if (string.Compare(key, "Referer", StringComparison.OrdinalIgnoreCase) == 0)
                        {
                            request.Referer = value;
                        }
                        else
                        {
                            request.Headers.Add(key, value);
                        }
                    }
                }

                if (options.TryGetValue("method", out object method))
                {
                    var _method = (string)method;
                    request.Method = _method;

                    if (string.Compare(_method, "GET", StringComparison.OrdinalIgnoreCase) != 0 &&
                        options.TryGetValue("body", out object body) == true)
                    {
                        using (var stream = await request.GetRequestStreamAsync())
                        using (var streamWriter = new StreamWriter(stream))
                        {
                            await streamWriter.WriteAsync((string)body);
                        }
                    }
                }
                
                if (options.TryGetValue("uploadImage", out _))
                {
                    await ImageUpload(request, options);
                }
                
                if (options.TryGetValue("uploadFilePUT", out _))
                {
                    await UploadFilePut(request, options);
                }

                if (options.TryGetValue("uploadImageLegacy", out _))
                {
                    await LegacyImageUpload(request, options);
                }
                
                if (options.TryGetValue("uploadImagePrint", out _))
                {
                    await PrintImageUpload(request, options);
                }

                try
                {
                    using (var response = await request.GetResponseAsync() as HttpWebResponse)
                    {
                        if (response.Headers["Set-Cookie"] != null)
                        {
                            _cookieDirty = true;
                        }
                        using (var stream = response.GetResponseStream())
                        using (var streamReader = new StreamReader(stream))
                        {
                            if (callback.CanExecute == true)
                            {
                                if (response.ContentType.Contains("image/") || response.ContentType.Contains("application/octet-stream"))
                                {
                                    // base64 response data for image
                                    using (var memoryStream = new MemoryStream())
                                    {
                                        await stream.CopyToAsync(memoryStream);
                                        callback.ExecuteAsync(null, new
                                        {
                                            data = $"data:image/png;base64,{Convert.ToBase64String(memoryStream.ToArray())}",
                                            status = response.StatusCode
                                        });
                                    }
                                }
                                else
                                {
                                    callback.ExecuteAsync(null, new
                                    {
                                        data = await streamReader.ReadToEndAsync(),
                                        status = response.StatusCode
                                    });
                                }
                            }
                        }
                    }
                }
                catch (WebException webException)
                {
                    if (webException.Response is HttpWebResponse response)
                    {
                        if (response.Headers["Set-Cookie"] != null)
                        {
                            _cookieDirty = true;
                        }
                        using (var stream = response.GetResponseStream())
                        using (var streamReader = new StreamReader(stream))
                        {
                            if (callback.CanExecute == true)
                            {
                                callback.ExecuteAsync(null, new
                                {
                                    data = await streamReader.ReadToEndAsync(),
                                    status = response.StatusCode
                                });
                            }
                        }
                    }
                    else if (callback.CanExecute == true)
                    {
                        callback.ExecuteAsync(webException.Message, null);
                    }
                }
            }
            catch (Exception e)
            {
                if (callback.CanExecute == true)
                {
                    // FIXME: 브라우저는 종료되었는데 얘는 이후에 실행되면 터짐
                    callback.ExecuteAsync(e.Message, null);
                }
            }

            callback.Dispose();
        }

#pragma warning restore CS4014
    }
}