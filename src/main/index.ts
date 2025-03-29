import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Channels } from '../shared/ipc-types';
import { getSetting, setSetting, getSettings } from './services/settingsManager';
import { initializeDependencies, getDependencyPaths, validateDependencies, findPythonPath, checkPythonPackages, setDependencyPath } from './services/dependencyManager';
import { ytDlpService } from './services/ytDlpService';
import { OpenAIClient } from './services/openAiClient';
import { SynthesisOptions } from '../shared/ai-services';
import { DemucsService } from './services/demucsService';
import { SoundTouchService } from './services/soundtouchService';
import { PipelineOrchestrator } from './processing/pipelineOrchestrator';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) app.quit();

// Singleton OpenAI client
let openAIClient: OpenAIClient | null = null;

// Singleton instances for Demucs and SoundTouch services
const demucsService = new DemucsService();
const soundTouchService = new SoundTouchService();

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
  
  // File system handlers
  ipcMain.handle(Channels.SELECT_FOLDER, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return null;
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    });
    return canceled ? null : filePaths[0];
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
  
  // Demucs handler
  ipcMain.handle(Channels.SEPARATE_VOCALS, async (_event, audioPath: string, outputDir: string) => {
    return demucsService.separateVocals(audioPath, outputDir);
  });
  
  // SoundTouch handler
  ipcMain.handle(Channels.ADJUST_TIMING, async (_event, audioPath: string, factor: number, outputPath: string) => {
    return soundTouchService.adjustTiming(audioPath, factor, outputPath);
  });
  
  // Video processing handler
  ipcMain.handle(Channels.START_PROCESSING, async (_event, args: {
    url: string;
    downloadFolder: string;
    originalLanguage?: string;
    targetLanguage: string;
  }) => {
    console.log('Received START_PROCESSING request with args:', args);

    if (!args?.url || !args?.targetLanguage || !args?.downloadFolder) {
      console.error('Invalid arguments received for START_PROCESSING:', args);
      return { success: false, error: 'Invalid arguments: URL, target language, and download folder are required.' };
    }

    const sourceLanguage = args.originalLanguage || 'auto';

    let orchestrator: PipelineOrchestrator | null = null;

    try {
      console.log('Fetching OpenAI client...');
      const client = await getOpenAIClient();
      const apiKey = await getSetting<string>('openai.apiKey');

      if (!apiKey) {
        throw new Error('OpenAI API key not found in settings.');
      }
      console.log('Dependencies retrieved.');

      console.log('Instantiating PipelineOrchestrator...');
      orchestrator = new PipelineOrchestrator(
        args.url,
        sourceLanguage,
        args.targetLanguage,
        args.downloadFolder,
        apiKey,
        client,
        client,
        client
      );
      console.log('PipelineOrchestrator instantiated.');

      console.log('Starting orchestrator run...');
      await orchestrator.run();
      console.log('Orchestrator run finished.');

      const resultPath = orchestrator.resultPath;
      console.log(`Pipeline successful. Result path: ${resultPath}`);
      return { success: true, resultPath: resultPath };

    } catch (error: any) {
      console.error('Error during START_PROCESSING pipeline:', error);
      const errorMessage = orchestrator?.errorMessage || (error instanceof Error ? error.message : String(error));
      return { success: false, error: errorMessage || 'An unknown error occurred during processing.' };
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