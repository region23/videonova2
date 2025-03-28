import YtDlpWrap from 'yt-dlp-wrap';
import { getDependencyPaths } from './dependencyManager';
import path from 'path';
import fs from 'fs';

// Define types for yt-dlp-wrap progress events which are missing from the package's type definitions
interface YtDlpProgress {
  percent?: number;
  totalSize?: number;
  currentSpeed?: number;
  eta?: number;
}

// Augment the yt-dlp-wrap module's types to include the onProgress option
declare module 'yt-dlp-wrap' {
  interface YTDlpOptions {
    onProgress?: (progress: YtDlpProgress) => void;
  }
}

// Custom error classes
export class YtDlpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YtDlpError';
  }
}

export class InvalidUrlError extends YtDlpError {
  constructor(url: string) {
    super(`Invalid URL: ${url}`);
    this.name = 'InvalidUrlError';
  }
}

export class FormatNotAvailableError extends YtDlpError {
  constructor(formatCode: string) {
    super(`Format not available: ${formatCode}`);
    this.name = 'FormatNotAvailableError';
  }
}

export class DownloadFailedError extends YtDlpError {
  constructor(reason: string) {
    super(`Download failed: ${reason}`);
    this.name = 'DownloadFailedError';
  }
}

// Video info interface
export interface YtDlpVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploadDate: string;
  uploader: string;
  formats: YtDlpFormat[];
  
  // Subtitle information
  subtitles?: {
    [languageCode: string]: Array<{
      ext: string;
      url: string;
      name?: string;
    }>;
  };
  
  // Automatic captions if available
  automaticCaptions?: {
    [languageCode: string]: Array<{
      ext: string;
      url: string;
      name?: string;
    }>;
  };
  
  // Original language if detected
  originalLanguage?: string;
}

export interface YtDlpFormat {
  formatId: string;
  formatNote?: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  filesize?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  audioChannels?: number;
}

/**
 * Service for interacting with yt-dlp for downloading video information and media
 */
class YtDlpService {
  private ytDlp: YtDlpWrap;

  constructor() {
    const { ytDlp: ytDlpPath } = getDependencyPaths();
    this.ytDlp = new YtDlpWrap(ytDlpPath);
  }

  /**
   * Get information about a video from its URL
   * 
   * @param url Video URL
   * @returns Parsed video information
   * @throws InvalidUrlError if URL is malformed
   * @throws YtDlpError for other errors
   */
  async getVideoInfo(url: string): Promise<YtDlpVideoInfo> {
    try {
      const rawInfo = await this.ytDlp.getVideoInfo(url);
      return this.parseVideoInfo(rawInfo);
    } catch (error) {
      if (String(error).includes('invalid URL')) {
        throw new InvalidUrlError(url);
      }
      throw new YtDlpError(`Failed to get video info: ${error}`);
    }
  }

  /**
   * Download media from URL with specified format
   * 
   * @param url Video URL
   * @param formatCode Format code (e.g., '22', 'best', '136+140')
   * @param outputPath Output file path
   * @param progressCallback Optional callback for progress updates
   * @returns Path to the downloaded file
   * @throws Various YtDlpError subclasses
   */
  async downloadMedia(
    url: string, 
    formatCode: string, 
    outputPath: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    try {
      // Check if format exists
      const info = await this.getVideoInfo(url);
      const formatExists = info.formats.some(f => f.formatId === formatCode);
      
      if (!formatExists && !formatCode.includes('best')) {
        throw new FormatNotAvailableError(formatCode);
      }
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      return new Promise((resolve, reject) => {
        this.ytDlp.execPromise([
          url,
          '-f', formatCode,
          '-o', outputPath,
          '--newline', // Progress on new lines
          '--progress'
        ], {
          onProgress: (progress: YtDlpProgress) => {
            if (progressCallback) {
              progressCallback(progress.percent || 0);
            }
          }
        })
        .then(() => resolve(outputPath))
        .catch((error) => {
          reject(new DownloadFailedError(String(error)));
        });
      });
    } catch (error) {
      if (error instanceof YtDlpError) {
        throw error;
      }
      throw new YtDlpError(`Download failed: ${error}`);
    }
  }

