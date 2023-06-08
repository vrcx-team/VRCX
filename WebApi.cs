using CefSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Threading;

namespace VRCX
{
    public class WebApi
    {
        public static readonly WebApi Instance;
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
            catch
            {
            }
        }

        internal void Init()
        {
            LoadCookies();
            _timer.Change(1000, 1000);
        }

        internal void Exit()
        {
            _timer.Change(-1, -1);
            SaveCookies();
        }

        public void ClearCookies()
        {
            _cookieContainer = new CookieContainer();
            SaveCookies();
        }

        internal void LoadCookies()
        {
            SQLiteLegacy.Instance.ExecuteNonQuery("CREATE TABLE IF NOT EXISTS `cookies` (`key` TEXT PRIMARY KEY, `value` TEXT)");
            SQLiteLegacy.Instance.Execute((values) =>
            {
                try
                {
                    using (var stream = new MemoryStream(Convert.FromBase64String((string)values[0])))
                    {
                        _cookieContainer = (CookieContainer)new BinaryFormatter().Deserialize(stream);
                    }
                }
                catch
                {
                }
            },
                "SELECT `value` FROM `cookies` WHERE `key` = @key",
                new Dictionary<string, object>() {
                    {"@key", "default"}
                }
            );
        }

        internal void SaveCookies()
        {
            if (_cookieDirty == false)
            {
                return;
            }
            try
            {
                using (var memoryStream = new MemoryStream())
                {
                    new BinaryFormatter().Serialize(memoryStream, _cookieContainer);
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
            catch
            {
            }
        }

        public string GetCookies()
        {
            _cookieDirty = true; // force cookies to be saved for lastUserLoggedIn

            using (var memoryStream = new MemoryStream())
            {
                new BinaryFormatter().Serialize(memoryStream, _cookieContainer);
                return Convert.ToBase64String(memoryStream.ToArray());
            }
        }

        public void SetCookies(string cookies)
        {
            using (var stream = new MemoryStream(Convert.FromBase64String(cookies)))
            {
                _cookieContainer = (CookieContainer)new BinaryFormatter().Deserialize(stream);
            }

            _cookieDirty = true; // force cookies to be saved for lastUserLoggedIn
        }

#pragma warning disable CS4014

        public async void Execute(IDictionary<string, object> options, IJavascriptCallback callback)
        {
            try
            {
                var request = WebRequest.CreateHttp((string)options["url"]);
                request.CookieContainer = _cookieContainer;
                request.KeepAlive = true;
                request.UserAgent = Program.Version;

                if (options.TryGetValue("headers", out object headers) == true)
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

                if (options.TryGetValue("method", out object method) == true)
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

                if (options.TryGetValue("uploadFilePUT", out object uploadImagePUT) == true)
                {
                    request.Method = "PUT";
                    request.ContentType = options["fileMIME"] as string;
                    var imageData = options["fileData"] as string;
                    byte[] sentData = Convert.FromBase64CharArray(imageData.ToCharArray(), 0, imageData.Length);
                    request.ContentLength = sentData.Length;
                    using (System.IO.Stream sendStream = request.GetRequestStream())
                    {
                        await sendStream.WriteAsync(sentData, 0, sentData.Length);
                        sendStream.Close();
                    }
                }

                if (options.TryGetValue("uploadImage", out object uploadImage) == true)
                {
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
                            byte[] itemBytes = System.Text.Encoding.UTF8.GetBytes(item);
                            await requestStream.WriteAsync(itemBytes, 0, itemBytes.Length);
                        }
                    }
                    var imageData = options["imageData"] as string;
                    byte[] fileToUpload = Convert.FromBase64CharArray(imageData.ToCharArray(), 0, imageData.Length);
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
                    byte[] endBytes = System.Text.Encoding.UTF8.GetBytes("--" + boundary + "--");
                    await requestStream.WriteAsync(endBytes, 0, endBytes.Length);
                    requestStream.Close();
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