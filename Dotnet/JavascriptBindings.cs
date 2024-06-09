using CefSharp;

namespace VRCX
{
    public static class JavascriptBindings
    {
        public static void ApplyAppJavascriptBindings(IJavascriptObjectRepository repository)
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
        
        public static void ApplyVrJavascriptBindings(IJavascriptObjectRepository repository)
        {
            repository.NameConverter = null;
            repository.Register("AppApiVr", AppApiVr.Instance);
        }
    }
}
