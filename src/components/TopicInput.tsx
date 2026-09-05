import React from 'react';
import { Sparkles, Video, Loader2, Compass, Globe, Sliders, FileText, Clock } from 'lucide-react';
import { Language, GenerationProgress } from '../types';
import { translations } from '../constants/translations';
import { TOPIC_PRESETS } from '../constants/topics';

interface TopicInputProps {
  topic: string;
  onChangeTopic: (val: string) => void;
  onRandomTopic: () => void;
  onGenerate: () => void;
  uiLang: Language;
  videoLang: Language;
  onChangeVideoLang: (val: Language) => void;
  sceneCount: number;
  onChangeSceneCount: (val: number) => void;
  fileName: string;
  onChangeFileName: (val: string) => void;
  progress: GenerationProgress;
  isGenerating: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  onChangeTopic,
  onRandomTopic,
  onGenerate,
  uiLang,
  videoLang,
  onChangeVideoLang,
  sceneCount,
  onChangeSceneCount,
  fileName,
  onChangeFileName,
  progress,
  isGenerating,
}) => {
  const t = translations[uiLang];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* 1. Topic Input Area */}
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-300">
            <Compass className="w-4 h-4 text-rose-400" />
            {t.topicLabel}
          </span>
          <span className="text-[11px] text-slate-400 font-mono font-medium lowercase tracking-normal flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            {t.estimatedDuration} ~58s ({sceneCount} {t.scenesCountSuffix})
          </span>
        </label>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => onChangeTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  onGenerate();
                }
              }}
              placeholder={t.topicPlaceholder}
              disabled={isGenerating}
              className="w-full bg-black/40 border border-white/10 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Random Idea Button */}
            <button
              onClick={onRandomTopic}
              disabled={isGenerating}
              type="button"
              className="px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-95 text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>{t.randomIdeaBtn}</span>
            </button>

            {/* Main Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              type="button"
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xl shadow-red-900/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>{t.generateBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Control Row: Video Language, Scene Count Slider (4-12), and Output Filename */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 border-t border-white/10">
        {/* A. Video Language Selector */}
        <div className="space-y-1.5 bg-black/30 p-3.5 rounded-2xl border border-white/5">
          <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            {t.videoLanguageLabel}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onChangeVideoLang('ar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                videoLang === 'ar'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 border-rose-400/50 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <span>🇸🇦</span>
              <span>{t.arabic}</span>
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onChangeVideoLang('en')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                videoLang === 'en'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 border-rose-400/50 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <span>🇬🇧</span>
              <span>{t.english}</span>
            </button>
          </div>
        </div>

        {/* B. Image Count Slider (4 to 12) */}
        <div className="space-y-1.5 bg-black/30 p-3.5 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              {t.imagesCountLabel}
            </span>
            <span className="text-rose-400 font-mono text-xs bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
              {sceneCount} {t.scenesCountSuffix}
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min={4}
              max={12}
              step={1}
              value={sceneCount}
              disabled={isGenerating}
              onChange={(e) => onChangeSceneCount(Number(e.target.value))}
              className="flex-1 accent-rose-500 h-2 bg-black/50 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min={4}
              max={12}
              value={sceneCount}
              disabled={isGenerating}
              onChange={(e) => {
                const val = Math.max(4, Math.min(12, Number(e.target.value) || 6));
                onChangeSceneCount(val);
              }}
              className="w-14 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-center font-mono text-slate-200 outline-none focus:border-rose-500"
            />
          </div>

          <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-500/20 mt-1">
            <span>{t.shortsDurationOk}</span>
          </p>
        </div>

        {/* C. Output File Name Input */}
        <div className="space-y-1.5 bg-black/30 p-3.5 rounded-2xl border border-white/5">
          <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              {t.customFileNameLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-normal lowercase tracking-normal">
              .mp4 / .webm
            </span>
          </label>
          <input
            type="text"
            value={fileName}
            disabled={isGenerating}
            onChange={(e) => onChangeFileName(e.target.value)}
            placeholder={t.customFileNamePlaceholder}
            className="w-full bg-black/40 border border-white/10 focus:border-rose-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            💡 {t.customFileNameHint}
          </p>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 pt-1">
        <span className="whitespace-nowrap font-bold text-slate-500 text-[10px] uppercase tracking-wider">
          {t.tryPresets}
        </span>
        {TOPIC_PRESETS.slice(0, 6).map((preset) => {
          const title = videoLang === 'ar' ? preset.topicAr : preset.topicEn;
          const category = videoLang === 'ar' ? preset.categoryAr : preset.categoryEn;
          return (
            <button
              key={preset.id}
              disabled={isGenerating}
              onClick={() => onChangeTopic(title)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap text-xs flex items-center gap-1.5 shrink-0 text-slate-300"
            >
              <span className="text-rose-400 font-bold">{category}:</span>
              <span className="truncate max-w-[200px]">{title}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time Progress Bar */}
      {isGenerating && (
        <div className="space-y-2 pt-2 border-t border-white/10 animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="text-rose-400 font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              {progress.message}
            </span>
            <span className="text-slate-400 font-mono font-bold">
              {Math.round(progress.progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 rounded-full transition-all duration-300 shadow-[0_0_10px_#dc2626]"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
