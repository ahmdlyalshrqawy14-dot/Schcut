import { Language, Scene, ShortsScript } from '../types';
import { imageEnginesService } from './imageEnginesService';
import { geminiClientService } from './geminiClientService';

/**
 * Generate a coherent, single continuous documentary script (~58-60 seconds)
 * with N cinematic 9:16 images distributed across the narration timeline.
 * Uses Server-Side Gemini 3.8 Flash (Primary) with Pollinations AI Fallback.
 */
export async function generateDocumentaryScript(
  topic: string,
  videoLang: Language,
  imageCount: number = 6,
  customFileName?: string
): Promise<ShortsScript> {
  const isAr = videoLang === 'ar';
  const clampedImageCount = Math.max(4, Math.min(12, Math.round(imageCount)));

  // 1. Try Google Gemini 3.8 Flash first if available
  try {
    const geminiScript = await geminiClientService.generateScript(
      topic,
      videoLang,
      clampedImageCount,
      customFileName
    );
    if (geminiScript && geminiScript.scenes && geminiScript.scenes.length >= 2) {
      return geminiScript;
    }
  } catch (e) {
    console.warn('Gemini script generation skipped, trying Pollinations:', e);
  }

  // 2. Pollinations AI Fallback

  const systemPrompt = `You are a world-class documentary director and viral YouTube Shorts creator.
Write an electrifying, fact-filled, single continuous documentary narration for a vertical YouTube Short.
Topic: "${topic}"
Target Narration Duration: Exactly 55 to 59 seconds (approximately 130-150 words in total).
Language: ${isAr ? 'Modern Standard Arabic (لغة عربية فصحى مشوقة وجذابة)' : 'English (gripping documentary tone)'}.
Total Visual Scenes/Images Required: EXACTLY ${clampedImageCount} distinct cinematic visual moments.

Return ONLY a valid JSON object strictly matching this format without any markdown code fences or conversational text:
{
  "title": "Viral YouTube Shorts title with 1-2 emojis and #Shorts in ${isAr ? 'Arabic' : 'English'}",
  "description": "Engaging description with key facts and #Shorts in ${isAr ? 'Arabic' : 'English'}",
  "tags": ["${topic}", "Shorts", "Documentary", "Facts", "Science", "History"],
  "category": "${isAr ? 'التعليم والعلوم' : 'Education & Science'}",
  "audience": "Not made for kids",
  "fullScript": "The complete, continuous, thrilling ~140-word narration text to be spoken in one unbroken voiceover take...",
  "scenes": [
    ${Array.from({ length: clampedImageCount }, (_, i) => `{
      "id": ${i + 1},
      "textSegment": "${isAr ? `جزء النص المرتبط بالصورة ${i + 1}` : `Sub-narrative sentence matching image ${i + 1}`}",
      "imagePrompt": "Cinematic documentary photograph, vertical 9:16 composition, 8k resolution, dramatic IMAX lighting, National Geographic style: detailed visual description of scene ${i + 1} in English"
    }`).join(',\n    ')}
  ]
}`;

  try {
    const encodedPrompt = encodeURIComponent(systemPrompt);
    const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?json=true&model=openai`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Text API error ${response.status}`);
    }

    const rawText = await response.text();
    const parsedData = extractAndParseJSON(rawText);

    if (parsedData && (parsedData.fullScript || (parsedData.scenes && parsedData.scenes.length >= 2))) {
      return formatScriptData(topic, parsedData, videoLang, clampedImageCount, customFileName);
    }
    
    return generateFallbackScript(topic, videoLang, clampedImageCount, customFileName);
  } catch (error) {
    console.warn('Pollinations text generation fallback:', error);
    return generateFallbackScript(topic, videoLang, clampedImageCount, customFileName);
  }
}

/**
 * Robust JSON extractor from arbitrary string responses
 */
function extractAndParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Format and structure the script, calculating continuous timeline distribution
 */