  /**
   * Download best quality audio track only
   * 
   * @param url Video URL
   * @param outputPath Output path for the audio file
   * @param progressCallback Optional callback for progress updates
   * @returns Path to the downloaded audio file
   * @throws YtDlpError subclasses
   */
  async downloadAudio(
    url: string, 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    try {
      // Get best audio format
      const { audioFormatId } = await this.getBestFormats(url);
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      return new Promise((resolve, reject) => {
        this.ytDlp.execPromise([
          url,
          '-f', audioFormatId,
          '-o', outputPath,
          '--newline',
          '--progress'
        ], {
          onProgress: (progress: YtDlpProgress) => {
            if (progressCallback) {
              progressCallback(progress.percent || 0);
            }
          }
        })
        .then(() => resolve(outputPath))
        .catch((error) => {
          reject(new DownloadFailedError(`Failed to download audio: ${error}`));
        });
      });
    } catch (error) {
      if (error instanceof YtDlpError) {
        throw error;
      }
      throw new YtDlpError(`Audio download failed: ${error}`);
    }
  }

  /**
   * Download best available subtitles in specified language
   * 
   * @param url Video URL
   * @param language ISO 639-1 language code (e.g., 'en', 'ru', 'auto' for auto-detection)
   * @param outputPath Output path for the subtitle file (without extension)
   * @returns Path to the downloaded subtitle file or null if not available
   */
  async downloadSubtitles(
    url: string, 
    language: string, 
    outputPath: string
  ): Promise<string | null> {
    try {
      // If language is 'auto', try to detect from video info first
      let targetLang = language;
      if (language === 'auto') {
        const info = await this.getVideoInfo(url);
        targetLang = info.originalLanguage || 'en'; // Default to English if not detected
      }
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Remove extension from outputPath if present
      const outputBase = outputPath.replace(/\.[^/.]+$/, '');
      const expectedSubtitlePath = `${outputBase}.${targetLang}.srt`;
      
      // Execute yt-dlp to download subtitles
      await this.ytDlp.execPromise([
        url,
        '--write-sub',
        '--skip-download',
        '--sub-lang', targetLang,
        '--convert-subs', 'srt', // Convert to SRT format for consistency
        '-o', outputBase
      ]);
      
      // Check if the subtitle file was actually created
      if (fs.existsSync(expectedSubtitlePath)) {
        return expectedSubtitlePath;
      }
      
      // Try automatic captions if regular subs not available
      await this.ytDlp.execPromise([
        url,
        '--write-auto-sub',
        '--skip-download',
        '--sub-lang', targetLang,
        '--convert-subs', 'srt', 
        '-o', outputBase
      ]);
      
      if (fs.existsSync(expectedSubtitlePath)) {
        return expectedSubtitlePath;
      }
      
      return null;
    } catch (error) {
      // Return null rather than throwing if subtitles aren't available
      console.warn(`No subtitles available for language ${language}: ${error}`);
      return null;
    }
  }

