import { Language, Scene, ShortsScript } from '../types';

/**
 * Generate a complete documentary Shorts script with customizable scene count (4 to 50 scenes)
 * using Pollinations AI (free, no API key required)
 */
export async function generateDocumentaryScript(
  topic: string,
  videoLang: Language,
  sceneCount: number = 4,
  customFileName?: string
): Promise<ShortsScript> {
  const isAr = videoLang === 'ar';
  const clampedSceneCount = Math.max(4, Math.min(50, Math.round(sceneCount)));

  const systemPrompt = `You are an elite YouTube Shorts documentary director and viral SEO specialist.
Create a thrilling, engaging ${clampedSceneCount}-scene documentary script for a vertical YouTube Short.
Topic: "${topic}"
Total Scenes Required: EXACTLY ${clampedSceneCount} scenes.
Target Language for Narration and Metadata: ${isAr ? 'Arabic (اللغة العربية الفصحى المشوقة)' : 'English (Engaging documentary style)'}.

Return ONLY a valid JSON object strictly matching this format without any markdown wrappers or preamble:
{
  "title": "A viral punchy YouTube Shorts title with 1-2 emojis and #Shorts in ${isAr ? 'Arabic' : 'English'}",
  "description": "Engaging SEO description with facts, timestamps and relevant hashtags #Shorts in ${isAr ? 'Arabic' : 'English'}",
  "tags": ["${topic}", "Shorts", "Documentary", "Facts", "Science", "History"],
  "category": "${isAr ? 'التعليم والعلوم' : 'Education & Science'}",
  "audience": "Not made for kids",
  "scenes": [
    ${Array.from({ length: Math.min(clampedSceneCount, 6) }, (_, i) => `{
      "id": ${i + 1},
      "text": "${isAr ? `نص الإلقاء الصوتي المشوق للمشهد ${i + 1}` : `Gripping narration text for scene ${i + 1}`}",
      "imagePrompt": "Cinematic 8k documentary photograph, dramatic lighting, detailed wide shot, photorealistic, IMAX, vertical 9:16 composition: specific visual description for scene ${i + 1} in English",
      "durationSeconds": 6
    }`).join(',\n    ')}
    // ... continue for all ${clampedSceneCount} scenes
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
      throw new Error(`Text API responded with status ${response.status}`);
    }

    const rawText = await response.text();
    const parsedData = extractAndParseJSON(rawText);

    if (parsedData && parsedData.scenes && Array.isArray(parsedData.scenes) && parsedData.scenes.length >= 2) {
      return formatScriptData(topic, parsedData, videoLang, clampedSceneCount, customFileName);
    }
    
    // If parsedData was imperfect, fallback to tailored generator
    return generateFallbackScript(topic, videoLang, clampedSceneCount, customFileName);
  } catch (error) {
    console.warn('Pollinations API call failed or timed out, using intelligent local script engine:', error);
    return generateFallbackScript(topic, videoLang, clampedSceneCount, customFileName);
  }
}

/**
 * Robust JSON parser that handles codeblocks or partial strings
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
 * Format and sanitize script data, padding or trimming to exactly requested sceneCount
 */
function formatScriptData(
  topic: string,
  data: any,
  videoLang: Language,
  targetSceneCount: number,
  customFileName?: string
): ShortsScript {
  const seedBase = Math.floor(Math.random() * 900000) + 100000;
  const isAr = videoLang === 'ar';
  
  const rawScenes: any[] = Array.isArray(data.scenes) ? data.scenes : [];
  const scenes: Scene[] = [];

  for (let index = 0; index < targetSceneCount; index++) {
    const rawScene = rawScenes[index];
    const fallbackText = isAr 
      ? `المشهد ${index + 1}: استكشاف جانب جديد ومثير حول ${topic}`
      : `Scene ${index + 1}: Uncovering another fascinating dimension of ${topic}`;
    
    const text = rawScene?.text || fallbackText;
    const imgPrompt = rawScene?.imagePrompt || `${topic} documentary cinematic shot ${index + 1}, dramatic atmosphere`;
    const cleanPrompt = imgPrompt.replace(/[\r\n\t]+/g, ' ').trim();
    const imageUrl = buildPollinationsImageUrl(cleanPrompt, seedBase + index);

    scenes.push({
      id: index + 1,
      text: text,
      imagePrompt: cleanPrompt,
      imageUrl: imageUrl,
      durationSeconds: Number(rawScene?.durationSeconds) || 6,
      loadedImage: null,
      imageLoading: true,
    });
  }

  return {
    topic,
    title: data.title || (isAr ? `حقائق لا تصدق عن: ${topic} 🤯 #Shorts` : `Shocking Facts About: ${topic} 🤯 #Shorts`),
    description: data.description || (isAr 
      ? `وثائقي شامل يستعرض أسرار ${topic} عبر ${targetSceneCount} مشهد سينمائي متكامل.\n\n#Shorts #وثائقي #علوم`
      : `Comprehensive documentary exploring ${topic} across ${targetSceneCount} cinematic scenes.\n\n#Shorts #Documentary #Science`),
    tags: Array.isArray(data.tags) ? data.tags : [topic, 'Shorts', 'Documentary', 'Facts', 'Science', 'History'],
    category: data.category || (isAr ? 'التعليم والعلوم' : 'Education & Science'),
    audience: 'Not made for kids',
    videoLanguage: videoLang,
    customFileName: customFileName?.trim() || undefined,
    scenes,
  };
}

