import { Language, ShortsScript, Scene } from '../types';
import { buildPollinationsImageUrl } from './pollinationsService';

export class GeminiClientService {
  private isAvailable: boolean | null = null;

  /**
   * Check if Gemini API is configured on the server
   */
  public async checkStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/gemini/status');
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
      const res = await fetch('/api/gemini/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, lang, sceneCount }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data.success || !data.script) return null;

      const script = data.script;
      const scenes: Scene[] = [];
      const seedBase = Math.floor(Math.random() * 900000) + 100000;
      const rawScenes = script.scenes || [];
      const durationPerScene = Math.max(4, Math.round(58 / Math.max(1, rawScenes.length)));

      let fullNarrationText = '';

      rawScenes.forEach((s: any, idx: number) => {
        const narration = s.narration || s.text || '';
        fullNarrationText += (idx > 0 ? ' ' : '') + narration;
        const prompt = s.visualPrompt || `${topic} cinematic 8k National Geographic documentary moment ${idx + 1}`;
        const imageUrl = buildPollinationsImageUrl(prompt, seedBase + idx);

        scenes.push({
          id: idx + 1,
          text: narration,
          imagePrompt: prompt,
          imageUrl,
          durationSeconds: durationPerScene,
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
