using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace VRCX
{
    public partial class AppApi
    {
        [DllImport("advapi32.dll", CharSet = CharSet.Ansi, SetLastError = true)]
        public static extern uint RegSetValueEx(
            UIntPtr hKey,
            [MarshalAs(UnmanagedType.LPStr)] string lpValueName,
            int Reserved,
            RegistryValueKind dwType,
            byte[] lpData,
            int cbData);

        [DllImport("advapi32.dll", CharSet = CharSet.Ansi, SetLastError = true)]
        public static extern int RegOpenKeyEx(
            UIntPtr hKey,
            string subKey,
            int ulOptions,
            int samDesired,
            out UIntPtr hkResult);

        [DllImport("advapi32.dll")]
        public static extern int RegCloseKey(UIntPtr hKey);

        public string AddHashToKeyName(string key)
        {
            // https://discussions.unity.com/t/playerprefs-changing-the-name-of-keys/30332/4
            // VRC_GROUP_ORDER_usr_032383a7-748c-4fb2-94e4-bcb928e5de6b_h2810492971
            uint hash = 5381;
            foreach (var c in key)
                hash = (hash * 33) ^ c;
            return key + "_h" + hash;
        }

        /// <summary>
        /// Retrieves the value of the specified key from the VRChat group in the windows registry.
        /// </summary>
        /// <param name="key">The name of the key to retrieve.</param>
        /// <returns>The value of the specified key, or null if the key does not exist.</returns>
        public object GetVRChatRegistryKey(string key)
        {
            var keyName = AddHashToKeyName(key);
            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                var data = regKey?.GetValue(keyName);
                if (data == null)
                    return null;

                var type = regKey.GetValueKind(keyName);
                switch (type)
                {
                    case RegistryValueKind.Binary:
                        return Encoding.ASCII.GetString((byte[])data);

                    case RegistryValueKind.DWord:
                        if (data.GetType() != typeof(long))
                            return data;

                        long.TryParse(data.ToString(), out var longValue);
                        var bytes = BitConverter.GetBytes(longValue);
                        var doubleValue = BitConverter.ToDouble(bytes, 0);
                        return doubleValue;
                }
            }

            return null;
        }

        /// <summary>
        /// Sets the value of the specified key in the VRChat group in the windows registry.
        /// </summary>
        /// <param name="key">The name of the key to set.</param>
        /// <param name="value">The value to set for the specified key.</param>
        /// <param name="typeInt">The RegistryValueKind type.</param>
        /// <returns>True if the key was successfully set, false otherwise.</returns>
        public bool SetVRChatRegistryKey(string key, object value, int typeInt)
        {
            var type = (RegistryValueKind)typeInt;
            var keyName = AddHashToKeyName(key);
            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat", true))
            {
                if (regKey == null)
                    return false;

                object setValue = null;
                switch (type)
                {
                    case RegistryValueKind.Binary:
                        setValue = Encoding.ASCII.GetBytes(value.ToString());
                        break;

                    case RegistryValueKind.DWord:
                        setValue = value;
                        break;
                }

                if (setValue == null)
                    return false;

                regKey.SetValue(keyName, setValue, type);
            }

            return true;
        }

        /// <summary>
        /// Sets the value of the specified key in the VRChat group in the windows registry.
        /// </summary>
        /// <param name="key">The name of the key to set.</param>
        /// <param name="value">The value to set for the specified key.</param>
        public void SetVRChatRegistryKey(string key, byte[] value)
        {
            var keyName = AddHashToKeyName(key);
            var hKey = (UIntPtr)0x80000001; // HKEY_LOCAL_MACHINE
            const int keyWrite = 0x20006;
            const string keyFolder = @"SOFTWARE\VRChat\VRChat";
            var openKeyResult = RegOpenKeyEx(hKey, keyFolder, 0, keyWrite, out var folderPointer);
            if (openKeyResult != 0)
                throw new Exception("Error opening registry key. Error code: " + openKeyResult);

            var setKeyResult = RegSetValueEx(folderPointer, keyName, 0, RegistryValueKind.DWord, value, value.Length);
            if (setKeyResult != 0)
                throw new Exception("Error setting registry value. Error code: " + setKeyResult);

            RegCloseKey(hKey);
        }

        public Dictionary<string, Dictionary<string, object>> GetVRChatRegistry()
        {
            var output = new Dictionary<string, Dictionary<string, object>>();
            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                if (regKey == null)
                    throw new Exception("Nothing to backup.");

                var keys = regKey.GetValueNames();

                Span<long> spanLong = stackalloc long[1];
                Span<double> doubleSpan = MemoryMarshal.Cast<long, double>(spanLong);

                foreach (var key in keys)
                {
                    var data = regKey.GetValue(key);
                    var index = key.LastIndexOf("_h", StringComparison.Ordinal);
                    if (index <= 0)
                        continue;

                    var keyName = key.Substring(0, index);
                    if (data == null)
                        continue;

                    var type = regKey.GetValueKind(key);
                    switch (type)
                    {
                        case RegistryValueKind.Binary:
                            var binDict = new Dictionary<string, object>
                            {
                                { "data", Encoding.ASCII.GetString((byte[])data) },
                                { "type", type }
                            };
                            output.Add(keyName, binDict);
                            break;

                        case RegistryValueKind.DWord:
                            if (data.GetType() != typeof(long))
                            {
                                var dwordDict = new Dictionary<string, object>
                                {
                                    { "data", data },
                                    { "type", type }
                                };
                                output.Add(keyName, dwordDict);
                                break;
                            }

                            spanLong[0] = (long)data;
                            var doubleValue = doubleSpan[0];
                            var floatDict = new Dictionary<string, object>
                            {
                                { "data", doubleValue },
                                { "type", 100 } // it's special
                            };
                            output.Add(keyName, floatDict);
                            break;

                        default:
                            Debug.WriteLine($"Unknown registry value kind: {type}");
                            break;
                    }
                }
            }
            return output;
        }

        public void SetVRChatRegistry(string json)
        {
            CreateVRChatRegistryFolder();
            Span<double> spanDouble = stackalloc double[1];
            var dict = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, object>>>(json);
            foreach (var item in dict)
            {
                var data = (JsonElement)item.Value["data"];
                if (!int.TryParse(item.Value["type"].ToString(), out var type))
                    throw new Exception("Unknown type: " + item.Value["type"]);

                if (data.ValueKind == JsonValueKind.Number)
                {
                    if (type == 100)
                    {
                        // fun handling of double to long to byte array
                        spanDouble[0] = data.Deserialize<double>();
                        var valueLong = MemoryMarshal.Cast<double, long>(spanDouble)[0];
                        const int dataLength = sizeof(long);
                        var dataBytes = new byte[dataLength];
                        Buffer.BlockCopy(BitConverter.GetBytes(valueLong), 0, dataBytes, 0, dataLength);
                        SetVRChatRegistryKey(item.Key, dataBytes);
                        continue;
                    }

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

        public bool HasVRChatRegistryFolder()
        {
            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                return regKey != null;
            }
        }

        public void CreateVRChatRegistryFolder()
        {
            if (HasVRChatRegistryFolder())
                return;

            using (var key = Registry.CurrentUser.CreateSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                if (key == null)
                    throw new Exception("Error creating registry key.");
            }
        }

        public void DeleteVRChatRegistryFolder()
        {
            using (var regKey = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\VRChat\VRChat"))
            {
                if (regKey == null)
                    return;

                Registry.CurrentUser.DeleteSubKeyTree(@"SOFTWARE\VRChat\VRChat");
            }
        }


        public string ReadVrcRegJsonFile(string filepath)
        {
            if (!File.Exists(filepath))
            {
                return "";
            }

            var json = File.ReadAllText(filepath);
            return json;
        }
    }
}