using System;
using System.IO;
using Newtonsoft.Json;

namespace VRCX
{
    public partial class AppApi
    {
        public string ReadConfigFile()
        {
            var path = GetVRChatAppDataLocation();
            var configFile = Path.Join(path, "config.json");
            if (!Directory.Exists(path) || !File.Exists(configFile))
            {
                return string.Empty;
            }

            var json = File.ReadAllText(configFile);
            return json;
        }

        public string ReadConfigFileSafe()
        {
            try
            {
                var configFile = ReadConfigFile();
                if (string.IsNullOrEmpty(configFile))
                    return string.Empty;
                
                var jObject = JsonConvert.DeserializeObject<dynamic>(configFile, JsonSerializerSettings);
                if (jObject == null)
                    return string.Empty;
                
                return JsonConvert.SerializeObject(jObject, Formatting.Indented);
            }
            catch (Exception ex)
            {
                logger.Warn(ex, "Failed to parse VRC config.json file");
                return string.Empty;
            }
        }

        public void WriteConfigFile(string json)
        {
            var path = GetVRChatAppDataLocation();
            Directory.CreateDirectory(path);
            var configFile = Path.Join(path, "config.json");
            File.WriteAllText(configFile, json);
        }
    }
}