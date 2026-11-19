/**
 * src/services/voice/voiceSynthesisService.ts
 *
 * Moteur de synthèse vocale (Text-To-Speech) naturel pour NEXUS AI.
 * Gère la sélection des meilleures voix système, la prononciation fluide,
 * l'interruption instantanée et les événements de synchronisation pour les animations d'orbe.
 */

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isDefault: boolean;
}

export interface SpeakOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  onBoundary?: (charIndex: number) => void;
}

class VoiceSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isBrowserSupported = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isBrowserSupported = true;
    }
  }

  public isSupported(): boolean {
    return this.isBrowserSupported && this.synth !== null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Trouve la meilleure voix disponible en français ou dans la langue préférée.
   */
  public getBestVoice(targetLang = 'fr'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // 1. Recherche voix naturelle française (Google, Microsoft, Apple, Thomas, Audrey, etc.)
    const langPrefix = targetLang.toLowerCase().slice(0, 2);
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));

    if (langVoices.length > 0) {
      const preferred = langVoices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Online') ||
          v.name.includes('Google') ||
          v.name.includes('Thomas') ||
          v.name.includes('Denise') ||
          v.name.includes('Henri') ||
          v.name.includes('Audrey'),
      );
      return preferred || langVoices[0];
    }

    // 2. Repli sur la voix par défaut du système
    return voices.find((v) => v.default) || voices[0] || null;
  }

  /**
   * Nettoie le texte des blocs de code markdown ou caractères spéciaux non prononçables
   * pour une lecture orale fluide et naturelle.
   */
  public sanitizeTextForSpeech(text: string): string {
    if (!text) return '';

    return text
      // Remplace les blocs de code markdown par une annonce orale concise
      .replace(/```[\s\S]*?```/g, ' [extrait de code disponible sur votre écran] ')
      // Supprime le code inline `...`
      .replace(/`([^`]+)`/g, '$1')
      // Supprime les liens markdown [texte](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Supprime les marqueurs de titre (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Supprime les astérisques de gras/italique
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Nettoie les retours à la ligne consécutifs
      .replace(/\n+/g, '. ')
      .trim();
  }

  /**
   * Prononce un message avec gestion des événements de début, fin et interruption.
   */
  public speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        options.onError?.(new Error('Synthèse vocale non supportée sur ce navigateur.'));
        return resolve();
      }

      // Arrêter toute synthèse précédente
      this.stop();

      const spokenText = this.sanitizeTextForSpeech(text);
      if (!spokenText) {
        return resolve();
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = options.voice || this.getBestVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.rate = options.rate ?? 1.05; // Débit légèrement dynamique
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        // Ignorer l'erreur d'annulation normale (interruption utilisateur)
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return resolve();
        }
        options.onError?.(e);
        reject(e);
      };

      utterance.onboundary = (e) => {
        options.onBoundary?.(e.charIndex);
      };

      this.currentUtterance = utterance;

      // Déclenchement de la parole
      try {
        this.synth.speak(utterance);
      } catch (err) {
        options.onError?.(err);
        resolve();
      }
    });
  }

  /**
   * Interrompt immédiatement toute synthèse en cours.
   */
  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignorer
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const voiceSynthesisService = new VoiceSynthesisService();
