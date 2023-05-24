using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading.Tasks;
using CefSharp;

namespace VRCX
{
    public class WorldDBManager
    {
        public static WorldDBManager Instance;
        private readonly HttpListener listener;
        private readonly SQLiteWorld sqlite;
        private readonly static string dbInitQuery = @"
CREATE TABLE IF NOT EXISTS worlds (
    id INTEGER PRIMARY KEY,
    world_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id text NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    last_accessed DATETIME DEFAULT (strftime('%s', 'now')),
    last_modified DATETIME DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (world_id) REFERENCES worlds(world_id) ON DELETE CASCADE,
    UNIQUE (world_id, key)
);

CREATE TRIGGER IF NOT EXISTS data_update_trigger
AFTER UPDATE ON data
FOR EACH ROW
BEGIN
    UPDATE data SET last_modified = (strftime('%s', 'now')) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS data_insert_trigger
AFTER INSERT ON data
FOR EACH ROW
BEGIN
    UPDATE data SET last_accessed = (strftime('%s', 'now')), last_modified = (strftime('%s', 'now')) WHERE id = NEW.id;
END;";
        private string currentWorldId = null;

        public WorldDBManager(string url)
        {
            Instance = this;
            // http://localhost:32767
            listener = new HttpListener();
            listener.Prefixes.Add(url);

            sqlite = new SQLiteWorld(Path.Combine(Program.AppDataDirectory, "VRCX-world.db"));
        }

        public async Task Start()
        {
            listener.Start();

            sqlite.Init();

            sqlite.ExecuteNonQuery(dbInitQuery, null);

            while (true)
            {
                var context = await listener.GetContextAsync();
                var request = context.Request;

                if (MainForm.Instance?.Browser == null)
                {
                    SendTextResponse(context.Response, "503: VRCX not yet initialized.", 503);
                    continue;
                };

                switch (request.Url.LocalPath)
                {
                    case "/vrcx/init":
                        if (request.QueryString["debug"] == "true")
                        {
                            sqlite.ExecuteNonQuery("INSERT OR IGNORE INTO worlds (world_id) VALUES (@world_id)", new Dictionary<string, object>() {
                                {"@world_id", "wrld_12345"}
                            });

                            sqlite.ExecuteNonQuery("INSERT OR IGNORE INTO data (world_id, key, value) VALUES (@world_id, @key, @value)", new Dictionary<string, object>() {
                                {"@world_id", "wrld_12345"},
                                {"@key", "test"},
                                {"@value", "testvalue"}
                            });

                            currentWorldId = "wrld_12345";
                            SendTextResponse(context.Response, $"Initialized World ID: {currentWorldId}");
                            break;
                        }

                        JavascriptResponse worldId = await MainForm.Instance.Browser.EvaluateScriptAsync("$app.API.getUserApiCurrentLocation();", TimeSpan.FromSeconds(5));
                        currentWorldId = worldId.Result.ToString();
                        SendTextResponse(context.Response, $"Initialized World ID: {worldId.Result}");                     
                        break;
                    case "/vrcx/get":
                        var key = request.QueryString["key"];
                        if (key == null)
                        {
                            SendTextResponse(context.Response, "400: Missing key parameter.", 400);
                            break;
                        }

                        if (String.IsNullOrEmpty(currentWorldId))
                        {
                            SendTextResponse(context.Response, "400: World ID not initialized.", 400);
                            break;
                        }

                        var values = await sqlite.ExecuteAsync("SELECT `value` FROM `data` WHERE `key` = @key AND `world_id` = @world_id", new Dictionary<string, object>() {
                            {"@key", key},
                            {"@world_id", currentWorldId}
                        });

                        if (values.Length == 0)
                        {
                            SendTextResponse(context.Response, $"No data found for key '{key}' @ {currentWorldId}");
                            break;
                        }

                        SendTextResponse(context.Response, $"SQL Key '{key}' for world '{currentWorldId}' = '{values[0][0]}'");
                        break;
                    case "/vrcx/getbulk":
                        // TODO: Implement
                        SendTextResponse(context.Response, "501: Not Implemented.", 501);
                        break;
                    default:
                        SendTextResponse(context.Response, "404: Invalid VRCX endpoint.", 404);
                        break;
                }
            }

        }

        private HttpListenerResponse SendTextResponse(HttpListenerResponse response, string text, int statusCode = 200)
        {
            response.ContentType = "text/plain";
            response.StatusCode = statusCode;

            var buffer = System.Text.Encoding.UTF8.GetBytes(text);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
            return response;
        }

        private HttpListenerResponse SendJsonResponse(HttpListenerResponse response, string json, int statusCode = 200)
        {
            response.ContentType = "application/json";
            response.StatusCode = statusCode;

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

            var result = await sqlite.ExecuteAsync("SELECT `world_id` FROM `worlds` WHERE `world_id` = @world_id", new Dictionary<string, object>() {
                {"@world_id", currentWorldId}
            });

            if (result.Length == 0)
            {
                await sqlite.ExecuteNonQueryAsync("INSERT OR IGNORE INTO worlds (world_id) VALUES (@world_id)", new Dictionary<string, object>() {
                    {"@world_id", currentWorldId}
                });
            }

            await sqlite.ExecuteNonQueryAsync("INSERT OR REPLACE INTO data (world_id, key, value) VALUES (@world_id, @key, @value)", new Dictionary<string, object>() {
                {"@world_id", currentWorldId},
                {"@key", key},
                {"@value", value}
            });

            /*sqlite.Execute((values) =>
            {
                if (values.Length == 0)
                {
                    sqlite.ExecuteNonQuery("INSERT OR IGNORE INTO worlds (world_id) VALUES (@world_id)", new Dictionary<string, object>() {
                        {"@world_id", currentWorldId}
                    });
                }

                sqlite.ExecuteNonQuery("INSERT OR REPLACE INTO data (world_id, key, value) VALUES (@world_id, @key, @value)", new Dictionary<string, object>() {
                    {"@world_id", currentWorldId},
                    {"@key", key},
                    {"@value", value}
                });
            },
                "SELECT `value` FROM `data` WHERE `key` = @key AND `world_id` = @world_id",
                new Dictionary<string, object>() {
                    {"@key", key},
                    {"@world_id", currentWorldId}
                }
            );*/
        }

        public void Stop()
        {
            listener.Stop();
            listener.Close();
            sqlite.Exit();
        }
    }
}