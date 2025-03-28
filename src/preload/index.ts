import { contextBridge, ipcRenderer } from 'electron';
import { Channels, IElectronAPI } from '../shared/ipc-types';

/**
 * Exposes specific Electron API functions to the renderer process
 * through the contextBridge, maintaining security with contextIsolation
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke(Channels.GET_APP_VERSION),
  // Settings methods
  getSetting: (key) => ipcRenderer.invoke(Channels.GET_SETTING, key),
  setSetting: (key, value) => ipcRenderer.invoke(Channels.SET_SETTING, key, value),
  getSettings: () => ipcRenderer.invoke(Channels.GET_SETTINGS),
  // Expose other methods here
} as IElectronAPI);

// For security reasons, we don't expose the entire ipcRenderer object
// Each method is explicitly defined with its specific channel and type 