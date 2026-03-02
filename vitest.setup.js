/**
 * Vitest global setup file.
 * Loads English locale messages into i18n so that
 * translation calls return expected values in tests.
 *
 * Provides global stubs for CefSharp IPC bindings.
 */

import { i18n } from './src/plugin/i18n';

import en from './src/localization/en.json';

const noopAsync = () => Promise.resolve('');

globalThis.AppApi = new Proxy({}, { get: () => noopAsync });
globalThis.WebApi = new Proxy({}, { get: () => noopAsync });
globalThis.VRCXStorage = new Proxy({}, { get: () => noopAsync });
globalThis.SQLite = new Proxy({}, { get: () => noopAsync });
globalThis.LogWatcher = new Proxy({}, { get: () => noopAsync });
globalThis.Discord = new Proxy({}, { get: () => noopAsync });
globalThis.AssetBundleManager = new Proxy({}, { get: () => noopAsync });

// Browser API stubs not available in jsdom
globalThis.speechSynthesis = {
    getVoices: () => [],
    cancel: () => {},
    speak: () => {}
};

// matchMedia polyfill (standard jsdom workaround)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
});

// Notification API stub
globalThis.Notification = class {
    static permission = 'denied';
    static requestPermission = vi.fn().mockResolvedValue('denied');
    constructor() {}
    close() {}
};

// Mock worker-timers to use native timers (workers unavailable in jsdom)
vi.mock('worker-timers', () => ({
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
}));

i18n.global.setLocaleMessage('en', en);
