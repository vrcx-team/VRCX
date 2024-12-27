using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Win32;
using NLog;

namespace VRCX
{
    public partial class AppApiElectron
    {
        private string AddHashToKeyName(string key)
        {
            // https://discussions.unity.com/t/playerprefs-changing-the-name-of-keys/30332/4
            // VRC_GROUP_ORDER_usr_032383a7-748c-4fb2-94e4-bcb928e5de6b_h2810492971
            uint hash = 5381;
            foreach (var c in key)
                hash = (hash * 33) ^ c;
            return key + "_h" + hash;
        }
        
        private static int FindMatchingBracket(string content, int openBracketIndex)
        {
            int depth = 0;
            for (int i = openBracketIndex; i < content.Length; i++)
            {
                if (content[i] == '{')
                    depth++;
                else if (content[i] == '}')
                {
                    depth--;
                    if (depth == 0)
                        return i;
                }
            }
            return -1;
        }

        private static Dictionary<string, string> ExtractCompatToolMapping(string vdfContent)
        {
            var compatToolMapping = new Dictionary<string, string>();
            const string sectionHeader = "\"CompatToolMapping\"";
            int sectionStart = vdfContent.IndexOf(sectionHeader);

            if (sectionStart == -1)
            {
                logger.Error("CompatToolMapping not found");
                return compatToolMapping;
            }

            int blockStart = vdfContent.IndexOf("{", sectionStart) + 1;
            int blockEnd = FindMatchingBracket(vdfContent, blockStart - 1);

            if (blockStart == -1 || blockEnd == -1)
            {
                logger.Error("CompatToolMapping block not found");
                return compatToolMapping;
            }

            string blockContent = vdfContent.Substring(blockStart, blockEnd - blockStart);

            var keyValuePattern = new Regex("\"(\\d+)\"\\s*\\{[^}]*\"name\"\\s*\"([^\"]+)\"", 
                RegexOptions.Multiline);

            var matches = keyValuePattern.Matches(blockContent);
            foreach (Match match in matches)
            {
                string key = match.Groups[1].Value;
                string name = match.Groups[2].Value;

                if (key != "0")
                {
                    compatToolMapping[key] = name;
                }
            }

            return compatToolMapping;
        }

        private static string GetSteamVdfCompatTool()
        {
            string steamPath = _steamPath;
            string configVdfPath = Path.Combine(steamPath, "config", "config.vdf");
            if (!File.Exists(configVdfPath))
            {
                logger.Error("config.vdf not found");
                return null;
            }

            string vdfContent = File.ReadAllText(configVdfPath);
            var compatToolMapping = ExtractCompatToolMapping(vdfContent);

            if (compatToolMapping.TryGetValue("438100", out string name))
            {
                return name;
            }

            return null;
        }

