import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Sparkles,
  Youtube,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Settings,
  Layers,
  Shield,
  Loader2,
  Tv,
  Music,
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  Check,
  Zap
} from 'lucide-react';
import { Language, PublishedVideoRecord, ScheduleConfig, YouTubeChannelInfo } from '../types';
import { translations } from '../constants/translations';
import { schedulerService, DEFAULT_DOCUMENTARY_TOPICS_AR, DEFAULT_DOCUMENTARY_TOPICS_EN } from '../services/schedulerService';
import { youtubeUploadService } from '../services/youtubeUploadService';
import { imageEnginesService, ImageEngineConfig } from '../services/imageEnginesService';
import { soundtrackService, SOUNDTRACK_PRESETS, SoundtrackMood } from '../services/soundtrackService';
import { geminiClientService } from '../services/geminiClientService';
import { soundFxService } from '../services/soundFxService';

interface SchedulerDashboardProps {
  lang: Language;
  onOpenSettings: () => void;
  onSwitchToManual?: () => void;
}

const PEAK_HOURS_PRESETS = [
  { time: '13:00', labelAr: '1:00 ظهراً (Peak 1)', labelEn: '1:00 PM (Peak 1)' },
  { time: '18:00', labelAr: '6:00 مساءً (Peak 2)', labelEn: '6:00 PM (Peak 2)' },
  { time: '21:00', labelAr: '9:00 ليلاً (Peak 3)', labelEn: '9:00 PM (Peak 3)' },
];

const CATEGORY_CHIPS_AR = ['🚀 أسرار الفضاء والكون', '🏺 الأهرامات والحضارات المفقودة', '🌊 أعماق المحيطات', '🤖 الذكاء الاصطناعي والمستقبل', '🧠 ألغاز العقل البشري'];
const CATEGORY_CHIPS_EN = ['🚀 Deep Space & Universe', '🏺 Ancient Civilizations', '🌊 Abyssal Oceans', '🤖 AI & Future Tech', '🧠 Psychology & Mind'];

