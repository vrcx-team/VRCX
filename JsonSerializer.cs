// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using Newtonsoft.Json;
using System.IO;
using System.Text;

namespace VRCX
{
    public static class JsonSerializer
    {
        public static void Serialize<T>(string path, T obj)
        {
            try
            {
                using (var file = File.Open(path, FileMode.Create, FileAccess.Write, FileShare.ReadWrite))
                using (var stream = new StreamWriter(file, Encoding.UTF8))
                using (var writer = new JsonTextWriter(stream))
                {
                    var serializer = Newtonsoft.Json.JsonSerializer.CreateDefault();
                    serializer.Formatting = Formatting.Indented;
                    serializer.Serialize(writer, obj, typeof(T));
                }
            }
            catch
            {
            }
        }

        public static bool Deserialize<T>(string path, ref T obj)
        {
            try
            {
                using (var file = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (var stream = new StreamReader(file, Encoding.UTF8))
                using (var reader = new JsonTextReader(stream))
                {
                    obj = Newtonsoft.Json.JsonSerializer.CreateDefault().Deserialize<T>(reader);
                    return true;
                }
            }
            catch
            {
            }
            return false;
        }
    }
}