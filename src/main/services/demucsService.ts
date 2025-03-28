import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ISeparationService, SeparationResult } from '../../shared/processing-interfaces';

/**
 * Custom error class for Demucs-related errors
 */
export class DemucsError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DemucsError';
  }
}

/**
 * Service for audio source separation using Demucs
 * Requires Python and Demucs to be installed on the system
 */
export class DemucsService implements ISeparationService {
  private pythonExecutable: string;
  
  /**
   * Creates a new DemucsService instance
   * @param pythonExecutable Path to the Python executable (defaults to 'python' or 'python3')
   */
  constructor(pythonExecutable?: string) {
    this.pythonExecutable = pythonExecutable || (process.platform === 'win32' ? 'python' : 'python3');
  }

  /**
   * Separates vocals from instrumental in an audio file using Demucs
   * @param audioPath Path to the input audio file
   * @param outputDir Directory to save the separated tracks
   * @returns Promise with paths to the separated vocal and instrumental tracks
   */
  async separateVocals(audioPath: string, outputDir: string): Promise<SeparationResult> {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      try {
        // Prepare demucs command - this is a placeholder and needs to be adjusted based on actual Demucs CLI
        const args = [
          '-m', 'demucs',
          '--two-stems=vocals',
          '-o', outputDir,
          audioPath
        ];
        
        console.log(`Running Demucs with command: ${this.pythonExecutable} ${args.join(' ')}`);
        
        const process = spawn(this.pythonExecutable, args);
        
        let stdoutData = '';
        let stderrData = '';
        
        process.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdoutData += chunk;
          console.log(`Demucs stdout: ${chunk}`);
        });
        
        process.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderrData += chunk;
          console.log(`Demucs stderr: ${chunk}`);
        });
        
        process.on('close', (code) => {
          if (code !== 0) {
            return reject(new DemucsError(`Demucs process exited with code ${code}: ${stderrData}`));
          }
          
          // This is a placeholder for the output paths - adjust based on actual Demucs output structure
          const filename = path.parse(audioPath).name;
          const modelName = 'htdemucs'; // Example model name, adjust as needed
          
          // Expected paths based on Demucs standard output format
          const baseOutputDir = path.join(outputDir, modelName);
          const vocalPath = path.join(baseOutputDir, 'vocals', `${filename}.wav`);
          const instrumentalPath = path.join(baseOutputDir, 'no_vocals', `${filename}.wav`);
          
          // Verify the files exist
          if (!fs.existsSync(vocalPath) || !fs.existsSync(instrumentalPath)) {
            return reject(new DemucsError('Demucs completed but output files not found'));
          }
          
          resolve({
            vocalPath,
            instrumentalPath
          });
        });
        
        process.on('error', (error) => {
          reject(new DemucsError(`Failed to start Demucs process: ${error.message}`, error));
        });
      } catch (error: unknown) {
        reject(new DemucsError(`Error in separateVocals: ${error instanceof Error ? error.message : String(error)}`, error));
      }
    });
  }
  
  /**
   * Set a new Python executable path
   * @param pythonPath Path to the Python executable
   */
  setPythonExecutable(pythonPath: string): void {
    this.pythonExecutable = pythonPath;
  }
} 