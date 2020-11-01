using CefSharp;

namespace VRCX
{
    public static class Util
    {
        public static void RegisterBindings(IJavascriptObjectRepository repository)
        {
            var options = new BindingOptions()
            {
                CamelCaseJavascriptNames = false
            };
            repository.Register("VRCX", VRCX.Instance, true, options);
            repository.Register("SharedVariable", SharedVariable.Instance, false, options);
            repository.Register("VRCXStorage", VRCXStorage.Instance, false, options);
            repository.Register("SQLite", SQLite.Instance, false, options);
            repository.Register("LogWatcher", LogWatcher.Instance, true, options);
            repository.Register("Discord", Discord.Instance, true, options);
        }
    }
}