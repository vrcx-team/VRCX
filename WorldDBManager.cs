using System.Linq;
using System.Text;
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
        private string lastError = null;

        public WorldDBManager(string url)
        {
            Instance = this;
            // http://localhost:22500
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

                if (MainForm.Instance?.Browser == null || MainForm.Instance.Browser.IsLoading || !MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                {
                    responseData.Error = "VRCX not yet initialized. Try again in a moment.";
                    responseData.StatusCode = 503;
                    SendJsonResponse(context.Response, responseData);
                    continue;
                };

                switch (request.Url.LocalPath)
                {
                    case "/vrcx/init":
                        responseData = await HandleInitRequest(context);
                        SendJsonResponse(context.Response, responseData);
                        break;
                    case "/vrcx/get":
                        responseData = await HandleDataRequest(context);
                        SendJsonResponse(context.Response, responseData);
                        break;
                    case "/vrcx/lasterror":
                        responseData.OK = lastError == null;
                        responseData.Data = lastError;
                        lastError = null;
                        SendJsonResponse(context.Response, responseData);
                        break;
                    case "/vrcx/getbulk":
                        responseData = await HandleBulkDataRequest(context);
                        SendJsonResponse(context.Response, responseData);
                        break;
                    default:
                        responseData.Error = "Invalid VRCX endpoint.";
                        responseData.StatusCode = 404;
                        SendJsonResponse(context.Response, responseData);
                        break;
                }
            }

        }

        private async Task<WorldDataRequestResponse> HandleInitRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var responseData = new WorldDataRequestResponse(false, null, null);

            if (request.QueryString["debug"] == "true")
            {
                if (!worldDB.DoesWorldExist("wrld_12345"))
                {
                    worldDB.AddWorld("wrld_12345", "12345");
                    worldDB.AddDataEntry("wrld_12345", "test", "testvalue");
                }

                currentWorldId = "wrld_12345";
                responseData.OK = true;
                responseData.StatusCode = 200;
                responseData.Data = "12345";
                return responseData;
            }

            string worldId = await GetCurrentWorldID();

            if (String.IsNullOrEmpty(worldId))
            {
                responseData.Error = "Failed to get/verify current world ID.";
                responseData.StatusCode = 500;
                return responseData;
            }

            currentWorldId = worldId;

            var existsInDB = worldDB.DoesWorldExist(currentWorldId);
            string connectionKey;

            if (!existsInDB)
            {
                connectionKey = GenerateWorldConnectionKey();
                worldDB.AddWorld(currentWorldId, connectionKey);
            }
            else
            {
                connectionKey = worldDB.GetWorldConnectionKey(currentWorldId);
            }

            responseData.OK = true;
            responseData.StatusCode = 200;
            responseData.Data = connectionKey;
            return responseData;
        }

        private async Task<WorldDataRequestResponse> HandleDataRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var responseData = new WorldDataRequestResponse(false, null, null);

            var key = request.QueryString["key"];
            if (key == null)
            {
                responseData.Error = "Missing key parameter.";
                responseData.StatusCode = 400;
                return responseData;
            }

            var worldId = await GetCurrentWorldID();

            if (String.IsNullOrEmpty(currentWorldId) || (worldId != currentWorldId && currentWorldId != "wrld_12345"))
            {
                responseData.Error = "World ID not initialized.";
                responseData.StatusCode = 400;
                return responseData;
            }

            var value = worldDB.GetDataEntry(currentWorldId, key);

            if (value == null)
            {
                responseData.Error = $"No data found for key '{key}' under world id '{currentWorldId}'.";
                responseData.StatusCode = 404;
                return responseData;
            }

            responseData.OK = true;
            responseData.StatusCode = 200;
            responseData.Error = null;
            responseData.Data = value.Value;
            return responseData;
        }

        private async Task<WorldDataRequestResponse> HandleBulkDataRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var responseData = new WorldDataRequestResponse(false, null, null);

            var keys = request.QueryString["keys"];
            if (keys == null)
            {
                responseData.Error = "Missing/invalid keys parameter.";
                responseData.StatusCode = 400;
                return responseData;
            }

            var keyArray = keys.Split(',');

            currentWorldId = await GetCurrentWorldID();

            if (String.IsNullOrEmpty(currentWorldId))
            {
                responseData.Error = "World ID not initialized.";
                responseData.StatusCode = 400;
                return responseData;
            }

            var values = worldDB.GetDataEntries(currentWorldId, keyArray).ToList();

            if (values == null)
            {
                responseData.Error = $"No data found for keys '{keys}' under world id '{currentWorldId}'.";
                responseData.StatusCode = 404;
                return responseData;
            }

            // Build a dictionary of key/value pairs to send back. If a key doesn't exist in the database, the key will be included in the response as requested but with a null value.
            var data = new Dictionary<string, string>();
            for (int i = 0; i < keyArray.Length; i++)
            {
                string dataKey = keyArray[i];
                string dataValue = values.Where(x => x.Key == dataKey).FirstOrDefault()?.Value; // get the value from the list of data entries, if it exists, otherwise null

                data.Add(dataKey, dataValue);
            }

            responseData.OK = true;
            responseData.StatusCode = 200;
            responseData.Error = null;
            responseData.Data = JsonConvert.SerializeObject(data);
            return responseData;
        }

        /// <summary>
        /// Generates a unique identifier for a world connection request.
        /// </summary>
        /// <returns>A string representation of a GUID that can be used to identify the world on requests.</returns>
        private string GenerateWorldConnectionKey()
        {
            // Ditched the old method of generating a short key, since we're just going with json anyway who cares about a longer identifier
            // Since we can rely on this GUID being unique, we can use it to identify the world on requests instead of trying to keep track of the user's current world.
            return Guid.NewGuid().ToString();
        }

        /// <summary>
        /// Gets the ID of the current world by evaluating a JavaScript function in the main browser instance.
        /// </summary>
        /// <returns>The ID of the current world as a string, or null if it could not be retrieved.</returns>
        private async Task<string> GetCurrentWorldID()
        {
            JavascriptResponse funcResult = await MainForm.Instance.Browser.EvaluateScriptAsync("$app.API.actuallyGetCurrentLocation();", TimeSpan.FromSeconds(5));

            try
            {
                funcResult = await MainForm.Instance.Browser.EvaluateScriptAsync("$app.API.actuallyGetCurrentLocation();", TimeSpan.FromSeconds(5));
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
                return null;
            }

            string worldId = funcResult?.Result?.ToString();

            if (String.IsNullOrEmpty(worldId))
            {
                // implement
                // wait what was i going to do here again
                return null;
            }

            return worldId;
        }

        /// <summary>
        /// Sends a JSON response to an HTTP listener request with the specified response data and status code.
        /// </summary>
        /// <param name="response">The HTTP listener response object.</param>
        /// <param name="responseData">The response data to be serialized to JSON.</param>
        /// <param name="statusCode">The HTTP status code to be returned.</param>
        /// <returns>The HTTP listener response object.</returns>
        private HttpListenerResponse SendJsonResponse(HttpListenerResponse response, WorldDataRequestResponse responseData)
        {
            response.ContentType = "application/json";
            response.StatusCode = responseData.StatusCode;
            response.AddHeader("Cache-Control", "no-cache");

            // Use newtonsoft.json to serialize WorldDataRequestResponse to json
            var json = JsonConvert.SerializeObject(responseData);
            var buffer = System.Text.Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
            return response;
        }

        /// <summary>
        /// Processes a JSON request containing world data and logs it to the world database.
        /// </summary>
        /// <param name="json">The JSON request containing the world data.</param>
        public async void ProcessLogWorldDataRequest(string json)
        {
            // Current format: 
            // {
            //     "requestType": "store",
            //     "connectionKey": "abc123",
            //     "key": "example_key",
            //     "value": "example_value"
            // }
            // TODO: limits
            // Evaluate if string is valid json with newtonsoft.json

            WorldDataRequest request;

            try // try to deserialize the json into a WorldDataRequest object
            {
                request = JsonConvert.DeserializeObject<WorldDataRequest>(json);
            }
            catch (JsonReaderException ex)
            {
                // invalid json
                return; // TODO: store error for "last error" request
            }
            catch (Exception ex)
            {
                // something else happened lol
                return; // TODO: store error for "last error" request
            }

            if (request.Key == null || request.Value == null) return; // TODO: Store error for "last error" request
            if (request.ConnectionKey == null) return; // TODO: Store error for "last error" request
            if (String.IsNullOrEmpty(currentWorldId)) return;

            // Make sure the connection key is a valid GUID. No point in doing anything else if it's not.
            if (!Guid.TryParse(request.ConnectionKey, out Guid _))
            {
                // invalid guid
                return; // TODO: store error for "last error" request
            }

            // Get the world ID from the connection key
            string worldId = worldDB.GetWorldByConnectionKey(request.ConnectionKey);
            if (worldId == null)
            {
                // invalid connection key
                return; // TODO: store error for "last error" request
            }

            // Get/calculate the old and new data sizes for this key/the world
            int oldTotalDataSize = worldDB.GetWorldDataSize(worldId);
            int oldDataSize = worldDB.GetDataEntrySize(worldId, request.Key);
            int newDataSize = Encoding.UTF8.GetByteCount(request.Value);
            int newTotalDataSize = oldTotalDataSize + newDataSize - oldDataSize;

            // Make sure we don't exceed 10MB total size for this world
            if (newTotalDataSize > 1024 * 1024 * 10)
            {
                // too much data
                throw new Exception("Too much data");
                return; // TODO: store error for "last error" request
            }


            worldDB.AddDataEntry(worldId, request.Key, request.Value, newDataSize);
            worldDB.UpdateWorldDataSize(worldId, newTotalDataSize);
        }

        public void Stop()
        {
            listener.Stop();
            listener.Close();
            worldDB.Close();
        }
    }
}