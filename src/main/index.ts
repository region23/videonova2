import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Channels } from '../shared/ipc-types';
import { getSetting, setSetting, getSettings } from './services/settingsManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) app.quit();

// Set up IPC handlers
const setupIpcHandlers = () => {
  // Handler for getting app version
  ipcMain.handle(Channels.GET_APP_VERSION, () => {
    return app.getVersion();
  });
  
  // Settings handlers
  ipcMain.handle(Channels.GET_SETTING, (_event, key: string) => {
    return getSetting(key);
  });

  ipcMain.handle(Channels.SET_SETTING, (_event, key: string, value: any) => {
    setSetting(key, value);
  });

  ipcMain.handle(Channels.GET_SETTINGS, () => {
    return getSettings();
  });
  
  // Add other handlers here
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      sandbox: true,
    },
  });

  console.log('Running in mode:', process.env.NODE_ENV);
  console.log('Current directory:', process.cwd());
  
  // Load the appropriate URL based on environment
  if (process.env.NODE_ENV === 'development') {
    // Dev mode - Try to connect to Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - Look for built HTML file
    const rendererPath = path.resolve(__dirname, '../renderer/index.html');
    console.log('Looking for HTML at:', rendererPath);
    
    if (fs.existsSync(rendererPath)) {
      console.log('Found renderer HTML file');
      mainWindow.loadFile(rendererPath);
    } else {
      // Fallback - create a simple HTML with message
      console.log('Renderer HTML not found - using fallback');
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><title>VideoNova 2</title></head>
          <body>
            <h1>VideoNova 2</h1>
            <p>App version: ${app.getVersion()}</p>
            <p>Renderer files not found. Please build the renderer.</p>
          </body>
        </html>
      `);
    }
  }
};

app.whenReady().then(() => {
  // Set up IPC handlers before creating the window
  setupIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
}); 