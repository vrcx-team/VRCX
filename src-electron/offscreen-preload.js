const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateImage: (callback) => ipcRenderer.on('update-image', (event, base64) => callback(base64))
});