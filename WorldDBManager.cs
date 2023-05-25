using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;
using CefSharp;
using Newtonsoft.Json;

namespace VRCX
{
    public class WorldDBManager
    {
        public static WorldDBManager Instance;
        private readonly HttpListener listener;
        private readonly WorldDatabase worldDB;

        private string currentWorldId = null;

        public WorldDBManager(string url)
        {
            Instance = this;
            // http://localhost:32767
            listener = new HttpListener();
            listener.Prefixes.Add(url);

            worldDB = new WorldDatabase(Path.Combine(Program.AppDataDirectory, "VRCX-WorldData.db"));
        }

        public async Task Start()
        {
            listener.Start();

            while (true)
            {
                var context = await listener.GetContextAsync();
                var request = context.Request;
                var responseData = new WorldDataRequestResponse(false, null, null);

                if (MainForm.Instance?.Browser == null)
                {
                    responseData.Error = "VRCX not yet initialized. Try again in a moment.";
                    SendJsonResponse(context.Response, responseData);
                    continue;
                };

                switch (request.Url.LocalPath)
                {
                    case "/vrcx/init":
                        if (request.QueryString["debug"] == "true")
                        {
                            worldDB.AddWorld("wrld_12345", "12345");
                            worldDB.AddDataEntry("wrld_12345", "test", "testvalue");

                            currentWorldId = "wrld_12345";
                            responseData.OK = true;
                            responseData.Data = "12345";
                            SendJsonResponse(context.Response, responseData);
                            break;
                        }

                        string worldId = await GetCurrentWorldID();
                        currentWorldId = worldId;

                        var existsInDB = worldDB.DoesWorldExist(currentWorldId);
                        string connectionKey;

                        if (!existsInDB)
                        {
                            connectionKey = GenerateWorldConnectionKey(currentWorldId);
                            worldDB.AddWorld(currentWorldId, connectionKey);
                        }
                        else
                        {
                            connectionKey = worldDB.GetWorldConnectionKey(currentWorldId);
                        }

                        responseData.OK = true;
                        responseData.Data = connectionKey;
                        SendJsonResponse(context.Response, responseData);
                        break;
                    case "/vrcx/get":
                        // TODO: Fix currentWorldId not being reset when leaving a world, so the next world would be able to access the previous world's data if they failed to init first.
                        // How do I do that reliably? I dunno lol
                        var key = request.QueryString["key"];
                        if (key == null)
                        {
                            responseData.Error = "Missing key parameter.";
                            SendJsonResponse(context.Response, responseData, 400);
                            break;
                        }

                        if (String.IsNullOrEmpty(currentWorldId))
                        {
                            responseData.Error = "World ID not initialized.";
                            SendJsonResponse(context.Response, responseData, 400);
                            break;
                        }

                        var value = worldDB.GetDataEntry(currentWorldId, key);

                        if (value == null)
                        {
                            responseData.Error = $"No data found for key '{key}' under world id '{currentWorldId}'.";
                            SendJsonResponse(context.Response, responseData, 404);
                            break;
                        }

                        responseData.OK = true;
                        responseData.Data = value.Value;
                        SendJsonResponse(context.Response, responseData);
                        break;
                    case "/vrcx/getbulk":
                        // TODO: Implement
                        responseData.Error = "Not implemented.";
                        SendJsonResponse(context.Response, responseData, 501);
                        break;
                    default:
                        responseData.Error = "Invalid VRCX endpoint.";
                        SendJsonResponse(context.Response, responseData, 404);
                        break;
                }
            }

        }

        private string GenerateWorldConnectionKey(string worldId)
        {
            // This doesn't really *need* to be unique, just something a naughty world can't guess.
            // Even if they had another world's key, they wouldn't be able to access its data unless something went wrong.
            // We mainly just use this to make sure data requests in the log are initialized and coming from the same world that initialized the connection.
            // Even if this was abusable, we're talking vrchat here. No one is storing their credit cards in a world. At least, I hope not.

            return (worldId + Guid.NewGuid().ToString()).GetHashCode().ToString("x");
        }

        private async Task<string> GetCurrentWorldID()
        {
            JavascriptResponse funcResult = await MainForm.Instance.Browser.EvaluateScriptAsync("$app.API.actuallyGetCurrentLocation();", TimeSpan.FromSeconds(5));
            string worldId = funcResult?.Result?.ToString();

            if (String.IsNullOrEmpty(worldId))
            {
                // implement
                return null;
            }

            return worldId;
        }

        private HttpListenerResponse SendTextResponse(HttpListenerResponse response, string text, int statusCode = 200)
        {
            response.ContentType = "text/plain";
            response.StatusCode = statusCode;
            response.AddHeader("Cache-Control", "no-cache");

            var buffer = System.Text.Encoding.UTF8.GetBytes(text);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
            return response;
        }

        private HttpListenerResponse SendJsonResponse(HttpListenerResponse response, WorldDataRequestResponse responseData, int statusCode = 200)
        {
            response.ContentType = "application/json";
            response.StatusCode = statusCode;
            response.AddHeader("Cache-Control", "no-cache");

            responseData.StatusCode = statusCode;

            // Use newtonsoft.json to serialize WorldDataRequestResponse to json
            var json = JsonConvert.SerializeObject(responseData);
            var buffer = System.Text.Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
            return response;
        }

        public async void ProcessLogWorldDataRequest(string[] args)
        {
            string type = args[0];
            string key = args[1];
            string value = args[2];

            if (key == null || value == null) return; // TODO: Store error for "last error" request
            if (String.IsNullOrEmpty(currentWorldId)) return;

            var exists = worldDB.DoesWorldExist(currentWorldId);

            if (!exists)
            {
                worldDB.AddWorld(currentWorldId, GenerateWorldConnectionKey(currentWorldId));
            }

            worldDB.AddDataEntry(currentWorldId, key, value);
        }

        public void Stop()
        {
            listener.Stop();
            listener.Close();
            worldDB.Close();
        }
    }
}