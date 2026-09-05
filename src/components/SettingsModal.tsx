import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Calendar,
  Settings as SettingsIcon,
  Check,
  Globe,
  Mic2,
  Youtube,
  Clock,
  Sparkles,
  Layers,
  Volume2,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Download,
  Upload,
  Save
} from 'lucide-react';
import { AzureSpeechConfig, AzureVoiceInfo, Language, ScheduleConfig, YouTubePrivacy } from '../types';
import { translations } from '../constants/translations';
import { azureSpeechService, AzureSpeechService } from '../services/azureSpeechService';
import { youtubeUploadService } from '../services/youtubeUploadService';
import { schedulerService } from '../services/schedulerService';
import { imageEnginesService, ImageEngineConfig } from '../services/imageEnginesService';
import { soundFxService } from '../services/soundFxService';
import { soundtrackService } from '../services/soundtrackService';
import { geminiClientService } from '../services/geminiClientService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  ambientMusicEnabled: boolean;
  onAmbientMusicToggle: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  ambientMusicEnabled,
  onAmbientMusicToggle,
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'apis' | 'schedule' | 'general'>('apis');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Google Gemini State
  const [geminiApiKey, setGeminiApiKey] = useState(geminiClientService.getStoredApiKey());
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);
  const [showGeminiGuide, setShowGeminiGuide] = useState(false);

  // Azure State
  const [azureConfig, setAzureConfig] = useState<AzureSpeechConfig>(azureSpeechService.getStoredConfig());
  const [azureVoices, setAzureVoices] = useState<AzureVoiceInfo[]>(AzureSpeechService.DEFAULT_NEURAL_VOICES);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [showAzureGuide, setShowAzureGuide] = useState(false);
  const [testPlaying, setTestPlaying] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // YouTube State
  const [ytClientId, setYtClientId] = useState(youtubeUploadService.getStoredClientId());
  const [showYtGuide, setShowYtGuide] = useState(false);
  const [ytChannel, setYtChannel] = useState<any>(null);
  const [isConnectingYt, setIsConnectingYt] = useState(false);

  // Image Engine State
  const [imageConfig, setImageConfig] = useState<ImageEngineConfig>(imageEnginesService.getConfig());

  // Scheduler State
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(schedulerService.getConfig());

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(geminiClientService.getStoredApiKey());
      setAzureConfig(azureSpeechService.getStoredConfig());
      setYtClientId(youtubeUploadService.getStoredClientId());
      setImageConfig(imageEnginesService.getConfig());
      setScheduleConfig(schedulerService.getConfig());
      if (youtubeUploadService.isAuthenticated()) {
        youtubeUploadService.fetchChannelInfo().then(setYtChannel).catch(() => setYtChannel(null));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Test Gemini API Key
  const handleTestGeminiKey = async () => {
    if (!geminiApiKey.trim()) {
      setGeminiStatus(isAr ? '⚠️ يرجى إدخال مفتاح Google Gemini أولاً.' : '⚠️ Please enter a Google Gemini API Key first.');
      return;
    }
    setIsTestingGemini(true);
    setGeminiStatus(isAr ? 'جاري الاتصال والتحقق من المفتاح...' : 'Verifying Google Gemini Key...');
    const result = await geminiClientService.testApiKey(geminiApiKey);
    setIsTestingGemini(false);
    if (result.success) {
      setGeminiStatus(isAr ? '✅ الاتصال ناجح! مفتاح Google Gemini فعال ومستعد لإنشاء السكربتات والأفكار.' : '✅ Connection verified! Google Gemini AI is ready to generate scripts.');
    } else {
      setGeminiStatus(isAr ? `❌ فشل الاتصال: ${result.error || 'تأكد من صحة المفتاح'}` : `❌ Failed: ${result.error || 'Invalid API Key'}`);
    }
  };

  // Azure Voice Fetching
  const handleFetchVoices = async () => {
    if (!azureConfig.apiKey.trim()) {
      alert(isAr ? 'يرجى إدخال مفتاح Azure Speech Key أولاً.' : 'Please enter your Azure Speech Key first.');
      return;
    }
    setIsLoadingVoices(true);
    try {
      const list = await azureSpeechService.fetchAvailableVoices(azureConfig.apiKey, azureConfig.region);
      setAzureVoices(list);
    } catch (e) {
      console.warn('Voice fetch error:', e);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Azure Test Audio
  const handleTestAzureVoice = async () => {
    if (testPlaying) {
      azureSpeechService.stopPlayback();
      setTestPlaying(false);
      return;
    }
    if (!azureConfig.apiKey.trim()) {
      alert(isAr ? 'يرجى إدخال مفتاح Azure Speech Key أولاً.' : 'Please enter Azure Speech Key.');
      return;
    }

    setTestPlaying(true);
    setTestStatus(isAr ? 'جاري توليد العينة الصوتية...' : 'Synthesizing voice sample...');

    try {
      const sampleText = isAr
        ? 'مرحباً بكم! هذا صوت وثائقي ذكي عالي النقاء بواسطة تقنية ميكروسوفت أزور.'
        : 'Welcome! This is high-fidelity neural documentary narration powered by Microsoft Azure.';

      const result = await azureSpeechService.synthesize(sampleText, {
        voiceName: azureConfig.selectedVoice,
        lang,
        apiKey: azureConfig.apiKey,
        region: azureConfig.region,
        rate: azureConfig.speakingRate,
        pitch: azureConfig.pitch,
      });

      setTestStatus(
        isAr
          ? `تم التوليد بنجاح (${result.durationSeconds.toFixed(1)} ثانية)`
          : `Synthesized successfully (${result.durationSeconds.toFixed(1)}s)`
      );

      azureSpeechService.playAudioBuffer(result.audioBuffer, undefined, () => {
        setTestPlaying(false);
      });
    } catch (err: any) {
      setTestStatus(isAr ? 'فشل التوليد: ' + err.message : 'Failed: ' + err.message);
      setTestPlaying(false);
    }
  };

  // YouTube OAuth Login
  const handleConnectYouTube = async () => {
    if (!ytClientId.trim()) {
      alert(isAr ? 'يرجى إدخال Google Client ID أولاً.' : 'Please enter Google Client ID first.');
      return;
    }
    youtubeUploadService.saveClientId(ytClientId.trim());
    setIsConnectingYt(true);

    try {
      const token = await youtubeUploadService.requestAuthToken(ytClientId.trim());
      const channel = await youtubeUploadService.fetchChannelInfo(token);
      setYtChannel(channel);
    } catch (err: any) {
      alert((isAr ? 'فشل تسجيل الدخول بقناة يوتيوب: ' : 'YouTube login failed: ') + (err.message || err));
    } finally {
      setIsConnectingYt(false);
    }
  };

  const handleDisconnectYouTube = () => {
    youtubeUploadService.disconnect();
    setYtChannel(null);
  };

  // Export Settings as JSON
  const handleExportConfig = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      geminiApiKey: geminiApiKey,
      azure: azureConfig,
      youtubeClientId: ytClientId,
      imageEngines: imageConfig,
      schedule: scheduleConfig,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocuShorts_Config_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Settings from JSON
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
        if (data.azure) setAzureConfig(data.azure);
        if (data.youtubeClientId) setYtClientId(data.youtubeClientId);
        if (data.imageEngines) setImageConfig(data.imageEngines);
        if (data.schedule) setScheduleConfig(data.schedule);
        alert(isAr ? 'تم استيراد الإعدادات بنجاح! اضغط على "حفظ كافة الإعدادات" لتثبيتها.' : 'Config imported! Click Save to apply.');
      } catch (err: any) {
        alert(isAr ? 'الملف غير صالح: ' + err.message : 'Invalid JSON config file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Save All Settings
  const handleSaveAll = () => {
    geminiClientService.saveApiKey(geminiApiKey);
    azureSpeechService.saveConfig(azureConfig);
    youtubeUploadService.saveClientId(ytClientId.trim());
    imageEnginesService.saveConfig(imageConfig);
    schedulerService.saveConfig(scheduleConfig);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e14]/95 backdrop-blur-2xl border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/50">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{t.settingsModalTitle}</h3>
              <p className="text-xs text-slate-400">Google Gemini • Azure Speech • YouTube API • Scheduler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 px-4 pt-2 bg-black/20 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('apis')}
            className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'apis'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.tabApis}</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t.tabSchedule}</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t.tabGeneral}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* TAB 1: APIs & INTEGRATIONS */}
          {activeTab === 'apis' && (
            <div className="space-y-6">
              {/* GOOGLE GEMINI AI CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-950/30 to-indigo-950/20 border border-blue-500/20 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-200 text-xs">{t.geminiSectionTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.geminiSectionDesc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeminiGuide(!showGeminiGuide)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showGeminiGuide ? 'إخفاء الدليل' : 'كيفية الحصول على المفتاح'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.geminiApiKeyLabel}</span>
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium underline"
                      >
                        <span>Google AI Studio</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder={t.geminiApiKeyPlaceholder}
                        className="flex-1 px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestGeminiKey}
                        disabled={isTestingGemini}
                        className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
                      >
                        {isTestingGemini ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{t.geminiTestKeyBtn}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">{t.geminiKeySaved}</p>
                  </div>

                  {geminiStatus && (
                    <div className="text-[11px] px-3 py-1.5 bg-black/50 rounded-xl border border-white/10 text-slate-200">
                      {geminiStatus}
                    </div>
                  )}

                  {/* Gemini Guide */}
                  {showGeminiGuide && (
                    <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs space-y-1.5 text-slate-300 animate-fadeIn">
                      <div className="font-bold text-blue-300">{t.geminiKeyGuide}</div>
                      <p className="text-[11px] leading-relaxed">{t.geminiStep1}</p>
                      <p className="text-[11px] leading-relaxed">{t.geminiStep2}</p>
                      <p className="text-[11px] leading-relaxed">{t.geminiStep3}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Generation Multi-Engine AI Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.imageEngineSectionTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.imageEngineSectionDesc}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">{t.imageEngineLabel}</label>
                    <select
                      value={imageConfig.activeEngine}
                      onChange={(e) => setImageConfig({ ...imageConfig, activeEngine: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="pollinations-turbo">{t.imageEnginePollinations}</option>
                      <option value="flux-schnell">{t.imageEngineFlux}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block">{t.imageEngineFallbackLabel}</span>
                      <span className="text-[10px] text-slate-400 block">{t.imageEngineFallbackDesc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={imageConfig.autoFallbackEnabled}
                        onChange={(e) => setImageConfig({ ...imageConfig, autoFallbackEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* YouTube Integration Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.ytUploadSectionTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.ytUploadSectionDesc}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">{t.ytClientIdLabel}</label>
                      <button
                        type="button"
                        onClick={() => setShowYtGuide(!showYtGuide)}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>{t.ytHelpToggle}</span>
                        {showYtGuide ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={ytClientId}
                      onChange={(e) => setYtClientId(e.target.value.trim())}
                      placeholder={t.ytClientIdPlaceholder}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  {/* YouTube Guide */}
                  {showYtGuide && (
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs space-y-1 text-slate-300 animate-fadeIn">
                      <div className="font-bold text-red-300">{t.ytHelpToggle}</div>
                      <p className="text-[11px] leading-relaxed">{t.ytStep1}</p>
                      <p className="text-[11px] leading-relaxed">{t.ytStep2}</p>
                      <p className="text-[11px] leading-relaxed">{t.ytStep3}</p>
                      <p className="text-[11px] leading-relaxed">{t.ytStep4}</p>
                    </div>
                  )}

                  {/* Connection Status & Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {ytChannel ? (
                      <div className="flex items-center gap-2.5 p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                        {ytChannel.avatarUrl && (
                          <img
                            src={ytChannel.avatarUrl}
                            alt="Channel Avatar"
                            className="w-7 h-7 rounded-full border border-emerald-400"
                          />
                        )}
                        <div>
                          <span className="text-emerald-300 font-bold text-xs">{ytChannel.title}</span>
                          <span className="text-[10px] text-emerald-400/80 block">
                            {t.ytConnectedAs} {ytChannel.subscriberCount ? `(${ytChannel.subscriberCount} Subs)` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs">{t.ytNotConnected}</div>
                    )}

                    <div>
                      {ytChannel ? (
                        <button
                          type="button"
                          onClick={handleDisconnectYouTube}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-colors"
                        >
                          {t.ytDisconnectBtn}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConnectYouTube}
                          disabled={isConnectingYt}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Youtube className="w-4 h-4" />
                          <span>{isConnectingYt ? 'Connecting...' : t.ytConnectBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Azure Speech Neural TTS Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Mic2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.azureSectionTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.azureSectionDesc}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={azureConfig.enabled}
                      onChange={(e) => setAzureConfig({ ...azureConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">{t.azureKeyLabel}</label>
                      <button
                        type="button"
                        onClick={() => setShowAzureGuide(!showAzureGuide)}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>{showAzureGuide ? 'إخفاء الدليل' : 'كيفية الإنشاء مجاناً؟'}</span>
                        {showAzureGuide ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <input
                      type="password"
                      value={azureConfig.apiKey}
                      onChange={(e) => setAzureConfig({ ...azureConfig, apiKey: e.target.value.trim() })}
                      placeholder="e.g. 1a2b3c4d5e6f..."
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">{t.azureRegionLabel}</label>
                    <select
                      value={azureConfig.region}
                      onChange={(e) => setAzureConfig({ ...azureConfig, region: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="eastus">eastus (شرق أمريكا)</option>
                      <option value="westeurope">westeurope (غرب أوروبا)</option>
                      <option value="uaenorth">uaenorth (الإمارات)</option>
                      <option value="qatarcentral">qatarcentral (قطر)</option>
                      <option value="southeastasia">southeastasia (سنغافورة)</option>
                      <option value="centralus">centralus (وسط أمريكا)</option>
                    </select>
                  </div>
                </div>

                {/* Azure Guide */}
                {showAzureGuide && (
                  <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs space-y-1 text-slate-300 animate-fadeIn">
                    <div className="font-bold text-sky-300">{t.azureGuideTitle}</div>
                    <p className="text-[11px] leading-relaxed">{t.azureGuide1}</p>
                    <p className="text-[11px] leading-relaxed">{t.azureGuide2}</p>
                    <p className="text-[11px] leading-relaxed">{t.azureGuide3}</p>
                  </div>
                )}

                {/* Voice Selection & Test */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">{t.azureVoiceLabel}</label>
                      <button
                        type="button"
                        onClick={handleFetchVoices}
                        disabled={isLoadingVoices}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingVoices ? 'animate-spin' : ''}`} />
                        <span>تحديث القائمة</span>
                      </button>
                    </div>
                    <select
                      value={azureConfig.selectedVoice}
                      onChange={(e) => setAzureConfig({ ...azureConfig, selectedVoice: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                    >
                      {azureVoices.map((v) => (
                        <option key={v.shortName} value={v.shortName} className="bg-neutral-900 text-white">
                          {v.displayName || v.shortName} [{v.gender === 'Female' ? 'أنثى' : 'ذكر'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleTestAzureVoice}
                      disabled={!azureConfig.apiKey.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {testPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-rose-400 fill-current" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
                          <span>{t.azureTestVoiceBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {testStatus && (
                  <div className="text-[11px] font-mono px-3 py-1.5 bg-black/40 rounded-lg border border-white/10 text-slate-300">
                    {testStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULED PUBLISHING */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.scheduleSectionTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.scheduleSectionDesc}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={scheduleConfig.enabled}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scheduled Time */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.scheduledTimeLabel}</span>
                    </label>
                    <input
                      type="time"
                      value={scheduleConfig.scheduledTime}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Daily Video Count */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>{t.dailyVideosCountLabel}</span>
                      <span className="text-rose-400 font-mono font-bold text-xs">{scheduleConfig.dailyVideoCount} فيديوهات / يومياً</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={scheduleConfig.dailyVideoCount}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, dailyVideoCount: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Images per video */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>{t.imagesPerVideoLabel}</span>
                      <span className="text-rose-400 font-mono font-bold text-xs">{scheduleConfig.imagesPerVideo} صور</span>
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={12}
                      step={1}
                      value={scheduleConfig.imagesPerVideo}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, imagesPerVideo: Number(e.target.value) })}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Privacy Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.ytPrivacyLabel}</span>
                    </label>
                    <select
                      value={scheduleConfig.privacy}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, privacy: e.target.value as YouTubePrivacy })}
                      className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
                    >
                      <option value="public">{t.ytPrivacyPublic}</option>
                      <option value="unlisted">{t.ytPrivacyUnlisted}</option>
                      <option value="private">{t.ytPrivacyPrivate}</option>
                    </select>
                  </div>
                </div>

                {/* Custom Topics Pool */}
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>قائمة المواضيع المخصصة (اختياري - موضوع في كل سطر):</span>
                    <span className="text-[10px] text-slate-400">إذا تُركت فارغة، سيتم التدوير بين مواضيع وثائقية مختارة تلقائياً</span>
                  </label>
                  <textarea
                    rows={4}
                    value={scheduleConfig.customTopicsText}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, customTopicsText: e.target.value })}
                    placeholder={`أسرار الأهرامات\nعجائب المحيطات العميقة\nكوكب المريخ والاستكشاف البشري...`}
                    className="w-full p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-rose-500 focus:outline-none font-sans resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                {/* Language selection */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">{t.uiLangLabel}</h4>
                    <p className="text-[11px] text-slate-400">اختر لغة الواجهة المفضلة</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('ar')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        lang === 'ar' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        lang === 'en' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Ambient Music Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.ambientMusic}</h4>
                      <p className="text-[11px] text-slate-400">موسيقى وثائقية سينمائية تصاحب الفيديو والتسجيل</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ambientMusicEnabled}
                      onChange={(e) => onAmbientMusicToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Sound FX Preview */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{t.soundFxTitle}</h4>
                      <p className="text-[11px] text-slate-400">{t.soundFxDesc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => soundFxService.playSceneTransition()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isAr ? 'تجربة المؤثر (Whoosh)' : 'Test SFX'}</span>
                  </button>
                </div>
              </div>

              {/* Backup & Save Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{t.backupSectionTitle}</h4>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'تصدير كافة المفاتيح والإعدادات وقائمة المواضيع كملف احتياطي أو استعادتها بضغطة زر واحدة.'
                      : 'Export or import your complete configuration, API keys, and topics to JSON.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.exportConfigBtn}</span>
                  </button>

                  <label className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{t.importConfigBtn}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            إغلاق
          </button>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold shadow-xl shadow-red-900/30 flex items-center gap-2 transition-all active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{t.settingsSaved}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{t.saveSettings}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
