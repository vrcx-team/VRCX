// @ts-nocheck
import InteropApi from '../ipc-electron/interopApi.js';

// #region | Init Cef C# bindings
if (WINDOWS) {
    await CefSharp.BindObjectAsync(
        'AppApi',
        'WebApi',
        'VRCXStorage',
        'SQLite',
        'LogWatcher',
        'Discord',
        'AssetBundleManager'
    );
} else {
    window.AppApi = InteropApi.AppApiElectron;
    window.WebApi = InteropApi.WebApi;
    window.VRCXStorage = InteropApi.VRCXStorage;
    window.SQLite = InteropApi.SQLite;
    window.LogWatcher = InteropApi.LogWatcher;
    window.Discord = InteropApi.Discord;
    window.AssetBundleManager = InteropApi.AssetBundleManager;
    window.AppApiVrElectron = InteropApi.AppApiVrElectron;
}
