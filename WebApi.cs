using CefSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.Serialization.Formatters.Binary;

namespace VRCX
{
    public class WebApi
    {
        private readonly string COOKIE_FILE_NAME = Path.Combine(Program.BaseDirectory, "cookies.dat");
        public static WebApi Instance { get; private set; }
        private CookieContainer _cookieContainer;

        static WebApi()
        {
            Instance = new WebApi();
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        }

        public WebApi()
        {
            _cookieContainer = new CookieContainer();
        }

        internal void Init()
        {
            try
            {
                using (var file = File.Open(COOKIE_FILE_NAME, FileMode.Open, FileAccess.Read))
                {
                    _cookieContainer = (CookieContainer)new BinaryFormatter().Deserialize(file);
                }
            }
            catch
            {
            }
        }

        internal void Exit()
        {
            try
            {
                using (var file = File.Open(COOKIE_FILE_NAME, FileMode.Create, FileAccess.Write))
                {
                    new BinaryFormatter().Serialize(file, _cookieContainer);
                }
            }
            catch
            {
            }
        }

        public void ClearCookies()
        {
            _cookieContainer = new CookieContainer();
        }

#pragma warning disable CS4014
        public async void Execute(IDictionary<string, object> options, IJavascriptCallback callback)
        {
            try
            {
                var request = WebRequest.CreateHttp((string)options["url"]);
                request.CookieContainer = _cookieContainer;
                request.KeepAlive = true;

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
                        else if (string.Compare(key, "User-Agent", StringComparison.OrdinalIgnoreCase) == 0)
                        {
                            request.UserAgent = value;
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

                try
                {
                    using (var response = await request.GetResponseAsync() as HttpWebResponse)
                    using (var stream = response.GetResponseStream())
                    using (var streamReader = new StreamReader(stream))
                    {
                        callback.ExecuteAsync(null, new
                        {
                            data = await streamReader.ReadToEndAsync(),
                            status = response.StatusCode
                        });
                    }
                }
                catch (WebException webException)
                {
                    if (webException.Response is HttpWebResponse response)
                    {
                        using (var stream = response.GetResponseStream())
                        using (var streamReader = new StreamReader(stream))
                        {
                            callback.ExecuteAsync(null, new
                            {
                                data = await streamReader.ReadToEndAsync(),
                                status = response.StatusCode
                            });
                        }
                    }
                    else
                    {
                        callback.ExecuteAsync(webException.Message, null);
                    }
                }
            }
            catch (Exception e)
            {
                callback.ExecuteAsync(e.Message, null);
            }

            callback.Dispose();
        }
#pragma warning restore CS4014
    }
}