function formatScriptData(
  topic: string,
  data: any,
  videoLang: Language,
  targetImageCount: number,
  customFileName?: string
): ShortsScript {
  const seedBase = Math.floor(Math.random() * 900000) + 100000;
  const isAr = videoLang === 'ar';
  
  const rawScenes: any[] = Array.isArray(data.scenes) ? data.scenes : [];
  
  // Extract or build full continuous script text
  let fullScriptText = typeof data.fullScript === 'string' && data.fullScript.trim().length > 30
    ? data.fullScript.trim()
    : rawScenes.map(s => s.textSegment || s.text || '').filter(Boolean).join(' ');

  if (!fullScriptText) {
    fullScriptText = isAr
      ? `هل تعلم أن ${topic} يخفي أسراراً حيرت أعظم العلماء عبر التاريخ؟ الاكتشافات الأخيرة كشفت عن ظواهر غير مسبوقة تبهر العقول وتغير كل ما كنا نعرفه عن هذا العالم.`
      : `Did you know that ${topic} holds secrets that have baffled the greatest scientists throughout history? Recent discoveries have revealed unprecedented phenomena that challenge everything we thought we knew.`;
  }

  // Split the full text logically across the target number of image scenes for subtitle synchronization
  const sentences = splitIntoSentences(fullScriptText, targetImageCount);

  const defaultDurationPerScene = Math.max(4, Math.round(58 / targetImageCount));
  const scenes: Scene[] = [];

  for (let index = 0; index < targetImageCount; index++) {
    const rawScene = rawScenes[index];
    const textSegment = rawScene?.textSegment || rawScene?.text || sentences[index] || sentences[sentences.length - 1];
    
    const imgPrompt = rawScene?.imagePrompt || `${topic} documentary cinematic shot ${index + 1}, dramatic atmosphere, photorealistic 8k`;
    const cleanPrompt = imgPrompt.replace(/[\r\n\t]+/g, ' ').trim();
    const imageUrl = buildPollinationsImageUrl(cleanPrompt, seedBase + index);

    scenes.push({
      id: index + 1,
      text: textSegment,
      imagePrompt: cleanPrompt,
      imageUrl: imageUrl,
      durationSeconds: defaultDurationPerScene,
      loadedImage: null,
      imageLoading: true,
    });
  }

  const title = data.title || (isAr ? `أسرار لا تصدق عن: ${topic} 🤯 #Shorts` : `Shocking Secrets of ${topic} 🤯 #Shorts`);
  const description = data.description || (isAr 
    ? `وثائقي قصير يستعرض أهم الأسرار والحقائق المثيرة حول ${topic}.\n\n#Shorts #وثائقي #معلومات #علوم`
    : `A thrilling mini-documentary exploring the deepest mysteries of ${topic}.\n\n#Shorts #Documentary #Science #Facts`);

  return {
    topic,
    title,
    description,
    tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [topic, 'Shorts', 'Documentary', 'Facts', 'Science'],
    category: data.category || (isAr ? 'التعليم والعلوم' : 'Education & Science'),
    audience: 'Not made for kids',
    videoLanguage: videoLang,
    customFileName: customFileName?.trim() || undefined,
    fullScriptText,
    scenes,
  };
}

/**
 * Split text into N balanced segments for subtitle synchronization
 */
function splitIntoSentences(text: string, count: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= count) {
    return Array.from({ length: count }, (_, i) => words[i] || words[0] || text);
  }

  const chunkSize = Math.ceil(words.length / count);
  const segments: string[] = [];

  for (let i = 0; i < count; i++) {
    const start = i * chunkSize;
    const end = i === count - 1 ? words.length : Math.min(words.length, (i + 1) * chunkSize);
    const chunk = words.slice(start, end).join(' ');
    if (chunk) {
      segments.push(chunk);
    }
  }

  while (segments.length < count) {
    segments.push(segments[segments.length - 1] || text);
  }

  return segments;
}

/**
 * Build 1080x1920 9:16 Ultra HD Image URL using configured multi-engine service
 */
export function buildPollinationsImageUrl(prompt: string, seed?: number): string {
  return imageEnginesService.buildImageUrl(prompt, seed);
}

/**
 * Preload a single image with multi-engine fallback and CORS support
 */
export function preloadImage(url: string, retryCount = 1): Promise<HTMLImageElement> {
  return imageEnginesService.fetchImageWithFallback(url);
}

/**
 * High-speed parallel batch load of multiple images (concurrency 4-6 for ultra-fast connections)
 */
