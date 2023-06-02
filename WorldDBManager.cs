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
        private static NLog.Logger logger = NLog.LogManager.GetCurrentClassLogger();

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

            logger.Info("Listening for requests on {0}", listener.Prefixes.First());
            while (true)
            {
                var context = await listener.GetContextAsync();
                var request = context.Request;
                var responseData = new WorldDataRequestResponse(false, null, null);

                try
                {
                    if (MainForm.Instance?.Browser == null || MainForm.Instance.Browser.IsLoading || !MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
                    {
                        logger.Warn("Received a request to {0} while VRCX is still initializing the browser window. Responding with error 503.", request.Url);

                        responseData.Error = "VRCX not yet initialized. Try again in a moment.";
                        responseData.StatusCode = 503;
                        SendJsonResponse(context.Response, responseData);
                        continue;
                    };

                    logger.Debug("Received a request to '{0}'", request.Url);

                    // TODO: Maybe an endpoint for getting a group of arbitrary keys by a group 'name'? eg; /getgroup?name=testgroup1 would return all keys with the column group set to 'testgroup1'
                    switch (request.Url.LocalPath)
                    {
                        case "/vrcx/data/init":
                            responseData = await HandleInitRequest(context);
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/get":
                            responseData = await HandleDataRequest(context);
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/getall":
                            responseData = await HandleAllDataRequest(context);
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/lasterror":
                            responseData.OK = lastError == null;
                            responseData.StatusCode = 200;
                            responseData.Data = lastError;
                            lastError = null;
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/getbulk":
                            responseData = await HandleBulkDataRequest(context);
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/status":
                            // Send a blank 200 response to indicate that the server is running.
                            context.Response.StatusCode = 200;
                            context.Response.Close();
                            break;
                        default:
                            responseData.Error = "Invalid VRCX endpoint.";
                            responseData.StatusCode = 404;
                            SendJsonResponse(context.Response, responseData);
                            break;
                    }

                    if (context.Response.StatusCode != 200)
                    {
                        logger.Warn("Received a request to '{0}' that returned a non-successful response. Error: {1} - {2}", request.Url, responseData.StatusCode, responseData.Error);
                    }
                }
                catch (Exception ex)
                {
                    logger.Error(ex, $"Exception while processing the url '{request.Url}'.");

                    responseData.Error = $"VRCX has encountered an exception while processing the url '{request.Url}': {ex.Message}";
                    responseData.StatusCode = 500;
                    SendJsonResponse(context.Response, responseData);
                }
            }

        }

        /// <summary>
        /// Handles an HTTP listener request to initialize a connection to the world db manager.
        /// </summary>
        /// <param name="context">The HTTP listener context object.</param>
        /// <returns>A <see cref="WorldDataRequestResponse"/> object containing the response data.</returns>
        private async Task<WorldDataRequestResponse> HandleInitRequest(HttpListenerContext context)
        {
            var request = context.Request;

            if (request.QueryString["debug"] == "true")
            {
                if (!worldDB.DoesWorldExist("wrld_12345"))
                {
                    worldDB.AddWorld("wrld_12345", "12345");
                    worldDB.AddDataEntry("wrld_12345", "test", "testvalue");
                }

                currentWorldId = "wrld_12345";

                return ConstructSuccessResponse("12345");
            }

            string worldId = await GetCurrentWorldID();

            if (String.IsNullOrEmpty(worldId))
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
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

            logger.Info("Initialized connection to world ID '{0}' with connection key '{1}'.", currentWorldId, connectionKey);
            return ConstructSuccessResponse(connectionKey);
        }

        /// <summary>
        /// Handles an HTTP listener request for data from the world database.
        /// </summary>
        /// <param name="context">The HTTP listener context object.</param>
        /// <returns>A <see cref="WorldDataRequestResponse"/> object containing the response data.</returns>
        private async Task<WorldDataRequestResponse> HandleDataRequest(HttpListenerContext context)
        {
            var request = context.Request;

            var key = request.QueryString["key"];
            if (key == null)
            {
                return ConstructErrorResponse(400, "Missing key parameter.");
            }

            var worldIdOverride = request.QueryString["world"];

            if (worldIdOverride != null)
            {
                var world = worldDB.GetWorld(worldIdOverride);

                if (world == null)
                {
                    return ConstructErrorResponse(200, $"World ID '{worldIdOverride}' not initialized in this user's database.");
                }

                if (!world.AllowExternalRead)
                {
                    return ConstructErrorResponse(200, $"World ID '{worldIdOverride}' does not allow external reads.");
                }
            }

            if (currentWorldId == "wrld_12345" && worldIdOverride == null)
                worldIdOverride = "wrld_12345";

            var worldId = worldIdOverride ?? await GetCurrentWorldID();

            if (worldIdOverride == null && (String.IsNullOrEmpty(currentWorldId) || worldId != currentWorldId))
            {
                return ConstructErrorResponse(400, "World ID not initialized.");
            }

            var value = worldDB.GetDataEntry(worldId, key);

            logger.Debug("Serving a request for data with key '{0}' from world ID '{1}'.", key, worldId);
            // This is intended to be null if the key doesn't exist.
            return ConstructSuccessResponse(value?.Value);
        }

        /// <summary>
        /// Handles an HTTP listener request for all data from the world database for a given world.
        /// </summary>
        /// <param name="context">The HTTP listener context object.</param>
        /// <returns>A <see cref="WorldDataRequestResponse"/> object containing the response data.</returns>
        private async Task<WorldDataRequestResponse> HandleAllDataRequest(HttpListenerContext context)
        {
            var request = context.Request;

            var worldIdOverride = request.QueryString["world"];

            if (worldIdOverride != null)
            {
                var world = worldDB.GetWorld(worldIdOverride);

                if (world == null)
                {
                    return ConstructErrorResponse(200, $"World ID '{worldIdOverride}' not initialized in this user's database.");
                }

                if (!world.AllowExternalRead)
                {
                    return ConstructErrorResponse(200, $"World ID '{worldIdOverride}' does not allow external reads.");
                }
            }

            if (currentWorldId == "wrld_12345" && worldIdOverride == null)
                worldIdOverride = "wrld_12345";

            var worldId = worldIdOverride ?? await GetCurrentWorldID();

            if (worldIdOverride == null && (String.IsNullOrEmpty(currentWorldId) || worldId != currentWorldId))
            {
                return ConstructErrorResponse(400, "World ID not initialized.");
            }

            var entries = worldDB.GetAllDataEntries(worldId);

            logger.Debug("Serving a request for all data from world ID '{0}'.", worldId);

            var data = new Dictionary<string, string>();
            foreach (var entry in entries)
            {
                data.Add(entry.Key, entry.Value);
            }

            // This is intended to be null if the key doesn't exist.
            return ConstructSuccessResponse(JsonConvert.SerializeObject(data));
        }

        /// <summary>
        /// Handles an HTTP listener request for bulk data from the world database.
        /// </summary>
        /// <param name="context">The HTTP listener context object.</param>
        /// <returns>A <see cref="WorldDataRequestResponse"/> object containing the response data.</returns>
        private async Task<WorldDataRequestResponse> HandleBulkDataRequest(HttpListenerContext context)
        {
            var request = context.Request;

            var keys = request.QueryString["keys"];
            if (keys == null)
            {
                return ConstructErrorResponse(400, "Missing/invalid keys parameter.");
            }

            var keyArray = keys.Split(',');

            var worldId = await GetCurrentWorldID();

            if (String.IsNullOrEmpty(currentWorldId) || (worldId != currentWorldId && currentWorldId != "wrld_12345"))
            {
                return ConstructErrorResponse(400, "World ID not initialized.");
            }

            var values = worldDB.GetDataEntries(currentWorldId, keyArray).ToList();

            /*if (values == null)
            {
                responseData.Error = $"No data found for keys '{keys}' under world id '{currentWorldId}'.";
                responseData.StatusCode = 404;
                return responseData;
            }*/

            // Build a dictionary of key/value pairs to send back. If a key doesn't exist in the database, the key will be included in the response as requested but with a null value.
            var data = new Dictionary<string, string>();
            for (int i = 0; i < keyArray.Length; i++)
            {
                string dataKey = keyArray[i];
                string dataValue = values?.Where(x => x.Key == dataKey).FirstOrDefault()?.Value; // Get the value from the list of data entries, if it exists, otherwise null

                data.Add(dataKey, dataValue);
            }

            logger.Debug("Serving a request for bulk data with keys '{0}' from world ID '{1}'.", keys, currentWorldId);
            return ConstructSuccessResponse(JsonConvert.SerializeObject(data));
        }

        /// <summary>
        /// Generates a unique identifier for a world connection request.
        /// </summary>
        /// <returns>A string representation of a GUID that can be used to identify the world on requests.</returns>
        private string GenerateWorldConnectionKey()
        {
            // Ditched the old method of generating a short key, since we're just going with json anyway who cares about a longer identifier
            // Since we can rely on this GUID being unique, we can use it to identify the world on requests instead of trying to keep track of the user's current world.
            // I uhh, should probably make sure this is actually unique though. Just in case. I'll do that later.
            return Guid.NewGuid().ToString();
        }

        /// <summary>
        /// Gets the ID of the current world by evaluating a JavaScript function in the main browser instance.
        /// </summary>
        /// <returns>The ID of the current world as a string, or null if it could not be retrieved.</returns>
        private async Task<string> GetCurrentWorldID()
        {
            JavascriptResponse funcResult;

            try
            {
                funcResult = await MainForm.Instance.Browser.EvaluateScriptAsync("$app.API.actuallyGetCurrentLocation();", TimeSpan.FromSeconds(5));
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to evaluate actuallyGetCurrentLocation JS function to get current world ID.");
                return null;
            }

            string worldId = funcResult?.Result?.ToString();

            if (String.IsNullOrEmpty(worldId))
            {
                // implement
                // wait what was i going to do here again
                // seriously i forgot, hope it wasn't important
                logger.Warn("actuallyGetCurrentLocation returned null or empty.");
                return null;
            }

            return worldId;
        }

        private WorldDataRequestResponse ConstructSuccessResponse(string data = null)
        {
            var responseData = new WorldDataRequestResponse(true, null, null);

            responseData.StatusCode = 200;
            responseData.Error = null;
            responseData.OK = true;
            responseData.Data = data;
            return responseData;
        }

        private WorldDataRequestResponse ConstructErrorResponse(int statusCode, string error)
        {
            var responseData = new WorldDataRequestResponse(true, null, null);

            responseData.StatusCode = statusCode;
            responseData.Error = error;
            responseData.OK = false;
            responseData.Data = null;

            return responseData;
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

            // * I could rate limit the processing of this, but I don't think it's necessary.
            // * At the amount of data you'd need to be spitting out to lag vrcx, you'd fill up the log file and lag out VRChat far before VRCX would have any issues; at least in my testing.
            // As long as malicious worlds can't permanently *store* stupid amounts of unculled data, this is pretty safe with the 10MB cap. If a world wants to just fill up a users HDD with logs, they can do that already anyway.

            WorldDataRequest request;

            try // try to deserialize the json into a WorldDataRequest object
            {
                request = JsonConvert.DeserializeObject<WorldDataRequest>(json);
            }
            catch (JsonReaderException ex)
            {
                logger.Error(ex, json.ToString());
                this.lastError = ex.Message;
                // invalid json
                return;
            }
            catch (Exception ex)
            {
                logger.Error(ex, json.ToString());
                this.lastError = ex.Message;
                // something else happened lol
                return;
            }

            if (String.IsNullOrEmpty(request.Key))
            {
                logger.Warn("World {0} tried to store data with no key provided", request.Key);
                this.lastError = "`key` is missing or null";
                return;
            }

            if (String.IsNullOrEmpty(request.Value))
            {
                logger.Warn("World {0} tried to store data with no value provided", request.Key);
                this.lastError = "`value` is missing or null";
                return;
            }

            if (String.IsNullOrEmpty(request.ConnectionKey))
            {
                logger.Warn("World {0} tried to store data with no connection key provided", request.Key);
                this.lastError = "`connectionKey` is missing or null";
                return;
            }

            // Make sure the connection key is a valid GUID. No point in doing anything else if it's not.
            if (!Guid.TryParse(request.ConnectionKey, out Guid _))
            {
                logger.Warn("World {0} tried to store data with an invalid GUID as a connection key {1}", request.Key, request.ConnectionKey);
                this.lastError = "Invalid GUID provided as connection key";
                // invalid guid
                return;
            }

            // Get the world ID from the connection key
            string worldId = worldDB.GetWorldByConnectionKey(request.ConnectionKey);
            if (worldId == null)
            {
                logger.Warn("World {0} tried to store data with invalid connection key {1}", request.Key, request.ConnectionKey);
                this.lastError = "Invalid connection key";
                // invalid connection key
                return;
            }

            // Get/calculate the old and new data sizes for this key/the world
            int oldTotalDataSize = worldDB.GetWorldDataSize(worldId);
            int oldDataSize = worldDB.GetDataEntrySize(worldId, request.Key);
            int newDataSize = Encoding.UTF8.GetByteCount(request.Value);
            int newTotalDataSize = oldTotalDataSize + newDataSize - oldDataSize;

            // Make sure we don't exceed 10MB total size for this world
            // This works, I tested it. Hopefully this prevents/limits any possible abuse. 
            if (newTotalDataSize > 1024 * 1024 * 10)
            {
                logger.Warn("World {0} exceeded 10MB total data size trying to store key {0}. {1}:{2} + {3} = {4}", request.Key, worldId, oldTotalDataSize - oldDataSize, newDataSize, newTotalDataSize);
                this.lastError = $"You have hit the 10MB total data cap. The previous data entry was *not* stored. Your request was {newDataSize} bytes, your current shared byte total is {oldTotalDataSize} and you went over the table limit by {newTotalDataSize - (1024 * 1024 * 10)} bytes.";
                // too much data
                //throw new Exception("Too much data");
                return;
            }


            worldDB.AddDataEntry(worldId, request.Key, request.Value, newDataSize);
            worldDB.UpdateWorldDataSize(worldId, newTotalDataSize);
            logger.Info("World {0} stored data entry {1} with size {2} bytes", worldId, request.Key, newDataSize);
            logger.Debug("{0} : {1}", request.Key, request.Value);
        }

        public void Stop()
        {
            listener.Stop();
            listener.Close();
            worldDB.Close();
        }
    }
}