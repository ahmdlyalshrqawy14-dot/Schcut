import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Loader2,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language, ShortsScript } from '../types';
import { translations } from '../constants/translations';
import { speechService } from '../services/speechService';
import { azureSpeechService } from '../services/azureSpeechService';
import { videoRecorderService } from '../services/videoRecorderService';
import { soundFxService } from '../services/soundFxService';

interface CanvasPlayerProps {
  script: ShortsScript | null;
  uiLang: Language;
  onSceneChange?: (sceneIndex: number) => void;
  ambientMusicEnabled: boolean;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  script,
  uiLang,
  onSceneChange,
  ambientMusicEnabled,
}) => {
  const t = translations[uiLang];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Privacy / Gated Preview State - Strict privacy default (no auto-play)
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Animation frame and timing refs
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSpokenSceneRef = useRef<number>(-1);
  const lastActiveSceneIndexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  const playbackRateRef = useRef<number>(1.0);

  const totalDuration = script?.scenes?.reduce((acc, s) => acc + (s.durationSeconds || 6), 0) || 58;
  const videoLang = script?.videoLanguage || uiLang;

  // Sync refs
  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;
  playbackRateRef.current = playbackRate;

  // Determine current active scene
  const getCurrentSceneIndex = useCallback(
    (time: number): number => {
      if (!script || !script.scenes || script.scenes.length === 0) return 0;
      let accumulated = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = script.scenes[i].durationSeconds || 6;
        if (time < accumulated + dur) {
          return i;
        }
        accumulated += dur;
      }
      return Math.max(0, script.scenes.length - 1);
    },
    [script]
  );

  // Draw placeholder canvas if no script or images (1080x1920)
  const drawPlaceholder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, 1080, 1920);

    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0.15)');
    grad.addColorStop(0.5, 'rgba(220, 38, 38, 0.1)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 64px Cairo, Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DocuShorts AI 🎬', 540, 900);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px Cairo, Plus Jakarta Sans, sans-serif';
    ctx.fillText(
      uiLang === 'ar' ? 'أدخل موضوعاً واضغط "إنشاء الفيديو الآن"' : 'Enter topic & click "Generate Video Now"',
      540,
      980
    );

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1000, 1840);
  }, [uiLang]);

  // Professional Cinematic Subtitle Drawing Helper (1080p Clean Typography)
  const drawSubtitles = useCallback(
    (ctx: CanvasRenderingContext2D, text: string) => {
      ctx.save();
      ctx.font = 'bold 50px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.direction = videoLang === 'ar' ? 'rtl' : 'ltr';

      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        ctx.restore();
        return;
      }

      // Line wrapping logic for 1080p canvas width
      const maxWidth = 880;
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          lines.push(currentLine.trim());
          currentLine = words[i] + ' ';
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine.trim());

      const lineHeight = 80;
      const startY = 1560 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, lineIndex) => {
        const lineY = startY + lineIndex * lineHeight;
        const totalLineWidth = ctx.measureText(line).width;
        const pillWidth = Math.max(totalLineWidth + 70, 240);
        const pillHeight = 72;

        // Dark frosted backdrop pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(540 - pillWidth / 2, lineY - 54, pillWidth, pillHeight, 20);
        ctx.fill();

        // Highlighting border
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Clean white text with subtle shadow
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 12;
        ctx.fillText(line, 540, lineY);
      });

      ctx.restore();
    },
    [videoLang]
  );

  // Main Canvas Render Frame Function (1080x1920 Full HD with Cross-Fade & Dust Overlay)
  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!script || !script.scenes || script.scenes.length === 0) {
        drawPlaceholder(ctx);
        return;
      }

      const sceneIndex = getCurrentSceneIndex(time);
      const currentScene = script.scenes[sceneIndex];
      const nextScene = script.scenes[sceneIndex + 1] || null;

      // Calculate time progress within current scene
      let sceneStartTime = 0;
      for (let i = 0; i < sceneIndex; i++) {
        sceneStartTime += script.scenes[i].durationSeconds || 6;
      }
      const sceneDur = currentScene?.durationSeconds || 6;
      const timeInScene = Math.max(0, time - sceneStartTime);
      const progressInScene = Math.min(1, Math.max(0, timeInScene / sceneDur));

      // 1. Background clear
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Draw Current Scene Image with Ken Burns zoom & subtle pan
      const currentImg = currentScene?.loadedImage;
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        ctx.save();
        const scale = 1.0 + progressInScene * 0.12;
        const panX = (sceneIndex % 2 === 0 ? 1 : -1) * (progressInScene * 35);
        const panY = progressInScene * 25;

        ctx.translate(540 + panX, 960 + panY);
        ctx.scale(scale, scale);
        ctx.drawImage(currentImg, -540, -960, 1080, 1920);
        ctx.restore();
      }

      // 3. Smooth Cross-Fade Transition into Next Image during last 0.8s
      const transitionDuration = 0.8;
      const timeLeftInScene = sceneDur - timeInScene;
      if (timeLeftInScene < transitionDuration && nextScene?.loadedImage && nextScene.loadedImage.complete) {
        const transitionProgress = 1 - Math.max(0, timeLeftInScene / transitionDuration);
        ctx.save();
        ctx.globalAlpha = transitionProgress;
        const nextScale = 1.0 + (transitionProgress * 0.03);
        ctx.translate(540, 960);
        ctx.scale(nextScale, nextScale);
        ctx.drawImage(nextScene.loadedImage, -540, -960, 1080, 1920);
        ctx.restore();
      }

      // 4. Cinematic Ambient Atmosphere: Floating Dust Particles & Light Leak
      ctx.save();
      const flareGrad = ctx.createRadialGradient(900, 200, 20, 900, 200, 600);
      flareGrad.addColorStop(0, 'rgba(251, 146, 60, 0.12)');
      flareGrad.addColorStop(0.6, 'rgba(244, 63, 94, 0.04)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, 1080, 800);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      for (let p = 0; p < 24; p++) {
        const seed = p * 137.5;
        const px = (seed + time * 18 + Math.sin(time * 0.5 + p) * 30) % 1080;
        const py = (1920 - ((seed * 2 + time * 32) % 1920));
        const pr = 1.5 + (p % 3);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Cinematic Top & Bottom Vignettes
      const topGrad = ctx.createLinearGradient(0, 0, 0, 360);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, 1080, 360);

      const bottomGrad = ctx.createLinearGradient(0, 1180, 0, 1920);
      bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.7)');
      bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 1180, 1080, 740);

      // 6. Top Progress Segment Bar
      const barY = 48;
      const totalWidth = 990;
      const startX = 45;
      const sceneCount = script.scenes.length;
      const segGap = Math.max(3, 8 - Math.floor(sceneCount / 8));
      const segWidth = (totalWidth - (sceneCount - 1) * segGap) / sceneCount;

      for (let i = 0; i < sceneCount; i++) {
        const segX = startX + i * (segWidth + segGap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(segX, barY, segWidth, 8, 4);
        ctx.fill();

        if (i < sceneIndex) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.roundRect(segX, barY, segWidth, 8, 4);
          ctx.fill();
        } else if (i === sceneIndex) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.roundRect(segX, barY, segWidth * progressInScene, 8, 4);
          ctx.fill();
        }
      }

      // 7. Shorts Watermark Badge
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(810, 84, 225, 54, 27);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(845, 111, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SHORTS', 866, 120);
      ctx.restore();

      // 8. Draw Subtitles (Clean High-Contrast Typography)
      if (currentScene && currentScene.text) {
        drawSubtitles(ctx, currentScene.text);
      }
    },
    [script, getCurrentSceneIndex, drawPlaceholder, drawSubtitles]
  );

  // Trigger speech when scene changes during playback (only for fallback TTS)
  const triggerSceneSpeech = useCallback(
    (sceneIndex: number) => {
      if (!isPlayingRef.current || isMuted || !script || !script.scenes[sceneIndex]) return;

      // If we have a single continuous audio recording for the whole video, it's already playing
      if (script.continuousAudio?.audioBuffer) {
        return;
      }

      if (lastSpokenSceneRef.current === sceneIndex) return;
      lastSpokenSceneRef.current = sceneIndex;

      const scene = script.scenes[sceneIndex];

      // If neural audio buffer was synthesized per scene
      if (scene.audioBuffer) {
        azureSpeechService.playAudioBuffer(scene.audioBuffer, 0);
      } else {
        speechService.speakText(scene.text, videoLang, playbackRateRef.current);
      }
    },
    [isMuted, script, videoLang]
  );

  // Main animation loop
  const loop = useCallback(
    (timestamp: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      let nextTime = currentTimeRef.current + delta * playbackRateRef.current;

      if (nextTime >= totalDuration) {
        nextTime = 0;
        lastSpokenSceneRef.current = -1;
        if (script?.continuousAudio?.audioBuffer && !isMuted) {
          azureSpeechService.playAudioBuffer(script.continuousAudio.audioBuffer, 0);
        }
      }

      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      const activeScene = getCurrentSceneIndex(nextTime);
      if (lastActiveSceneIndexRef.current !== -1 && lastActiveSceneIndexRef.current !== activeScene) {
        soundFxService.playSceneTransition();
      }
      lastActiveSceneIndexRef.current = activeScene;

      triggerSceneSpeech(activeScene);
      if (onSceneChange) onSceneChange(activeScene);

      renderFrame(nextTime);

      animationFrameRef.current = requestAnimationFrame(loop);
    },
    [totalDuration, getCurrentSceneIndex, triggerSceneSpeech, onSceneChange, renderFrame, script, isMuted]
  );

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(
    (force?: boolean) => {
      if (!isPreviewUnlocked) {
        setIsPreviewUnlocked(true);
      }

      const nextPlay = force !== undefined ? force : !isPlaying;
      setIsPlaying(nextPlay);
      isPlayingRef.current = nextPlay;

      if (nextPlay) {
        lastTimestampRef.current = null;
        if (ambientMusicEnabled) {
          speechService.startAmbientSoundtrack(0.2);
        }
        
        // Start single continuous audio recording if available
        if (script?.continuousAudio?.audioBuffer && !isMuted) {
          azureSpeechService.playAudioBuffer(
            script.continuousAudio.audioBuffer,
            currentTimeRef.current
          );
        } else {
          const activeScene = getCurrentSceneIndex(currentTimeRef.current);
          triggerSceneSpeech(activeScene);
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        speechService.stopSpeaking();
        azureSpeechService.stopPlayback();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    },
    [isPlaying, isPreviewUnlocked, ambientMusicEnabled, script, isMuted, getCurrentSceneIndex, triggerSceneSpeech, loop]
  );

  // Seek time handler
  const handleSeek = (val: number) => {
    setCurrentTime(val);
    currentTimeRef.current = val;
    lastSpokenSceneRef.current = -1;
    speechService.stopSpeaking();
    azureSpeechService.stopPlayback();
    renderFrame(val);
    if (isPlaying) {
      if (script?.continuousAudio?.audioBuffer && !isMuted) {
        azureSpeechService.playAudioBuffer(script.continuousAudio.audioBuffer, val);
      } else {
        const activeScene = getCurrentSceneIndex(val);
        triggerSceneSpeech(activeScene);
      }
    }
  };

  // Restart / Replay
  const handleRestart = () => {
    setCurrentTime(0);
    currentTimeRef.current = 0;
    lastSpokenSceneRef.current = -1;
    speechService.stopSpeaking();
    azureSpeechService.stopPlayback();
    renderFrame(0);
    handleTogglePlay(true);
  };

  // When a new script is loaded, lock preview & do NOT auto play
  useEffect(() => {
    setIsPreviewUnlocked(false);
    setIsPlaying(false);
    isPlayingRef.current = false;
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastSpokenSceneRef.current = -1;
    speechService.stopSpeaking();
    azureSpeechService.stopPlayback();
    renderFrame(0);
  }, [script, renderFrame]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      speechService.stopSpeaking();
      speechService.stopAmbientSoundtrack();
      azureSpeechService.stopPlayback();
    };
  }, []);

  // Format safe file name: User custom name OR auto YouTube title
  const getOutputFilename = (): string => {
    if (!script) return 'DocuShorts_video.webm';
    
    let baseName = script.customFileName?.trim();
    if (!baseName) {
      baseName = script.title || script.topic || 'DocuShorts_video';
    }

    const clean = baseName.replace(/[/\\?%*:|"<>#]+/g, '_').trim().replace(/\s+/g, '_');
    return `${clean}.webm`;
  };

  // MediaRecorder Video Export with Confetti celebration
  const handleExportVideo = async () => {
    if (!script || !canvasRef.current) return;

    try {
      setIsRecording(true);
      setRecordingProgress(0);

      // Stop current preview
      handleTogglePlay(false);
      handleSeek(0);

      if (ambientMusicEnabled) {
        speechService.startAmbientSoundtrack(0.25);
      }

      let audioTrack = script.continuousAudio?.audioBuffer
        ? azureSpeechService.getAudioStreamTrack()
        : speechService.getAudioStreamTrack();

      await videoRecorderService.startRecording({
        canvas: canvasRef.current,
        audioTrack,
        fps: 60,
      });

      // Start recording animation loop from 0
      setIsPlaying(true);
      isPlayingRef.current = true;
      lastTimestampRef.current = null;
      lastSpokenSceneRef.current = -1;

      if (script.continuousAudio?.audioBuffer) {
        azureSpeechService.playAudioBuffer(script.continuousAudio.audioBuffer, 0);
      }

      const recordStartTime = performance.now();
      const progressInterval = setInterval(() => {
        const elapsed = (performance.now() - recordStartTime) / 1000;
        const pct = Math.min(99, Math.round((elapsed / totalDuration) * 100));
        setRecordingProgress(pct);
      }, 200);

      // Auto stop after totalDuration + safety buffer
      setTimeout(async () => {
        clearInterval(progressInterval);
        handleTogglePlay(false);

        try {
          const { blob } = await videoRecorderService.stopRecording();
          const targetFilename = getOutputFilename();
          videoRecorderService.downloadBlob(blob, targetFilename);

          setRecordingProgress(100);
          setIsRecording(false);

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#ef4444', '#10b981', '#3b82f6'],
          });
        } catch (err) {
          console.error('Recording stop error:', err);
          setIsRecording(false);
        }
      }, (totalDuration + 0.8) * 1000);
    } catch (e) {
      console.error('Failed to export video:', e);
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col items-center shadow-2xl space-y-4">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <h2 className="font-bold text-xs uppercase tracking-widest text-slate-300">{t.previewTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          {script && (
            <button
              onClick={() => {
                if (isPlaying) handleTogglePlay(false);
                setIsPreviewUnlocked(!isPreviewUnlocked);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10 flex items-center gap-1.5 backdrop-blur-md transition-all"
              title={isPreviewUnlocked ? t.lockPreviewBtn : t.unlockPreviewBtn}
            >
              {isPreviewUnlocked ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.lockPreviewBtn}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.unlockPreviewBtn}</span>
                </>
              )}
            </button>
          )}
          <span className="text-[11px] bg-white/5 text-rose-300 font-mono font-semibold px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-md">
            1080x1920 • 60fps Full HD
          </span>
        </div>
      </div>

      {/* 9:16 Canvas Box with Privacy Blur & Gated Preview Overlay */}
      <div className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] bg-black rounded-[2.5rem] border-[6px] border-white/10 shadow-2xl overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className={`w-full h-full object-cover block transition-all duration-500 ${
            !isPreviewUnlocked && script ? 'blur-xl scale-105 opacity-40' : 'blur-0 opacity-100'
          }`}
          onClick={() => {
            if (isPreviewUnlocked) handleTogglePlay();
          }}
        />

        {/* 🔒 Privacy Gated Mask (When Preview is Locked) */}
        {!isPreviewUnlocked && script && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-md animate-fadeIn space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-100">{t.privacyPreviewTitle}</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-[240px]">
                {t.privacyPreviewDesc}
              </p>
            </div>

            {/* Unlock & Preview Button */}
            <button
              onClick={() => {
                setIsPreviewUnlocked(true);
                handleTogglePlay(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-xs font-bold shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>{t.unlockPreviewBtn}</span>
            </button>

            {/* Direct Download Option without previewing */}
            <button
              onClick={handleExportVideo}
              disabled={isRecording}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>{t.directDownloadReady}</span>
            </button>
          </div>
        )}

        {/* Center Play Overlay Icon (When Unlocked & Paused) */}
        {isPreviewUnlocked && !isPlaying && (
          <button
            onClick={() => handleTogglePlay(true)}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md transition-all scale-100 hover:scale-110 shadow-2xl border border-white/30"
          >
            <Play className="w-7 h-7 fill-white text-white ml-1" />
          </button>
        )}

        {/* Recording Overlay Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg border border-white/20 z-30">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>REC {recordingProgress}%</span>
          </div>
        )}
      </div>

      {/* Target Output Filename Display */}
      {script && (
        <div className="w-full text-center px-2">
          <span className="text-[11px] text-slate-400 font-mono bg-black/40 px-3 py-1 rounded-xl border border-white/5 truncate max-w-full inline-block">
            💾 {getOutputFilename()}
          </span>
        </div>
      )}

      {/* Player Controls Bar */}
      <div className="w-full space-y-3 pt-1">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-10 text-center">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.05}
            value={currentTime}
            disabled={!isPreviewUnlocked}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 accent-rose-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none disabled:opacity-30"
          />
          <span className="text-xs font-mono text-slate-400 w-10 text-center">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Action Controls & Recording Button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => handleTogglePlay()}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 backdrop-blur-md transition-colors shadow-sm"
              title={isPlaying ? t.pause : t.play}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-rose-400" />
              ) : (
                <Play className="w-4 h-4 text-rose-400 fill-rose-400" />
              )}
            </button>

            {/* Replay */}
            <button
              onClick={handleRestart}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 backdrop-blur-md transition-colors shadow-sm"
              title={t.replay}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed toggle */}
            <button
              onClick={() => {
                const next = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
                setPlaybackRate(next);
              }}
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 text-xs font-bold font-mono backdrop-blur-md transition-colors shadow-sm"
              title={t.voiceSpeed}
            >
              {playbackRate}x
            </button>
          </div>

          {/* Export & Download Video Button (Download Only - No YouTube Upload in manual player) */}
          <button
            onClick={handleExportVideo}
            disabled={isRecording || !script}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-900/30 hover:scale-[1.02] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecording ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {t.recordingInProgress} ({recordingProgress}%)
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t.downloadVideoBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}
