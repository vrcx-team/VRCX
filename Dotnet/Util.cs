using System;
using CefSharp;

namespace VRCX
{
    public static class Util
    {
        public static void ApplyJavascriptBindings(IJavascriptObjectRepository repository)
        {
            repository.NameConverter = null;
            repository.Register("AppApi", AppApi.Instance);
            repository.Register("SharedVariable", SharedVariable.Instance);
            repository.Register("WebApi", WebApi.Instance);
            repository.Register("VRCXStorage", VRCXStorage.Instance);
            repository.Register("SQLite", SQLiteLegacy.Instance);
            repository.Register("LogWatcher", LogWatcher.Instance);
            repository.Register("Discord", Discord.Instance);
            repository.Register("AssetBundleCacher", AssetBundleCacher.Instance);
        }
    }
}
