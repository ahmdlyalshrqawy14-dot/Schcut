import { Language, PublishedVideoRecord, ScheduleConfig, ShortsScript, YouTubePrivacy } from '../types';
import { generateDocumentaryScript, preloadImagesInBatches } from './pollinationsService';
import { azureSpeechService } from './azureSpeechService';
import { youtubeUploadService } from './youtubeUploadService';
import { videoRecorderService } from './videoRecorderService';
import { speechService } from './speechService';
import { geminiClientService } from './geminiClientService';

const SCHEDULE_CONFIG_KEY = 'docushorts_schedule_config';
const PUBLISHED_HISTORY_KEY = 'docushorts_published_history';

export const DEFAULT_DOCUMENTARY_TOPICS_AR = [
  'أسرار الثقوب السوداء والمادة المظلمة في الفضاء السحيق',
  'أعظم ألغاز الحضارة الفرعونية وهندسة بناء الأهرامات',
  'أسرار خندق ماريانا والمخلوقات الغريبة في أعمق نقطة على الأرض',
  'مثلث برمودا والحقائق العلمية والجيولوجية الصادمة',
  'كوكب المريخ واكتشافات المياه وآثار الحياة القديمة',
  'أسرار غابات الأمازون المطيرة والمدن المفقودة تحت الأشجار',
  'سر انفجار تونغوسكا الكوني الغامض في سيبيريا',
  'عجائب الدماغ البشري وقدرات العقل الباطن الخارقة',
  'أغرب الظواهر الفيزيائية في ميكانيكا الكم والتشابك الكمي',
  'سر اختفاء قارة أطلانتس الأسطورية بين الحقيقة والخيال',
  'أقوى الانفجارات البركانية التي غيرت مناخ كوكب الأرض',
  'حضارة المايا وسر اختفائها المفاجئ في ذروة قوتها',
  'العصر الجليدي الأخير وكيف نجت البشرية من الانقراض',
  'سر النيازك الذهبية وأصل المعادن الثمينة في الكون',
  'أعماق القطب الجنوبي وما تخفيه طبقات الجليد القديمة',
  'تلسكوب جيمس ويب وأغرب الصور الملتقطة لبداية الكون',
  'كوكب الزهرة والجحيم المناخي الذي حير العلماء',
  'أسرار الكهوف المظلمة وأغرب النظم البيئية المعزولة',
];

export const DEFAULT_DOCUMENTARY_TOPICS_EN = [
  'Mysteries of Supermassive Black Holes & Dark Matter in Deep Space',
  'Shocking Engineering Feats & Astronomy of Ancient Egypt',
  'The Alien Bioluminescent Creatures of Mariana Trench Depths',
  'The Scientific Reality Behind the Bermuda Triangle Anomaly',
  'Signs of Ancient Oceans and Extinct Microorganisms on Mars',
  'Lost Prehistoric Civilizations Buried Beneath the Amazon Rainforest',
  'The Tunguska Cosmic Blast Mystery Over the Siberian Wilderness',
  'Mind-Bending Capabilities of the Human Brain & Subconscious Memory',
  'Quantum Entanglement and Parallel Universe Paradoxes Explained',
  'The Legend of Atlantis: Historical Clues vs Geological Fact',
  'Supervolcanoes That Almost Wiped Out All Life on Earth',
  'The Sudden Mysterious Collapse of the Ancient Maya Empire',
  'How Early Humans Survived the Harsh Last Ice Age Epoch',
  'Cosmic Origins of Gold and Heavy Elements in Neutron Collisions',
  'What Lies Beneath the 3-Mile Deep Ice Sheets of Antarctica',
  'Mind-Blowing Deep Space Revelations from James Webb Telescope',
  'The Runaway Greenhouse Hellscape of Planet Venus',
  'Subterranean Giant Crystal Caves and Hidden Ecosystems',
];

