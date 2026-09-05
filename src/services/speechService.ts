import { Language } from '../types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Get available voices filtered by language
   */
  public getVoices(lang: Language): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const allVoices = this.synth.getVoices();
    const langPrefix = lang === 'ar' ? 'ar' : 'en';
    const filtered = allVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    return filtered.length > 0 ? filtered : allVoices;
  }

  /**
   * Select best natural sounding voice
   */
  public getPreferredVoice(lang: Language): SpeechSynthesisVoice | null {
    const voices = this.getVoices(lang);
    if (voices.length === 0) return null;

    const preferred = voices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Google') || 
      v.name.includes('Maged') || 
      v.name.includes('Tariq') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel')
    );
    return preferred || voices[0];
  }

  /**
   * Speak continuous unbroken narration for all scenes with zero pauses in between
   */
  public speakContinuousNarration(
    scenes: { text: string }[],
    startSceneIndex: number = 0,
    lang: Language = 'ar',
    rate: number = 1.0,
    pitch: number = 1.0,
    callbacks?: {
      onSceneChange?: (sceneIndex: number) => void;
      onEnd?: () => void;
    }
  ) {
    if (!this.synth) {
      if (callbacks?.onEnd) callbacks.onEnd();
      return;
    }

    this.stopSpeaking();

    const voice = this.getPreferredVoice(lang);
    const targetScenes = scenes.slice(startSceneIndex);

    if (targetScenes.length === 0) {
      if (callbacks?.onEnd) callbacks.onEnd();
      return;
    }

    targetScenes.forEach((scene, offset) => {
      const actualIndex = startSceneIndex + offset;
      const text = scene.text.trim();
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        if (callbacks?.onSceneChange) {
          callbacks.onSceneChange(actualIndex);
        }
      };

      utterance.onend = () => {
        if (offset === targetScenes.length - 1) {
          this.currentUtterance = null;
          if (callbacks?.onEnd) callbacks.onEnd();
        }
      };

      utterance.onerror = (e) => {
        console.warn(`Continuous speech error at scene ${actualIndex}:`, e);
      };

      if (offset === 0) {
        this.currentUtterance = utterance;
      }

      this.synth!.speak(utterance);
    });
  }

  /**
   * Speak a scene narration sentence with callbacks
   */
  public speakText(
    text: string,
    lang: Language,
    rate = 1.0,
    pitch = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): SpeechSynthesisUtterance | null {
    if (!this.synth) {
      if (onStart) onStart();
      if (onEnd) setTimeout(onEnd, this.estimateDuration(text, rate) * 1000);
      return null;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voice = this.getPreferredVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error or interrupted:', e);
      this.currentUtterance = null;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Synth speak threw error:', e);
      if (onEnd) onEnd();
    }

    return utterance;
  }

  /**
   * Stop current speech
   */
  public stopSpeaking() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    this.currentUtterance = null;
  }

  /**
   * Estimate duration in seconds based on word count & language
   */
  public estimateDuration(text: string, rate = 1.0): number {
    const words = text.trim().split(/\s+/).length;
    // Average speaking rate: ~2.5 words per second
    const baseSeconds = Math.max(4, words / (2.2 * rate));
    return Math.min(12, baseSeconds + 1); // Extra padding for breathing pause
  }

  /**
   * Initialize Web Audio API for cinematic documentary background music
   */
  private initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.musicGainNode = this.audioContext.createGain();
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        this.musicGainNode.connect(this.audioContext.destination);
        this.musicGainNode.connect(this.destinationNode);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Start procedural atmospheric documentary drone synthesizer
   */
  public startAmbientSoundtrack(volume = 0.25) {
    try {
      this.initAudioContext();
      if (!this.audioContext || !this.musicGainNode) return;

      this.stopAmbientSoundtrack();
      this.musicGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      const ctx = this.audioContext;
      const frequencies = [65.41, 130.81, 196.00, 261.63]; // C2, C3, G3, C4 deep cinematic chord

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow LFO pitch drift for organic cinematic pulse
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350 + i * 100, ctx.currentTime);

        oscGain.gain.setValueAtTime(0.12 / (i + 1), ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.musicGainNode!);

        osc.start();
        this.ambientOscillators.push(osc, lfo);
      });

      this.isMusicPlaying = true;
    } catch (e) {
      console.warn('Could not start ambient soundtrack:', e);
    }
  }

  /**
   * Stop background soundtrack
   */
  public stopAmbientSoundtrack() {
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignored
      }
    });
    this.ambientOscillators = [];
    this.isMusicPlaying = false;
  }

  /**
   * Set ambient soundtrack volume
   */
  public setMusicVolume(volume: number) {
    if (this.musicGainNode && this.audioContext) {
      this.musicGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  /**
   * Get audio stream for MediaRecorder export
   */
  public getAudioStreamTrack(): MediaStreamTrack | null {
    if (this.destinationNode && this.destinationNode.stream) {
      const tracks = this.destinationNode.stream.getAudioTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }
}

export const speechService = new SpeechService();
