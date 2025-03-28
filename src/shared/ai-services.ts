export interface TranscriptionResult {
  text: string;
  segments?: {
    id: number;
    start: number;
    end: number;
    text: string;
  }[];
  language?: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLang?: string;
  targetLang: string;
}

export interface SynthesisOptions {
  voice: string;
  model?: string;
  speed?: number;
}

export interface ISttService {
  transcribe(audioPath: string, language?: string): Promise<TranscriptionResult>;
}

export interface ITranslationService {
  translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult>;
}

export interface ITtsService {
  synthesize(text: string, options: SynthesisOptions, outputPath: string): Promise<string>;
}

// Import and re-export interfaces from processing-interfaces.ts for backward compatibility
import type { 
  ISeparationService, 
  ITimingService,
  SeparationResult
} from './processing-interfaces';

export type {
  ISeparationService,
  ITimingService,
  SeparationResult
} 