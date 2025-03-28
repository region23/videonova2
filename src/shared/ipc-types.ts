// IPC API type definitions for secure main/renderer process communication

// Import types from dependency manager
import { DependencyPaths } from '../main/services/dependencyManager';
import { YtDlpVideoInfo } from '../main/services/ytDlpService';
import { TranscriptionResult, TranslationResult, SynthesisOptions } from './ai-services';

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  // Settings methods
  getSetting: <T>(key: string) => Promise<T | undefined>;
  setSetting: <T>(key: string, value: T) => Promise<void>;
  getSettings: () => Promise<Record<string, any>>;
  
  // Dependency management methods
  getDependencyPaths: () => Promise<DependencyPaths>;
  validateDependencies: () => Promise<{ valid: boolean; missing: string[] }>;
  findPythonPath: () => Promise<string | null>;
  checkPythonPackages: (packages: string[]) => Promise<{ installed: string[]; missing: string[] }>;
  setDependencyPath: (dependency: 'python' | 'soundtouch', path: string) => Promise<{ valid: boolean; missing: string[] }>;
  
  // yt-dlp methods
  getVideoInfo: (url: string) => Promise<YtDlpVideoInfo>;
  downloadMedia: (url: string, formatCode: string, outputPath: string) => Promise<string>;
  downloadAudio: (url: string, outputPath: string) => Promise<string>;
  downloadSubtitles: (url: string, language: string, outputPath: string) => Promise<string | null>;
  getBestFormats: (url: string) => Promise<{ videoFormatId: string, audioFormatId: string }>;
  downloadHighQualityComponents: (
    url: string, 
    outputDir: string, 
    basename: string
  ) => Promise<{
    videoPath: string;
    audioPath: string;
    subtitlePath: string | null;
    info: YtDlpVideoInfo;
  }>;
  
  // OpenAI methods
  transcribeAudio: (audioPath: string, language?: string) => Promise<TranscriptionResult>;
  translateText: (text: string, targetLang: string, sourceLang?: string) => Promise<TranslationResult>;
  synthesizeSpeech: (text: string, options: SynthesisOptions, outputPath: string) => Promise<string>;
  setOpenAIApiKey: (apiKey: string) => Promise<void>;
  setOpenAIDefaultModel: (model: string) => Promise<void>;
}

export const Channels = {
  GET_APP_VERSION: 'ipc:get-app-version',
  // Settings channels
  GET_SETTING: 'ipc:get-setting',
  SET_SETTING: 'ipc:set-setting',
  GET_SETTINGS: 'ipc:get-settings',
  
  // Dependency management channels
  GET_DEPENDENCY_PATHS: 'ipc:get-dependency-paths',
  VALIDATE_DEPENDENCIES: 'ipc:validate-dependencies',
  FIND_PYTHON_PATH: 'ipc:find-python-path',
  CHECK_PYTHON_PACKAGES: 'ipc:check-python-packages',
  SET_DEPENDENCY_PATH: 'ipc:set-dependency-path',
  
  // yt-dlp channels
  GET_VIDEO_INFO: 'ipc:get-video-info',
  DOWNLOAD_MEDIA: 'ipc:download-media',
  DOWNLOAD_AUDIO: 'ipc:download-audio',
  DOWNLOAD_SUBTITLES: 'ipc:download-subtitles',
  GET_BEST_FORMATS: 'ipc:get-best-formats',
  DOWNLOAD_HIGH_QUALITY_COMPONENTS: 'ipc:download-high-quality-components',
  DOWNLOAD_PROGRESS: 'ipc:download-progress',
  
  // OpenAI channels
  TRANSCRIBE_AUDIO: 'ipc:transcribe-audio',
  TRANSLATE_TEXT: 'ipc:translate-text',
  SYNTHESIZE_SPEECH: 'ipc:synthesize-speech',
  SET_OPENAI_API_KEY: 'ipc:set-openai-api-key',
  SET_OPENAI_DEFAULT_MODEL: 'ipc:set-openai-default-model',
} as const; // Use const assertion for type safety

// Type for channel names to ensure type safety when using channels
export type ChannelNames = keyof typeof Channels; 