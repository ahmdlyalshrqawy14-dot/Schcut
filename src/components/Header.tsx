import React from 'react';
import { Globe, Video, FileCode, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../constants/translations';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenExportModal: () => void;
  ambientMusicEnabled: boolean;
  onToggleAmbientMusic: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onOpenExportModal,
  ambientMusicEnabled,
  onToggleAmbientMusic,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/30 text-white font-black">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                Pollinations AI
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Ambient Music Toggle */}
          <button
            onClick={onToggleAmbientMusic}
            title={t.ambientMusic}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md ${
              ambientMusicEnabled
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/40'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {ambientMusicEnabled ? (
              <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden md:inline text-xs">{t.ambientMusic}</span>
          </button>

          {/* Export Standalone index.html for GitHub Pages */}
          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileCode className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">{t.exportHtmlBtn}</span>
            <span className="sm:hidden">index.html</span>
          </button>

          {/* Language Switch Pill */}
          <div className="flex p-0.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full">
            <button
              onClick={onToggleLang}
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.langToggle}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
