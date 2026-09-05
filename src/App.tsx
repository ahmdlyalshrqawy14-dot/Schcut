import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Calendar,
  Layers,
  Settings as SettingsIcon,
  Video,
  Clock
} from 'lucide-react';
import { Language, ShortsScript, GenerationProgress, ProductionMode } from './types';
import { translations } from './constants/translations';
import { TOPIC_PRESETS } from './constants/topics';
import { Header } from './components/Header';
import { TopicInput } from './components/TopicInput';
import { CanvasPlayer } from './components/CanvasPlayer';
import { SceneTimeline } from './components/SceneTimeline';
import { MetadataDashboard } from './components/MetadataDashboard';
import { StandaloneModal } from './components/StandaloneModal';
import { AzureSpeechSettings } from './components/AzureSpeechSettings';
import { SettingsModal } from './components/SettingsModal';
import { SchedulerDashboard } from './components/SchedulerDashboard';
import { generateDocumentaryScript, preloadImagesInBatches } from './services/pollinationsService';
import { speechService } from './services/speechService';
import { azureSpeechService } from './services/azureSpeechService';

export default function App() {
  const [uiLang, setUiLang] = useState<Language>('ar');
  const [videoLang, setVideoLang] = useState<Language>('ar');
  const [productionMode, setProductionMode] = useState<ProductionMode>('scheduled');
  const [sceneCount, setSceneCount] = useState<number>(6);
  const [fileName, setFileName] = useState<string>('');
  const [topic, setTopic] = useState<string>('أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 'idle',
    progress: 0,
    message: '',
  });
  const [script, setScript] = useState<ShortsScript | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [ambientMusicEnabled, setAmbientMusicEnabled] = useState<boolean>(false);

  const t = translations[uiLang];

  // Sync document direction and language attribute
  useEffect(() => {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = uiLang === 'ar' ? 'rtl' : 'ltr';
  }, [uiLang]);

  // UI Language toggle
  const handleToggleLang = () => {
    const nextLang: Language = uiLang === 'ar' ? 'en' : 'ar';
    setUiLang(nextLang);
    setVideoLang(nextLang);

    const currentPreset = TOPIC_PRESETS.find(
      (p) => p.topicAr === topic || p.topicEn === topic
    );
    if (currentPreset) {
      setTopic(nextLang === 'ar' ? currentPreset.topicAr : currentPreset.topicEn);
    } else {
      setTopic(
        nextLang === 'ar'
          ? 'أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت'
          : 'Secrets of Supermassive Black Holes & Time Distortion'
      );
    }
  };

  // Set random topic from curated presets
  const handleRandomTopic = () => {
    const randomPreset = TOPIC_PRESETS[Math.floor(Math.random() * TOPIC_PRESETS.length)];
    setTopic(videoLang === 'ar' ? randomPreset.topicAr : randomPreset.topicEn);
  };

  // Toggle ambient music
  const handleToggleAmbientMusic = () => {
    const nextState = !ambientMusicEnabled;
    setAmbientMusicEnabled(nextState);
    if (nextState) {
      speechService.startAmbientSoundtrack(0.2);
    } else {
      speechService.stopAmbientSoundtrack();
    }
  };

  // Continuous Audio Generation Pipeline
  const handleGenerate = async () => {
    if (!topic.trim()) {
      handleRandomTopic();
    }
    const currentTopic = topic.trim() || (videoLang === 'ar' ? 'أسرار الكون' : 'Cosmic Mysteries');

    setIsGenerating(true);
    setProgress({
      step: 'script',
      progress: 15,
      message: t.statusScript,
      loadedCount: 0,
      totalCount: sceneCount,
    });

    try {
      // 1. Generate full continuous narrative script and visual chunks
      const generatedScript = await generateDocumentaryScript(
        currentTopic,
        videoLang,
        sceneCount,
        fileName
      );

      setProgress({
        step: 'images',
        progress: 35,
        message: `${t.statusImages} (0/${generatedScript.scenes.length})`,
        loadedCount: 0,
        totalCount: generatedScript.scenes.length,
      });

      // 2. Preload all scene images in parallel batches
      const scenesWithImages = [...generatedScript.scenes];
      await preloadImagesInBatches(scenesWithImages, 4, (loaded, total) => {
        const imageProgress = 35 + Math.round((loaded / total) * 50);
        setProgress({
          step: 'images',
          progress: Math.min(85, imageProgress),
          message: `${t.statusImages} (${loaded}/${total})`,
          loadedCount: loaded,
          totalCount: total,
        });
      });

      setProgress({
        step: 'audio_prep',
        progress: 88,
        message: t.statusAudio,
      });

      // 3. Synthesize full continuous voiceover audio track (~58s)
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
          console.warn('Azure continuous speech error, using estimated duration:', e);
          totalAudioDuration = speechService.estimateDuration(generatedScript.fullScriptText, 1.0);
        }
      } else {
        totalAudioDuration = 58;
      }

      // Distribute timestamps and duration evenly across all scenes
      const durPerScene = totalAudioDuration / scenesWithImages.length;
      scenesWithImages.forEach((scene, idx) => {
        scene.durationSeconds = durPerScene;
        scene.startTimeSeconds = idx * durPerScene;
        scene.endTimeSeconds = (idx + 1) * durPerScene;
      });

      generatedScript.scenes = scenesWithImages;
      generatedScript.continuousAudio = continuousAudioObj;
      setScript(generatedScript);

      setTimeout(() => {
        setProgress({
          step: 'ready',
          progress: 100,
          message: t.statusReady,
        });
        setIsGenerating(false);
      }, 400);
    } catch (error) {
      console.error('Generation error:', error);
      setProgress({
        step: 'error',
        progress: 0,
        message: t.statusError,
      });
      setIsGenerating(false);
    }
  };

  // Update a single scene image if regenerated
  const handleUpdateSceneImage = (
    sceneIndex: number,
    newImageUrl: string,
    loadedImg: HTMLImageElement
  ) => {
    if (!script) return;
    const updatedScenes = [...script.scenes];
    if (updatedScenes[sceneIndex]) {
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        imageUrl: newImageUrl,
        loadedImage: loadedImg,
      };
      setScript({
        ...script,
        scenes: updatedScenes,
      });
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        lang={uiLang}
        onToggleLang={handleToggleLang}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        ambientMusicEnabled={ambientMusicEnabled}
        onToggleAmbientMusic={handleToggleAmbientMusic}
      />

      {/* Main Studio Workspace */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* Mode Selector (24/7 Autopilot Hub vs Custom Studio) */}
        <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-xl">
          <div className="flex gap-1.5 flex-1 sm:flex-initial">
            {/* Scheduled 24/7 Autopilot Mode Button (Primary) */}
            <button
              onClick={() => setProductionMode('scheduled')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                productionMode === 'scheduled'
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t.autopilotNavTitle || t.scheduledMode}</span>
            </button>

            {/* Manual Custom Studio Button */}
            <button
              onClick={() => setProductionMode('manual')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                productionMode === 'manual'
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{t.manualNavTitle || t.manualMode}</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.settingsNavBtn}</span>
          </button>
        </div>

        {/* MODE A: MANUAL MODE */}
        {productionMode === 'manual' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Topic & Parameters Control Panel */}
            <TopicInput
              topic={topic}
              onChangeTopic={setTopic}
              onRandomTopic={handleRandomTopic}
              onGenerate={handleGenerate}
              uiLang={uiLang}
              videoLang={videoLang}
              onChangeVideoLang={setVideoLang}
              sceneCount={sceneCount}
              onChangeSceneCount={setSceneCount}
              fileName={fileName}
              onChangeFileName={setFileName}
              progress={progress}
              isGenerating={isGenerating}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />

            {/* 2-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 9:16 Canvas Video Player (Download Only in Manual Mode) */}
              <div className="lg:col-span-5 sticky top-20 space-y-6">
                <CanvasPlayer
                  script={script}
                  uiLang={uiLang}
                  onSceneChange={setActiveSceneIndex}
                  ambientMusicEnabled={ambientMusicEnabled}
                />

                {/* Microsoft Azure Speech Neural Settings */}
                <AzureSpeechSettings lang={uiLang} />
              </div>

              {/* Right Column: Scene Timeline & SEO Metadata Copy Dashboard */}
              <div className="lg:col-span-7 space-y-6">
                {/* Scene Visual Cards */}
                <SceneTimeline
                  script={script}
                  lang={uiLang}
                  activeSceneIndex={activeSceneIndex}
                  onUpdateSceneImage={handleUpdateSceneImage}
                />

                {/* YouTube Shorts SEO Metadata Dashboard (No direct upload buttons in Manual mode) */}
                <MetadataDashboard
                  script={script}
                  lang={uiLang}
                />
              </div>
            </div>
          </div>
        )}

        {/* MODE B: SCHEDULED MODE (24/7 Automated Batch & Auto Upload) */}
        {productionMode === 'scheduled' && (
          <div className="space-y-6 animate-fadeIn">
            <SchedulerDashboard
              lang={uiLang}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onSwitchToManual={() => setProductionMode('manual')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-300">DocuShorts AI • 100% Free Automated YouTube Shorts Generator</span>
          <span className="text-slate-500">Continuous 60s Voiceover • Ken Burns Animations • Bilingual RTL/LTR</span>
        </div>
      </footer>

      {/* Standalone GitHub Pages Modal */}
      <StandaloneModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lang={uiLang}
      />

      {/* Centralized Settings & Integrations Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        lang={uiLang}
        onLanguageChange={setUiLang}
        ambientMusicEnabled={ambientMusicEnabled}
        onAmbientMusicToggle={handleToggleAmbientMusic}
      />
    </div>
  );
}
