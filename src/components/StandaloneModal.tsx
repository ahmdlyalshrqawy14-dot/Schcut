import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../constants/translations';
import { generateStandaloneHtml } from '../services/standaloneExporter';

interface StandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const StandaloneModal: React.FC<StandaloneModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlContent = generateStandaloneHtml();

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e14]/90 backdrop-blur-2xl border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{t.exportHtmlModalTitle}</h3>
              <p className="text-xs text-slate-400">HTML5 + Tailwind CSS CDN + Vanilla JS + Pollinations AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          <p className="leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/10 text-slate-300">
            {t.exportHtmlModalDesc}
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Preview: index.html ({Math.round(htmlContent.length / 1024)} KB)</span>
              <span className="text-[11px] text-rose-400 font-mono">100% Self-Contained</span>
            </div>
            <pre className="bg-black/40 p-3.5 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto select-all leading-relaxed">
              {htmlContent.slice(0, 1500)}...
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.copyCode}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold shadow-xl shadow-red-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadHtml}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
