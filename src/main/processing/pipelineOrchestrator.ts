import {
  ISttService,
  ITranslationService,
  ITtsService,
  TranscriptionResult
} from '../../shared/ai-services';
import { FFmpegService } from '../services/ffmpegService';
import { ytDlpService } from '../services/ytDlpService';

// --- Add Node.js module imports ---
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
// --- End Node.js module imports ---

// Define possible statuses for the pipeline
type PipelineStatus = 'idle' | 'downloading' | 'extracting' | 'transcribing' | 'translating' | 'synthesizing' | 'merging' | 'completed' | 'failed';

/**
 * Orchestrates the entire video processing pipeline.
 */
export class PipelineOrchestrator {
  // --- Dependencies ---
  private ytDlpServiceInstance: typeof ytDlpService = ytDlpService;
  private sttService: ISttService;
  private translationService: ITranslationService;
  private ttsService: ITtsService;
  // FFmpegService uses static methods, so we don't need an instance member

  // --- Job Parameters ---
  private videoUrl: string;
  private sourceLanguage: string;
  private targetLanguage: string;
  private outputFolderPath: string;
  private apiKey: string; // Assuming OpenAI API key

  // --- Internal State ---
  private _status: PipelineStatus = 'idle';
  private _currentStep: string = 'idle';
  private _errorMessage: string | null = null;
  private _resultPath: string | null = null;
  private _tempDir: string | null = null; // To be added in Step 3.2
  private _originalVideoPath: string | null = null; // To be added in Step 3.3
  private _extractedAudioPath: string | null = null; // To be added in Step 3.4
  private _transcriptionResult: TranscriptionResult | null = null; // Use the imported TranscriptionResult type
  private _translatedText: string | null = null; // To be added in Step 3.6
  private _synthesizedAudioPath: string | null = null; // To be added in Step 3.7

  constructor(
    videoUrl: string,
    sourceLanguage: string,
    targetLanguage: string,
    outputFolderPath: string,
    apiKey: string,
    sttService: ISttService,
    translationService: ITranslationService,
    ttsService: ITtsService
  ) {
    this.videoUrl = videoUrl;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.outputFolderPath = outputFolderPath;
    this.apiKey = apiKey;
    this.sttService = sttService;
    this.translationService = translationService;
    this.ttsService = ttsService;

    // Validate inputs (basic example)
    if (!this.videoUrl) throw new Error("Video URL is required.");
    if (!this.outputFolderPath) throw new Error("Output folder path is required.");
    if (!this.apiKey) throw new Error("API key is required.");
    // Add more validation as needed
  }

  /**
   * Executes the entire processing pipeline.
   */
  async run(): Promise<void> {
    this._status = 'idle';
    this._currentStep = 'Starting pipeline...';
    this._errorMessage = null;
    this._resultPath = null;
    this._tempDir = null; // Ensure it starts as null

    console.log(`Starting processing for: ${this.videoUrl}`);

    try {
      // --- Step 3.2: Setup Temp Directory ---
      this._currentStep = 'Initializing temporary directory';
      const tempDirPrefix = path.join(os.tmpdir(), 'videonova-job-');
      this._tempDir = await fs.mkdtemp(tempDirPrefix);
      console.log(`Created temporary directory: ${this._tempDir}`);
      // --- End Step 3.2 ---

      // --- Pipeline Steps will be added here in subsequent steps ---
      // Step 3.3: Download Video
      // Step 3.4: Extract Audio
      // Step 3.5: Transcribe (STT)
      // Step 3.6: Translate
      // Step 3.7: Synthesize (TTS)
      // Step 3.8: Merge Audio/Video

      this._status = 'completed';
      this._currentStep = 'Pipeline finished successfully';
      console.log(`Processing completed successfully. Result: ${this._resultPath}`);

    } catch (error: any) {
      this._status = 'failed';
      this._errorMessage = error instanceof Error ? error.message : String(error);
      this._currentStep = 'Pipeline failed';
      console.error(`Pipeline failed for ${this.videoUrl}: ${this._errorMessage}`, error);
      // Ensure cleanup happens even on failure
    } finally {
      // --- Step 3.2: Cleanup Temp Directory ---
      this._currentStep = 'Cleaning up temporary files';
      await this.cleanup();
      // --- End Step 3.2 ---
    }
  }

  // --- Getters for state ---
  get status(): PipelineStatus { return this._status; }
  get currentStep(): string { return this._currentStep; }
  get errorMessage(): string | null { return this._errorMessage; }
  get resultPath(): string | null { return this._resultPath; }

  // --- Private helper methods ---

  /**
   * Cleans up the temporary directory created for the job.
   */
  private async cleanup(): Promise<void> {
    if (this._tempDir) {
      console.log(`Attempting to clean up temporary directory: ${this._tempDir}`);
      try {
        // Check access first (optional, as rm with force handles non-existence)
        // await fs.access(this._tempDir);
        await fs.rm(this._tempDir, { recursive: true, force: true });
        console.log(`Successfully removed temporary directory: ${this._tempDir}`);
        this._tempDir = null; // Reset tempDir path after successful removal
      } catch (cleanupError: any) {
        // Log cleanup errors but don't let them crash the main process
        console.error(`Error cleaning up temporary directory ${this._tempDir}: ${cleanupError.message}`, cleanupError);
        // Keep _tempDir assigned so potential manual cleanup might be possible
      }
    } else {
      console.log('No temporary directory to clean up.');
    }
  }

} 