import { OpenAI } from 'openai';
import fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import {
  ISttService,
  ITranslationService,
  ITtsService,
  TranscriptionResult,
  TranslationResult,
  SynthesisOptions
} from '../../shared/ai-services';

// Custom error class for OpenAI API related errors
export class OpenAIApiError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'OpenAIApiError';
  }
}

export class OpenAIClient implements ISttService, ITranslationService, ITtsService {
  private client: OpenAI;
  private defaultModel = 'gpt-4o-mini';

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 2
    });
  }

  /**
   * Transcribes audio using OpenAI's Whisper API
   * @param audioPath Path to the audio file
   * @param language Optional language code for the audio
   * @returns TranscriptionResult with text and optional segments
   */
  async transcribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      const response = await this.client.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: 'whisper-1',
        language,
        response_format: 'verbose_json'
      });

      // Handle response based on format
      if (typeof response === 'string') {
        return { text: response };
      } else {
        // For verbose_json format
        return {
          text: response.text,
          segments: response.segments?.map((segment: { id: number; start: number; end: number; text: string }) => ({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            text: segment.text
          })),
          language: response.language
        };
      }
    } catch (error: any) {
      throw new OpenAIApiError(
        `Failed to transcribe audio: ${error.message}`,
        error
      );
    }
  }

  /**
   * Translates text using OpenAI's chat completions API
   * @param text Text to translate
   * @param targetLang Target language code
   * @param sourceLang Optional source language code
   * @returns TranslationResult with translated text
   */
  async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
    try {
      let prompt = `Translate the following text to ${targetLang}`;
      
      if (sourceLang) {
        prompt += ` from ${sourceLang}`;
      }
      
      prompt += `. Return only the translated text:\n\n${text}`;

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: 'You are a professional translator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: Math.min(4096, text.length * 2) // Allocate enough tokens for response, limit to max API allows
      });

      const translatedText = response.choices[0]?.message.content?.trim() || '';
      
      return {
        translatedText,
        targetLang,
        sourceLang
      };
    } catch (error: any) {
      throw new OpenAIApiError(
        `Failed to translate text: ${error.message}`,
        error
      );
    }
  }

  /**
   * Synthesizes speech using OpenAI's TTS API
   * @param text Text to convert to speech
   * @param options Voice and model options
   * @param outputPath Path to save the audio file
   * @returns Path to the generated audio file
   */
  async synthesize(text: string, options: SynthesisOptions, outputPath: string): Promise<string> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const response = await this.client.audio.speech.create({
        model: options.model || 'tts-1',
        voice: options.voice,
        input: text,
        speed: options.speed || 1.0,
        response_format: 'mp3'
      });

      // Get the response as a buffer and write to file
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      
      return outputPath;
    } catch (error: any) {
      throw new OpenAIApiError(
        `Failed to synthesize speech: ${error.message}`,
        error
      );
    }
  }

  /**
   * Set a new API key
   * @param apiKey The new OpenAI API key
   */
  setApiKey(apiKey: string): void {
    this.client = new OpenAI({
      apiKey,
      timeout: 60000,
      maxRetries: 2
    });
  }

  /**
   * Set the default model for translation requests
   * @param model Model identifier (e.g., 'gpt-4o-mini')
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }
} 