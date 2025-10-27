using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;

namespace VRCX
{
    public class VRCXStorage
    {
        public static readonly VRCXStorage Instance;

        private static ConcurrentDictionary<string, string> _storage = new ConcurrentDictionary<string, string>();
        private static readonly string JsonPath = Path.Join(Program.AppDataDirectory, "VRCX.json");

        private static readonly TimeSpan SaveDebounce = TimeSpan.FromMilliseconds(500);
        private static readonly Timer SaveTimer;
        private static readonly Lock SaveLock = new Lock();

        static VRCXStorage()
        {
            Instance = new VRCXStorage();
            SaveTimer = new Timer(_ => Instance.Save(), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
        }

        public void Load()
        {
            var tmp = new Dictionary<string, string>();
            JsonFileSerializer.Deserialize(JsonPath, ref tmp);
            _storage = new ConcurrentDictionary<string, string>(tmp);
        }

        public void Save()
        {
            lock (SaveLock)
            {
                var snapshot = new Dictionary<string, string>(_storage);
                JsonFileSerializer.Serialize(JsonPath, snapshot);
            }
        }

        public void Clear()
        {
            if (!_storage.IsEmpty)
            {
                _storage.Clear();
                ScheduleSave();
            }
        }

        public bool Remove(string key)
        {
            var result = _storage.TryRemove(key, out _);
            if (result)
                ScheduleSave();
            return result;
        }

        public string Get(string key)
        {
            return _storage.TryGetValue(key, out var value) ? value : string.Empty;
        }

        public void Set(string key, string value)
        {
            _storage[key] = value;
            ScheduleSave();
        }

        public string GetAll()
        {
            return JsonSerializer.Serialize(new Dictionary<string, string>(_storage));
        }

        private static void ScheduleSave()
        {
            SaveTimer.Change(SaveDebounce, Timeout.InfiniteTimeSpan);
        }
    }
}