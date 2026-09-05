import { Language, ShortsScript, Scene } from '../types';
import { buildPollinationsImageUrl } from './pollinationsService';

export class GeminiClientService {
  private static readonly STORAGE_KEY = 'docushorts_gemini_api_key';
  private isAvailable: boolean | null = null;

  /**
   * Get stored custom Gemini API Key
   */
  public getStoredApiKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(GeminiClientService.STORAGE_KEY) || '';
  }

  /**
   * Save custom Gemini API Key
   */
  public saveApiKey(key: string) {
    if (typeof window === 'undefined') return;
    if (key && key.trim()) {
      localStorage.setItem(GeminiClientService.STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GeminiClientService.STORAGE_KEY);
    }
    this.isAvailable = null;
  }

  /**
   * Test a custom Gemini API Key
   */
  public async testApiKey(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/gemini/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': key.trim(),
        },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      const data = await res.json();
      return { success: !!data.success, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  }

  /**
   * Check if Gemini API is configured on the server or in storage
   */
  public async checkStatus(): Promise<boolean> {
    try {
      const customKey = this.getStoredApiKey();
      const res = await fetch('/api/gemini/status', {
        headers: customKey ? { 'x-gemini-api-key': customKey } : {},
      });
      if (res.ok) {
        const data = await res.json();
        this.isAvailable = Boolean(data.available);
        return this.isAvailable;
      }
    } catch {
      this.isAvailable = false;
    }
    return false;
  }

  /**
   * Suggest high-retention viral topics based on a niche or random exploration
   */
  public async suggestTopics(niche: string, lang: Language = 'ar', count: number = 5): Promise<string[]> {
    try {
      const customKey = this.getStoredApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) headers['x-gemini-api-key'] = customKey;

      const res = await fetch('/api/gemini/suggest-topics', {
        method: 'POST',
        headers,
        body: JSON.stringify({ niche, lang, count }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.topics) && data.topics.length > 0) {
          return data.topics;
        }
      }
    } catch (e) {
      console.warn('Gemini topic suggestion fallback to procedural:', e);
    }

    return this.getFallbackTopics(niche, lang);
  }

  /**
   * Generate complete documentary script via server-side Gemini 3.8 Flash
   */
  public async generateScript(
    topic: string,
    lang: Language = 'ar',
    sceneCount: number = 6,
    customFileName?: string
  ): Promise<ShortsScript | null> {
    try {
      const customKey = this.getStoredApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) headers['x-gemini-api-key'] = customKey;

      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic, lang, sceneCount }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data.success || !data.script) return null;

      const script = data.script;
      const scenes: Scene[] = [];
      const seedBase = Math.floor(Math.random() * 900000) + 100000;
      const rawScenes = script.scenes || [];
      
      const narrations = rawScenes.map((s: any) => s.narration || s.text || '');
      const wordCounts = narrations.map((n: string) => Math.max(1, n.trim().split(/\s+/).filter(Boolean).length));
      const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0);
      const targetTotalSecs = 58;

      let fullNarrationText = '';

      rawScenes.forEach((s: any, idx: number) => {
        const narration = narrations[idx];
        fullNarrationText += (idx > 0 ? ' ' : '') + narration;
        const prompt = s.visualPrompt || `${topic} cinematic 8k National Geographic documentary moment ${idx + 1}`;
        const imageUrl = buildPollinationsImageUrl(prompt, seedBase + idx);
        const words = wordCounts[idx] || 10;
        const proportionalDuration = Math.max(3.5, Math.round(((words / totalWords) * targetTotalSecs) * 10) / 10);

        scenes.push({
          id: idx + 1,
          text: narration,
          imagePrompt: prompt,
          imageUrl,
          durationSeconds: proportionalDuration,
          loadedImage: null,
          imageLoading: true,
        });
      });

      return {
        topic,
        title: script.title || (lang === 'ar' ? `سر لا يصدق عن ${topic} 🤯 #Shorts` : `Secrets of ${topic} 🤯 #Shorts`),
        description: script.description || `وثائقي قصير عن ${topic}.\n\n#Shorts #وثائقي #علوم`,
        tags: Array.isArray(script.tags) ? script.tags : [topic, 'Shorts', 'Documentary'],
        category: lang === 'ar' ? 'التعليم والعلوم' : 'Education & Science',
        audience: 'Not made for kids',
        videoLanguage: lang,
        customFileName: customFileName?.trim() || undefined,
        fullScriptText: fullNarrationText || undefined,
        scenes,
      };
    } catch (e) {
      console.warn('Gemini script generation failed, falling back:', e);
      return null;
    }
  }

  private getFallbackTopics(niche: string, lang: Language): string[] {
    const isAr = lang === 'ar';
    if (isAr) {
      return [
        `أسرار غير مروية عن: ${niche}`,
        `كيف يغير ${niche} كل ما نعرفه عن العالم؟`,
        `أكبر لغز غامض تم اكتشافه في ${niche}`,
        `الحقيقة المخيفة وراء ${niche} التي أخفاها العلماء`,
        `5 حقائق مذهلة تجعلك تعيد التفكير في ${niche}`,
      ];
    }
    return [
      `Untold Mysteries Behind ${niche}`,
      `How ${niche} is Changing Everything We Know`,
      `The Deepest Enigma Discovered in ${niche}`,
      `The Shocking Truth About ${niche} Hidden for Years`,
      `5 Mind-Blowing Facts About ${niche}`,
    ];
  }
}

export const geminiClientService = new GeminiClientService();
