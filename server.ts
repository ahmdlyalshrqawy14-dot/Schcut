import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy Google Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Check Gemini API Availability
app.get("/api/gemini/status", (req, res) => {
  const isAvailable = Boolean(process.env.GEMINI_API_KEY);
  res.json({ available: isAvailable });
});

// 1. Generate Smart Viral Topics from Niche / Random Idea
app.post("/api/gemini/suggest-topics", async (req, res) => {
  try {
    const { niche, lang = "ar", count = 5 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY not configured in environment.",
        fallback: true,
      });
    }

    const prompt = lang === "ar"
      ? `أنت خبير محتوى فيروسي في YouTube Shorts. اقترح ${count} مواضيع وثائقية مشوقة جداً وغامضة ومثيرة للفضول، مصممة لتحقيق ملايين المشاهدات في مجال (نيتش): "${niche || 'أسرار الكون والتاريخ والغرائب'}".
أرجع النتيجة بصيغة JSON فقط، على شكل مصفوفة من النصوص: ["عنوان 1", "عنوان 2", "عنوان 3", ...] بدون أي نصوص أخرى.`
      : `You are a viral YouTube Shorts documentary expert. Suggest ${count} highly intriguing, mysterious, and curiosity-hooking documentary topics designed for high retention in the niche: "${niche || 'Universe mysteries, ancient history, and mind enigmas'}".
Return JSON array of strings only: ["Topic 1", "Topic 2", ...] without any extra markdown or text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const topics = JSON.parse(text);
    res.json({ success: true, topics });
  } catch (err: any) {
    console.error("Gemini suggest-topics error:", err);
    res.status(500).json({ error: err.message || "Failed to suggest topics" });
  }
});

// 2. Generate Complete High-Retention Shorts Script
app.post("/api/gemini/generate-script", async (req, res) => {
  try {
    const { topic, lang = "ar", sceneCount = 6 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY not configured in environment.",
        fallback: true,
      });
    }

    const systemInstruction = lang === "ar"
      ? `أنت مخرج وكاتب وثائقيات سينمائية قصيرة في YouTube Shorts (DocuShorts Pro).
مهمتك كتابة سكريبت سينمائي متكامل لـ YouTube Shorts مدته ~55-59 ثانية مقسم إلى ${sceneCount} مشاهد متتالية ومتناسقة.
- المشهد الأول يجب أن يحتوي على هوك (Hook) صادم ومثير للاهتمام يمنع المشاهد من التمرير.
- كل مشهد يحتوي على:
  1. narration: النص الصوتي الذي سيتم قراءته (صياغة فصيحة، درامية، بلا حشو، مشوقة).
  2. visualPrompt: وصف بصري سينمائي احترافي جداً باللغة الإنجليزية لتوليد صورة 1080x1920 (مثال: ultra photorealistic 8k IMAX ARRI lighting...).
  3. keywords: كلمات مفتاحية للتأكيد البصري.
- بالإضافة إلى:
  - title: عنوان يوتيوب جذاب مع هاشتاج #Shorts
  - description: وصف يوتيوب غني بالكلمات الدلالية والهاشتاجات
  - tags: مصفوفة من الهاشتاجات والكلمات المفتاحية.`
      : `You are a professional YouTube Shorts cinematic documentary director and writer (DocuShorts Pro).
Your job is to write a cohesive 55-59 second documentary shorts script broken into ${sceneCount} continuous scenes.
- Scene 1 must have an irresistible curiosity hook stopping viewers from scrolling.
- Each scene must have:
  1. narration: Voiceover text to be spoken dramatically.
  2. visualPrompt: Highly detailed 8k IMAX cinematic visual prompt in English for 1080x1920 generation.
  3. keywords: Key visual highlight words.
- Also provide title (with #Shorts), description with hashtags, and tags array.`;

    const prompt = `Topic: "${topic}"\nReturn strict JSON matching the structure:\n{
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "string",
      "visualPrompt": "string",
      "keywords": ["string"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const script = JSON.parse(text);
    res.json({ success: true, script });
  } catch (err: any) {
    console.error("Gemini generate-script error:", err);
    res.status(500).json({ error: err.message || "Failed to generate script" });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocuShorts AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
