// @ts-nocheck
import InteropApi from '../ipc-electron/interopApi.js';
import configRepository from '../service/config';
import vrcxJsonStorage from '../service/jsonStorage';

export async function initInteropApi(isVrOverlay = false) {
    if (isVrOverlay) {
        if (WINDOWS) {
            await CefSharp.BindObjectAsync('AppApiVr');
        } else {
            // @ts-ignore
            window.AppApiVr = InteropApi.AppApiVrElectron;
        }
    } else {
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

        configRepository.init();
        new vrcxJsonStorage(VRCXStorage);

        AppApi.SetUserAgent();
    }
}
