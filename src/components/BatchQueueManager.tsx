import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ListPlus,
  Youtube,
  Film,
  Zap,
  Check
} from 'lucide-react';
import { QueueItem, Language, ShortsScript, YouTubePrivacy } from '../types';
import { translations } from '../constants/translations';
import { generateDocumentaryScript } from '../services/pollinationsService';
import { azureSpeechService } from '../services/azureSpeechService';
import { speechService } from '../services/speechService';
import { videoRecorderService } from '../services/videoRecorderService';
import { youtubeUploadService } from '../services/youtubeUploadService';

interface BatchQueueManagerProps {
  lang: Language;
  onSelectScriptForPreview?: (script: ShortsScript) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  ambientMusicEnabled?: boolean;
}

export const BatchQueueManager: React.FC<BatchQueueManagerProps> = ({
  lang,
  onSelectScriptForPreview,
  canvasRef,
  ambientMusicEnabled = false,
}) => {
  const t = translations[lang];

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [stopRequested, setStopRequested] = useState<boolean>(false);

  // Single Add form
  const [newTopic, setNewTopic] = useState<string>('');
  const [newSceneCount, setNewSceneCount] = useState<number>(6);
  const [newLanguage, setNewLanguage] = useState<Language>(lang);

  // Bulk Add form
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  // Auto-Upload toggle
  const [autoUpload, setAutoUpload] = useState<boolean>(() => {
    return localStorage.getItem('docushorts_auto_upload') === 'true';
  });
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacy>('unlisted');

  const handleToggleAutoUpload = (enabled: boolean) => {
    setAutoUpload(enabled);
    localStorage.setItem('docushorts_auto_upload', enabled ? 'true' : 'false');
  };

  // Add single item to queue
  const handleAddSingle = () => {
    if (!newTopic.trim()) return;

    const newItem: QueueItem = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      topic: newTopic.trim(),
      sceneCount: newSceneCount,
      language: newLanguage,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    };

    setQueue((prev) => [...prev, newItem]);
    setNewTopic('');
  };

  // Bulk add multiple topics from multi-line text
  const handleBulkAdd = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    if (lines.length === 0) return;

    const newItems: QueueItem[] = lines.map((topic, i) => ({
      id: 'q_' + (Date.now() + i) + '_' + Math.random().toString(36).substring(2, 7),
      topic,
      sceneCount: newSceneCount,
      language: newLanguage,
      status: 'pending',
      progress: 0,
      createdAt: Date.now() + i,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setBulkText('');
    setBulkMode(false);
  };

  // Populate sample viral topics
  const handleAddSampleTopics = () => {
    const sampleTopics =
      lang === 'ar'
        ? [
            'أغرب 5 أسرار عن قاع المحيط لم يخبرك بها أحد',
            'كيف تم بناء أهرامات الجيزة بالتقنيات القديمة؟',
            'ماذا يحدث لجسمك إذا انعدمت الجاذبية تماماً؟',
            'سر اختفاء جزيرة أطلانتس الأسطورية',
          ]
        : [
            '5 Deep Ocean Secrets Scientists Cannot Explain',
            'How The Great Pyramids Were Truly Built',
            'What Happens To Your Body In Zero Gravity?',
            'The Lost Mystery Of Ancient Atlantis',
          ];

    const newItems: QueueItem[] = sampleTopics.map((topic, i) => ({
      id: 'q_sample_' + (Date.now() + i),
      topic,
      sceneCount: 6,
      language: lang,
      status: 'pending',
      progress: 0,
      createdAt: Date.now() + i,
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear completed items
  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'completed'));
  };

  // Execute Batch Queue Sequentially
  const handleRunQueue = async () => {
    if (isProcessingQueue) return;

    const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'error');
    if (pendingItems.length === 0) {
      alert(lang === 'ar' ? 'لا توجد عناصر في الطابور بانتظار التنفيذ.' : 'No pending items in queue.');
      return;
    }

    setIsProcessingQueue(true);
    setStopRequested(false);

    for (let i = 0; i < queue.length; i++) {
      const currentItem = queue[i];
      if (currentItem.status === 'completed') continue;

      if (stopRequested) {
        break;
      }

      // Update current item status to processing
      setQueue((prev) =>
        prev.map((it) =>
          it.id === currentItem.id
            ? { ...it, status: 'processing', progress: 10, statusMessage: 'توليد السيناريو...' }
            : it
        )
      );

      try {
        // Step 1: Generate Script
        const script = await generateDocumentaryScript(
          currentItem.topic,
          currentItem.language,
          currentItem.sceneCount
        );

        setQueue((prev) =>
          prev.map((it) =>
            it.id === currentItem.id
              ? {
                  ...it,
                  script,
                  progress: 30,
                  statusMessage: 'تحميل الصور وتجهيز الصوت فائق النقاء...',
                }
              : it
          )
        );

        // Step 2: Preload images & Azure/Speech narration for all scenes
        const isAzureEnabled = azureSpeechService.isConfigured();
        for (let sIdx = 0; sIdx < script.scenes.length; sIdx++) {
          const scene = script.scenes[sIdx];

          // Synthesize audio if Azure is active
          if (isAzureEnabled) {
            try {
              const synthResult = await azureSpeechService.synthesize(scene.text, {
                lang: currentItem.language,
              });
              scene.audioBuffer = synthResult.audioBuffer;
              scene.audioBlob = synthResult.audioBlob;
              scene.durationSeconds = synthResult.durationSeconds; // Exact mathematical sync!
            } catch (err) {
              console.warn('Azure synth error for scene, falling back:', err);
              scene.durationSeconds = speechService.estimateDuration(scene.text, 1.0);
            }
          } else {
            scene.durationSeconds = speechService.estimateDuration(scene.text, 1.0);
          }

          // Preload image
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              scene.loadedImage = img;
              resolve();
            };
            img.onerror = () => {
              resolve();
            };
            img.src = scene.imageUrl;
          });
        }

        // Inform user / load preview
        if (onSelectScriptForPreview) {
          onSelectScriptForPreview(script);
        }

        // Step 3: Record Canvas Video if auto-upload or canvas is available
        const canvas = canvasRef?.current || document.querySelector('canvas');
        if (canvas) {
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? { ...it, status: 'rendering', progress: 50, statusMessage: 'تصيير وتسجيل الفيديو...' }
                : it
            )
          );

          const totalDuration = script.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
          const audioTrack = speechService.getAudioStreamTrack();

          await videoRecorderService.startRecording({
            canvas,
            audioTrack,
            fps: 60,
          });

          // Wait for recording duration
          const recordedBlob = await new Promise<Blob>((resolve, reject) => {
            setTimeout(async () => {
              try {
                const res = await videoRecorderService.stopRecording();
                resolve(res.blob);
              } catch (e) {
                reject(e);
              }
            }, (totalDuration + 0.5) * 1000);
          });

          // Step 4: Auto-Upload to YouTube if enabled
          let uploadedVideoId: string | undefined = undefined;
          let uploadedVideoUrl: string | undefined = undefined;

          if (autoUpload) {
            setQueue((prev) =>
              prev.map((it) =>
                it.id === currentItem.id
                  ? { ...it, status: 'uploading', progress: 75, statusMessage: 'رفع الفيديو إلى YouTube...' }
                  : it
              )
            );

            try {
              const uploadRes = await youtubeUploadService.uploadVideo({
                blob: recordedBlob,
                title: script.title,
                description: script.description,
                tags: script.tags,
                privacyStatus,
                videoLanguage: currentItem.language,
                onProgress: (pct) => {
                  const mapped = 75 + Math.round((pct / 100) * 24);
                  setQueue((prev) =>
                    prev.map((it) =>
                      it.id === currentItem.id
                        ? { ...it, progress: mapped, statusMessage: `رفع إلى YouTube (${pct}%)...` }
                        : it
                    )
                  );
                },
              });

              uploadedVideoId = uploadRes.videoId;
              uploadedVideoUrl = uploadRes.url;
            } catch (uErr: any) {
              console.warn('Auto-upload failed for queue item:', uErr);
            }
          }

          // Complete this item
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? {
                    ...it,
                    status: 'completed',
                    progress: 100,
                    statusMessage: uploadedVideoUrl ? 'تم النشر بنجاح على YouTube!' : 'تم التوليد بنجاح!',
                    youtubeId: uploadedVideoId,
                    videoUrl: uploadedVideoUrl,
                  }
                : it
            )
          );
        } else {
          // Complete without canvas recording
          setQueue((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? {
                    ...it,
                    status: 'completed',
                    progress: 100,
                    statusMessage: 'تم توليد السيناريو والصور بنجاح!',
                  }
                : it
            )
          );
        }

        // 2-second cooldown pause before next item
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err: any) {
        console.error('Queue item processing error:', err);
        setQueue((prev) =>
          prev.map((it) =>
            it.id === currentItem.id
              ? {
                  ...it,
                  status: 'error',
                  progress: 0,
                  errorMessage: err.message || 'حدث خطأ أثناء معالجة هذا الفيديو.',
                }
              : it
          )
        );
      }
    }

    setIsProcessingQueue(false);
  };

  return (
    <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-200">
              نظام الطابور والدُفعات التلقائي (Batch Queue Automation)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              إنتاج حتى 10 فيديوهات أو أكثر دفعة واحدة بالتسلسل مع النشر التلقائي
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full uppercase font-bold tracking-wider">
          {queue.length} عناصر
        </span>
      </div>

      {/* Auto-Upload Configuration & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-black/40 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2.5">
          <Youtube className="w-4 h-4 text-red-500" />
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              النشر التلقائي فور انتهاء الإنتاج (Auto-Upload)
            </span>
            <span className="text-[10px] text-slate-400">
              رفع الفيديو فوراً إلى قناتك على YouTube دون الحاجة للضغط اليدوي
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {autoUpload && (
            <select
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value as YouTubePrivacy)}
              className="px-2.5 py-1 bg-black/60 rounded-xl border border-white/10 text-xs text-slate-300 focus:outline-none"
            >
              <option value="unlisted">غير مدرج (Unlisted)</option>
              <option value="public">علني (Public)</option>
              <option value="private">خاص (Private)</option>
            </select>
          )}

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoUpload}
              onChange={(e) => handleToggleAutoUpload(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 shadow-inner"></div>
          </label>
        </div>
      </div>

      {/* Input Options: Single or Bulk Mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkMode(false)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                !bulkMode
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              إضافة موضوع فردي
            </button>
            <button
              type="button"
              onClick={() => setBulkMode(true)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                bulkMode
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>لصق قائمة مواضيع (Bulk Add)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddSampleTopics}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>إضافة أفكار وثائقية جاهزة</span>
          </button>
        </div>

        {/* Add Controls */}
        {!bulkMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
              placeholder="اكتب موضوع الفيديو المطلوب إضافته للطابور..."
              className="sm:col-span-7 px-3.5 py-2.5 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            />

            <select
              value={newSceneCount}
              onChange={(e) => setNewSceneCount(Number(e.target.value))}
              className="sm:col-span-2 px-2.5 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:outline-none"
            >
              <option value="4">4 مشاهد (~24ث)</option>
              <option value="6">6 مشاهد (~36ث)</option>
              <option value="8">8 مشاهد (~48ث)</option>
              <option value="10">10 مشاهد (~60ث)</option>
              <option value="15">15 مشهد (~90ث)</option>
            </select>

            <select
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value as Language)}
              className="sm:col-span-2 px-2.5 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>

            <button
              type="button"
              onClick={handleAddSingle}
              disabled={!newTopic.trim()}
              className="sm:col-span-1 p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center justify-center transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`الصق هنا عدة مواضيع (موضوع في كل سطر):\nأسرار بناء سور الصين العظيم\nكيف تعمل الثقوب السوداء في الفضاء؟\nأعظم 5 اختراعات غيرت البشرية`}
              className="w-full p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة كل العناصر إلى الطابور</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Queue Items List Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>قائمة الفيديوهات المجدولة ({queue.length}):</span>
          {queue.some((it) => it.status === 'completed') && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              مسح الفيديوهات المكتملة
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 text-xs space-y-1">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p>الطابور فارغ حالياً. أضف مواضيع فيديوهات للبدء في الإنتاج المتسلسل.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {queue.map((item, index) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'processing' || item.status === 'rendering' || item.status === 'uploading'
                    ? 'bg-purple-950/30 border-purple-500/40 shadow-md'
                    : item.status === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-300'
                    : item.status === 'error'
                    ? 'bg-red-950/20 border-red-500/20 text-slate-300'
                    : 'bg-black/30 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-slate-400 shrink-0">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{item.topic}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-white/5 rounded">
                        {item.sceneCount} مشاهد
                      </span>
                      <span>•</span>
                      <span>{item.language === 'ar' ? 'العربية' : 'English'}</span>
                      {item.statusMessage && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300">{item.statusMessage}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {item.status === 'pending' && (
                    <span className="text-[10px] px-2.5 py-1 bg-white/10 rounded-full text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>قيد الانتظار</span>
                    </span>
                  )}

                  {(item.status === 'processing' || item.status === 'rendering' || item.status === 'uploading') && (
                    <span className="text-[10px] px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      <span>{item.progress}%</span>
                    </span>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مكتمل</span>
                      </span>

                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-red-400 hover:text-red-300"
                          title="مشاهدة على YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span
                      className="text-[10px] px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full flex items-center gap-1 font-bold"
                      title={item.errorMessage}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>خطأ</span>
                    </span>
                  )}

                  {item.status !== 'processing' && item.status !== 'rendering' && item.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Action Bar: Run Queue */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleRunQueue}
          disabled={isProcessingQueue || queue.length === 0}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          {isProcessingQueue ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تنفيذ الطابور بالتسلسل...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>بدء تشغيل الطابور التلقائي (Run Queue)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
