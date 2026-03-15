import { AIProvider } from '../types/app';
import type { AIConfig } from '../types/app';
import { generateSpeech, type VoiceContext } from './speechSynthesis';

/**
 * SpeechService provides a unified interface for text-to-speech.
 * It handles provider selection, fallback logic, and future extensibility.
 */
export class SpeechService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Generates an audio URL for the given text.
   * Falls back to null if AI generation fails.
   */
  async generateUrl(text: string, context: VoiceContext): Promise<string | null> {
    try {
      return await generateSpeech(text, this.config, context);
    } catch (error) {
      console.error('SpeechService: AI generation failed:', error);
      return null;
    }
  }

  /**
   * Speaks the text directly. 
   * Tries AI generation first, falls back to browser native TTS.
   */
  async speak(text: string, context: VoiceContext): Promise<void> {
    const url = await this.generateUrl(text, context);
    
    if (url) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = (e) => {
          console.warn('SpeechService: Audio playback failed, falling back to native TTS', e);
          this.speakNative(text, context).then(resolve).catch(reject);
        };
        audio.play().catch(err => {
          console.warn('SpeechService: Playback blocked or failed:', err);
          this.speakNative(text, context).then(resolve).catch(reject);
        });
      });
    } else {
      console.log('SpeechService: No AI audio URL, using native TTS fallback');
      return this.speakNative(text, context);
    }
  }

  /**
   * Browser native TTS fallback.
   */
  private speakNative(text: string, context: VoiceContext): Promise<void> {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.error('SpeechService: Browser does not support SpeechSynthesis');
        resolve();
        return;
      }

      const speak = () => {
        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Basic voice selection based on gender/age
        const voices = window.speechSynthesis.getVoices();
        const isFemale = context.gender.toLowerCase() === 'female';
        
        // Try to find a suitable voice
        const preferredVoice = voices.find(v => 
          (v.name.toLowerCase().includes(isFemale ? 'female' : 'male') ||
           v.name.toLowerCase().includes(isFemale ? 'samantha' : 'alex')) &&
          v.lang.startsWith('en')
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Adjust pitch/rate based on age
        if (context.age) {
          if (context.age > 60) {
            utterance.rate = 0.8;
            utterance.pitch = 0.9;
          } else if (context.age < 20) {
            utterance.rate = 1.1;
            utterance.pitch = 1.1;
          }
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
      } else {
        speak();
      }
    });
  }
}
