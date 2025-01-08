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
using NLog;

namespace VRCX
{
    public class WorldDBManager
    {
        public static readonly WorldDBManager Instance;
        private readonly HttpListener listener;
        private readonly WorldDatabase worldDB;
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private const string WorldDBServerUrl = "http://127.0.0.1:22500/";

        private string lastError = null;
        private bool debugWorld = false;

        static WorldDBManager()
        {
            Instance = new WorldDBManager();
        }
        
        public WorldDBManager()
        {
            // http://localhost:22500
            listener = new HttpListener();
            listener.Prefixes.Add(WorldDBServerUrl);

            worldDB = new WorldDatabase(Path.Combine(Program.AppDataDirectory, "VRCX-WorldData.db"));
        }

        public void Init()
        {
            if (VRCXStorage.Instance.Get("VRCX_DisableWorldDatabase") == "true")
            {
                logger.Info("World database is disabled. Not starting.");
                return;
            }
            
            Task.Run(Start);
        }

        private async Task Start()
        {
            // typing this in vr gonna kms
            try
            {
                listener.Start();
            }
            catch (HttpListenerException e)
            {
                logger.Error(e, "Failed to start HTTP listener. Is VRCX already running?");
                return;
            }

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
                        logger.Error("Received a request to {0} while VRCX is still initializing the browser window. Responding with error 503.", request.Url);

                        responseData.Error = "VRCX not yet initialized. Try again in a moment.";
                        responseData.StatusCode = 503;
                        responseData.ConnectionKey = null;
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
                            responseData.ConnectionKey = null;
                            lastError = null;
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/getbulk":
                            responseData = await HandleBulkDataRequest(context);
                            SendJsonResponse(context.Response, responseData);
                            break;
                        case "/vrcx/data/settings":
                            responseData = await HandleSetSettingsRequest(context);
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
                            responseData.ConnectionKey = null;
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
                    logger.Error(ex, $"Exception while processing a request to endpoint '{request.Url}'.");

                    responseData.Error = $"VRCX has encountered an exception while processing the url '{request.Url}': {ex.Message}";
                    responseData.StatusCode = 500;
                    responseData.ConnectionKey = null;
                    SendJsonResponse(context.Response, responseData);
                }
            }

        }

        private async Task<WorldDataRequestResponse> HandleSetSettingsRequest(HttpListenerContext context)
        {
            var request = context.Request;

            string worldId = await GetCurrentWorldID();
            string set = request.QueryString["set"];
            string value = request.QueryString["value"];

            if (!TryInitializeWorld(worldId, out string connectionKey))
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
            }

            if (set != null && value != null)
            {
                switch (set)
                {
                    case "externalReads":
                        if (request.QueryString["value"] == "true")
                        {
                            worldDB.SetWorldAllowExternalRead(worldId, true);
                        }
                        else if (request.QueryString["value"] == "false")
                        {
                            worldDB.SetWorldAllowExternalRead(worldId, false);
                        }
                        else
                        {
                            return ConstructErrorResponse(400, "Invalid value for 'externalReads' setting.");
                        }
                        break;
                    default:
                        return ConstructErrorResponse(400, "Invalid setting name.");
                }
            }

            return ConstructSuccessResponse(null, connectionKey);
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
                debugWorld = true;
            }
            else if (request.QueryString["debug"] == "false")
            {
                debugWorld = false;
            }

            string worldId = await GetCurrentWorldID();

            if (TryInitializeWorld(worldId, out string connectionKey))
            {
                logger.Info("Initialized a connection to the world database for world ID '{0}' with connection key {1}.", worldId, connectionKey);
                return ConstructSuccessResponse(connectionKey, connectionKey);
            }
            else
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
            }
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

            var worldId = await GetCurrentWorldID();

            if (!TryInitializeWorld(worldId, out string connectionKey))
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
            }

            var worldOverride = request.QueryString["world"];
            if (worldOverride == "global")
            {
                TryInitializeWorld(worldOverride, out connectionKey);
            }
            if (worldOverride != null && worldId != worldOverride)
            {
                var allowed = worldDB.GetWorldAllowExternalRead(worldOverride) || worldOverride == "global";
                if (!allowed)
                {
                    return ConstructSuccessResponse(null, connectionKey);
                }

                var otherValue = worldDB.GetDataEntry(worldOverride, key);

                logger.Debug("Serving a request for data with key '{0}' from world ID '{1}' requested by world ID '{2}' with connection key {3}.", key, worldOverride, worldId, connectionKey);

                // This value is intended to be null if the key doesn't exist.
                return ConstructSuccessResponse(otherValue?.Value, connectionKey);
            }

            var value = worldDB.GetDataEntry(worldId, key);

            logger.Debug("Serving a request for data with key '{0}' from world ID '{1}' with connection key {2}.", key, worldId, connectionKey);
            // This value is intended to be null if the key doesn't exist.
            return ConstructSuccessResponse(value?.Value, connectionKey);
        }

        /// <summary>
        /// Handles an HTTP listener request for all data from the world database for a given world.
        /// </summary>
        /// <param name="context">The HTTP listener context object.</param>
        /// <returns>A <see cref="WorldDataRequestResponse"/> object containing the response data.</returns>
        private async Task<WorldDataRequestResponse> HandleAllDataRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var worldId = await GetCurrentWorldID();

            if (!TryInitializeWorld(worldId, out string connectionKey))
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
            }

            var worldOverride = request.QueryString["world"];
            if (worldOverride == "global")
            {
                TryInitializeWorld(worldOverride, out connectionKey);
            }
            if (worldOverride != null && worldId != worldOverride)
            {
                var allowed = worldDB.GetWorldAllowExternalRead(worldOverride) || worldOverride == "global";
                if (!allowed)
                {
                    return ConstructSuccessResponse(null, connectionKey);
                }

                var otherEntries = worldDB.GetAllDataEntries(worldOverride);

                var otherData = new Dictionary<string, string>();
                foreach (var entry in otherEntries)
                {
                    otherData.Add(entry.Key, entry.Value);
                }

                logger.Debug("Serving a request for all data ({0} entries) for world ID '{1}' requested by {2} with connection key {3}.", otherData.Count, worldOverride, worldId, connectionKey);
                return ConstructSuccessResponse(JsonConvert.SerializeObject(otherData), connectionKey);
            }

            var entries = worldDB.GetAllDataEntries(worldId);

            var data = new Dictionary<string, string>();
            foreach (var entry in entries)
            {
                data.Add(entry.Key, entry.Value);
            }

            logger.Debug("Serving a request for all data ({0} entries) for world ID '{1}' with connection key {2}.", data.Count, worldId, connectionKey);
            return ConstructSuccessResponse(JsonConvert.SerializeObject(data), connectionKey);
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

            if (!TryInitializeWorld(worldId, out string connectionKey))
            {
                return ConstructErrorResponse(500, "Failed to get/verify current world ID.");
            }

            var worldOverride = request.QueryString["world"];
            if (worldOverride == "global")
            {
                TryInitializeWorld(worldOverride, out connectionKey);
            }
            if (worldOverride != null && worldId != worldOverride)
            {
                var allowed = worldDB.GetWorldAllowExternalRead(worldOverride) || worldOverride == "global";
                if (!allowed)
                {
                    return ConstructSuccessResponse(null, connectionKey);
                }

                var otherEntries = worldDB.GetAllDataEntries(worldOverride);

                var otherData = new Dictionary<string, string>();
                foreach (var entry in otherEntries)
                {
                    otherData.Add(entry.Key, entry.Value);
                }

                logger.Debug("Serving a request for all data ({0} entries) for world ID '{1}' requested by {2} with connection key {3}.", otherData.Count, worldOverride, worldId, connectionKey);
                return ConstructSuccessResponse(JsonConvert.SerializeObject(otherData), connectionKey);
            }

            var values = worldDB.GetDataEntries(worldId, keyArray).ToList();

            // Build a dictionary of key/value pairs to send back. If a key doesn't exist in the database, the key will be included in the response as requested but with a null value.
            var data = new Dictionary<string, string>();
            for (int i = 0; i < keyArray.Length; i++)
            {
                string dataKey = keyArray[i];
                string dataValue = values?.Where(x => x.Key == dataKey).FirstOrDefault()?.Value; // Get the value from the list of data entries, if it exists, otherwise null

                data.Add(dataKey, dataValue);
            }

            logger.Debug("Serving a request for bulk data with keys '{0}' from world ID '{1}' with connection key {2}.", keys, worldId, connectionKey);
            return ConstructSuccessResponse(JsonConvert.SerializeObject(data), connectionKey);
        }

        /// <summary>
        /// Attempts to initialize a world with the given ID by generating a connection key and adding it to the world database if it does not already exist.
        /// </summary>
        /// <param name="worldId">The ID of the world to initialize.</param>
        /// <param name="connectionKey">The connection key generated for the world.</param>
        /// <returns>True if the world was successfully initialized, false otherwise.</returns>
        private bool TryInitializeWorld(string worldId, out string connectionKey)
        {
            if (string.IsNullOrEmpty(worldId))
            {
                connectionKey = null;
                return false;
            }

            var existsInDB = worldDB.DoesWorldExist(worldId);

            if (!existsInDB)
            {
                connectionKey = GenerateWorldConnectionKey();
                worldDB.AddWorld(worldId, connectionKey);
                logger.Info("Added new world ID '{0}' with connection key '{1}' to the database.", worldId, connectionKey);
            }
            else
            {
                connectionKey = worldDB.GetWorldConnectionKey(worldId);
            }

            return true;
        }

        /// <summary>
        /// Generates a unique identifier for a world connection request.
        /// </summary>
        /// <returns>A string representation of a GUID that can be used to identify the world on requests.</returns>
        private string GenerateWorldConnectionKey()
        {
            if (debugWorld) return "12345";

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
            if (debugWorld) return "wrld_12345";

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

            if (string.IsNullOrEmpty(worldId))
            {
                // implement
                // wait what was i going to do here again
                // seriously i forgot, hope it wasn't important
                logger.Warn("actuallyGetCurrentLocation returned null or empty.");
                return null;
            }

            return worldId;
        }

        private WorldDataRequestResponse ConstructSuccessResponse(string data = null, string connectionKey = null)
        {
            var responseData = new WorldDataRequestResponse(true, null, null);

            responseData.StatusCode = 200;
            responseData.Error = null;
            responseData.OK = true;
            responseData.Data = data;
            responseData.ConnectionKey = connectionKey;
            return responseData;
        }

        private WorldDataRequestResponse ConstructErrorResponse(int statusCode, string error)
        {
            var responseData = new WorldDataRequestResponse(true, null, null);

            responseData.StatusCode = statusCode;
            responseData.Error = error;
            responseData.OK = false;
            responseData.Data = null;
            responseData.ConnectionKey = null;

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
        public void ProcessLogWorldDataRequest(string json)
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

            if (string.IsNullOrEmpty(request.RequestType))
            {
                logger.Warn("World tried to store data with no request type provided. Request: ", json);
                this.lastError = "`requestType` is missing or null";
                return;
            }

            // Make sure the connection key is a valid GUID. No point in doing anything else if it's not.
            if (!debugWorld && !Guid.TryParse(request.ConnectionKey, out Guid _))
            {
                logger.Warn("World tried to store data with an invalid GUID as a connection key '{0}'", request.ConnectionKey);
                this.lastError = "Invalid GUID provided as connection key";
                // invalid guid
                return;
            }

            // Get the world ID from the connection key
            string worldId = worldDB.GetWorldByConnectionKey(request.ConnectionKey);
            
            // Global override
            if (request.ConnectionKey == "global")
            {
                worldId = "global";
            }

            // World ID is null, which means the connection key is invalid (or someone just deleted a world from the DB while VRCX was running lol).
            if (worldId == null)
            {
                logger.Warn("World tried to store data under {0} with an invalid connection key {1}", request.Key, request.ConnectionKey);
                this.lastError = "Invalid connection key";
                // invalid connection key
                return;
            }

            try
            {
                string requestType = request.RequestType.ToLower();
                switch (requestType)
                {
                    case "store":
                        if (String.IsNullOrEmpty(request.Key))
                        {
                            logger.Warn("World {0} tried to store data with no key provided", worldId);
                            this.lastError = "`key` is missing or null";
                            return;
                        }

                        if (request.Key.Length > 255)
                        {
                            logger.Warn("World {0} tried to store data with a key that was too long ({1}/256 characters)", worldId, request.Key.Length);
                            this.lastError = "`key` is too long. Keep it below <256 characters.";
                            return;
                        }

                        if (request.Value == null)
                        {
                            logger.Warn("World {0} tried to store data under key {1} with null value", worldId, request.Key);
                            this.lastError = "`value` is null";
                            return;
                        }

                        StoreWorldData(worldId, request.Key, request.Value);

                        break;
                    case "delete":
                        if (String.IsNullOrEmpty(request.Key))
                        {
                            logger.Warn("World {0} tried to delete data with no key provided", worldId);
                            this.lastError = "`key` is missing or null";
                            return;
                        }


                        DeleteWorldData(worldId, request.Key);
                        break;
                    case "delete-all":

                        logger.Info("World {0} requested to delete all data.", worldId);


                        worldDB.DeleteAllDataEntriesForWorld(worldId);
                        worldDB.UpdateWorldDataSize(worldId, 0);
                        break;
                    case "set-setting":
                        if (String.IsNullOrEmpty(request.Key))
                        {
                            logger.Warn("World {0} tried to delete data with no key provided", worldId);
                            this.lastError = "`key` is missing or null";
                            return;
                        }

                        if (String.IsNullOrEmpty(request.Value))
                        {
                            logger.Warn("World {0} tried to set settings with no value provided", worldId);
                            this.lastError = "`value` is missing or null";
                            return;
                        }

                        SetWorldProperty(worldId, request.Key, request.Value);
                        break;
                    default:
                        logger.Warn("World {0} sent an invalid request type '{0}'", worldId, request.RequestType);
                        this.lastError = "Invalid request type";
                        // invalid request type
                        return;
                }
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to process world data request for world {0}", worldId);
                logger.Error("Failed Request: {0}", json);
                this.lastError = ex.Message;
                return;
            }
        }

        /// <summary>
        /// Sets a property for a given world in the world database.
        /// </summary>
        /// <param name="worldId">The ID of the world to set the property for.</param>
        /// <param name="key">The key of the property to set.</param>
        /// <param name="value">The value to set the property to.</param>
        public void SetWorldProperty(string worldId, string key, string value)
        {
            switch (key)
            {
                case "externalReads":
                    if (bool.TryParse(value, out bool result))
                    {
                        worldDB.SetWorldAllowExternalRead(worldId, result);
                    }
                    else
                    {
                        logger.Warn("World {0} tried to set externalReads to an invalid value '{1}'", worldId, value);
                        this.lastError = "Invalid value for externalReads";
                        return;
                    }
                    break;
            }
        }

        /// <summary>
        /// Stores a data entry for a given world in the world database.
        /// </summary>
        /// <param name="worldId">The ID of the world to store the data entry for.</param>
        /// <param name="key">The key of the data entry to store.</param>
        /// <param name="value">The value of the data entry to store.</param>
        public void StoreWorldData(string worldId, string key, string value)
        {
            // Get/calculate the old and new data sizes for this key/the world
            int oldTotalDataSize = worldDB.GetWorldDataSize(worldId);
            int oldDataSize = worldDB.GetDataEntrySize(worldId, key);
            int newDataSize = Encoding.UTF8.GetByteCount(value);
            int newTotalDataSize = oldTotalDataSize + newDataSize - oldDataSize;

            // Make sure we don't exceed 10MB total size for a world
            // This works, I tested it. Hopefully this prevents/limits any possible abuse. 
            if (newTotalDataSize > 1024 * 1024 * 10)
            {
                logger.Warn("World {0} exceeded 10MB total data size trying to store key {0}. {1}:{2} + {3} = {4}", key, worldId, oldTotalDataSize - oldDataSize, newDataSize, newTotalDataSize);
                this.lastError = $"You have hit the 10MB total data cap. The previous data entry was *not* stored. Your request was {newDataSize} bytes, your current shared byte total is {oldTotalDataSize} and you went over the table limit by {newTotalDataSize - (1024 * 1024 * 10)} bytes.";
                return;
            }

            worldDB.AddDataEntry(worldId, key, value, newDataSize);
            worldDB.UpdateWorldDataSize(worldId, newTotalDataSize);
            logger.Info("World {0} stored data entry {1} with size {2} bytes", worldId, key, newDataSize);
            logger.Debug("{0} : {1}", key, value);
        }

        /// <summary>
        /// Deletes a data entry for a given world from the world database.
        /// </summary>
        /// <param name="worldId">The ID of the world to delete the data entry from.</param>
        /// <param name="key">The key of the data entry to delete.</param>
        public void DeleteWorldData(string worldId, string key)
        {
            int oldTotalDataSize = worldDB.GetWorldDataSize(worldId);
            int oldDataSize = worldDB.GetDataEntrySize(worldId, key);
            int newTotalDataSize = oldTotalDataSize - oldDataSize;

            worldDB.DeleteDataEntry(worldId, key);
            worldDB.UpdateWorldDataSize(worldId, newTotalDataSize);
            logger.Info("World {0} deleted data entry {1} with size {2} bytes.", worldId, key, oldDataSize);
        }

        public void Stop()
        {
            try
            {
                worldDB?.Close();
                listener?.Stop();
                listener?.Close();
            }
            catch (ObjectDisposedException)
            {
                // ignore
            }
        }
    }
}