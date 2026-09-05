import { AzureSpeechConfig, AzureVoiceInfo, Language } from '../types';

export class AzureSpeechService {
  private static readonly STORAGE_KEY = 'docushorts_azure_speech_config';

  private audioContext: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;

  // Curated fallback list of popular Azure Neural voices when offline or before fetching
  public static readonly DEFAULT_NEURAL_VOICES: AzureVoiceInfo[] = [
    // Arabic Voices
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-EG, SalmaNeural)',
      displayName: 'Salma (سلمى - مصر)',
      localName: 'سلمى',
      shortName: 'ar-EG-SalmaNeural',
      gender: 'Female',
      locale: 'ar-EG',
      localeName: 'Arabic (Egypt)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-EG, ShakirNeural)',
      displayName: 'Shakir (شاكر - مصر)',
      localName: 'شاكر',
      shortName: 'ar-EG-ShakirNeural',
      gender: 'Male',
      locale: 'ar-EG',
      localeName: 'Arabic (Egypt)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-SA, HamedNeural)',
      displayName: 'Hamed (حامد - السعودية)',
      localName: 'حامد',
      shortName: 'ar-SA-HamedNeural',
      gender: 'Male',
      locale: 'ar-SA',
      localeName: 'Arabic (Saudi Arabia)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-SA, ZariyahNeural)',
      displayName: 'Zariyah (زارية - السعودية)',
      localName: 'زارية',
      shortName: 'ar-SA-ZariyahNeural',
      gender: 'Female',
      locale: 'ar-SA',
      localeName: 'Arabic (Saudi Arabia)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-AE, FatimaNeural)',
      displayName: 'Fatima (فاطمة - الإمارات)',
      localName: 'فاطمة',
      shortName: 'ar-AE-FatimaNeural',
      gender: 'Female',
      locale: 'ar-AE',
      localeName: 'Arabic (UAE)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (ar-AE, HamdanNeural)',
      displayName: 'Hamdan (حمدان - الإمارات)',
      localName: 'حمدان',
      shortName: 'ar-AE-HamdanNeural',
      gender: 'Male',
      locale: 'ar-AE',
      localeName: 'Arabic (UAE)',
    },
    // English Voices
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)',
      displayName: 'Jenny (US Natural Storyteller)',
      localName: 'Jenny',
      shortName: 'en-US-JennyNeural',
      gender: 'Female',
      locale: 'en-US',
      localeName: 'English (US)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)',
      displayName: 'Guy (US Documentary Narrator)',
      localName: 'Guy',
      shortName: 'en-US-GuyNeural',
      gender: 'Male',
      locale: 'en-US',
      localeName: 'English (US)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)',
      displayName: 'Aria (US Expressive)',
      localName: 'Aria',
      shortName: 'en-US-AriaNeural',
      gender: 'Female',
      locale: 'en-US',
      localeName: 'English (US)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-US, ChristopherNeural)',
      displayName: 'Christopher (US Cinematic Deep)',
      localName: 'Christopher',
      shortName: 'en-US-ChristopherNeural',
      gender: 'Male',
      locale: 'en-US',
      localeName: 'English (US)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-GB, RyanNeural)',
      displayName: 'Ryan (British BBC Style)',
      localName: 'Ryan',
      shortName: 'en-GB-RyanNeural',
      gender: 'Male',
      locale: 'en-GB',
      localeName: 'English (UK)',
    },
    {
      name: 'Microsoft Server Speech Text to Speech Voice (en-GB, SoniaNeural)',
      displayName: 'Sonia (British Documentary)',
      localName: 'Sonia',
      shortName: 'en-GB-SoniaNeural',
      gender: 'Female',
      locale: 'en-GB',
      localeName: 'English (UK)',
    },
  ];

  /**
   * Read saved Azure configuration
   */
  public getStoredConfig(): AzureSpeechConfig {
    if (typeof window === 'undefined') {
      return {
        apiKey: '',
        region: 'eastus',
        selectedVoice: 'ar-EG-SalmaNeural',
        enabled: false,
        speakingRate: 1.0,
        pitch: 0,
      };
    }

    const saved = localStorage.getItem(AzureSpeechService.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          apiKey: parsed.apiKey || '',
          region: parsed.region || 'eastus',
          selectedVoice: parsed.selectedVoice || 'ar-EG-SalmaNeural',
          enabled: !!parsed.enabled && !!parsed.apiKey,
          speakingRate: parsed.speakingRate || 1.0,
          pitch: parsed.pitch || 0,
        };
      } catch (e) {
        // Fallback
      }
    }

    return {
      apiKey: '',
      region: 'eastus',
      selectedVoice: 'ar-EG-SalmaNeural',
      enabled: false,
      speakingRate: 1.0,
      pitch: 0,
    };
  }

  /**
   * Persist Azure configuration in LocalStorage
   */
  public saveConfig(config: AzureSpeechConfig): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AzureSpeechService.STORAGE_KEY, JSON.stringify(config));
    }
  }

  /**
   * Fetch live list of neural voices from Azure Cognitive Services API
   */
  public async fetchAvailableVoices(apiKey?: string, region?: string): Promise<AzureVoiceInfo[]> {
    const config = this.getStoredConfig();
    const activeKey = (apiKey || config.apiKey).trim();
    const activeRegion = (region || config.region || 'eastus').trim();

    if (!activeKey) {
      return AzureSpeechService.DEFAULT_NEURAL_VOICES;
    }

    try {
      const response = await fetch(
        `https://${activeRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': activeKey,
          },
        }
      );

      if (!response.ok) {
        console.warn('Azure voice list fetch returned non-200:', response.status);
        return AzureSpeechService.DEFAULT_NEURAL_VOICES;
      }

      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        return list.map((v: any) => ({
          name: v.Name,
          displayName: `${v.LocalName || v.DisplayName} (${v.Locale})`,
          localName: v.LocalName || v.DisplayName,
          shortName: v.ShortName,
          gender: v.Gender,
          locale: v.Locale,
          localeName: v.LocaleName || v.Locale,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch live Azure voices, falling back to default list:', err);
    }

    return AzureSpeechService.DEFAULT_NEURAL_VOICES;
  }

  /**
   * Synthesize text to high-fidelity audio buffer via Azure REST API
   */
  public async synthesize(
    text: string,
    options?: {
      voiceName?: string;
      lang?: Language;
      apiKey?: string;
      region?: string;
      rate?: number;
      pitch?: number;
    }
  ): Promise<{ audioBlob: Blob; audioBuffer: AudioBuffer; durationSeconds: number }> {
    const config = this.getStoredConfig();
    const apiKey = (options?.apiKey || config.apiKey).trim();
    const region = (options?.region || config.region || 'eastus').trim();
    const lang = options?.lang || (config.selectedVoice.startsWith('ar') ? 'ar' : 'en');
    
    // Choose appropriate voice
    let voice = options?.voiceName || config.selectedVoice;
    if (!voice) {
      voice = lang === 'ar' ? 'ar-EG-SalmaNeural' : 'en-US-JennyNeural';
    } else if (lang === 'ar' && !voice.startsWith('ar-')) {
      voice = 'ar-EG-SalmaNeural';
    } else if (lang === 'en' && !voice.startsWith('en-')) {
      voice = 'en-US-JennyNeural';
    }

    if (!apiKey) {
      throw new Error('Azure Speech API Key is required for neural voice generation.');
    }

    const langCode = voice.split('-').slice(0, 2).join('-');
    const ratePercent = options?.rate ? `${Math.round((options.rate - 1) * 100)}%` : '0%';
    const pitchPercent = options?.pitch ? `${options.pitch > 0 ? '+' : ''}${options.pitch}Hz` : '0Hz';

    // XML-escape text
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const ssml = `<speak version='1.0' xml:lang='${langCode}' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts'>
  <voice xml:lang='${langCode}' name='${voice}'>
    <prosody rate='${ratePercent}' pitch='${pitchPercent}'>
      ${escapedText}
    </prosody>
  </voice>
</speak>`;

    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'DocuShortsAI',
      },
      body: ssml,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `Azure Speech API error (${response.status}): ${errText || response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
    
    // Decode audio data accurately using Web Audio API
    const audioBuffer = await this.decodeAudio(arrayBuffer);
    const durationSeconds = audioBuffer.duration;

    return {
      audioBlob,
      audioBuffer,
      durationSeconds,
    };
  }

  /**
   * Decode binary audio buffer to Web Audio AudioBuffer for exact duration calculation
   */
  public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Clone arrayBuffer because decodeAudioData detaches it
    const clonedBuffer = arrayBuffer.slice(0);
    return new Promise((resolve, reject) => {
      this.audioContext!.decodeAudioData(
        clonedBuffer,
        (decoded) => resolve(decoded),
        (err) => reject(new Error('Failed to decode audio data: ' + err))
      );
    });
  }

  /**
   * Play an AudioBuffer with callback on completion
   */
  public playAudioBuffer(
    buffer: AudioBuffer,
    destinationGain?: GainNode,
    onEnded?: () => void
  ): AudioBufferSourceNode {
    this.stopPlayback();

    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    if (destinationGain) {
      source.connect(destinationGain);
    } else {
      source.connect(this.audioContext.destination);
    }

    source.onended = () => {
      this.currentSourceNode = null;
      if (onEnded) onEnded();
    };

    source.start(0);
    this.currentSourceNode = source;
    return source;
  }

  /**
   * Stop current audio playback
   */
  public stopPlayback(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {
        // Ignored
      }
      this.currentSourceNode = null;
    }
  }

  /**
   * Check if user has active Azure configuration
   */
  public isConfigured(): boolean {
    const config = this.getStoredConfig();
    return !!config.apiKey && !!config.apiKey.trim() && config.enabled;
  }
}

export const azureSpeechService = new AzureSpeechService();