export class SchedulerService {
  private timerId: any = null;
  private isRunningBatch = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBackgroundInterval();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Get stored Schedule Configuration
   */
  public getConfig(): ScheduleConfig {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        scheduledTime: '14:00',
        dailyVideoCount: 2,
        imagesPerVideo: 6,
        language: 'ar',
        privacy: 'public',
        category: 'التعليم والعلوم',
        channelNiche: '',
        customTopicsText: '',
      };
    }

    const saved = localStorage.getItem(SCHEDULE_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          enabled: !!parsed.enabled,
          scheduledTime: parsed.scheduledTime || '14:00',
          dailyVideoCount: Math.min(6, Math.max(1, Number(parsed.dailyVideoCount) || 2)),
          imagesPerVideo: Math.min(12, Math.max(4, Number(parsed.imagesPerVideo) || 6)),
          language: parsed.language === 'en' ? 'en' : 'ar',
          privacy: parsed.privacy || 'public',
          category: parsed.category || 'التعليم والعلوم',
          channelNiche: parsed.channelNiche || '',
          customTopicsText: parsed.customTopicsText || '',
          lastRunDate: parsed.lastRunDate || undefined,
        };
      } catch (e) {
        // Fallback
      }
    }

    return {
      enabled: false,
      scheduledTime: '14:00',
      dailyVideoCount: 2,
      imagesPerVideo: 6,
      language: 'ar',
      privacy: 'public',
      category: 'التعليم والعلوم',
      channelNiche: '',
      customTopicsText: '',
    };
  }

  /**
   * Save Schedule Configuration
   */
  public saveConfig(config: ScheduleConfig): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCHEDULE_CONFIG_KEY, JSON.stringify(config));
      this.notify();
    }
  }

  /**
   * Get Published Video History
   */
  public getHistory(): PublishedVideoRecord[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(PUBLISHED_HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Add a record to history
   */
  public addHistoryRecord(record: PublishedVideoRecord): void {
    if (typeof window === 'undefined') return;
    const history = this.getHistory();
    history.unshift(record);
    // Keep last 100 entries
    const trimmed = history.slice(0, 100);
    localStorage.setItem(PUBLISHED_HISTORY_KEY, JSON.stringify(trimmed));
    this.notify();
  }

  /**
   * Clear History
   */
  public clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PUBLISHED_HISTORY_KEY);
      this.notify();
    }
  }

  /**
   * Calculate time remaining until next run
   */
  public getNextRunCountdown(lang: Language = 'ar'): { text: string; hours: number; minutes: number } {
    const config = this.getConfig();
    if (!config.enabled) {
      return {
        text: lang === 'ar' ? 'الجدولة متوقفة' : 'Scheduler paused',
        hours: 0,
        minutes: 0,
      };
    }

    const [targetHour, targetMinute] = config.scheduledTime.split(':').map(Number);
    const now = new Date();
    const targetDate = new Date();
    targetDate.setHours(targetHour, targetMinute, 0, 0);

    // If today's target time has passed, next run is tomorrow
    if (now.getTime() >= targetDate.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const diffMs = targetDate.getTime() - now.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const text = lang === 'ar'
      ? `بعد ${hours} ساعة و ${minutes} دقيقة (${config.scheduledTime})`
      : `In ${hours}h ${minutes}m (${config.scheduledTime})`;

    return { text, hours, minutes };
  }

  /**
   * Background interval checking every 30 seconds
   */
  private initBackgroundInterval() {
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      this.checkAndExecuteSchedule();
    }, 30000); // 30s check
  }

  /**
   * Check if current time matches scheduled time
   */
  private async checkAndExecuteSchedule() {
    const config = this.getConfig();
    if (!config.enabled || this.isRunningBatch) return;

    // Check if YouTube is connected
    if (!youtubeUploadService.isAuthenticated()) return;

    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;
    const todayDateStr = now.toISOString().split('T')[0];

    // Check if time matches and hasn't already run today
    if (currentTimeStr === config.scheduledTime && config.lastRunDate !== todayDateStr) {
      console.log(`[Scheduler] Scheduled time reached: ${currentTimeStr}. Executing daily batch!`);
      // Update lastRunDate immediately to prevent double triggers
      config.lastRunDate = todayDateStr;
      this.saveConfig(config);

      await this.runBatchGenerationAndUpload(config);
    }
  }

  /**
   * Execute batch generation and upload of N videos directly to YouTube
   */
  public async runBatchGenerationAndUpload(
    overrideConfig?: ScheduleConfig,
    onProgressUpdate?: (current: number, total: number, msg: string) => void
  ): Promise<PublishedVideoRecord[]> {
    if (this.isRunningBatch) {
      throw new Error('A scheduled batch is already currently executing.');
    }

    this.isRunningBatch = true;
    this.notify();

    const config = overrideConfig || this.getConfig();
    const count = config.dailyVideoCount || 2;
    const imagesCount = config.imagesPerVideo || 6;
    const lang = config.language || 'ar';
    const privacy = config.privacy || 'public';

    // Pick topics
    const topics = this.selectTopicsForBatch(config, count);
    const results: PublishedVideoRecord[] = [];

    try {
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const stepNum = i + 1;
        
        if (onProgressUpdate) {
          onProgressUpdate(stepNum, count, lang === 'ar' ? `إنتاج فيديو ${stepNum} من ${count}: "${topic}"...` : `Generating video ${stepNum} of ${count}: "${topic}"...`);
        }

        try {
          // 1. Generate Script
          const script = await generateDocumentaryScript(topic, lang, imagesCount);

          // 2. Preload all Images
          await preloadImagesInBatches(script.scenes, 2);

          // 3. Synthesize Continuous Audio
          let audioBuffer: AudioBuffer | null = null;
          let audioBlob: Blob | null = null;
          let totalDuration = 58;

          if (azureSpeechService.isConfigured() && script.fullScriptText) {
            try {
              const synth = await azureSpeechService.synthesize(script.fullScriptText, {
                lang,
              });
              audioBuffer = synth.audioBuffer;
              audioBlob = synth.audioBlob;
              totalDuration = Math.min(60, Math.max(30, synth.durationSeconds));
            } catch (e) {
              console.warn('Azure continuous synthesis failed, using default timing:', e);
            }
          }

          // Distribute duration across scenes
          const durPerScene = totalDuration / script.scenes.length;
          script.scenes.forEach(s => {
            s.durationSeconds = durPerScene;
          });

          // 4. Render Video using Offscreen Canvas & VideoRecorderService
          if (onProgressUpdate) {
            onProgressUpdate(stepNum, count, lang === 'ar' ? `تصيير الفيديو ${stepNum} وتسجيل الكانفاس...` : `Rendering canvas stream for video ${stepNum}...`);
          }

          const videoBlob = await this.renderScriptToVideoBlob(script, totalDuration);

          // 5. Direct YouTube Upload via YouTube Data API v3
          if (onProgressUpdate) {
            onProgressUpdate(stepNum, count, lang === 'ar' ? `رفع الفيديو ${stepNum} إلى يوتيوب (${script.title})...` : `Uploading video ${stepNum} to YouTube...`);
          }

          const uploadRes = await youtubeUploadService.uploadVideo({
            blob: videoBlob,
            title: script.title,
            description: script.description,
            tags: script.tags,
            privacyStatus: privacy,
            videoLanguage: lang,
          });

          const record: PublishedVideoRecord = {
            id: `pub_${Date.now()}_${i}`,
            topic: script.topic,
            title: script.title,
            youtubeId: uploadRes.videoId,
            youtubeUrl: uploadRes.url,
            privacy: privacy,
            timestamp: Date.now(),
            thumbnailUrl: script.scenes[0]?.imageUrl,
            status: 'success',
          };

          this.addHistoryRecord(record);
          results.push(record);
        } catch (itemErr: any) {
          console.error(`Error in scheduled batch item ${i + 1}:`, itemErr);
          const failedRecord: PublishedVideoRecord = {
            id: `pub_failed_${Date.now()}_${i}`,
            topic: topic,
            title: `فشل رفع: ${topic}`,
            privacy: privacy,
            timestamp: Date.now(),
            status: 'failed',
            errorMessage: itemErr?.message || 'Upload failed',
          };
          this.addHistoryRecord(failedRecord);
          results.push(failedRecord);
        }
      }
    } finally {
      this.isRunningBatch = false;
      this.notify();
    }

    return results;
  }

  /**
   * Helper to select topics from custom list or preset rotation
   */
  private selectTopicsForBatch(config: ScheduleConfig, count: number): string[] {
    const customList = config.customTopicsText
      ? config.customTopicsText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const defaultList = config.language === 'ar' ? DEFAULT_DOCUMENTARY_TOPICS_AR : DEFAULT_DOCUMENTARY_TOPICS_EN;
    const pool = customList.length > 0 ? customList : defaultList;

    const selected: string[] = [];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());

    for (let i = 0; i < count; i++) {
      selected.push(shuffled[i % shuffled.length]);
    }

    return selected;
  }

  /**
   * Procedurally render a script to a video WebM Blob via Canvas & MediaRecorder (1080x1920 Full HD @ 60fps)
   */
  private renderScriptToVideoBlob(script: ShortsScript, totalDurationSeconds: number): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));

        // Start Ambient Audio for recording track
        speechService.startAmbientSoundtrack(0.25);
        const audioTrack = speechService.getAudioStreamTrack();

        await videoRecorderService.startRecording({
          canvas,
          audioTrack,
          fps: 60,
        });

        const startTime = performance.now();
        const totalDurationMs = totalDurationSeconds * 1000;
        let animationId: number;

        const renderLoop = () => {
          const elapsed = performance.now() - startTime;
          const currentSeconds = elapsed / 1000;

          if (elapsed >= totalDurationMs) {
            cancelAnimationFrame(animationId);
            setTimeout(async () => {
              try {
                speechService.stopAmbientSoundtrack();
                const res = await videoRecorderService.stopRecording();
                resolve(res.blob);
              } catch (e) {
                reject(e);
              }
            }, 300);
            return;
          }

          // Calculate current scene
          const sceneIndex = Math.min(
            script.scenes.length - 1,
            Math.floor((currentSeconds / totalDurationSeconds) * script.scenes.length)
          );
          const currentScene = script.scenes[sceneIndex];
          const nextScene = script.scenes[sceneIndex + 1] || null;

          // Progress in current scene
          const durPerScene = totalDurationSeconds / script.scenes.length;
          const sceneStart = sceneIndex * durPerScene;
          const timeInScene = currentSeconds - sceneStart;
          const progressInScene = Math.min(1, Math.max(0, timeInScene / durPerScene));

          // 1. Background clear
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, 1080, 1920);

          // 2. Draw scene image with Ken Burns zoom
          if (currentScene?.loadedImage && currentScene.loadedImage.complete) {
            ctx.save();
            const scale = 1.0 + progressInScene * 0.12;
            const panX = (sceneIndex % 2 === 0 ? 1 : -1) * (progressInScene * 35);
            const panY = progressInScene * 25;
            ctx.translate(540 + panX, 960 + panY);
            ctx.scale(scale, scale);
            ctx.drawImage(currentScene.loadedImage, -540, -960, 1080, 1920);
            ctx.restore();
          }

          // 3. Smooth Cross-Fade Transition
          const transitionDuration = 0.8;
          const timeLeftInScene = durPerScene - timeInScene;
          if (timeLeftInScene < transitionDuration && nextScene?.loadedImage && nextScene.loadedImage.complete) {
            const transitionProgress = 1 - Math.max(0, timeLeftInScene / transitionDuration);
            ctx.save();
            ctx.globalAlpha = transitionProgress;
            ctx.translate(540, 960);
            ctx.scale(1.0 + transitionProgress * 0.03, 1.0 + transitionProgress * 0.03);
            ctx.drawImage(nextScene.loadedImage, -540, -960, 1080, 1920);
            ctx.restore();
          }

          // 4. Subtle ambient lighting & floating dust
          ctx.save();
          const flareGrad = ctx.createRadialGradient(900, 200, 20, 900, 200, 600);
          flareGrad.addColorStop(0, 'rgba(251, 146, 60, 0.1)');
          flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = flareGrad;
          ctx.fillRect(0, 0, 1080, 800);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          for (let p = 0; p < 20; p++) {
            const seed = p * 137.5;
            const px = (seed + currentSeconds * 18) % 1080;
            const py = 1920 - ((seed * 2 + currentSeconds * 32) % 1920);
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 5. Draw dark vignettes
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

          // 6. Top Progress Bar
          const sceneCount = script.scenes.length;
          const segWidth = (990 - (sceneCount - 1) * 6) / sceneCount;
          for (let s = 0; s < sceneCount; s++) {
            const segX = 45 + s * (segWidth + 6);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(segX, 48, segWidth, 8, 4);
            ctx.fill();

            if (s < sceneIndex) {
              ctx.fillStyle = '#f43f5e';
              ctx.beginPath();
              ctx.roundRect(segX, 48, segWidth, 8, 4);
              ctx.fill();
            } else if (s === sceneIndex) {
              ctx.fillStyle = '#f43f5e';
              ctx.beginPath();
              ctx.roundRect(segX, 48, segWidth * progressInScene, 8, 4);
              ctx.fill();
            }
          }

          // 7. Shorts Watermark
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
            ctx.save();
            ctx.font = 'bold 50px Cairo, Plus Jakarta Sans, sans-serif';
            ctx.textAlign = 'center';
            ctx.direction = script.videoLanguage === 'ar' ? 'rtl' : 'ltr';

            const words = currentScene.text.split(/\s+/).filter(Boolean);
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

            lines.forEach((line, lIdx) => {
              const lineY = startY + lIdx * lineHeight;
              const totalLineWidth = ctx.measureText(line).width;
              const pillWidth = Math.max(totalLineWidth + 70, 240);

              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
              ctx.beginPath();
              ctx.roundRect(540 - pillWidth / 2, lineY - 54, pillWidth, 72, 20);
              ctx.fill();

              ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
              ctx.shadowBlur = 12;
              ctx.fillText(line, 540, lineY);
            });

            ctx.restore();
          }

          animationId = requestAnimationFrame(renderLoop);
        };

        animationId = requestAnimationFrame(renderLoop);
      } catch (err) {
        speechService.stopAmbientSoundtrack();
        reject(err);
      }
    });
  }

  public get runningStatus() {
    return this.isRunningBatch;
  }
}

export const schedulerService = new SchedulerService();