export const SchedulerDashboard: React.FC<SchedulerDashboardProps> = ({
  lang,
  onOpenSettings,
  onSwitchToManual,
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [config, setConfig] = useState<ScheduleConfig>(schedulerService.getConfig());
  const [imageConfig, setImageConfig] = useState<ImageEngineConfig>(imageEnginesService.getConfig());
  const [soundtrackConfig, setSoundtrackConfig] = useState(soundtrackService.getConfig());
  const [history, setHistory] = useState<PublishedVideoRecord[]>(schedulerService.getHistory());
  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(null);
  const [countdown, setCountdown] = useState(schedulerService.getNextRunCountdown(lang));
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [isPlayingMusicPreview, setIsPlayingMusicPreview] = useState(false);

  const [channelNicheInput, setChannelNicheInput] = useState(config.channelNiche || '');
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [generatedTopicsList, setGeneratedTopicsList] = useState<string[]>([]);
  const [saveNicheSuccess, setSaveNicheSuccess] = useState(false);

  // Sync state & live intervals
  useEffect(() => {
    const updateAll = () => {
      setConfig(schedulerService.getConfig());
      setImageConfig(imageEnginesService.getConfig());
      setSoundtrackConfig(soundtrackService.getConfig());
      setHistory(schedulerService.getHistory());
      setCountdown(schedulerService.getNextRunCountdown(lang));
      if (youtubeUploadService.isAuthenticated()) {
        youtubeUploadService.fetchChannelInfo().then(setChannel).catch(() => setChannel(null));
      } else {
        setChannel(null);
      }
    };

    updateAll();
    const unsub = schedulerService.subscribe(updateAll);
    const interval = setInterval(() => {
      setCountdown(schedulerService.getNextRunCountdown(lang));
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
      soundtrackService.stop();
    };
  }, [lang]);

  // Master Toggle for 24/7 Autopilot
  const handleToggleAutopilot = () => {
    const nextState = !config.enabled;
    const updated = { ...config, enabled: nextState };
    setConfig(updated);
    schedulerService.saveConfig(updated);
  };

  // Quick Daily Count
  const handleSetDailyCount = (count: number) => {
    const updated = { ...config, dailyVideoCount: count };
    setConfig(updated);
    schedulerService.saveConfig(updated);
  };

  // Quick Scheduled Time
  const handleSetScheduledTime = (time: string) => {
    const updated = { ...config, scheduledTime: time };
    setConfig(updated);
    schedulerService.saveConfig(updated);
  };

  // Quick Privacy
  const handleSetPrivacy = (privacy: 'public' | 'unlisted' | 'private') => {
    const updated = { ...config, privacy };
    setConfig(updated);
    schedulerService.saveConfig(updated);
  };

  // Image Engine Toggle
  const handleSetImageEngine = (engine: any) => {
    const updated = { ...imageConfig, activeEngine: engine };
    setImageConfig(updated);
    imageEnginesService.saveConfig(updated);
  };

  const handleToggleFailover = () => {
    const updated = { ...imageConfig, autoFallbackEnabled: !imageConfig.autoFallbackEnabled };
    setImageConfig(updated);
    imageEnginesService.saveConfig(updated);
  };

  // Soundtrack Mood Toggle
  const handleSetSoundtrackMood = (mood: SoundtrackMood) => {
    const updated = { ...soundtrackConfig, mood };
    setSoundtrackConfig(updated);
    soundtrackService.saveConfig(updated);
    if (isPlayingMusicPreview) {
      soundtrackService.play(mood);
    }
  };

  const handleToggleMusicPreview = () => {
    if (isPlayingMusicPreview) {
      soundtrackService.stop();
      setIsPlayingMusicPreview(false);
    } else {
      soundtrackService.play(soundtrackConfig.mood);
      setIsPlayingMusicPreview(true);
    }
  };

  const handleSaveNiche = () => {
    const updated = { ...config, channelNiche: channelNicheInput.trim() };
    setConfig(updated);
    schedulerService.saveConfig(updated);
    setSaveNicheSuccess(true);
    setTimeout(() => setSaveNicheSuccess(false), 2000);
  };

  const handleGenerateNicheTopics = async () => {
    if (isGeneratingTopics) return;
    setIsGeneratingTopics(true);
    try {
      const suggestions = await geminiClientService.suggestTopics(
        channelNicheInput.trim() || (isAr ? 'أسرار التاريخ والكون' : 'History and Universe'),
        lang,
        5
      );
      setGeneratedTopicsList(suggestions);
      
      // Also automatically append to customTopicsText if empty or user wants
      if (suggestions.length > 0) {
        const existing = config.customTopicsText ? config.customTopicsText.split('\n').filter(Boolean) : [];
        const merged = Array.from(new Set([...suggestions, ...existing]));
        const updated = { ...config, channelNiche: channelNicheInput.trim(), customTopicsText: merged.join('\n') };
        setConfig(updated);
        schedulerService.saveConfig(updated);
      }
    } catch (e) {
      console.warn('Failed to generate niche topics via AI:', e);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handlePickRandomTopicNow = async () => {
    try {
      const pool = config.customTopicsText
        ? config.customTopicsText.split('\n').map(s => s.trim()).filter(Boolean)
        : (isAr ? DEFAULT_DOCUMENTARY_TOPICS_AR : DEFAULT_DOCUMENTARY_TOPICS_EN);
      
      let chosen = pool[Math.floor(Math.random() * pool.length)];

      if (channelNicheInput.trim()) {
        const aiSuggestions = await geminiClientService.suggestTopics(channelNicheInput.trim(), lang, 3);
        if (aiSuggestions.length > 0) {
          chosen = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
        }
      }

      alert((isAr ? '🎲 الموضوع المختار عشوائياً للإنتاج القادم:\n\n' : '🎲 Randomly Selected Topic:\n\n') + `"${chosen}"`);
    } catch (e) {
      console.warn(e);
    }
  };

  // Execute Instant Batch
  const handleRunBatchNow = async () => {
    if (isRunningTest) return;

    if (!youtubeUploadService.isAuthenticated()) {
      alert(
        isAr
          ? 'يرجى ربط قناة يوتيوب أولاً بالنقر على زر "ربط قناة يوتيوب" لتمكين النشر التلقائي.'
          : 'Please connect your YouTube channel first by clicking "Connect YouTube Channel".'
      );
      onOpenSettings();
      return;
    }

    setIsRunningTest(true);
    setTestProgress({
      current: 0,
      total: config.dailyVideoCount || 1,
      message: isAr ? 'بدء إنتاج ونشر شورتس الآن...' : 'Starting generation & upload...'
    });

    try {
      await schedulerService.runBatchGenerationAndUpload(config, (curr, tot, msg) => {
        setTestProgress({ current: curr, total: tot, message: msg });
      });
      setHistory(schedulerService.getHistory());
    } catch (err: any) {
      alert((isAr ? 'حدث خطأ أثناء الإنتاج: ' : 'Error during production: ') + (err?.message || err));
    } finally {
      setIsRunningTest(false);
      setTestProgress(null);
    }
  };

  const handleClearHistory = () => {
    if (confirm(isAr ? 'هل تريد مسح سجل الفيديوهات المنشورة؟' : 'Clear published history?')) {
      schedulerService.clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO AUTOPILOT CONTROL CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/50 via-slate-900/90 to-purple-950/50 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Glow effect */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.autopilotHeroTitle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {isAr ? 'الإنتاج والنشر التلقائي الذكي على يوتيوب 24/7' : '24/7 Autonomous YouTube Shorts Creator & Publisher'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.autopilotHeroDesc}
            </p>
          </div>

          {/* Autopilot Master Switch */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <button
              onClick={handleToggleAutopilot}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-3 transition-all shadow-xl active:scale-95 ${
                config.enabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-950/60 border border-emerald-400/40 ring-4 ring-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
              <span>{config.enabled ? t.autopilotActiveBadge : t.autopilotPausedBadge}</span>
            </button>

            {/* Next publish countdown */}
            <div className="flex items-center gap-2 text-xs font-mono text-rose-300 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>{countdown.text}</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10 border-t border-white/10">
          {/* Channel Card */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.ytConnectedAs}</span>
            {channel ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 truncate">
                <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                <span className="truncate">{channel.title}</span>
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isAr ? 'ربط القناة الآن' : 'Connect Channel'}</span>
              </button>
            )}
          </div>

          {/* Daily Schedule */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.scheduledTimeLabel}</span>
            <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{config.scheduledTime} ({config.dailyVideoCount} {isAr ? 'فيديوهات' : 'videos'})</span>
            </div>
          </div>

          {/* AI Image Engine */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.imageEngineLabel}</span>
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="capitalize">{imageConfig.activeEngine.replace('-', ' ')}</span>
            </div>
          </div>

          {/* Total Published */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">{isAr ? 'إجمالي المنشور' : 'Total Published'}</span>
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{history.filter(h => h.status === 'success').length} {isAr ? 'شورتس' : 'Shorts'}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunBatchNow}
              disabled={isRunningTest}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-red-950/80 flex items-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {isRunningTest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.runningBatchMsg}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.produceOneNowBtn}</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              <span>{isAr ? 'إعدادات متقدمة' : 'Advanced Settings'}</span>
            </button>
          </div>

          {onSwitchToManual && (
            <button
              onClick={onSwitchToManual}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <span>{isAr ? 'الانتقال إلى الاستوديو اليدوي المخصص 🎬' : 'Switch to Custom Studio 🎬'}</span>
            </button>
          )}
        </div>

        {/* Live Running Progress Bar */}
        {testProgress && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2 animate-fadeIn relative z-10">
            <div className="flex items-center justify-between text-xs font-bold text-rose-200">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                {testProgress.message}
              </span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                {testProgress.current} / {testProgress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-300"
                style={{ width: `${Math.max(8, (testProgress.current / testProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* QUICK INTERACTIVE CONFIGURATION PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Daily Schedule & Peak Times */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <div className="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-200">{t.quickDailyPlan}</h4>
              <p className="text-[10px] text-slate-400">{t.peakTimesHint}</p>
            </div>
          </div>

          {/* Daily Count Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">{t.dailyVideosCountLabel}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => handleSetDailyCount(cnt)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    config.dailyVideoCount === cnt
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-950/50'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {cnt} {isAr ? 'فيديو' : 'vids'}
                </button>
              ))}
            </div>
          </div>

          {/* Peak Hours Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">{t.scheduledTimeLabel}</label>
            <div className="space-y-1.5">
              {PEAK_HOURS_PRESETS.map((p) => (
                <button
                  key={p.time}
                  onClick={() => handleSetScheduledTime(p.time)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                    config.scheduledTime === p.time
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="font-mono font-bold">{p.time}</span>
                  <span className="text-[11px]">{isAr ? p.labelAr : p.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Status */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-300 block">{t.ytPrivacyLabel}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['public', 'unlisted', 'private'] as const).map((prv) => (
                <button
                  key={prv}
                  onClick={() => handleSetPrivacy(prv)}
                  className={`py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all border ${
                    config.privacy === prv
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {prv}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Visual AI Engine & Soundtrack Mood */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-200">{t.imageEngineSectionTitle}</h4>
              <p className="text-[10px] text-slate-400">{t.imageEngineSectionDesc}</p>
            </div>
          </div>

          {/* Image Engine Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">{t.imageEngineLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSetImageEngine('pollinations-turbo')}
                className={`p-2.5 rounded-xl text-start text-xs font-bold transition-all border ${
                  imageConfig.activeEngine === 'pollinations-turbo'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="block font-bold">⚡ Pollinations</span>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'فائق السرعة (Turbo)' : 'Ultra Fast (Turbo)'}</span>
              </button>

              <button
                onClick={() => handleSetImageEngine('flux-schnell')}
                className={`p-2.5 rounded-xl text-start text-xs font-bold transition-all border ${
                  imageConfig.activeEngine === 'flux-schnell'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="block font-bold">🎨 FLUX Schnell</span>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'واقعية سينمائية 8K' : '8K Cinematic Realism'}</span>
              </button>
            </div>
          </div>

          {/* Failover Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10">
            <div>
              <span className="text-[11px] font-bold text-slate-200 block">{t.imageEngineFallbackLabel}</span>
              <span className="text-[10px] text-slate-400 block">{isAr ? 'تبديل تلقائي عند الضغط' : 'Auto failover on latency'}</span>
            </div>
            <button
              onClick={handleToggleFailover}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                imageConfig.autoFallbackEnabled ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  imageConfig.autoFallbackEnabled ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Soundtrack Mood Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 block">{t.soundtrackMoodLabel}</label>
              <button
                onClick={handleToggleMusicPreview}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
              >
                {isPlayingMusicPreview ? (
                  <>
                    <VolumeX className="w-3 h-3" />
                    <span>{isAr ? 'إيقاف التجربة' : 'Stop Demo'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    <span>{isAr ? 'استماع لعينة' : 'Preview Demo'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {SOUNDTRACK_PRESETS.map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => handleSetSoundtrackMood(snd.id)}
                  className={`p-2 rounded-xl text-start text-[11px] font-bold transition-all border truncate ${
                    soundtrackConfig.mood === snd.id
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate block">{isAr ? snd.titleAr : snd.titleEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Topics Bank & Channel Niche */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-xl md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-200">{t.channelNicheTitle}</h4>
                <p className="text-[10px] text-slate-400">{t.autoSeoActive}</p>
              </div>
            </div>
          </div>

          {/* Custom Niche Input & Controls */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              {isAr ? 'تخصص قناتك ومجال المحتوى:' : 'Your Channel Niche & Topic:'}
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={channelNicheInput}
                onChange={(e) => setChannelNicheInput(e.target.value)}
                placeholder={t.channelNichePlaceholder}
                className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveNiche}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveNicheSuccess ? t.savedNotification : t.saveNicheBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateNicheTopics}
                  disabled={isGeneratingTopics}
                  className="py-1.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {isGeneratingTopics ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>{isAr ? 'توليد أفكار بالذكاء الاصطناعي' : 'Generate Ideas'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Random Topic Picker Button */}
          <button
            type="button"
            onClick={handlePickRandomTopicNow}
            className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <span>{t.generateRandomTopicBtn}</span>
          </button>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-300 block">{isAr ? 'المجالات النشطة في التدوير التلقائي:' : 'Active Topic Domains:'}</span>
            <div className="flex flex-wrap gap-1.5">
              {(isAr ? CATEGORY_CHIPS_AR : CATEGORY_CHIPS_EN).map((chip, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{chip}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.customizeTopics}</span>
          </button>
        </div>
      </div>

      {/* PUBLISHED ARCHIVE WITH DIRECT YOUTUBE LINKS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              {t.historyTitle} ({history.length})
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1.5 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory}</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2 text-slate-400">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-300">{t.noHistoryYet}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex gap-3.5 items-start hover:border-white/20 transition-all backdrop-blur-md"
              >
                {/* Thumbnail */}
                <div className="w-16 sm:w-20 aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-white/10 relative shadow-md">
                  {record.thumbnailUrl ? (
                    <img
                      src={record.thumbnailUrl}
                      alt={record.title}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-500 bg-rose-950/20">
                      <Youtube className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-black/80 font-mono text-white">
                    9:16
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                      <span className="font-mono">
                        {new Date(record.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          record.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {record.status === 'success' ? 'Published' : 'Failed'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-100 line-clamp-2 leading-relaxed">
                      {record.title}
                    </h4>
                  </div>

                  {/* Actions */}
                  {record.youtubeUrl && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
                      <a
                        href={record.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span>{t.viewOnYoutube}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {record.youtubeId && (
                        <a
                          href={`https://youtube.com/shorts/${record.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>{t.viewOnShorts}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {record.errorMessage && (
                    <p className="text-[10px] text-rose-400 leading-tight">
                      {record.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
