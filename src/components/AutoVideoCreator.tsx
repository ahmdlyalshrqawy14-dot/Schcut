import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Video,
  Download,
  Loader2,
  Globe,
  Compass,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Flame,
  Clock,
  Layers,
  Bot,
  Sliders,
  Play,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { Language, ShortsScript, GenerationProgress } from '../types';
import { translations } from '../constants/translations';
import { TOPIC_PRESETS } from '../constants/topics';
import { CanvasPlayer } from './CanvasPlayer';
import { generateDocumentaryScript, preloadImagesInBatches } from '../services/pollinationsService';
import { speechService } from '../services/speechService';
import { azureSpeechService } from '../services/azureSpeechService';
import { soundFxService } from '../services/soundFxService';
import { geminiClientService } from '../services/geminiClientService';

interface AutoVideoCreatorProps {
  lang: Language;
  onOpenSettings: () => void;
  onSwitchToManual: (script?: ShortsScript) => void;
  ambientMusicEnabled: boolean;
  onToggleAmbientMusic: () => void;
}

interface NicheItem {
  id: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  promptAr: string;
  promptEn: string;
}

const NICHES: NicheItem[] = [
  {
    id: 'space',
    icon: '🌌',
    titleAr: 'أسرار الفضاء والكون',
    titleEn: 'Cosmic & Space Secrets',
    descAr: 'ثقوب سوداء، كواكب غريبة، وأسرار المجرة',
    descEn: 'Black holes, alien worlds & cosmic anomalies',
    promptAr: 'أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت في الفضاء السحيق',
    promptEn: 'Mind-Blowing Secrets of Supermassive Black Holes & Cosmic Time Warping',
  },
  {
    id: 'history',
    icon: '🏛️',
    titleAr: 'حضارات وألغاز قديمة',
    titleEn: 'Ancient Mysteries & Civilizations',
    descAr: 'الفراعنة، أطلانتس، واكتشافات أثرية محيرة',
    descEn: 'Pyramids, lost empires & archeological puzzles',
    promptAr: 'أسرار بناء الأهرامات الهندسية المدهشة التي حيرت العلماء لآلاف السنين',
    promptEn: 'Astonishing Engineering Secrets of Ancient Pyramids Scientists Cannot Explain',
  },
  {
    id: 'ocean',
    icon: '🌊',
    titleAr: 'أعماق المحيطات والأسرار',
    titleEn: 'Deep Ocean & Abyss',
    descAr: 'كائنات غريبة، خندق ماريانا، وظلام الأعماق',
    descEn: 'Mariana trench, glowing creatures & deep abyss',
    promptAr: 'كائنات مرعبة ومجهولة تعيش في أعمق نقطة بمحيطات كوكب الأرض',
    promptEn: 'Terrifying Unknown Creatures Lurking in the Deepest Trench on Earth',
  },
  {
    id: 'psychology',
    icon: '🧠',
    titleAr: 'أسرار العقل وعلم النفس',
    titleEn: 'Psychology & Mind Power',
    descAr: 'حيل نفسية، لغة الجسد، وقدرات العقل الباطن',
    descEn: 'Subconscious mind, body language & mental facts',
    promptAr: 'حقائق نفسية مدهشة عن كيفية قراءة أفكار ولغة جسد الآخرين فوراً',
    promptEn: 'Fascinating Psychological Tricks to Read Body Language and Human Behavior',
  },
  {
    id: 'nature',
    icon: '🌋',
    titleAr: 'ظواهر طبيعية خارقة',
    titleEn: 'Extreme Nature & Anomalies',
    descAr: 'براكين نادرة، عواصف غامضة، وأماكن غريبة',
    descEn: 'Rare volcanoes, plasma storms & bizarre places',
    promptAr: 'أغرب 5 ظواهر طبيعية حقيقية تحدث على الأرض وتبدو خيالية',
    promptEn: 'Shocking Real Natural Phenomena on Earth That Look Like Science Fiction',
  },
  {
    id: 'random',
    icon: '🎲',
    titleAr: 'فكرة عشوائية فيروسية بالكامل',
    titleEn: '100% Random Viral Mystery',
    descAr: 'دع الذكاء الاصطناعي يبتكر موضوعاً فيروسياً مشوقاً',
    descEn: 'Let AI generate a high-retention viral concept',
    promptAr: '',
    promptEn: '',
  },
];

