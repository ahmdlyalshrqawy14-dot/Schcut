import React, { useState, useEffect } from 'react';
import {
  Mic2,
  KeyRound,
  Globe,
  Sparkles,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Sliders,
  Check
} from 'lucide-react';
import { AzureSpeechConfig, AzureVoiceInfo, Language } from '../types';
import { AzureSpeechService, azureSpeechService } from '../services/azureSpeechService';
import { translations } from '../constants/translations';

interface AzureSpeechSettingsProps {
  lang: Language;
  onConfigChange?: (config: AzureSpeechConfig) => void;
}

export const AzureSpeechSettings: React.FC<AzureSpeechSettingsProps> = ({
  lang,
  onConfigChange,
}) => {
  const t = translations[lang];

  const [config, setConfig] = useState<AzureSpeechConfig>(azureSpeechService.getStoredConfig());
  const [voices, setVoices] = useState<AzureVoiceInfo[]>(AzureSpeechService.DEFAULT_NEURAL_VOICES);
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [testPlaying, setTestPlaying] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Load voices & stored config on mount
  useEffect(() => {
    const saved = azureSpeechService.getStoredConfig();
    setConfig(saved);
    if (saved.apiKey) {
      loadVoices(saved.apiKey, saved.region);
    }
  }, []);

  const loadVoices = async (key: string, region: string) => {
    setIsLoadingVoices(true);
    try {
      const list = await azureSpeechService.fetchAvailableVoices(key, region);
      setVoices(list);
    } catch (err) {
      console.warn('Could not fetch voices:', err);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const updateConfig = (patch: Partial<AzureSpeechConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    azureSpeechService.saveConfig(next);
    if (onConfigChange) onConfigChange(next);
  };

  const handleFetchVoicesClick = () => {
    if (!config.apiKey.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال مفتاح Azure Speech Key أولاً.' : 'Please enter your Azure Speech Key first.');
      return;
    }
    loadVoices(config.apiKey, config.region);
  };

  // Test current selected voice
  const handleTestVoice = async () => {
    if (testPlaying) {
      azureSpeechService.stopPlayback();
      setTestPlaying(false);
      return;
    }

    if (!config.apiKey.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال مفتاح Azure Speech Key أولاً.' : 'Please enter your Azure Speech Key.');
      return;
    }

    setTestPlaying(true);
    setTestStatus(lang === 'ar' ? 'جاري توليد العينة الصوتية...' : 'Synthesizing voice sample...');

    try {
      const sampleText =
        lang === 'ar'
          ? 'مرحباً بكم! هذا صوت وثائقي ذكي عالي النقاء بواسطة تقنية ميكروسوفت أزور.'
          : 'Welcome! This is high fidelity neural documentary narration powered by Microsoft Azure.';

      const result = await azureSpeechService.synthesize(sampleText, {
        voiceName: config.selectedVoice,
        lang,
        apiKey: config.apiKey,
        region: config.region,
        rate: config.speakingRate,
        pitch: config.pitch,
      });

      setTestStatus(
        lang === 'ar'
          ? `تم التوليد بنجاح (${result.durationSeconds.toFixed(1)} ثانية)`
          : `Synthesized successfully (${result.durationSeconds.toFixed(1)}s)`
      );

      azureSpeechService.playAudioBuffer(result.audioBuffer, undefined, () => {
        setTestPlaying(false);
      });
    } catch (err: any) {
      console.error('Azure test error:', err);
      setTestStatus(lang === 'ar' ? 'فشل التوليد: ' + err.message : 'Failed: ' + err.message);
      setTestPlaying(false);
    }
  };

  // Filter voices based on current selected language
  const filteredVoices = voices.filter((v) =>
    lang === 'ar'
      ? v.locale.toLowerCase().startsWith('ar')
      : v.locale.toLowerCase().startsWith('en')
  );

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices;

  return (
    <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-sky-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header with Enable Switch */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-200">
              أصوات Microsoft Azure Neural فائقة النقاء
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تعليق صوتي سينمائي فائق الواقعية مع مزامنة زمنية 100% بالمللي ثانية
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
        </label>
      </div>

      {/* Azure Settings Body */}
      <div className="space-y-4">
        {/* API Key & Region */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Azure Speech API Key</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showGuide ? 'إخفاء الدليل' : 'كيفية الإنشاء مجاناً؟'}</span>
                {showGuide ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            </div>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => updateConfig({ apiKey: e.target.value.trim() })}
              placeholder="مثال: a1b2c3d4e5f67890..."
              className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>المنطقة (Region)</span>
            </label>
            <select
              value={config.region}
              onChange={(e) => updateConfig({ region: e.target.value })}
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

        {/* Quick Guide */}
        {showGuide && (
          <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs space-y-1 text-slate-300 animate-fadeIn">
            <div className="font-bold text-sky-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دليل الحصول على مفتاح Azure Speech مجاناً (500,000 حرف شهرياً):</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              1. افتح Azure Portal وأنشئ حساباً مجانياً (Free Tier).
              <br />
              2. ابحث عن خدمة <strong>Speech service</strong> وأنشئ مورداً جديداً باختيار خطة <strong>Free F0</strong>.
              <br />
              3. انسخ <strong>Key 1</strong> واسم <strong>Location/Region</strong> والصقهما هنا.
            </p>
          </div>
        )}

        {/* Voice Selector & Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>الصوت العصبي المختار ({lang === 'ar' ? 'العربية' : 'English'}):</span>
              </label>
              <button
                type="button"
                onClick={handleFetchVoicesClick}
                disabled={isLoadingVoices}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingVoices ? 'animate-spin' : ''}`} />
                <span>تحديث قائمة الأصوات</span>
              </button>
            </div>

            <select
              value={config.selectedVoice}
              onChange={(e) => updateConfig({ selectedVoice: e.target.value })}
              className="w-full px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {displayVoices.map((v) => (
                <option key={v.shortName} value={v.shortName} className="bg-neutral-900 text-white">
                  {v.displayName || v.shortName} [{v.gender === 'Female' ? 'أنثى' : 'ذكر'}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={!config.apiKey.trim()}
              className="w-full py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {testPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 text-rose-400 fill-current" />
                  <span>إيقاف المعاينة</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
                  <span>استماع لعينة صوتية</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        {testStatus && (
          <div className="text-[11px] font-mono px-3 py-1.5 bg-black/40 rounded-lg border border-white/10 text-slate-300 flex items-center gap-2">
            <Sliders className="w-3 h-3 text-sky-400" />
            <span>{testStatus}</span>
          </div>
        )}

        {/* Info note */}
        <p className="text-[10px] text-slate-400">
          💡 عند تفعيل Azure، سيتم توليد تعليق صوتي حقيقي بصيغة MP3 وقياس طول كل مشهد بالمللي ثانية لضمان تزامن 100% بين الصوت وتأثيرات الصورة والترجمة. في حال عدم إدخاله، يعمل التطبيق تلقائياً بمحرك Web Speech المجاني.
        </p>
      </div>
    </div>
  );
};