export async function preloadImagesInBatches(
  scenes: Scene[],
  concurrencyLimit: number = 4,
  onProgress?: (loaded: number, total: number) => void
): Promise<Scene[]> {
  const total = scenes.length;
  let loadedCount = 0;
  const results: Scene[] = [...scenes];

  for (let i = 0; i < total; i += concurrencyLimit) {
    const chunk = results.slice(i, i + concurrencyLimit);
    await Promise.all(
      chunk.map(async (scene) => {
        try {
          const img = await preloadImage(scene.imageUrl, 1);
          scene.loadedImage = img;
          scene.imageLoading = false;
        } catch {
          scene.imageLoading = false;
        } finally {
          loadedCount++;
          if (onProgress) {
            onProgress(loadedCount, total);
          }
        }
      })
    );
  }

  return results;
}

function createFallbackImageElement(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;
  
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 1080;
    const y = Math.random() * 1920;
    const r = Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const img = new Image();
  img.src = canvas.toDataURL('image/jpeg');
  return img;
}

/**
 * Dynamic fallback generator producing coherent continuous narrative (~58 seconds)
 */
function generateFallbackScript(
  topic: string,
  videoLang: Language,
  targetImageCount: number = 6,
  customFileName?: string
): ShortsScript {
  const isAr = videoLang === 'ar';
  const seedBase = Math.floor(Math.random() * 900000) + 100000;

  const arabicContinuousStory = `هل تعلم أن ${topic} يخفي في طياته أحد أعظم الأسرار التي حيرت البشرية لقرون طويلة؟ في البداية، اعتقد الجميع أن الأمر مجرد مصادفة بسيطة، ولكن التحليلات العلمية الحديثة أثبتت وجود قوى وظواهر غير مسبوقة تفوق كل التوقعات الفيزيائية. خرائط قديمة وأبحاث متطورة كشفت عن تفاصيل مذهلة كانت مخفية عن الأنظار. واليوم، يتسابق كبار الباحثين والعلماء حول العالم لفك هذا اللغز المثير قبل فوات الأوان. ما رأيك أنت في هذا السر الغامض؟ شاركنا برأيك في التعليقات واشترك للمزيد!`;

  const englishContinuousStory = `Did you know that ${topic} conceals one of the deepest mysteries that has puzzled humanity for centuries? At first, experts believed it was a mere coincidence, but modern scientific analysis has revealed staggering phenomena that defy conventional physics. Ancient archives and cutting-edge observations have uncovered breathtaking details long hidden from the public. Today, leading researchers across the globe are racing to unlock this astonishing puzzle before time runs out. What do you think is really going on? Drop your theories in the comments and subscribe for more daily documentaries!`;

  const fullScriptText = isAr ? arabicContinuousStory : englishContinuousStory;
  const sentences = splitIntoSentences(fullScriptText, targetImageCount);
  const defaultDurationPerScene = Math.max(4, Math.round(58 / targetImageCount));
  const scenes: Scene[] = [];

  for (let i = 0; i < targetImageCount; i++) {
    const scenePrompt = `Cinematic documentary moment ${i + 1} illustrating ${topic}, dramatic atmospheric lighting, photorealistic 8k, National Geographic IMAX vertical composition`;
    const imageUrl = buildPollinationsImageUrl(scenePrompt, seedBase + i);

    scenes.push({
      id: i + 1,
      text: sentences[i] || sentences[0],
      imagePrompt: scenePrompt,
      imageUrl: imageUrl,
      durationSeconds: defaultDurationPerScene,
      loadedImage: null,
      imageLoading: true,
    });
  }

  const title = isAr
    ? `سر مذهل لم تكن تعرفه عن: ${topic} 🤯 #Shorts`
    : `The Shocking Truth About ${topic} 🤯 #Shorts`;

  const description = isAr
    ? `اكتشف في هذا الوثائقي القصير حقائق مذهلة وأسراراً حيرت العلماء حول ${topic}.\n\n📌 اشترك للمزيد من الأفلام الوثائقية اليومية!\n#Shorts #وثائقي #معلومات #علوم`
    : `Uncover the hidden science and jaw-dropping reality behind ${topic} in this mini-documentary.\n\n🔔 Subscribe for daily mind-blowing documentary shorts!\n#Shorts #Documentary #Science #History`;

  return {
    topic,
    title,
    description,
    tags: [topic, 'Shorts', 'Documentary', 'Science', 'History', 'Facts', 'Viral'],
    category: isAr ? 'التعليم والعلوم' : 'Science & Technology',
    audience: 'Not made for kids',
    videoLanguage: videoLang,
    customFileName: customFileName?.trim() || undefined,
    fullScriptText,
    scenes,
  };
}
