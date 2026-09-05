import React, { useState, useEffect } from 'react';
import { Language, ShortsScript, GenerationProgress } from './types';
import { translations } from './constants/translations';
import { TOPIC_PRESETS } from './constants/topics';
import { Header } from './components/Header';
import { TopicInput } from './components/TopicInput';
import { CanvasPlayer } from './components/CanvasPlayer';
import { SceneTimeline } from './components/SceneTimeline';
import { MetadataDashboard } from './components/MetadataDashboard';
import { StandaloneModal } from './components/StandaloneModal';
import { AzureSpeechSettings } from './components/AzureSpeechSettings';
import { BatchQueueManager } from './components/BatchQueueManager';
import { generateDocumentaryScript, preloadImagesInBatches } from './services/pollinationsService';
import { speechService } from './services/speechService';
import { azureSpeechService } from './services/azureSpeechService';

export default function App() {
  const [uiLang, setUiLang] = useState<Language>('ar');
  const [videoLang, setVideoLang] = useState<Language>('ar');
  const [sceneCount, setSceneCount] = useState<number>(4);
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

    // Switch default topic if it's currently a preset
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

  // Main Generation Pipeline
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
      // 1. Script generation with custom scene count, language, and file name
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

      // 2. Safe batch image preloading (concurrency limit 4) to handle up to 50 images seamlessly
      const scenesWithImages = [...generatedScript.scenes];
      await preloadImagesInBatches(scenesWithImages, 4, (loaded, total) => {
        const imageProgress = 35 + Math.round((loaded / total) * 55);
        setProgress({
          step: 'images',
          progress: Math.min(92, imageProgress),
          message: `${t.statusImages} (${loaded}/${total})`,
          loadedCount: loaded,
          totalCount: total,
        });
      });

      setProgress({
        step: 'audio_prep',
        progress: 92,
        message: t.statusAudio,
      });

      // 3. Audio Preparation & 100% Perfect Sync Timing
      const isAzureConfigured = azureSpeechService.isConfigured();
      for (let i = 0; i < scenesWithImages.length; i++) {
        const scene = scenesWithImages[i];
        if (isAzureConfigured) {
          try {
            const synth = await azureSpeechService.synthesize(scene.text, {
              lang: videoLang,
            });
            scene.audioBuffer = synth.audioBuffer;
            scene.audioBlob = synth.audioBlob;
            scene.durationSeconds = synth.durationSeconds; // 100% mathematical sync
          } catch (e) {
            console.warn('Azure synthesis error for scene, fallback to Web Speech:', e);
            scene.durationSeconds = speechService.estimateDuration(scene.text, 1.0);
          }
        } else {
          scene.durationSeconds = speechService.estimateDuration(scene.text, 1.0);
        }
      }

      generatedScript.scenes = scenesWithImages;
      setScript(generatedScript);

      setTimeout(() => {
        setProgress({
          step: 'ready',
          progress: 100,
          message: t.statusReady,
        });
        setIsGenerating(false);
      }, 500);
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
        ambientMusicEnabled={ambientMusicEnabled}
        onToggleAmbientMusic={handleToggleAmbientMusic}
      />

      {/* Main Studio Workspace */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
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
        />

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 9:16 Canvas Video Player (5 cols on lg) */}
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

          {/* Right Column: Scene Timeline, YouTube SEO Metadata, & Batch Queue (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Batch Queue Automation */}
            <BatchQueueManager
              lang={uiLang}
              onSelectScriptForPreview={(s) => setScript(s)}
              ambientMusicEnabled={ambientMusicEnabled}
            />

            {/* Scene Visual Cards */}
            <SceneTimeline
              script={script}
              lang={uiLang}
              activeSceneIndex={activeSceneIndex}
              onUpdateSceneImage={handleUpdateSceneImage}
            />

            {/* YouTube Shorts SEO Metadata Dashboard & Direct YouTube Uploader */}
            <MetadataDashboard
              script={script}
              lang={uiLang}
              ambientMusicEnabled={ambientMusicEnabled}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-300">DocuShorts AI • 100% Free Automated YouTube Shorts Generator</span>
          <span className="text-slate-500">Frosted Glass Edition • Supports 4–50 Scenes & Arabic/English Synthesis</span>
        </div>
      </footer>

      {/* Standalone GitHub Pages Modal */}
      <StandaloneModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lang={uiLang}
      />
    </div>
  );
}

