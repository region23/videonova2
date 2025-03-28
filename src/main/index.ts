import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Channels } from '../shared/ipc-types';
import { getSetting, setSetting, getSettings } from './services/settingsManager';
import { initializeDependencies, getDependencyPaths, validateDependencies, findPythonPath, checkPythonPackages, setDependencyPath } from './services/dependencyManager';
import { ytDlpService } from './services/ytDlpService';
import { OpenAIClient } from './services/openAiClient';
import { SynthesisOptions } from '../shared/ai-services';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) app.quit();

// Singleton OpenAI client
let openAIClient: OpenAIClient | null = null;

// Initialize OpenAI client with API key from settings
const getOpenAIClient = async () => {
  if (openAIClient === null) {
    const apiKey = await getSetting<string>('openai.apiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not set. Please set it in settings.');
    }
    openAIClient = new OpenAIClient(apiKey);
    
    // Set default model if it exists in settings
    const defaultModel = await getSetting<string>('openai.defaultModel');
    if (defaultModel) {
      openAIClient.setDefaultModel(defaultModel);
    }
  }
  return openAIClient;
};

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
  
  // Dependency management handlers
  ipcMain.handle(Channels.GET_DEPENDENCY_PATHS, () => {
    return getDependencyPaths();
  });
  
  ipcMain.handle(Channels.VALIDATE_DEPENDENCIES, () => {
    return validateDependencies();
  });
  
  ipcMain.handle(Channels.FIND_PYTHON_PATH, () => {
    return findPythonPath();
  });
  
  ipcMain.handle(Channels.CHECK_PYTHON_PACKAGES, (_event, packages: string[]) => {
    return checkPythonPackages(packages);
  });
  
  ipcMain.handle(Channels.SET_DEPENDENCY_PATH, (_event, dependency: 'python' | 'soundtouch', path: string) => {
    setDependencyPath(dependency, path);
    return validateDependencies();
  });
  
  // yt-dlp handlers
  ipcMain.handle(Channels.GET_VIDEO_INFO, (_event, url: string) => {
    return ytDlpService.getVideoInfo(url);
  });
  
  ipcMain.handle(Channels.DOWNLOAD_MEDIA, (_event, url: string, formatCode: string, outputPath: string) => {
    return ytDlpService.downloadMedia(url, formatCode, outputPath);
  });
  
  ipcMain.handle(Channels.DOWNLOAD_AUDIO, (_event, url: string, outputPath: string) => {
    return ytDlpService.downloadAudio(url, outputPath);
  });
  
  ipcMain.handle(Channels.DOWNLOAD_SUBTITLES, (_event, url: string, language: string, outputPath: string) => {
    return ytDlpService.downloadSubtitles(url, language, outputPath);
  });
  
  ipcMain.handle(Channels.GET_BEST_FORMATS, (_event, url: string) => {
    return ytDlpService.getBestFormats(url);
  });
  
  ipcMain.handle(Channels.DOWNLOAD_HIGH_QUALITY_COMPONENTS, 
    async (_event, url: string, outputDir: string, basename: string) => {
      const sender = _event.sender;
      
      return ytDlpService.downloadHighQualityComponents(
        url, 
        outputDir, 
        basename,
        (component, progress) => {
          // Send progress updates to renderer
          sender.send(Channels.DOWNLOAD_PROGRESS, { component, progress });
        }
      );
  });
  
  // OpenAI handlers
  ipcMain.handle(Channels.TRANSCRIBE_AUDIO, async (_event, audioPath: string, language?: string) => {
    const client = await getOpenAIClient();
    return client.transcribe(audioPath, language);
  });
  
  ipcMain.handle(Channels.TRANSLATE_TEXT, async (_event, text: string, targetLang: string, sourceLang?: string) => {
    const client = await getOpenAIClient();
    return client.translate(text, targetLang, sourceLang);
  });
  
  ipcMain.handle(Channels.SYNTHESIZE_SPEECH, async (_event, text: string, options: SynthesisOptions, outputPath: string) => {
    const client = await getOpenAIClient();
    return client.synthesize(text, options, outputPath);
  });
  
  ipcMain.handle(Channels.SET_OPENAI_API_KEY, async (_event, apiKey: string) => {
    await setSetting('openai.apiKey', apiKey);
    
    // If client exists, update its API key, otherwise it will be created with the new key on next use
    if (openAIClient) {
      openAIClient.setApiKey(apiKey);
    }
  });
  
  ipcMain.handle(Channels.SET_OPENAI_DEFAULT_MODEL, async (_event, model: string) => {
    await setSetting('openai.defaultModel', model);
    
    // If client exists, update its default model
    if (openAIClient) {
      openAIClient.setDefaultModel(model);
    }
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

app.whenReady().then(async () => {
  // Initialize dependencies
  await initializeDependencies();
  
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