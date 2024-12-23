using System;
using System.IO;

namespace VRCX
{
    public partial class AppApiCef : AppApiInterface
    {
        /// <summary>
        /// Reads the VRChat config file and returns its contents as a string.
        /// </summary>
        /// <returns>The contents of the VRChat config file as a string, or an empty string if the file does not exist.</returns>
        public string ReadConfigFile()
        {
            var logPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat\";
            var configFile = Path.Combine(logPath, "config.json");
            if (!Directory.Exists(logPath) || !File.Exists(configFile))
            {
                return string.Empty;
            }

            var json = File.ReadAllText(configFile);
            return json;
        }

        /// <summary>
        /// Writes the specified JSON string to the VRChat config file.
        /// </summary>
        /// <param name="json">The JSON string to write to the config file.</param>
        public void WriteConfigFile(string json)
        {
            var logPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat\";
            var configFile = Path.Combine(logPath, "config.json");
            File.WriteAllText(configFile, json);
        }
    }
}