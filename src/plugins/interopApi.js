// @ts-nocheck
import InteropApi from '../ipc-electron/interopApi.js';
import configRepository from '../services/config.js';
import vrcxJsonStorage from '../services/jsonStorage.js';

export async function initInteropApi(isVrOverlay = false) {
    if (typeof window.Capacitor !== 'undefined') {
        console.log('[VRCX] interop A: Capacitor detected');
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

        const isIOS = window.Capacitor.getPlatform() === 'ios';
        const platformLabel = isIOS ? 'iOS' : 'Android';
        console.log('[VRCX] interop B: platform =', platformLabel);

        window.AppApi = mockClass({
            SetUserAgent: () => {},
            GetVersion: async () => `1.0.0 (${platformLabel})`
        });
        console.log('[VRCX] interop C: AppApi set');

        // Cookie jar for iOS: CapacitorHttp intercepts fetch() natively and manages
        // its own cookie store, but we also keep a JS-level backup in case of gaps.
        const cookieJar = new Map();

        function parseCookies(setCookieHeader) {
            if (!setCookieHeader) return;
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            for (const cookie of cookies) {
                const [kv] = cookie.split(';');
                const eqIdx = kv.indexOf('=');
                if (eqIdx > 0) {
                    const name = kv.slice(0, eqIdx).trim();
                    const value = kv.slice(eqIdx + 1).trim();
                    if (value) {
                        cookieJar.set(name, value);
                    } else {
                        cookieJar.delete(name); // cookie cleared
                    }
                }
            }
        }

        function buildCookieHeader() {
            if (cookieJar.size === 0) return null;
            return Array.from(cookieJar.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join('; ');
        }

        const VRCX_UA = 'VRCX/1.0.0 (iOS; vrcx-team/VRCX)';

        window.WebApi = {
            Execute: async (options) => {
                try {
                    let url = typeof options.url === 'string' ? options.url : options.Url;
                    if(!url && typeof options === 'string') url = options;
                    const method = options.method || options.Method || 'GET';
                    const reqHeaders = {
                        'User-Agent': VRCX_UA,
                        ...(options.headers || options.Headers || {})
                    };
                    // Replay our cookie jar to ensure session auth persists
                    // across requests (CapacitorHttp handles this natively,
                    // but we keep a backup jar for safety).
                    const cookieHeader = buildCookieHeader();
                    if (cookieHeader) {
                        reqHeaders['Cookie'] = cookieHeader;
                    }
                    const fetchOpts = {
                        method,
                        headers: reqHeaders,
                        credentials: 'include'
                    };
                    const body = options.body || options.Content;
                    if(body && (method !== 'GET' && method !== 'HEAD')) {
                        fetchOpts.body = body;
                    }
                    const response = await fetch(url, fetchOpts);
                    // Capture any new cookies from the response
                    const setCookie = response.headers.get('set-cookie');
                    if (setCookie) parseCookies(setCookie);
                    const data = await response.text();
                    return { Item1: response.status, Item2: data };
                } catch (e) {
                    return { Item1: -1, Item2: e.toString() };
                }
            },
            GetCookies: () => Array.from(cookieJar.entries()).map(([k,v]) => `${k}=${v}`).join('; '),
            SetCookies: (cookie) => {
                if (typeof cookie === 'string') parseCookies(cookie);
            },
            ClearCookies: () => cookieJar.clear()
        };
        console.log('[VRCX] interop D: WebApi set');

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
        console.log('[VRCX] interop E: VRCXStorage set');

        let db = null;
        if (!isIOS) {
            // @capacitor-community/sqlite has no Package.swift so it is NOT
            // available on iOS when using SPM. Skip it entirely on iOS.
            try {
                const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
                const sqlite = new SQLiteConnection(CapacitorSQLite);
                db = await sqlite.createConnection('vrcx_sqlite_db', false, 'no-encryption', 1, false);
                await db.open();
            } catch (err) {
                console.warn('Capacitor SQLite failed to load or open:', err);
            }
        }
        console.log('[VRCX] interop F: db =', db ? 'connected' : 'null (iOS)');

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
        console.log('[VRCX] interop G: SQLite set');

        console.log('[VRCX] interop G1: setting LogWatcher');
        window.LogWatcher = mockClass();
        console.log('[VRCX] interop G2: setting Discord');
        window.Discord = mockClass();
        console.log('[VRCX] interop G3: setting AssetBundleManager');
        window.AssetBundleManager = mockClass();
        console.log('[VRCX] interop G4: patching speechSynthesis if missing');
        // window.speechSynthesis is a READ-ONLY getter on iOS WKWebView.
        // Assigning to it directly in strict mode (ES modules are always strict)
        // throws a TypeError which JavaScriptCore serializes as {} — the fatal crash.
        // Use defineProperty only if speechSynthesis is genuinely absent.
        if (!window.speechSynthesis) {
            try {
                Object.defineProperty(window, 'speechSynthesis', {
                    configurable: true,
                    get: () => ({
                        getVoices: () => [],
                        speak: () => {},
                        cancel: () => {},
                        pause: () => {},
                        resume: () => {}
                    })
                });
            } catch (e) {
                console.warn('[VRCX] Could not patch speechSynthesis:', e);
            }
        }
        console.log('[VRCX] interop H: misc mocks set');

        console.log('[VRCX] interop I: calling configRepository.init()');
        await configRepository.init();
        console.log('[VRCX] interop J: configRepository.init() done');
        new vrcxJsonStorage(VRCXStorage);
        console.log('[VRCX] interop K: vrcxJsonStorage done');
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