        private string ParseWineRegOutput(string output, string keyName)
        {
            if (string.IsNullOrEmpty(output))
                return null;
            
            var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(line => 
                    !string.IsNullOrWhiteSpace(line) && 
                    !line.Contains("fixme:") && 
                    !line.Contains("wine:"))
                .ToArray();
        
            foreach (var line in lines)
            {
                var parts = line.Split(new[] { '\t', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(p => p.Trim())
                                .ToArray();
                if (parts.Length >= 3 && parts[0].Contains(keyName))
                {
                    var valueType = parts[parts.Length - 2];
                    var value = parts[parts.Length - 1];

                    switch (valueType)
                    {
                        case "REG_BINARY":
                            try 
                            {
                                // Treat the value as a plain hex string and decode it to ASCII
                                var hexValues = Enumerable.Range(0, value.Length / 2)
                                    .Select(i => value.Substring(i * 2, 2)) // Break string into chunks of 2
                                    .Select(hex => Convert.ToByte(hex, 16)) // Convert each chunk to a byte
                                    .ToArray();

                                return Encoding.ASCII.GetString(hexValues).TrimEnd('\0');
                            }
                            catch (Exception ex)
                            {
                                logger.Error($"Error parsing REG_BINARY as plain hex string: {ex.Message}");
                                return null;
                            }

                        case "REG_DWORD":
                            return "REG_DWORD";

                        default:
                            logger.Error($"Unsupported parsed registry value type: {valueType}");
                            return null;
                    }
                }
            }

            return null;
        }
        
        private string ParseWineRegOutputEx(string output, string keyName)
        {
            var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            string currentKey = null;
            string currentValue = null;

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                if (line.Contains("="))
                {
                    var parts = line.Split(new[] { '=' }, 2);
                    currentKey = parts[0].Trim();
                    currentValue = parts[1].Trim();

                    string escapedString = @$"{currentValue}";
                    escapedString = escapedString.Replace("\\", "");
                    currentValue = escapedString;

                    if (currentKey.Contains(keyName))
                    {
                        if (currentValue.EndsWith(",\\"))
                        {
                            var multiLineValue = new StringBuilder(currentValue.TrimEnd('\\'));
                            while (currentValue.EndsWith(",\\"))
                            {
                                currentValue = lines[++i].Trim();
                                multiLineValue.Append(currentValue.TrimEnd('\\'));
                            }
                            currentValue = multiLineValue.ToString();
                        }

                        if (currentValue.StartsWith("dword:"))
                        {
                            return int.Parse(currentValue.Substring(6), System.Globalization.NumberStyles.HexNumber).ToString();
                        }
                        else if (currentValue.StartsWith("hex:"))
                        {
                            var hexValues = currentValue.Substring(4).Replace("\\", "").Split(',');
                            var bytes = hexValues.Select(hex => Convert.ToByte(hex, 16)).ToArray();
                            var decodedString = Encoding.UTF8.GetString(bytes);

                            if (decodedString.StartsWith("[") && decodedString.EndsWith("]"))
                            {
                                try
                                {
                                    var jsonObject = Newtonsoft.Json.JsonConvert.DeserializeObject(decodedString);
                                    return Newtonsoft.Json.JsonConvert.SerializeObject(jsonObject, Newtonsoft.Json.Formatting.Indented);
                                }
                                catch (Exception ex)
                                {
                                    logger.Error($"Error parsing JSON: {ex.Message}");
                                    return decodedString;
                                }
                            }
                            else
                            {
                                return currentValue;
                            }
                        }
                        else
                        {
                            return currentValue;
                        }
                    }
                }
            }

            logger.Error($"Key not found: {keyName}");
        
            return null;
        }

        public static string GetVRChatWinePath()
        {
            string compatTool = GetSteamVdfCompatTool();
            if (compatTool == null)
            {
                logger.Error("CompatTool not found");
                return null;
            }

            string steamPath = _steamPath;
            string steamAppsCommonPath = Path.Combine(steamPath, "steamapps", "common");
            string compatabilityToolsPath = Path.Combine(steamPath, "compatibilitytools.d");
            string protonPath = Path.Combine(steamAppsCommonPath, compatTool);
            string compatToolPath = Path.Combine(compatabilityToolsPath, compatTool);
            string winePath = "";
            if (Directory.Exists(compatToolPath))
            {
                winePath = Path.Combine(compatToolPath, "files", "bin", "wine");
                if (!File.Exists(winePath))
                {
                    Console.WriteLine("Wine not found in CompatTool path");
                    return null;
                }
            }
            else if (Directory.Exists(protonPath))
            {
                winePath = Path.Combine(protonPath, "dist", "bin", "wine");
                if (!File.Exists(winePath))
                {
                    logger.Error("Wine not found in Proton path");
                    return null;
                }
            }
            else
            {
                logger.Error("CompatTool and Proton not found");
                return null;
            }

            return winePath;
        }

        private ProcessStartInfo GetWineProcessStartInfo(string winePath, string winePrefix, string wineCommand)
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "/bin/bash",
                Arguments = $"-c \"{wineCommand.Replace("\"", "\\\"")}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };
            processStartInfo.Environment["WINEFSYNC"] = "1";
            processStartInfo.Environment["WINEPREFIX"] = winePrefix;
            //processStartInfo.Environment["WINEDEBUG"] = "-all";

            return processStartInfo;
        }

        private string GetWineRegCommand(string command)
        {
            string winePath = GetVRChatWinePath();
            string winePrefix = _vrcPrefixPath;
            string wineRegCommand = $"\"{winePath}\" reg {command}";
            ProcessStartInfo processStartInfo = GetWineProcessStartInfo(winePath, winePrefix, wineRegCommand);
            using var process = Process.Start(processStartInfo);
            string output = process.StandardOutput.ReadToEnd();
            string error = process.StandardError.ReadToEnd();
            process.WaitForExit();

            if (!string.IsNullOrEmpty(error) && 
                !error.Contains("wineserver: using server-side synchronization.") && 
                !error.Contains("fixme:wineusb:query_id"))
            {
                logger.Error($"Wine reg command error: {error}");
                return null;
            }

            return output;
        }

        private string GetWineRegCommandEx(string regCommand)
        {
            string winePrefix = _vrcPrefixPath;
            string filePath = Path.Combine(winePrefix, "user.reg");
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"Registry file not found at {filePath}");

            var match = Regex.Match(regCommand, @"^(add|query|delete)\s+""([^""]+)""(?:\s+/v\s+""([^""]+)"")?(?:\s+/t\s+(\w+))?(?:\s+/d\s+([^\s]+))?.*$");
            if (!match.Success)
                throw new ArgumentException("Invalid command format.");

            string action = match.Groups[1].Value.ToLower();
            string valueName = match.Groups[3].Success ? match.Groups[3].Value : null;
            string valueType = match.Groups[4].Success ? match.Groups[4].Value : null;
            string valueData = match.Groups[5].Success ? match.Groups[5].Value : null;

            var lines = File.ReadAllLines(filePath).ToList();
            var updatedLines = new List<string>();
            bool keyFound = false;
            bool valueFound = false;
            bool inVRChatSection = false;
            int headerEndIndex = -1;
            string keyHeader = "[Software\\\\VRChat\\\\VRChat]";

            if (action == "add")
            {
                for (int i = 0; i < lines.Count; i++)
                {
                    string line = lines[i].Trim();

                    if (line.StartsWith(keyHeader))
                    {
                        inVRChatSection = true;
                        keyFound = true;
                        headerEndIndex = i;

                        // Add header and metadata lines
                        while (i < lines.Count && (lines[i].StartsWith("#") || lines[i].StartsWith("@") || lines[i].Trim().StartsWith(keyHeader)))
                        {
                            updatedLines.Add(lines[i]);
                            i++;
                        }
                        i--;
                        continue;
                    }
                    else if (inVRChatSection && line.StartsWith("["))
                    {
                        inVRChatSection = false;
                    }

                    if (inVRChatSection && valueName != null)
                    {
                        if (line.TrimStart().StartsWith($"\"{valueName}\"="))
                        {
                            valueFound = true;
                            updatedLines.Add($"\"{valueName}\"={GetRegistryValueFormat(valueType, valueData)}");
                            continue;
                        }
                    }

                    updatedLines.Add(lines[i]);
                }

                // Add new value if not found but section exists
                if (keyFound && !valueFound && valueName != null)
                {
                    var insertIndex = headerEndIndex + 2;
                    while (insertIndex < updatedLines.Count && 
                           (updatedLines[insertIndex].StartsWith("#") || updatedLines[insertIndex].StartsWith("@")))
                    {
                        insertIndex++;
                    }
                    updatedLines.Insert(insertIndex, $"\"{valueName}\"={GetRegistryValueFormat(valueType, valueData)}");
                }

                File.WriteAllLines(filePath, updatedLines);
                return $"Command '{regCommand}' executed successfully.";
            }
            else if (action == "query")
            {
                if (!valueName.Contains("_h"))
                {
                    valueName = AddHashToKeyName(valueName);
                }
                
                foreach (var line in lines)
                {
                    if (line.Contains(valueName))
                    {
                        return line;
                    }
                }

                return $"Value \"{valueName}\" not found.";
            }

            logger.Error($"Unsupported registry command: {regCommand}");

            return $"Command '{regCommand}' executed successfully.";
        }

        private static string GetRegistryValueFormat(string valueType, string valueData)
        {
            if (valueType?.ToUpper() == "REG_DWORD100")
            {
                double inputValue = double.Parse(valueData);
                Span<byte> dataBytes = stackalloc byte[sizeof(double)];
                BitConverter.TryWriteBytes(dataBytes, inputValue);
                var hexValues = dataBytes.ToArray().Select(b => b.ToString("X2")).ToArray();
                var byteString = string.Join(",", hexValues).ToLower();
                var result = $"hex(4):{byteString}";
                return result;
            }

            return valueType?.ToUpper() switch
            {
                "REG_DWORD" => $"dword:{int.Parse(valueData):X8}",
                _ => throw new ArgumentException($"Unsupported registry value type: {valueType}"),
            };
        }

        public override object GetVRChatRegistryKey(string key)
        {
            try 
            {
                key = AddHashToKeyName(key);
                string regCommand = $"query \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"{key}\"";
                var queryResult = GetWineRegCommand(regCommand);
                if (queryResult == null)
                    return null;

                var result = ParseWineRegOutput(queryResult, key);
                if (result == "REG_DWORD")
                {
                    queryResult = GetWineRegCommandEx(regCommand);
                    result = ParseWineRegOutputEx(queryResult, key);
                }

                return result;
            }
            catch (Exception ex)
            {
                logger.Error($"Exception in GetRegistryValueFromWine: {ex.Message}");
                return null;
            }
        }
        
        public override string GetVRChatRegistryKeyString(string key)
        {
            // for electron
            return GetVRChatRegistryKey(key)?.ToString();
        }
        
        // TODO: check this
        public async Task SetVRChatRegistryKeyAsync(string key, object value, int typeInt)
        {
            await Task.Run(() =>
            {
                SetVRChatRegistryKey(key, value, typeInt);
            });
        }

        public override bool SetVRChatRegistryKey(string key, object value, int typeInt)
        {
            var type = (RegistryValueKind)typeInt;
            var keyName = AddHashToKeyName(key);
            switch (type)
            {
                case RegistryValueKind.Binary:
                    if (value is JsonElement jsonElement)
                    {
                        
                        if (jsonElement.ValueKind == JsonValueKind.String)
                        {
                            byte[] byteArray = Encoding.UTF8.GetBytes(jsonElement.GetString());
                            var data = BitConverter.ToString(byteArray).Replace("-", "");
                            if (data.Length == 0)
                                data = "\"\"";
                            string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_BINARY /d " + data + " /f";
                            var addResult = GetWineRegCommand(regCommand);
                            if (addResult == null)
                                return false;
                        }
                        else if (jsonElement.ValueKind == JsonValueKind.Array)
                        {
                            byte[] byteArray = jsonElement.EnumerateArray()
                                                           .Select(e => (byte)e.GetInt32()) // Convert each element to byte
                                                           .ToArray();
                            string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_BINARY /d " + BitConverter.ToString(byteArray).Replace("-", "") + " /f";
                            var addResult = GetWineRegCommand(regCommand);
                            if (addResult == null)
                                return false;
                        }
                        else
                        {
                            logger.Error($"Invalid value for REG_BINARY: {value}. It must be a JSON string or array.");
                            return false;
                        }
                    }
                    else if (value is string jsonArray)
                    {
                        byte[] byteArray = Encoding.UTF8.GetBytes(jsonArray);
                        string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_BINARY /d " + BitConverter.ToString(byteArray).Replace("-", "") + " /f";
                        var addResult = GetWineRegCommand(regCommand);
                        if (addResult == null)
                            return false;
                    }
                    else
                    {
                        logger.Error($"Invalid value for REG_BINARY: {value}. It must be a JsonElement.");
                        return false;
                    }
                    break;
                
                case RegistryValueKind.DWord:
                    if (value is int intValue)
                    {
                        string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_DWORD /d " + intValue + " /f";
                        var addResult = GetWineRegCommandEx(regCommand);
                        if (addResult == null)
                            return false;
                    }
                    else if (value is string stringValue && int.TryParse(stringValue, out int parsedIntValue))
                    {
                        string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_DWORD /d " + parsedIntValue + " /f";
                        var addResult = GetWineRegCommandEx(regCommand);
                        if (addResult == null)
                            return false;
                    }
                    else if (value is JsonElement jsonElementValue && jsonElementValue.ValueKind == JsonValueKind.Number)
                    {
                        int parsedInt32Value = jsonElementValue.GetInt32();
                        string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_DWORD /d " + parsedInt32Value + " /f";
                        var addResult = GetWineRegCommandEx(regCommand);
                        if (addResult == null)
                            return false;
                    }
                    else
                    {
                        logger.Error($"Invalid value for REG_DWORD: {value}. It must be a valid integer.");
                        return false;
                    }
                    break;
                default:
                    logger.Error($"Unsupported set registry value type: {typeInt}");
                    return false;
            }
            return true;
        }

        public override void SetVRChatRegistryKey(string key, byte[] value)
        {
            var keyName = AddHashToKeyName(key);
            var data = BitConverter.ToString(value).Replace("-", "");
            if (data.Length == 0)
                data = "\"\"";
            var regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_BINARY /d " + data + " /f";
            GetWineRegCommand(regCommand);
        }

        public override Dictionary<string, Dictionary<string, object>> GetVRChatRegistry()
        {
            return null;
        }

        // TODO: no object type
        // public Dictionary<string, Dictionary<string, object>> GetVRChatRegistry()
        public string GetVRChatRegistryJson()
        {
            var registry = new Dictionary<string, Dictionary<string, object>>();
            string regCommand = "query \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\"";
            var queryResult = GetWineRegCommand(regCommand);
            if (queryResult == null)
                return null;

            var lines = queryResult.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(line => 
                    !string.IsNullOrWhiteSpace(line) && 
                    !line.Contains("fixme:") && 
                    !line.Contains("wine:"))
                .ToArray();

            foreach (var line in lines)
            {
                var parts = line.Split(new[] { '\t', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(p => p.Trim())
                                .ToArray();
                if (parts.Length >= 3)
                {
                    var keyName = parts[0];
                    var index = keyName.LastIndexOf("_h", StringComparison.Ordinal);
                    if (index > 0)
                        keyName = keyName.Substring(0, index);
                    var valueType = parts[parts.Length - 2];
                    var value = parts[parts.Length - 1];
                    
                    switch (valueType)
                    {
                        case "REG_BINARY":
                            try 
                            {
                                // Treat the value as a plain hex string and decode it to ASCII
                                var hexValues = Enumerable.Range(0, value.Length / 2)
                                    .Select(i => value.Substring(i * 2, 2)) // Break string into chunks of 2
                                    .Select(hex => Convert.ToByte(hex, 16)) // Convert each chunk to a byte
                                    .ToArray();

                                var binDict = new Dictionary<string, object>
                                {
                                    { "data", Encoding.ASCII.GetString(hexValues).TrimEnd('\0') },
                                    { "type", 3 }
                                };
                                registry.Add(keyName, binDict);
                            }
                            catch (Exception ex)
                            {
                                logger.Error($"Error parsing REG_BINARY as plain hex string: {ex.Message}");
                            }
                            break;

                        case "REG_DWORD":
                            string regCommandExDword = $"query \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"{keyName}\"";
                            var queryResultExDword = GetWineRegCommandEx(regCommandExDword);
                            if (queryResultExDword == null)
                                break;

                            var resultExDword = ParseWineRegOutputEx(queryResultExDword, keyName);
                            if (resultExDword == null)
                                break;

                            try
                            {
                                if (resultExDword.StartsWith("hex(4)"))
                                {
                                    string hexString = resultExDword;
                                    string[] hexValues = hexString.Split(':')[1].Split(',');
                                    byte[] byteValues = hexValues.Select(h => Convert.ToByte(h, 16)).ToArray();
                                    if (byteValues.Length != 8)
                                    {
                                        throw new ArgumentException("Input does not represent a valid 8-byte double-precision float.");
                                    }
                                    double parsedDouble = BitConverter.ToDouble(byteValues, 0);
                                    var doubleDict = new Dictionary<string, object>
                                    {
                                        { "data", parsedDouble },
                                        { "type", 100 } // it's special
                                    };
                                    registry.Add(keyName, doubleDict);
                                }
                                else
                                {
                                    // Convert dword value to integer
                                    int parsedInt = int.Parse(resultExDword);
                                    var dwordDict = new Dictionary<string, object>
                                    {
                                        { "data", parsedInt },
                                        { "type", 4 }
                                    };
                                    registry.Add(keyName, dwordDict);
                                }
                            }
                            catch (Exception ex)
                            {
                                logger.Error($"Error parsing REG_DWORD: {ex.Message}");
                            }
                            break;
                    }
                }
            }

            return Newtonsoft.Json.JsonConvert.SerializeObject(registry, Newtonsoft.Json.Formatting.Indented);
        }

        public override void SetVRChatRegistry(string json)
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, object>>>(json);
            foreach (var item in dict)
            {
                var data = (JsonElement)item.Value["data"];
                if (!int.TryParse(item.Value["type"].ToString(), out var type))
                    throw new Exception("Unknown type: " + item.Value["type"]);

                string keyName = AddHashToKeyName(item.Key);
                if (type == 4)
                {
                    int intValue = data.GetInt32();
                    string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_DWORD /d " + intValue + " /f";
                    var addResult = GetWineRegCommandEx(regCommand);
                    if (addResult == null)
                        continue;
                }
                else if (type == 100)
                {
                    var valueLong = data.GetDouble();
                    string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /v \"" + keyName + "\" /t REG_DWORD100 /d " + valueLong + " /f";
                    var addResult = GetWineRegCommandEx(regCommand);
                    if (addResult == null)
                        continue;
                }
                else 
                {
                    // This slows down the recovery process but using async can be problematic
                    if (data.ValueKind == JsonValueKind.Number)
                    {
                        if (int.TryParse(data.ToString(), out var intValue))
                        {
                            SetVRChatRegistryKey(item.Key, intValue, type);
                            continue;
                        }
                        
                        throw new Exception("Unknown number type: " + item.Key);
                    }

                    SetVRChatRegistryKey(item.Key, data, type);
                }
            }
        }

        public override bool HasVRChatRegistryFolder()
        {
            string regCommand = "query \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\"";
            var queryResult = GetWineRegCommand(regCommand);
            if (queryResult == null)
                return false;

            return !string.IsNullOrEmpty(queryResult);
        }

        private void CreateVRChatRegistryFolder()
        {
            string regCommand = "add \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /f";
            GetWineRegCommand(regCommand);
        }

        public override void DeleteVRChatRegistryFolder()
        {
            string regCommand = "delete \"HKEY_CURRENT_USER\\SOFTWARE\\VRChat\\VRChat\" /f";
            GetWineRegCommand(regCommand);
        }

        public override void OpenVrcRegJsonFileDialog()
        {
        }
    }
}