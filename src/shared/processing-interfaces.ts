/**
 * Core interfaces for the audio/video processing pipeline
 * These interfaces define the contract for different processing steps
 * to enable swapping implementations (online vs offline, different backends)
 */

// Results from the Demucs vocal separation process
export interface SeparationResult {
  vocalPath: string;
  instrumentalPath: string;
}

/**
 * Interface for audio source separation services (e.g., Demucs)
 * Implementations will handle separating vocals from instruments
 */
export interface ISeparationService {
  /**
   * Separates vocals from instrumental in an audio file
   * @param audioPath Path to the input audio file
   * @param outputDir Directory to save the separated tracks
   * @returns Promise with paths to the separated vocal and instrumental tracks
   */
  separateVocals(audioPath: string, outputDir: string): Promise<SeparationResult>;
}

/**
 * Interface for audio timing adjustment services (e.g., Soundtouch)
 * Implementations will handle time-stretching audio without pitch changes
 */
export interface ITimingService {
  /**
   * Adjusts the timing of an audio file without changing pitch
   * @param audioPath Path to the input audio file
   * @param factor Speed factor (e.g., 0.8 for slower, 1.2 for faster)
   * @param outputPath Path to save the adjusted audio file
   * @returns Promise with the path to the adjusted audio file
   */
  adjustTiming(audioPath: string, factor: number, outputPath: string): Promise<string>;
} 