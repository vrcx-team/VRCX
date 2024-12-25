using System;
using System.IO;

namespace VRCX
{
    public partial class AppApiCommon
    {
        public string ReadConfigFile()
        {
            var path = GetVRChatAppDataLocation();
            var configFile = Path.Combine(path, "config.json");
            if (!Directory.Exists(path) || !File.Exists(configFile))
            {
                return string.Empty;
            }

            var json = File.ReadAllText(configFile);
            return json;
        }

        public void WriteConfigFile(string json)
        {
            var path = GetVRChatAppDataLocation();
            var configFile = Path.Combine(path, "config.json");
            File.WriteAllText(configFile, json);
        }
    }
}