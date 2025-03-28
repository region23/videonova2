import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ITimingService } from '../../shared/processing-interfaces';

/**
 * Custom error class for SoundTouch-related errors
 */
export class SoundTouchError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'SoundTouchError';
  }
}

/**
 * Service for audio time-stretching using SoundTouch (soundstretch CLI)
 * Requires soundstretch to be installed or bundled with the application
 */
export class SoundTouchService implements ITimingService {
  private soundstretchPath: string;
  
  /**
   * Creates a new SoundTouchService instance
   * @param soundstretchPath Path to the soundstretch executable
   */
  constructor(soundstretchPath?: string) {
    // Default to 'soundstretch' and assume it's in PATH
    // In a real implementation, this might come from a bundled binary or dependency manager
    this.soundstretchPath = soundstretchPath || 'soundstretch';
  }

  /**
   * Adjusts the timing of an audio file without changing pitch
   * @param audioPath Path to the input audio file
   * @param factor Speed factor (e.g., 0.8 for slower, 1.2 for faster)
   * @param outputPath Path to save the adjusted audio file
   * @returns Promise with the path to the adjusted audio file
   */
  async adjustTiming(audioPath: string, factor: number, outputPath: string): Promise<string> {
    // Validate input
    if (!fs.existsSync(audioPath)) {
      throw new SoundTouchError(`Input audio file not found: ${audioPath}`);
    }
    
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      try {
        // Calculate tempo parameter (percentage)
        // SoundTouch uses percentage values: 50 = half speed, 200 = double speed
        const tempoPercent = factor * 100;
        
        // Prepare soundstretch command
        // Basic usage: soundstretch input.wav output.wav -tempo=X
        const args = [
          audioPath,
          outputPath,
          `-tempo=${tempoPercent}`
        ];
        
        console.log(`Running SoundStretch with command: ${this.soundstretchPath} ${args.join(' ')}`);
        
        const process = spawn(this.soundstretchPath, args);
        
        let stdoutData = '';
        let stderrData = '';
        
        process.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdoutData += chunk;
          console.log(`SoundStretch stdout: ${chunk}`);
        });
        
        process.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderrData += chunk;
          console.log(`SoundStretch stderr: ${chunk}`);
        });
        
        process.on('close', (code) => {
          if (code !== 0) {
            return reject(new SoundTouchError(`SoundStretch process exited with code ${code}: ${stderrData}`));
          }
          
          // Verify the output file exists
          if (!fs.existsSync(outputPath)) {
            return reject(new SoundTouchError('SoundStretch completed but output file not found'));
          }
          
          resolve(outputPath);
        });
        
        process.on('error', (error) => {
          reject(new SoundTouchError(`Failed to start SoundStretch process: ${error.message}`, error));
        });
      } catch (error: unknown) {
        reject(new SoundTouchError(
          `Error in adjustTiming: ${error instanceof Error ? error.message : String(error)}`, 
          error
        ));
      }
    });
  }
  
  /**
   * Set a new path to the soundstretch executable
   * @param executablePath Path to the soundstretch executable
   */
  setSoundstretchPath(executablePath: string): void {
    this.soundstretchPath = executablePath;
  }
} 