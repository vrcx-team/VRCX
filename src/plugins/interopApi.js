// @ts-nocheck
import InteropApi from '../ipc-electron/interopApi.js';
import configRepository from '../services/config.js';
import vrcxJsonStorage from '../services/jsonStorage.js';

export async function initInteropApi(isVrOverlay = false) {
    if (typeof window.Capacitor !== 'undefined') {
        const mockClass = (overrides = {}) => {
            return new Proxy(overrides, {
                get(target, prop) {
                    if (prop in target) {
                        return target[prop];
                    }
                    if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch' || (typeof prop === 'string' && prop.startsWith('__v_'))) {
                        return undefined;
                    }
                    return async () => "";
                }
            });
        };

        window.AppApi = mockClass({
            SetUserAgent: () => {},
            GetVersion: async () => "1.0.0 (Android)"
        });

        window.WebApi = {
            Execute: async (options) => {
                try {
                    let url = typeof options.url === 'string' ? options.url : options.Url;
                    if(!url && typeof options === 'string') url = options;
                    const fetchOpts = {
                        method: options.method || options.Method || 'GET',
                        headers: options.headers || options.Headers || {},
                        credentials: 'include'
                    };
                    const body = options.body || options.Content;
                    if(body && (fetchOpts.method !== 'GET' && fetchOpts.method !== 'HEAD')) {
                        fetchOpts.body = body;
                    }
                    const response = await fetch(url, fetchOpts);
                    const data = await response.text();
                    return { Item1: response.status, Item2: data };
                } catch (e) {
                    return { Item1: -1, Item2: e.toString() };
                }
            },
            GetCookies: () => "",
            SetCookies: () => {},
            ClearCookies: () => {}
        };

        window.VRCXStorage = {
            Load: async () => {},
            Save: async () => {},
            Flush: async () => {},
            Get: async (key) => window.localStorage.getItem('VRCXStorage_' + key) || "",
            Set: async (key, val) => window.localStorage.setItem('VRCXStorage_' + key, String(val)),
            Remove: async (key) => window.localStorage.removeItem('VRCXStorage_' + key),
            GetAll: async () => "{}",
            GetArray: async (key) => {
                try { return JSON.parse(window.localStorage.getItem('VRCXStorage_arr_' + key)) || []; } catch { return []; }
            },
            SetArray: async (key, val) => window.localStorage.setItem('VRCXStorage_arr_' + key, JSON.stringify(val)),
            GetObject: async (key) => {
                try { return JSON.parse(window.localStorage.getItem('VRCXStorage_obj_' + key)) || {}; } catch { return {}; }
            },
            SetObject: async (key, val) => window.localStorage.setItem('VRCXStorage_obj_' + key, JSON.stringify(val))
        };

        let db = null;
        try {
            const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
            const sqlite = new SQLiteConnection(CapacitorSQLite);
            db = await sqlite.createConnection('vrcx_sqlite_db', false, 'no-encryption', 1, false);
            await db.open();
        } catch (err) {
            console.warn('Capacitor SQLite failed to load or open:', err);
        }

        const parseArgs = (sql, args) => {
            if (!args) return { sql, values: [] };
            const values = [];
            const regex = /@\w+/g;
            const matches = sql.match(regex);
            if (matches) {
                matches.forEach(m => {
                    const val = args instanceof Map ? args.get(m) : args[m];
                    values.push(val !== undefined ? val : null);
                });
                sql = sql.replace(regex, '?');
            }
            return { sql, values };
        };

        window.SQLite = {
            Execute: async (sql, args) => {
                if (!db) return [];
                const parsed = parseArgs(sql, args);
                try {
                    const res = await db.query(parsed.sql, parsed.values);
                    if (res && res.values) {
                        return res.values.map(row => Object.values(row));
                    }
                } catch (e) {
                    console.error('SQLite.Execute error:', e, parsed.sql, parsed.values);
                }
                return [];
            },
            ExecuteNonQuery: async (sql, args) => {
                if (!db) return;
                const parsed = parseArgs(sql, args);
                try {
                    await db.run(parsed.sql, parsed.values);
                } catch (e) {
                    console.error('SQLite.ExecuteNonQuery error:', e, parsed.sql, parsed.values);
                }
            }
        };

        window.LogWatcher = mockClass();
        window.Discord = mockClass();
        window.AssetBundleManager = mockClass();
        
        window.speechSynthesis = window.speechSynthesis || {
            getVoices: () => [],
            speak: () => {},
            cancel: () => {},
            pause: () => {},
            resume: () => {}
        };

        await configRepository.init();
        new vrcxJsonStorage(VRCXStorage);
        return;
    }

    if (isVrOverlay) {
        if (WINDOWS) {
            if (typeof CefSharp !== 'undefined') {
                await CefSharp.BindObjectAsync('AppApiVr');
            }
        } else {
            // @ts-ignore
            window.AppApiVr = InteropApi.AppApiVrElectron;
        }
    } else {
        // #region | Init Cef C# bindings
        if (WINDOWS) {
            if (typeof CefSharp !== 'undefined') {
                await CefSharp.BindObjectAsync(
                    'AppApi',
                    'WebApi',
                    'VRCXStorage',
                    'SQLite',
                    'LogWatcher',
                    'Discord',
                    'AssetBundleManager'
                );
            }
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

        await configRepository.init();
        new vrcxJsonStorage(VRCXStorage);

        if (window.AppApi) {
            AppApi.SetUserAgent();
        }
    }
}
