import { spawn } from 'child_process';
// Using require instead of import to avoid TypeScript issues with these modules
// @ts-ignore
const ffmpegStatic = require('ffmpeg-static');
// @ts-ignore
const ffprobeStatic = require('ffprobe-static');
import * as fs from 'fs';
import * as path from 'path';

// Define error type for FFmpeg operations
class FFmpegError extends Error {
  constructor(message: string, public exitCode?: number, public stderr?: string) {
    super(message);
    this.name = 'FFmpegError';
  }
}

// Type for progress reporting callback
type ProgressCallback = (progress: number) => void;

/**
 * Service for handling FFmpeg operations
 */
export class FFmpegService {
  private static ffmpegPath = ffmpegStatic;
  private static ffprobePath = ffprobeStatic.path;

  // Ensure FFmpeg paths are available
  private static validatePaths() {
    if (!this.ffmpegPath) {
      throw new Error('ffmpeg binary path not found');
    }
    if (!this.ffprobePath) {
      throw new Error('ffprobe binary path not found');
    }
  }

  /**
   * Execute an FFmpeg command with optional progress reporting
   */
  private static executeFFmpeg(
    args: string[],
    progressCallback?: ProgressCallback
  ): Promise<string> {
    this.validatePaths();
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';
      
      // Handle progress parsing
      if (progressCallback) {
        ffmpeg.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
          
          // Extract progress information from FFmpeg output
          const timeMatch = data.toString().match(/time=(\d+):(\d+):(\d+\.\d+)/);
          const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
          
          if (timeMatch && durationMatch) {
            const currentSeconds = 
              parseFloat(timeMatch[1]) * 3600 + 
              parseFloat(timeMatch[2]) * 60 + 
              parseFloat(timeMatch[3]);
              
            const totalSeconds = 
              parseFloat(durationMatch[1]) * 3600 + 
              parseFloat(durationMatch[2]) * 60 + 
              parseFloat(durationMatch[3]);
              
            if (totalSeconds > 0) {
              const progress = currentSeconds / totalSeconds;
              progressCallback(Math.min(progress, 1.0));
            }
          }
        });
      } else {
        ffmpeg.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      // Handle process exit
      ffmpeg.on('close', (exitCode: number | null) => {
        if (exitCode === 0) {
          resolve(stderr);
        } else {
          reject(new FFmpegError(`FFmpeg process exited with code ${exitCode}`, exitCode || undefined, stderr));
        }
      });

      // Handle process errors
      ffmpeg.on('error', (err: Error) => {
        reject(new FFmpegError(`Failed to start FFmpeg process: ${err.message}`));
      });
    });
  }

  /**
   * Extract audio from a video file
   * @param videoPath Path to the video file
   * @param outputPath Path where the extracted audio will be saved
   * @param progressCallback Optional callback for progress reporting
   * @returns Promise resolving to the output file path
   */
  public static extractAudio(
    videoPath: string,
    outputPath: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      return Promise.reject(new Error(`Video file not found: ${videoPath}`));
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const args = [
      '-i', videoPath,            // Input file
      '-vn',                      // Disable video
      '-acodec', 'libmp3lame',    // Audio codec
      '-q:a', '2',                // Audio quality
      '-y',                       // Overwrite output file if exists
      outputPath                  // Output file
    ];
    
    return this.executeFFmpeg(args, progressCallback)
      .then(() => outputPath);
  }

  /**
   * Merge audio and video files
   * @param videoPath Path to the video file
   * @param audioPath Path to the audio file
   * @param outputPath Path where the merged file will be saved
   * @param progressCallback Optional callback for progress reporting
   * @returns Promise resolving to the output file path
   */
  public static mergeAudioVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      return Promise.reject(new Error(`Video file not found: ${videoPath}`));
    }
    if (!fs.existsSync(audioPath)) {
      return Promise.reject(new Error(`Audio file not found: ${audioPath}`));
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const args = [
      '-i', videoPath,            // Input video file
      '-i', audioPath,            // Input audio file
      '-c:v', 'copy',             // Copy video codec (no re-encode)
      '-c:a', 'aac',              // Audio codec
      '-map', '0:v:0',            // Map first video stream from first input
      '-map', '1:a:0',            // Map first audio stream from second input
      '-shortest',                // Finish encoding when the shortest input stream ends
      '-y',                       // Overwrite output file if exists
      outputPath                  // Output file
    ];
    
    return this.executeFFmpeg(args, progressCallback)
      .then(() => outputPath);
  }

  /**
   * Get the duration of a media file in seconds
   * @param filePath Path to the media file
   * @returns Promise resolving to the duration in seconds
   */
  public static getVideoDuration(filePath: string): Promise<number> {
    this.validatePaths();
    
    if (!fs.existsSync(filePath)) {
      return Promise.reject(new Error(`File not found: ${filePath}`));
    }
    
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ];
      
      const ffprobe = spawn(this.ffprobePath, args);
      let stdout = '';
      let stderr = '';
      
      ffprobe.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      
      ffprobe.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      
      ffprobe.on('close', (exitCode: number | null) => {
        if (exitCode === 0) {
          const duration = parseFloat(stdout.trim());
          if (!isNaN(duration)) {
            resolve(duration);
          } else {
            reject(new Error('Could not parse duration from ffprobe output'));
          }
        } else {
          reject(new FFmpegError(`ffprobe process exited with code ${exitCode}`, exitCode || undefined, stderr));
        }
      });
      
      ffprobe.on('error', (err: Error) => {
        reject(new FFmpegError(`Failed to start ffprobe process: ${err.message}`));
      });
    });
  }
} 