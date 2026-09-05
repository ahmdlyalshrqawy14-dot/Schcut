import React, { useState } from 'react';
import {
  Copy,
  Check,
  TrendingUp,
  Share2,
  ExternalLink,
  MessageCircle,
  Twitter,
  Send,
  Info,
  Layers,
  Sparkles,
  Youtube
} from 'lucide-react';
import { Language, ShortsScript } from '../types';
import { translations } from '../constants/translations';
import { YouTubeUploader } from './YouTubeUploader';

interface MetadataDashboardProps {
  script: ShortsScript | null;
  lang: Language;
  ambientMusicEnabled?: boolean;
}

export const MetadataDashboard: React.FC<MetadataDashboardProps> = ({ script, lang, ambientMusicEnabled = false }) => {
  const t = translations[lang];
  const [copiedField, setCopiedField] = useState<string | null>(null);


  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const title = script?.title || (lang === 'ar' ? 'أسرار الكون الغامضة 🤯 #Shorts' : 'Deep Space Mysteries 🤯 #Shorts');
  const description =
    script?.description ||
    (lang === 'ar'
      ? 'وثائقي قصير يشرح أهم الحقائق والمعلومات العلمية...\n\n#Shorts #وثائقي #علوم'
      : 'A thrilling documentary mini-story...\n\n#Shorts #Documentary #Science');
  const tagsString = script?.tags ? script.tags.join(', ') : 'Shorts, Documentary, Science, Facts, History';
  const category = script?.category || (lang === 'ar' ? 'التعليم والعلوم' : 'Science & Technology');
  const audience = script?.audience || 'Not made for kids';

  // Share handlers
  const handleShareWeb = () => {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: `${title}\n\n${description.slice(0, 150)}...`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      copyToClipboard(`${title}\n\n${description}`, 'share');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${title}\n\n#Shorts #Documentary`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n\n${description.slice(0, 180)}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`${title}\n\n${description.slice(0, 180)}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  const handleOpenYTStudio = () => {
    window.open('https://studio.youtube.com', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 🚀 YouTube Direct Video Upload Card (YouTube Data API v3 & GIS) */}
      <YouTubeUploader
        script={script}
        lang={lang}
        ambientMusicEnabled={ambientMusicEnabled}
      />

      {/* 📊 SEO Metadata & Tags Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>{t.metadataTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.metadataDesc}</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full uppercase font-bold tracking-wider backdrop-blur-md">
            Ready to Upload
          </span>
        </div>

      {/* 1. Viral Title Field */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            {t.viralTitle}
          </span>
          <button
            onClick={() => copyToClipboard(title, 'title')}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
          >
            {copiedField === 'title' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </>
            )}
          </button>
        </div>
        <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 text-sm font-bold text-slate-100 select-all shadow-inner">
          {title}
        </div>
      </div>

      {/* 2. SEO Description & Hashtags */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            {t.seoDescription}
          </span>
          <button
            onClick={() => copyToClipboard(description, 'desc')}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
          >
            {copiedField === 'desc' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </>
            )}
          </button>
        </div>
        <textarea
          rows={4}
          readOnly
          value={description}
          className="w-full p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-slate-300 select-all resize-none outline-none leading-relaxed font-sans shadow-inner"
        />
      </div>

      {/* 3. Keywords & Tags */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{t.tagsList}</span>
          <button
            onClick={() => copyToClipboard(tagsString, 'tags')}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
          >
            {copiedField === 'tags' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </>
            )}
          </button>
        </div>
        <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-slate-300 select-all leading-relaxed shadow-inner flex flex-wrap gap-2">
          {script?.tags && script.tags.length > 0 ? (
            script.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300">
                #{tag.replace(/^#/, '')}
              </span>
            ))
          ) : (
            <span className="text-slate-400">{tagsString}</span>
          )}
        </div>
      </div>

      {/* 4. Upload Guidelines Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5 backdrop-blur-md">
        <div className="font-bold text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-rose-400" />
          <span className="uppercase text-[11px] tracking-wider">{t.uploadTipsTitle}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
          <div>
            <strong className="text-slate-400 font-medium">{t.categoryLabel}</strong>{' '}
            <span className="font-semibold text-rose-300">{category}</span>
          </div>
          <div>
            <strong className="text-slate-400 font-medium">{t.audienceLabel}</strong>{' '}
            <span className="font-semibold text-rose-300">{audience}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 border-t border-white/10 pt-2">
          💡 {t.aspectRatioNotice}
        </p>
      </div>

      {/* 5. Social & Distribution Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.shareTitle}:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* YouTube Studio Button */}
          <button
            onClick={handleOpenYTStudio}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-900/30 transition-all active:scale-95"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>{t.shareYTStudio}</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={handleShareTwitter}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 backdrop-blur-md transition-colors"
            title="X / Twitter"
          >
            <Twitter className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{t.shareTwitter}</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 backdrop-blur-md transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t.shareWhatsApp}</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleShareTelegram}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 backdrop-blur-md transition-colors"
            title="Telegram"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t.shareTelegram}</span>
          </button>

          {/* Web Share */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShareWeb}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 backdrop-blur-md transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.shareWeb}</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};
