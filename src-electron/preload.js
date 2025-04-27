/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer, app } = require('electron');

contextBridge.exposeInMainWorld('interopApi', {
    callDotNetMethod: (className, methodName, args) => {
        return ipcRenderer.invoke(
            'callDotNetMethod',
            className,
            methodName,
            args
        );
    }
});

contextBridge.exposeInMainWorld('electron', {
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
    onWindowPositionChanged: (callback) =>
        ipcRenderer.on('setWindowPosition', callback),
    onWindowSizeChanged: (callback) =>
        ipcRenderer.on('setWindowSize', callback),
    onWindowStateChange: (callback) =>
        ipcRenderer.on('setWindowState', callback),
    desktopNotification: (title, body, icon) =>
        ipcRenderer.invoke('notification:showNotification', title, body, icon),
    restartApp: () => ipcRenderer.invoke('app:restart')
});
