/**
 * worker-timers shim for iOS WKWebView.
 *
 * The real worker-timers package spawns a Web Worker to keep timers accurate
 * when the tab is backgrounded. iOS WKWebView blocks Worker creation from
 * capacitor://localhost, causing a fatal crash at module-load time.
 *
 * This shim replaces the package with plain window.setTimeout / setInterval
 * equivalents. Timer accuracy may degrade when backgrounded on iOS, but the
 * app will actually run, which is the priority.
 */

export const clearInterval = (id) => window.clearInterval(id);
export const clearTimeout  = (id) => window.clearTimeout(id);
export const setInterval   = (fn, delay, ...args) => window.setInterval(fn, delay, ...args);
export const setTimeout    = (fn, delay, ...args) => window.setTimeout(fn, delay, ...args);