  /**
   * Get best available formats for video-only and audio-only streams
   * 
   * @param url Video URL
   * @returns Object containing best video and audio format IDs
   * @throws YtDlpError on failure
   */
  async getBestFormats(url: string): Promise<{ videoFormatId: string, audioFormatId: string }> {
    try {
      const info = await this.getVideoInfo(url);
      
      // Find best video-only format (no audio)
      const videoFormats = info.formats.filter(f => 
        f.vcodec !== 'none' && (f.acodec === 'none' || f.acodec === 'no')
      );
      
      // Find best audio-only format
      const audioFormats = info.formats.filter(f => 
        f.acodec !== 'none' && (f.vcodec === 'none' || f.vcodec === 'no')
      );
      
      // If no separate streams available, use best combined format
      if (videoFormats.length === 0 || audioFormats.length === 0) {
        return {
          videoFormatId: 'bestvideo+bestaudio/best',
          audioFormatId: 'bestaudio/best'
        };
      }
      
      // Sort by resolution or quality metrics
      videoFormats.sort((a, b) => {
        const aRes = (a.height || 0) * (a.width || 0);
        const bRes = (b.height || 0) * (b.width || 0);
        return bRes - aRes; // Highest resolution first
      });
      
      // Sort audio by quality
      audioFormats.sort((a, b) => {
        return (b.audioChannels || 0) - (a.audioChannels || 0);
      });
      
      return {
        videoFormatId: videoFormats[0]?.formatId || 'bestvideo',
        audioFormatId: audioFormats[0]?.formatId || 'bestaudio'
      };
    } catch (error) {
      throw new YtDlpError(`Failed to determine best formats: ${error}`);
    }
  }

  /**
   * Download video at highest quality with separate video, audio, and subtitles
   * Uses the recommended workflow: 
   * 1. Downloads best video track
   * 2. Downloads best audio track
   * 3. Downloads subtitles in original language if available
   * 
   * @param url Video URL
   * @param outputDir Directory to save files to
   * @param basename Base filename to use (without extension)
   * @param progressCallback Progress update callback
   * @returns Object containing paths to all downloaded files
   */
  async downloadHighQualityComponents(
    url: string,
    outputDir: string,
    basename: string,
    progressCallback?: (component: 'video'|'audio'|'subtitles', progress: number) => void
  ): Promise<{
    videoPath: string;
    audioPath: string;
    subtitlePath: string | null;
    info: YtDlpVideoInfo;
  }> {
    // First get video info to determine formats and language
    const info = await this.getVideoInfo(url);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get best formats
    const { videoFormatId, audioFormatId } = await this.getBestFormats(url);
    
    // Download video track
    const videoPath = path.join(outputDir, `${basename}.video.mp4`);
    await this.downloadMedia(
      url, 
      videoFormatId, 
      videoPath,
      (progress) => progressCallback?.('video', progress)
    );
    
    // Download audio track
    const audioPath = path.join(outputDir, `${basename}.audio.m4a`);
    await this.downloadAudio(
      url, 
      audioPath,
      (progress) => progressCallback?.('audio', progress)
    );
    
    // Try to download subtitles in original language
    const subtitleBasePath = path.join(outputDir, basename);
    const originalLang = info.originalLanguage || 'auto';
    const subtitlePath = await this.downloadSubtitles(
      url, 
      originalLang, 
      subtitleBasePath
    );
    if (subtitlePath) {
      progressCallback?.('subtitles', 100);
    } else {
      progressCallback?.('subtitles', 0);
    }
    
    return {
      videoPath,
      audioPath,
      subtitlePath,
      info
    };
  }

  /**
   * Parse raw yt-dlp output into typed object
   * @private
   */
  private parseVideoInfo(rawInfo: any): YtDlpVideoInfo {
    return {
      id: rawInfo.id,
      title: rawInfo.title,
      description: rawInfo.description || '',
      thumbnail: rawInfo.thumbnail || '',
      duration: rawInfo.duration || 0,
      uploadDate: rawInfo.upload_date || '',
      uploader: rawInfo.uploader || '',
      formats: (rawInfo.formats || []).map((f: any) => ({
        formatId: f.format_id,
        formatNote: f.format_note,
        ext: f.ext,
        resolution: f.resolution,
        width: f.width,
        height: f.height,
        filesize: f.filesize,
        fps: f.fps,
        vcodec: f.vcodec,
        acodec: f.acodec,
        audioChannels: f.audio_channels
      })),
      subtitles: rawInfo.subtitles,
      automaticCaptions: rawInfo.automatic_captions,
      originalLanguage: rawInfo.language
    };
  }
}

// Export a singleton instance
export const ytDlpService = new YtDlpService(); 