export const AutoVideoCreator: React.FC<AutoVideoCreatorProps> = ({
  lang,
  onOpenSettings,
  onSwitchToManual,
  ambientMusicEnabled,
  onToggleAmbientMusic,
}) => {
  const isAr = lang === 'ar';
  const t = translations[lang];

  const [selectedNiche, setSelectedNiche] = useState<string>('space');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [videoLang, setVideoLang] = useState<Language>(lang);
  const [sceneCount, setSceneCount] = useState<number>(6);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [script, setScript] = useState<ShortsScript | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Select Niche
  const handleSelectNiche = (niche: NicheItem) => {
    setSelectedNiche(niche.id);
    if (niche.id === 'random') {
      const randomPreset = TOPIC_PRESETS[Math.floor(Math.random() * TOPIC_PRESETS.length)];
      setCustomTopic(videoLang === 'ar' ? randomPreset.topicAr : randomPreset.topicEn);
    } else {
      setCustomTopic(videoLang === 'ar' ? niche.promptAr : niche.promptEn);
    }
  };

  // 1-Click Complete Video Generation
  const handleAutoCreateVideo = async () => {
    let finalTopic = customTopic.trim();
    if (!finalTopic) {
      if (selectedNiche === 'random') {
        const randomPreset = TOPIC_PRESETS[Math.floor(Math.random() * TOPIC_PRESETS.length)];
        finalTopic = videoLang === 'ar' ? randomPreset.topicAr : randomPreset.topicEn;
      } else {
        const found = NICHES.find((n) => n.id === selectedNiche);
        finalTopic = found
          ? videoLang === 'ar'
            ? found.promptAr
            : found.promptEn
          : (videoLang === 'ar' ? 'أسرار الكون الغامضة' : 'Cosmic Mysteries');
      }
    }

    setIsGenerating(true);
    setCurrentStep(1); // Script stage
    setScript(null);

    try {
      soundFxService.playSceneTransition();

      // Step 1: AI Script Generation
      const generatedScript = await generateDocumentaryScript(
        finalTopic,
        videoLang,
        sceneCount
      );

      setCurrentStep(2); // Images stage

      // Step 2: Parallel Batch AI Image Preloading
      const scenesWithImages = [...generatedScript.scenes];
      await preloadImagesInBatches(scenesWithImages, 4);

      setCurrentStep(3); // Continuous Narration & Audio
      let totalAudioDuration = 58;
      let continuousAudioObj = undefined;

      if (azureSpeechService.isConfigured() && generatedScript.fullScriptText) {
        try {
          const synth = await azureSpeechService.synthesize(generatedScript.fullScriptText, {
            lang: videoLang,
          });
          continuousAudioObj = {
            audioBuffer: synth.audioBuffer,
            audioBlob: synth.audioBlob,
            durationSeconds: synth.durationSeconds,
          };
          totalAudioDuration = Math.min(60, Math.max(35, synth.durationSeconds));
        } catch (e) {
          totalAudioDuration = speechService.estimateDuration(generatedScript.fullScriptText, 1.0);
        }
      } else {
        totalAudioDuration = 58;
      }

      // Step 4: Synchronize scene timestamps
      const durPerScene = totalAudioDuration / scenesWithImages.length;
      scenesWithImages.forEach((scene, idx) => {
        scene.durationSeconds = durPerScene;
        scene.startTimeSeconds = idx * durPerScene;
        scene.endTimeSeconds = (idx + 1) * durPerScene;
      });

      generatedScript.scenes = scenesWithImages;
      generatedScript.continuousAudio = continuousAudioObj;

      setCurrentStep(4); // Video ready!
      soundFxService.playSuccess();
      setScript(generatedScript);
      setIsGenerating(false);
    } catch (err) {
      console.error('Auto creation failed:', err);
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/60 via-rose-950/40 to-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{t.autoModeBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {t.autoCreatorHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {t.autoModeNotice}
          </p>
        </div>
      </div>

      {/* 2. Main Auto Creation Control Box */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        
        {/* Niche Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-200">
              <Flame className="w-4 h-4 text-rose-400" />
              {t.autoSelectNiche}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              100% Free AI • No Watermarks • HD 1080x1920
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {NICHES.map((niche) => {
              const isSelected = selectedNiche === niche.id;
              return (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => handleSelectNiche(niche)}
                  disabled={isGenerating}
                  className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-b from-rose-600/30 to-red-950/40 border-rose-500/70 shadow-lg shadow-rose-950/50 scale-[1.02]'
                      : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="text-2xl">{niche.icon}</div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 leading-tight">
                      {isAr ? niche.titleAr : niche.titleEn}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {isAr ? niche.descAr : niche.descEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input or Auto Prompt Bar */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>{t.topicLabel} ({isAr ? 'يمكنك كتابة فكرتك أو تعديل الموضوع المقترح' : 'Custom topic or edit suggestion'}):</span>
            <span className="text-slate-400 font-mono text-[10px]">~58s Shorts</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={isAr ? 'اكتب موضوعاً وثائقياً أو اتركه لتوليد فكرة فيروسية تلقائياً...' : 'Enter a topic or leave blank for auto viral theme...'}
              disabled={isGenerating}
              className="flex-1 px-4 py-3.5 bg-black/40 rounded-2xl border border-white/10 text-sm text-slate-100 focus:border-rose-500 focus:outline-none placeholder-slate-500"
            />
            
            {/* Launch Auto Creation Button */}
            <button
              type="button"
              onClick={handleAutoCreateVideo}
              disabled={isGenerating}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white font-black text-sm sm:text-base shadow-xl shadow-red-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.autoCreatingVideo}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white text-white animate-pulse" />
                  <span>{t.autoLaunchBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional Quick Settings (Language & Scenes) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">{t.videoLanguageLabel}</span>
            <div className="inline-flex rounded-xl bg-black/30 border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setVideoLang('ar')}
                disabled={isGenerating}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  videoLang === 'ar' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇸🇦 العربية
              </button>
              <button
                type="button"
                onClick={() => setVideoLang('en')}
                disabled={isGenerating}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  videoLang === 'en' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">{t.sceneCountLabel}</span>
            <div className="inline-flex items-center gap-2 bg-black/30 border border-white/10 px-3 py-1 rounded-xl">
              {[5, 6, 7, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSceneCount(count)}
                  disabled={isGenerating}
                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                    sceneCount === count ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAmbientMusic}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all ${
              ambientMusicEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{ambientMusicEnabled ? 'الموسيقى التصويرية: مفعلة 🟢' : 'الموسيقى التصويرية: متوقفة'}</span>
          </button>
        </div>
      </div>

      {/* 3. Live Generation Progress Visualizer */}
      {isGenerating && (
        <div className="p-6 rounded-3xl bg-black/60 border border-rose-500/30 space-y-5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
              <div>
                <h3 className="font-black text-base text-white">{t.autoCreatingVideo}</h3>
                <p className="text-xs text-slate-400">100% Free AI Documentary Production Engine</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              {currentStep === 1 && '25%'}
              {currentStep === 2 && '55%'}
              {currentStep === 3 && '85%'}
              {currentStep === 4 && '100%'}
            </span>
          </div>

          {/* Stepper Display */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3 rounded-2xl border transition-all ${
              currentStep >= 1 ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
              <div className="font-bold">{t.autoStep1}</div>
              <p className="text-[10px] text-slate-400 mt-1">تأليف سيناريو 58s مشوق</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${
              currentStep >= 2 ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
              <div className="font-bold">{t.autoStep2}</div>
              <p className="text-[10px] text-slate-400 mt-1">توليد صور 8K سينمائية</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${
              currentStep >= 3 ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
              <div className="font-bold">{t.autoStep3}</div>
              <p className="text-[10px] text-slate-400 mt-1">سرد متصل بدون صمت</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${
              currentStep >= 4 ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
              <div className="font-bold">{t.autoStep4}</div>
              <p className="text-[10px] text-slate-400 mt-1">Ken Burns + ترجمة متحركة</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Generated Real AI Video Player & Export */}
      {script && !isGenerating && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-950/30 to-black/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">{t.autoVideoReadyTitle}</h3>
                <p className="text-xs text-slate-300">
                  {script.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSwitchToManual(script)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>تعديل وتخصيص في الاستوديو</span>
              </button>
              <button
                type="button"
                onClick={handleAutoCreateVideo}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.autoCreateAnotherBtn}</span>
              </button>
            </div>
          </div>

          {/* 2-Column Display: Player on Left, Metadata & Download on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: 9:16 Full HD Canvas Player */}
            <div className="lg:col-span-5 sticky top-20">
              <CanvasPlayer
                script={script}
                uiLang={lang}
                ambientMusicEnabled={ambientMusicEnabled}
              />
            </div>

            {/* Right: Quick Actions, Direct Download, Script, and SEO Metadata */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Ready SEO Metadata Box */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>بيانات يوتيوب شورتس الجاهزة (YouTube Shorts SEO)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-bold">جاهز للنشر 🚀</span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">{t.viralTitle}:</label>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-100 flex-1">{script.title}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(script.title, 'title')}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs transition-colors shrink-0"
                    >
                      {copiedField === 'title' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">{t.seoDescription}:</label>
                  <div className="flex items-start gap-2 bg-black/40 border border-white/10 rounded-2xl p-3">
                    <p className="text-xs text-slate-300 whitespace-pre-line flex-1 leading-relaxed">{script.description}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(script.description, 'desc')}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs transition-colors shrink-0"
                    >
                      {copiedField === 'desc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400">{t.tagsList}:</label>
                    <button
                      type="button"
                      onClick={() => handleCopy(script.tags.join(', '), 'tags')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      {copiedField === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'tags' ? t.copied : t.copy}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {script.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-medium font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scene Breakdown Display */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-400" />
                  <span>المشاهد المصممة بالذكاء الاصطناعي ({script.scenes.length} مشاهد بدقة 9:16)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {script.scenes.map((scene, idx) => (
                    <div
                      key={scene.id}
                      className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col group"
                    >
                      <div className="aspect-[9/16] relative overflow-hidden bg-slate-900">
                        <img
                          src={scene.imageUrl}
                          alt={`Scene ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white font-mono">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="p-2.5 text-[11px] text-slate-300 line-clamp-2 leading-tight">
                        {scene.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
