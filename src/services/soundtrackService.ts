export type SoundtrackMood = 'deep-space' | 'ancient-mystery' | 'epic-suspense' | 'synth-drone' | 'cyber-future';

export interface SoundtrackConfig {
  mood: SoundtrackMood;
  volume: number; // 0.0 to 1.0
  enabled: boolean;
}

export const SOUNDTRACK_PRESETS: { id: SoundtrackMood; titleAr: string; titleEn: string; descAr: string; descEn: string; baseFreqs: number[] }[] = [
  {
    id: 'deep-space',
    titleAr: '🌌 الفضاء العميق (Deep Space)',
    titleEn: '🌌 Deep Space Ambient',
    descAr: 'نغمات كونية غامضة وهادئة تعكس عظمة المجرات والثقوب السوداء',
    descEn: 'Mysterious, expansive cosmic pads reflecting galaxies & black holes',
    baseFreqs: [65.41, 130.81, 196.00, 261.63], // C2, C3, G3, C4
  },
  {
    id: 'ancient-mystery',
    titleAr: '🏺 أسرار الحضارات (Ancient Mystery)',
    titleEn: '🏺 Ancient Mystery',
    descAr: 'أجواء أثرية وسحرية تناسب وثائقيات الأهرامات والتاريخ المفقود',
    descEn: 'Atmospheric minor scales suited for archaeological & historical enigmas',
    baseFreqs: [55.00, 110.00, 164.81, 220.00], // A1, A2, E3, A3
  },
  {
    id: 'epic-suspense',
    titleAr: '⚡ التوتر والتشويق (Epic Suspense)',
    titleEn: '⚡ Epic Suspense',
    descAr: 'إيقاع مشوق ومثير يجذب انتباه المشاهد من الثانية الأولى',
    descEn: 'Tension-building cinematic swells maximizing viewer retention',
    baseFreqs: [73.42, 146.83, 220.00, 293.66], // D2, D3, A3, D4
  },
  {
    id: 'synth-drone',
    titleAr: '🎛️ دروون سينمائي (Cinematic Drone)',
    titleEn: '🎛️ Cinematic Drone',
    descAr: 'طبقة هادئة ومستمرة تزيد من فخامة التعليق الصوتي دون تشتيت',
    descEn: 'Subtle low-end harmonic drone enhancing voiceover clarity',
    baseFreqs: [43.65, 87.31, 130.81, 174.61], // F1, F2, C3, F3
  },
];

export class SoundtrackService {
  private static readonly STORAGE_KEY = 'docushorts_soundtrack_config';
  private config: SoundtrackConfig;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private isPlaying = false;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): SoundtrackConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<SoundtrackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SoundtrackService.STORAGE_KEY, JSON.stringify(this.config));
    }
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.config.volume, this.audioContext.currentTime);
    }
  }

  private loadConfig(): SoundtrackConfig {
    const defaults: SoundtrackConfig = {
      mood: 'deep-space',
      volume: 0.18,
      enabled: true,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const data = localStorage.getItem(SoundtrackService.STORAGE_KEY);
      if (data) {
        return { ...defaults, ...JSON.parse(data) };
      }
    } catch {}
    return defaults;
  }

  private initAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.masterGain = this.audioContext.createGain();
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        
        this.masterGain.gain.setValueAtTime(this.config.volume, this.audioContext.currentTime);
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.connect(this.destinationNode);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Play procedural royalty-free ambient soundtrack
   */
  public play(moodOverride?: SoundtrackMood) {
    try {
      this.initAudio();
      if (!this.audioContext || !this.masterGain) return;

      this.stop();
      const mood = moodOverride || this.config.mood;
      const preset = SOUNDTRACK_PRESETS.find(p => p.id === mood) || SOUNDTRACK_PRESETS[0];

      const ctx = this.audioContext;
      const baseFreqs = preset.baseFreqs;

      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow LFO for cinematic breathing modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.04, ctx.currentTime);
        lfoGain.gain.setValueAtTime(2.0, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        // Low-pass warm filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + idx * 80, ctx.currentTime);

        // Gain per harmonic
        oscGain.gain.setValueAtTime(0.1 / (idx + 1), ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start();
        this.activeNodes.push(osc, lfo);
      });

      this.isPlaying = true;
    } catch (e) {
      console.warn('Could not start procedural soundtrack:', e);
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      if (node && typeof (node as any).stop === 'function') {
        try {
          (node as any).stop();
          (node as any).disconnect();
        } catch {}
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getAudioStreamTrack(): MediaStreamTrack | null {
    if (this.destinationNode && this.destinationNode.stream) {
      const tracks = this.destinationNode.stream.getAudioTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }
}

export const soundtrackService = new SoundtrackService();
