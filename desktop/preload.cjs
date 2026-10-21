const { contextBridge, ipcRenderer } = require('electron');

// window.desktop exists only in the .exe: it turns on the cast edition extras
contextBridge.exposeInMainWorld('desktop', {
  quit: () => ipcRenderer.send('quit'),
  fullscreen: () => ipcRenderer.send('fullscreen'),
});