/**
 * Build a high quality 720x1280 9:16 Pollinations Image URL using fast turbo model (~2s generation)
 */
export function buildPollinationsImageUrl(prompt: string, seed?: number): string {
  const randomSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `${prompt}, cinematic documentary 8k, national geographic photography, hyper-detailed, dramatic atmosphere, vertical 9:16 composition, photorealistic volumetric lighting, ultra-hd film grain`;
  const encoded = encodeURIComponent(enhancedPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=720&height=1280&nologo=true&seed=${randomSeed}&model=turbo`;
}

/**
 * Preload a single image with CORS enabled for safe Canvas drawing and video stream recording
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback procedural canvas to avoid broken images
      const fallbackImg = createFallbackImageElement();
      resolve(fallbackImg);
    };
    img.src = url;
  });
}

/**
 * Batch load multiple images with strict concurrency control (2 at a time) to prevent browser freezing on up to 50 scenes
 */
export async function preloadImagesInBatches(
  scenes: Scene[],
  concurrencyLimit: number = 2,
  onProgress?: (loaded: number, total: number) => void
): Promise<Scene[]> {
  const total = scenes.length;
  let loadedCount = 0;
  const results: Scene[] = [...scenes];

  // Process in sequential chunks with concurrency limit 2
  for (let i = 0; i < total; i += concurrencyLimit) {
    const chunk = results.slice(i, i + concurrencyLimit);
    await Promise.all(
      chunk.map(async (scene) => {
        try {
          const img = await preloadImage(scene.imageUrl);
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
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  
  // Dramatic dark gradient
  const grad = ctx.createLinearGradient(0, 0, 720, 1280);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 1280);

  // Cinematic stars / particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 720;
    const y = Math.random() * 1280;
    const r = Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const img = new Image();
  img.src = canvas.toDataURL('image/jpeg');
  return img;
}

/**
 * Dynamic fallback generator producing between 4 to 50 coherent narrative scenes
 */
function generateFallbackScript(
  topic: string,
  videoLang: Language,
  targetSceneCount: number = 4,
  customFileName?: string
): ShortsScript {
  const isAr = videoLang === 'ar';
  const seedBase = Math.floor(Math.random() * 900000) + 100000;
  const scenes: Scene[] = [];

  const arabicNarratives = [
    `هل تعلم أن ${topic} يخفي في طياته أحد أكثر الأسرار إثارة في تاريخ العلم؟`,
    `لسنوات طويلة، اعتقد الخبراء أن الأمر مجرد صدفة، حتى ظهرت هذه الاكتشافات الصادمة.`,
    `التجارب الحديثة أثبتت وجود قوى وظواهر تفوق كل التوقعات الفيزيائية المعروفة.`,
    `الخرائط والوثائق القديمة تظهر إشارات غامضة تؤكد وجود هذا اللغز منذ آلاف السنين.`,
    `فريق من كبار الباحثين تمكن أخيراً من رصد إشارات غير مسبوقة تثير الدهشة.`,
    `هذه الظاهرة ليست مجرد حدث عابر، بل تغير فهمنا للطبيعة والكون كلياً.`,
    `المثير للدهشة هو أن التفاصيل الدقيقة لم يتم الكشف عنها للعلن إلا مؤخراً.`,
    `التحليلات المخبرية الحديثة أظهرت نتائج غير مسبوقة صدمت المجتمع العلمي.`,
    `الآن يتساءل الجميع: ما الذي سيحدث لو تأكدت هذه الفرضية بنسبة مئة بالمئة؟`,
    `والآن أخبرنا برأيك في التعليقات: هل تعتقد أن هذا اللغز سيُحل يوماً ما؟`,
  ];

  const englishNarratives = [
    `Did you know that ${topic} holds one of the deepest mysteries in modern science?`,
    `For centuries, experts thought they understood it, until new groundbreaking discoveries emerged.`,
    `Recent scientific observations revealed mind-bending phenomena that defy conventional physics.`,
    `Ancient records and forgotten archives contain strange clues pointing to this very truth.`,
    `A team of dedicated researchers finally captured unprecedented visual evidence.`,
    `This discovery completely reshapes everything we thought we knew about our reality.`,
    `What makes this even more shocking is how long it remained hidden from the public.`,
    `State-of-the-art laboratory analysis produced staggering data that stunned physicists.`,
    `Scientists around the globe are now racing to unlock the final missing piece of the puzzle.`,
    `What do you think really happened? Drop your theories in the comments and subscribe!`,
  ];

  const narrativePool = isAr ? arabicNarratives : englishNarratives;

  for (let i = 0; i < targetSceneCount; i++) {
    const narrativeText = narrativePool[i % narrativePool.length];
    const scenePrompt = `Cinematic documentary scene ${i + 1} of ${topic}, dramatic atmospheric lighting, photorealistic 8k, National Geographic IMAX vertical composition`;
    const imageUrl = buildPollinationsImageUrl(scenePrompt, seedBase + i);

    scenes.push({
      id: i + 1,
      text: narrativeText,
      imagePrompt: scenePrompt,
      imageUrl: imageUrl,
      durationSeconds: 6,
      loadedImage: null,
      imageLoading: true,
    });
  }

  const title = isAr
    ? `سر حقيقي لم تكن تعرفه عن: ${topic} 🤯 #Shorts`
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
    scenes,
  };
}

