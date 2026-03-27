import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';

import {
    i18n,
    initComponents,
    initPlugins,
    initRouter,
    initSentry
} from './plugins';
import { initPiniaPlugins, pinia } from './stores';
import { queryClient } from './queries';

import App from './App.vue';

// Show any uncaught crash on screen (critical for iOS debugging with no DevTools)
let appMounted = false;
function showFatalError(err) {
    console.error('[VRCX iOS Fatal]', err);
    // Don't show an error screen if the app already mounted - that means these
    // are background/async rejections from Capacitor plugins, not real crashes.
    if (appMounted) {
        console.warn('[VRCX] Ignoring post-mount rejection:', err);
        return;
    }
    let msg;
    try {
        if (err instanceof Error) {
            // In JavaScriptCore (iOS), Error's message/stack are non-enumerable
            // so JSON.stringify gives {}. Always use explicit property access.
            msg = (err.name || 'Error') + ': ' + (err.message || '(no message)');
            if (err.stack) msg += '\n\n' + err.stack;
        } else if (err && typeof err === 'object') {
            // Try explicit getOwnPropertyNames first, then fall back
            let serialized = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
            if (!serialized || serialized === '{}') {
                const keys = Object.keys(err);
                serialized = keys.length
                    ? JSON.stringify(err, null, 2)
                    : `[object ${err.constructor?.name || 'Object'}] (no enumerable properties)`;
            }
            msg = serialized;
        } else {
            msg = String(err);
        }
    } catch (e2) {
        msg = 'Could not serialize error: ' + String(e2);
    }
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#1a0000;color:#ff6b6b;font-family:monospace;font-size:13px;padding:20px;overflow:auto;z-index:99999;white-space:pre-wrap;word-break:break-all';
    div.textContent = '[VRCX Fatal Error]\n\n' + msg;
    document.body?.appendChild(div);
}

window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    // Capacitor plugin bridge rejects with plain {} for missing native plugins.
    // These are expected on iOS and should not crash the app.
    if (reason !== null && typeof reason === 'object' && !(reason instanceof Error)) {
        console.warn('[VRCX] Suppressed non-Error unhandledrejection:', reason);
        e.preventDefault(); // Prevent default handling
        return;
    }
    showFatalError(reason ?? new Error('unhandledrejection with no reason'));
});

window.addEventListener('error', (e) => {
    showFatalError(e.error || new Error(e.message));
});

try {
    console.log('[VRCX] step 1: initPlugins');
    await initPlugins();
    console.log('[VRCX] step 2: initPiniaPlugins');
    await initPiniaPlugins();
    console.log('[VRCX] step 3: createApp');
    const app = createApp(App);
    console.log('[VRCX] step 4: use plugins');
    app.use(pinia).use(i18n).use(VueQueryPlugin, { queryClient });
    initComponents(app);
    initRouter(app);
    console.log('[VRCX] step 5: initSentry');
    await initSentry(app);
    console.log('[VRCX] step 6: mount');
    app.mount('#root');
    appMounted = true;
    console.log('[VRCX] mounted OK');
} catch (err) {
    showFatalError(err);
}
