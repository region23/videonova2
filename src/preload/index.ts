import { contextBridge, ipcRenderer } from 'electron';
import { Channels, IElectronAPI } from '../shared/ipc-types';

/**
 * Exposes specific Electron API functions to the renderer process
 * through the contextBridge, maintaining security with contextIsolation
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke(Channels.GET_APP_VERSION),
  // Settings methods
  getSetting: (key: string) => ipcRenderer.invoke(Channels.GET_SETTING, key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke(Channels.SET_SETTING, key, value),
  getSettings: () => ipcRenderer.invoke(Channels.GET_SETTINGS),
  
  // Dependency management methods
  getDependencyPaths: () => ipcRenderer.invoke(Channels.GET_DEPENDENCY_PATHS),
  validateDependencies: () => ipcRenderer.invoke(Channels.VALIDATE_DEPENDENCIES),
  findPythonPath: () => ipcRenderer.invoke(Channels.FIND_PYTHON_PATH),
  checkPythonPackages: (packages: string[]) => ipcRenderer.invoke(Channels.CHECK_PYTHON_PACKAGES, packages),
  setDependencyPath: (dependency: 'python' | 'soundtouch', path: string) => 
    ipcRenderer.invoke(Channels.SET_DEPENDENCY_PATH, dependency, path),
  
  // yt-dlp methods
  getVideoInfo: (url: string) => 
    ipcRenderer.invoke(Channels.GET_VIDEO_INFO, url),
  downloadMedia: (url: string, formatCode: string, outputPath: string) => 
    ipcRenderer.invoke(Channels.DOWNLOAD_MEDIA, url, formatCode, outputPath),
  downloadAudio: (url: string, outputPath: string) => 
    ipcRenderer.invoke(Channels.DOWNLOAD_AUDIO, url, outputPath),
  downloadSubtitles: (url: string, language: string, outputPath: string) => 
    ipcRenderer.invoke(Channels.DOWNLOAD_SUBTITLES, url, language, outputPath),
  getBestFormats: (url: string) => 
    ipcRenderer.invoke(Channels.GET_BEST_FORMATS, url),
  downloadHighQualityComponents: (url: string, outputDir: string, basename: string) => 
    ipcRenderer.invoke(Channels.DOWNLOAD_HIGH_QUALITY_COMPONENTS, url, outputDir, basename),
} as IElectronAPI);

// For security reasons, we don't expose the entire ipcRenderer object
// Each method is explicitly defined with its specific channel and type 