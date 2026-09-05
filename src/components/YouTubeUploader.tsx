import React, { useState, useEffect } from 'react';
import {
  Youtube,
  LogIn,
  LogOut,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Globe,
  Lock,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, ShortsScript, YouTubePrivacy, YouTubeChannelInfo, YouTubeUploadState } from '../types';
import { translations } from '../constants/translations';
import { youtubeUploadService } from '../services/youtubeUploadService';
import { speechService } from '../services/speechService';
import { videoRecorderService } from '../services/videoRecorderService';

interface YouTubeUploaderProps {
  script: ShortsScript | null;
  lang: Language;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  ambientMusicEnabled?: boolean;
}

export const YouTubeUploader: React.FC<YouTubeUploaderProps> = ({
  script,
  lang,
  canvasRef,
  ambientMusicEnabled = false,
}) => {
  const t = translations[lang];

  // Client ID & Auth state
  const [clientId, setClientId] = useState<string>('');
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  // Upload configuration
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacy>('unlisted');
  const [categoryId, setCategoryId] = useState<string>('28');

  // Upload execution state
  const [uploadState, setUploadState] = useState<YouTubeUploadState>({
    isUploading: false,
    progress: 0,
    step: 'idle',
  });

  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Load stored Google Client ID on mount
  useEffect(() => {
    const savedId = youtubeUploadService.getStoredClientId();
    if (savedId) {
      setClientId(savedId);
    }
  }, []);

  // Handle Client ID Input Change
  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setClientId(val);
    youtubeUploadService.saveClientId(val);
  };

  // Connect YouTube Channel via Google Identity Services
  const handleConnectYouTube = async () => {
    if (!clientId.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال Google Client ID أولاً.' : 'Please enter your Google Client ID first.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const token = await youtubeUploadService.requestAuthToken(clientId);
      const info = await youtubeUploadService.fetchChannelInfo(token);
      setChannelInfo(info);
    } catch (err: any) {
      console.error('YouTube Auth Error:', err);
      alert(err.message || 'حدث خطأ أثناء المصادقة مع Google YouTube API');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect Channel
  const handleDisconnect = () => {
    youtubeUploadService.disconnect();
    setChannelInfo(null);
  };

  // Copy Link Helper
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Direct Publish Flow: Record Canvas -> Resumable Upload to YouTube API
  const handleDirectPublish = async () => {
    if (!script) {
      alert(lang === 'ar' ? 'يرجى إنشاء فيديو أولاً قبل النشر.' : 'Please generate a video first before uploading.');
      return;
    }

    if (!clientId.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال Google Client ID في الإعدادات.' : 'Please enter your Google Client ID.');
      setShowHelpGuide(true);
      return;
    }

    // Grab canvas element
    const canvas = canvasRef?.current || document.querySelector('canvas');
    if (!canvas) {
      alert(lang === 'ar' ? 'لم يتم العثور على شاشة تصيير الفيديو (Canvas).' : 'Video Canvas element not found.');
      return;
    }

    try {
      // 1. Check or request auth token
      setUploadState({
        isUploading: true,
        progress: 5,
        step: 'initiating',
      });

      const token = await youtubeUploadService.requestAuthToken(clientId);
      if (!channelInfo) {
        const info = await youtubeUploadService.fetchChannelInfo(token).catch(() => null);
        if (info) setChannelInfo(info);
      }

      // 2. Record Canvas to Blob
      setUploadState({
        isUploading: true,
        progress: 10,
        step: 'recording',
      });

      const totalDuration = script.scenes?.reduce((acc, s) => acc + (s.durationSeconds || 6), 0) || 24;

      if (ambientMusicEnabled) {
        speechService.startAmbientSoundtrack(0.2);
      }
      const audioTrack = speechService.getAudioStreamTrack();

      await videoRecorderService.startRecording({
        canvas: canvas,
        audioTrack,
        fps: 60,
      });

      // Track recording progress
      const recordStartTime = performance.now();
      const recordInterval = setInterval(() => {
        const elapsed = (performance.now() - recordStartTime) / 1000;
        const pct = Math.min(95, Math.round((elapsed / totalDuration) * 100));
        setUploadState((prev) => ({
          ...prev,
          progress: Math.round(10 + (pct / 100) * 30), // 10% -> 40%
        }));
      }, 200);

      // Wait for duration to finish recording
      const recordedBlob = await new Promise<Blob>((resolve, reject) => {
        setTimeout(async () => {
          clearInterval(recordInterval);
          try {
            const { blob } = await videoRecorderService.stopRecording();
            resolve(blob);
          } catch (e) {
            reject(e);
          }
        }, (totalDuration + 0.8) * 1000);
      });

      // 3. Upload to YouTube API with progress tracking
      setUploadState({
        isUploading: true,
        progress: 45,
        step: 'uploading',
      });

      const uploadResult = await youtubeUploadService.uploadVideo({
        blob: recordedBlob,
        title: script.title || script.topic || 'YouTube Shorts',
        description: script.description || '',
        tags: script.tags || [],
        categoryId,
        privacyStatus,
        videoLanguage: script.videoLanguage,
        onProgress: (percent) => {
          // Map upload 0-100% to overall 45% -> 100%
          const overall = 45 + Math.round((percent / 100) * 55);
          setUploadState((prev) => ({
            ...prev,
            progress: overall,
          }));
        },
      });

      // 4. Success!
      setUploadState({
        isUploading: false,
        progress: 100,
        step: 'completed',
        videoId: uploadResult.videoId,
        videoUrl: uploadResult.url,
      });

      // Confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ff0000', '#f43f5e', '#ffffff', '#10b981'],
      });
    } catch (err: any) {
      console.error('Upload Error:', err);
      setUploadState({
        isUploading: false,
        progress: 0,
        step: 'error',
        errorMessage: err.message || 'حدث خطأ أثناء رفع الفيديو إلى يوتيوب.',
      });
    }
  };

  return (
    <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-200">
              {t.ytUploadSectionTitle}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.ytUploadSectionDesc}</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full uppercase font-bold tracking-wider backdrop-blur-md">
          YouTube API v3
        </span>
      </div>

      {/* 1. Google Client ID Input & Channel Status */}
      <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.ytClientIdLabel}</span>
          </label>
          <button
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHelpGuide ? 'إخفاء الدليل' : 'كيفية الحصول عليه؟'}</span>
            {showHelpGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={clientId}
          onChange={handleClientIdChange}
          placeholder={t.ytClientIdPlaceholder}
          className="w-full px-3.5 py-2.5 bg-black/50 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none transition-colors"
        />

        <p className="text-[10px] text-slate-400">{t.ytClientIdSaved}</p>

        {/* Expandable Help Guide */}
        {showHelpGuide && (
          <div className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
            <div className="font-bold text-rose-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.ytHelpToggle}</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 leading-relaxed list-disc list-inside">
              <li>{t.ytStep1}</li>
              <li>{t.ytStep2}</li>
              <li>{t.ytStep3}</li>
              <li>{t.ytStep4}</li>
            </ul>
          </div>
        )}

        {/* Channel Connection Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          {channelInfo ? (
            <div className="flex items-center gap-3">
              {channelInfo.avatarUrl ? (
                <img
                  src={channelInfo.avatarUrl}
                  alt={channelInfo.title}
                  className="w-8 h-8 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white">
                  {channelInfo.title.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">{t.ytConnectedAs}</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {channelInfo.title}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>{t.ytNotConnected}</span>
            </div>
          )}

          {channelInfo ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.ytDisconnectBtn}</span>
            </button>
          ) : (
            <button
              onClick={handleConnectYouTube}
              disabled={isAuthenticating || !clientId.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/30 transition-all active:scale-95"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري المصادقة...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.ytConnectBtn}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Upload Controls: Privacy & Category Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Privacy Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            {t.ytPrivacyLabel}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPrivacyStatus('public')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                privacyStatus === 'public'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>علني</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyStatus('unlisted')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                privacyStatus === 'unlisted'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>غير مدرج</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyStatus('private')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                privacyStatus === 'private'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>خاص</span>
            </button>
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            {t.categoryLabel}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-200 focus:border-rose-500 focus:outline-none transition-colors"
          >
            <option value="28" className="bg-neutral-900 text-white">
              28 - العلوم والتكنولوجيا (Science & Tech)
            </option>
            <option value="27" className="bg-neutral-900 text-white">
              27 - التعليم والمعرفة (Education)
            </option>
            <option value="24" className="bg-neutral-900 text-white">
              24 - الترفيه والقصص (Entertainment)
            </option>
          </select>
        </div>
      </div>

      {/* 3. Upload Execution & Progress Bar */}
      {uploadState.isUploading && (
        <div className="space-y-2 p-4 bg-black/40 rounded-2xl border border-rose-500/30 backdrop-blur-md animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-rose-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              {uploadState.step === 'recording'
                ? t.ytRecordingPhase
                : uploadState.step === 'uploading'
                ? t.ytUploadingPhase
                : 'جاري تهيئة جلسة الرفع...'}
            </span>
            <span className="font-mono font-bold text-rose-400">{uploadState.progress}%</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-600 via-rose-500 to-rose-400 h-2.5 rounded-full transition-all duration-300 shadow-md"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState.step === 'error' && (
        <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block">فشل رفع الفيديو:</strong>
            <p className="leading-relaxed">{uploadState.errorMessage}</p>
          </div>
        </div>
      )}

      {/* 4. Success Card with Direct Video Link */}
      {uploadState.step === 'completed' && uploadState.videoId && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.ytSuccessTitle}</span>
          </div>

          <div className="p-3 bg-black/50 rounded-xl border border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-200 truncate select-all">
              {uploadState.videoUrl}
            </span>
            <button
              onClick={() => handleCopyLink(uploadState.videoUrl!)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t.ytCopiedLink}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.ytCopyLink}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={uploadState.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95"
            >
              <Youtube className="w-4 h-4" />
              <span>{t.ytWatchVideo}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={`https://www.youtube.com/shorts/${uploadState.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <span>{t.ytWatchShorts}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 5. Main Action Button: Publish Directly to YouTube */}
      <button
        onClick={handleDirectPublish}
        disabled={uploadState.isUploading || !script}
        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-98"
      >
        {uploadState.isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{uploadState.progress}% {t.recordingInProgress}</span>
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            <span>{t.ytPublishBtn}</span>
          </>
        )}
      </button>
    </div>
  );
};
