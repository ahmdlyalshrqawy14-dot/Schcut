import React from 'react';
import { Film, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { Language, ShortsScript } from '../types';
import { translations } from '../constants/translations';
import { buildPollinationsImageUrl, preloadImage } from '../services/pollinationsService';

interface SceneTimelineProps {
  script: ShortsScript | null;
  lang: Language;
  activeSceneIndex: number;
  onUpdateSceneImage: (sceneIndex: number, newImageUrl: string, loadedImg: HTMLImageElement) => void;
}

export const SceneTimeline: React.FC<SceneTimelineProps> = ({
  script,
  lang,
  activeSceneIndex,
  onUpdateSceneImage,
}) => {
  const t = translations[lang];
  const [regeneratingIndex, setRegeneratingIndex] = React.useState<number | null>(null);

  const handleRegenerateImage = async (index: number) => {
    if (!script || !script.scenes[index]) return;
    setRegeneratingIndex(index);

    try {
      const scene = script.scenes[index];
      const newSeed = Math.floor(Math.random() * 1000000);
      const newUrl = buildPollinationsImageUrl(scene.imagePrompt, newSeed);
      const loadedImg = await preloadImage(newUrl);
      onUpdateSceneImage(index, newUrl, loadedImg);
    } catch (e) {
      console.error('Failed to regenerate scene image:', e);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const scenes = script?.scenes || [
    { id: 1, text: '', imagePrompt: '', imageUrl: '', durationSeconds: 7 },
    { id: 2, text: '', imagePrompt: '', imageUrl: '', durationSeconds: 7 },
    { id: 3, text: '', imagePrompt: '', imageUrl: '', durationSeconds: 7 },
    { id: 4, text: '', imagePrompt: '', imageUrl: '', durationSeconds: 7 },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300 flex items-center gap-2">
          <Film className="w-4 h-4 text-rose-400" />
          <span>{t.scenesTitle}</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          {scenes.length} {lang === 'ar' ? 'مشاهد متناسقة' : 'Scenes'} • 9:16 Vertical
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {scenes.map((scene, idx) => {
          const isActive = idx === activeSceneIndex;
          const isRegen = regeneratingIndex === idx;

          let startSec = 0;
          for (let i = 0; i < idx; i++) {
            startSec += scenes[i].durationSeconds || 6;
          }
          const dur = scene.durationSeconds || 6;
          const endSec = startSec + dur;

          return (
            <div
              key={scene.id || idx}
              className={`border rounded-2xl p-3 flex gap-3 items-start transition-all relative overflow-hidden backdrop-blur-md ${
                isActive
                  ? 'border-rose-500/80 bg-white/10 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="w-16 sm:w-20 aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-white/10 relative group/thumb shadow-md">
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${idx + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold bg-white/5">
                    {idx + 1}
                  </div>
                )}

                {/* Regenerate Single Scene Button */}
                {script && (
                  <button
                    onClick={() => handleRegenerateImage(idx)}
                    disabled={isRegen}
                    title={t.regenerateImage}
                    className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-white/20 hover:bg-rose-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity disabled:opacity-100 border border-white/30"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegen ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {/* Text & Meta info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-1.5">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-rose-400">
                      {t.scene} {idx + 1}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {Math.round(startSec)}-{Math.round(endSec)}s
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-normal">
                    {scene.text || (lang === 'ar' ? 'بانتظار إنشاء المحتوى...' : 'Waiting for generation...')}
                  </p>
                </div>

                {scene.imagePrompt && (
                  <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-white/10 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                    <span className="truncate">{scene.imagePrompt}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
