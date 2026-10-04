using System;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public void SetRemoteHostConfig(string address, string username, string password, string logPath)
        {
            var storage = VRCXStorage.Instance;
            storage.Set("VRCX_RemoteHostAddress", address ?? string.Empty);
            storage.Set("VRCX_RemoteHostUsername", username ?? string.Empty);
            storage.Set("VRCX_RemoteHostPassword", password ?? string.Empty);
            storage.Set("VRCX_RemoteHostLogPath", logPath ?? string.Empty);

            if (storage.Get("VRCX_RemoteHostEnabled") == "true")
            {
                RemoteHostClient.Instance.Start(address, username, password, logPath);
                LogWatcher.Instance.Restart();
            }
        }

        public void SetRemoteHostEnabled(bool enabled)
        {
            VRCXStorage.Instance.Set("VRCX_RemoteHostEnabled", enabled ? "true" : "false");

            if (enabled)
            {
                RemoteHostClient.Instance.StartFromConfig();
                LogWatcher.Instance.Restart();
            }
            else
            {
                RemoteHostClient.Instance.Stop();
                LogWatcher.Instance.Restart();
            }
        }

        public string GetRemoteHostStatus()
        {
            return RemoteHostClient.Instance.GetStatusJson();
        }
    }
}
