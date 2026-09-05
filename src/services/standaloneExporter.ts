/**
 * Generates a complete standalone 100% self-contained index.html
 * built with HTML5, Tailwind CSS CDN, Vanilla JavaScript, and Web APIs
 * designed for 1-click GitHub Pages deployment.
 */
export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocuShorts AI - صانع فيديوهات يوتيوب شورتس الوثائقية التلقائي</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Google Identity Services (GIS) for YouTube Data API v3 -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <!-- Canvas Confetti -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <!-- Google Fonts: Cairo & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Cairo', 'Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body { 
      font-family: 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif;
      background-color: #05070A;
      background-image: radial-gradient(circle at 0% 0%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 100% 100%, #312e81 0%, transparent 50%);
      background-attachment: fixed;
    }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 9999px; backdrop-filter: blur(8px); }
  </style>
</head>
<body class="text-slate-100 min-h-screen antialiased flex flex-col justify-between selection:bg-rose-500 selection:text-white">

  <!-- Header -->
  <header class="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-black/20">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/30 text-white font-black text-xl">
          🎬
        </div>
        <div>
          <h1 class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            DocuShorts AI
          </h1>
          <p id="appSubtitle" class="text-xs text-slate-400">صانع فيديوهات يوتيوب شورتس الوثائقية التلقائي (4-50 مشهد)</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex p-0.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full">
          <button id="langToggleBtn" onclick="toggleLanguage()" class="px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
            <i data-lucide="globe" class="w-3.5 h-3.5 text-rose-400"></i>
            <span id="langBtnText">English</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">

    <!-- 🎬 Unified Split Generator & Dynamic Batch Cards Studio -->
    <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      
      <!-- Top Action Bar: Production Language + Split Button with Dropdown (1 to 6 videos) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <!-- Production Language Selector -->
        <div class="flex items-center gap-2">
          <label id="videoLangLabel" class="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 shrink-0">
            <i data-lucide="globe" class="w-3.5 h-3.5 text-rose-400"></i>
            <span id="videoLangText">لغة الصوت والسيناريو:</span>
          </label>
          <div class="flex gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              id="vLangArBtn"
              onclick="setVideoLanguage('ar')"
              class="py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-gradient-to-r from-red-600 to-rose-600 border-rose-400/50 text-white shadow-md"
            >
              <span>🇸🇦 العربية</span>
            </button>
            <button
              type="button"
              id="vLangEnBtn"
              onclick="setVideoLanguage('en')"
              class="py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            >
              <span>🇬🇧 English</span>
            </button>
          </div>
        </div>

        <!-- 🚀 Split Button with 1-6 Videos Dropdown -->
        <div class="relative inline-flex items-center self-stretch sm:self-auto shadow-2xl rounded-2xl">
          <!-- Main Action Button -->
          <button 
            id="mainProduceBtn" 
            type="button"
            onclick="startBatchProduction()" 
            class="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-98 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 rounded-s-2xl shadow-xl shadow-red-900/30 hover:scale-[1.01]"
          >
            <i data-lucide="video" class="w-5 h-5"></i>
            <span id="mainProduceBtnText">بدء الإنتاج (1 فيديو)</span>
          </button>

          <!-- Dropdown Trigger Arrow -->
          <button
            id="batchDropdownToggle"
            type="button"
            onclick="toggleBatchDropdown(event)"
            title="اختر عدد الفيديوهات (1 إلى 6)"
            class="px-3.5 py-3.5 bg-rose-700 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center rounded-e-2xl border-s border-rose-500/40 shadow-xl"
          >
            <i data-lucide="chevron-down" id="batchDropdownChevron" class="w-4 h-4 transition-transform duration-200"></i>
          </button>

          <!-- Dropdown Menu (1 to 6 videos) -->
          <div
            id="batchDropdownMenu"
            class="hidden absolute top-full mt-2 end-0 z-50 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl space-y-1 text-xs"
          >
            <div id="batchDropdownTitle" class="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
              <span>عدد الفيديوهات المطلوبة</span>
              <span class="text-rose-400 font-mono">1-6</span>
            </div>
            <button type="button" onclick="setBatchVideoCount(1)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>🎬</span> <span>1 فيديو (مفرد)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Single</span>
            </button>
            <button type="button" onclick="setBatchVideoCount(2)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>⚡</span> <span>2 فيديوهات (دفعة)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Batch 2</span>
            </button>
            <button type="button" onclick="setBatchVideoCount(3)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>⚡</span> <span>3 فيديوهات (دفعة)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Batch 3</span>
            </button>
            <button type="button" onclick="setBatchVideoCount(4)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>⚡</span> <span>4 فيديوهات (دفعة)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Batch 4</span>
            </button>
            <button type="button" onclick="setBatchVideoCount(5)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>⚡</span> <span>5 فيديوهات (دفعة)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Batch 5</span>
            </button>
            <button type="button" onclick="setBatchVideoCount(6)" class="w-full px-3 py-2 rounded-xl text-start hover:bg-rose-600/20 hover:text-rose-300 text-slate-200 font-medium flex items-center justify-between transition-colors">
              <span class="flex items-center gap-2"><span>⚡</span> <span>6 فيديوهات (دفعة)</span></span>
              <span class="text-[10px] text-slate-400 font-mono">Batch 6</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 📊 Global Sequential Batch Progress Banner (Hidden when idle) -->
      <div id="batchProgressBanner" class="hidden p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-black/60 border border-rose-500/30 backdrop-blur-xl shadow-2xl space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span id="batchProgressMainStatus" class="font-bold text-slate-100">جاري إنتاج ومعالجة الفيديو 1 من 3...</span>
          </div>
          <span id="batchProgressPct" class="font-mono text-rose-400 font-bold">0%</span>
        </div>
        <div class="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div id="batchProgressBarFill" class="h-full bg-gradient-to-r from-red-600 via-rose-600 to-emerald-500 rounded-full transition-all duration-300 w-0"></div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span id="batchProgressSubStatus" class="flex items-center gap-1.5">
            <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin text-rose-400"></i>
            <span>توليد السيناريو والوسائط عبر الذكاء الاصطناعي...</span>
          </span>
          <span id="batchCompletedCount" class="font-mono text-emerald-400 font-bold">0 / 1 مكتمل</span>
        </div>
      </div>

      <!-- 🎴 Dynamic Vertical Input Cards Container (Card 1 to Card N) -->
      <div id="dynamicBatchCardsContainer" class="space-y-4">
        <!-- Cards dynamically injected here by renderDynamicBatchCards() -->
      </div>

      <!-- Quick Topics Suggestions Bar -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 pt-2 border-t border-white/10">
        <span id="tryPresetsText" class="whitespace-nowrap font-bold text-slate-500 text-[10px] uppercase tracking-wider">أفكار مقترحة سريعة:</span>
        <button type="button" onclick="applyQuickTopicToFirstCard('أسرار الثقوب السوداء والزمكان')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap">🌌 الثقوب السوداء</button>
        <button type="button" onclick="applyQuickTopicToFirstCard('كيف بُنيت أهرامات الجيزة بدقة هندسية حيرت العالم؟')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap">🏛️ أسرار الأهرامات</button>
        <button type="button" onclick="applyQuickTopicToFirstCard('كائنات غامضة ومخيفة تعيش في خندق ماريانا')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap">🌊 خندق ماريانا</button>
        <button type="button" onclick="applyQuickTopicToFirstCard('غرائب فيزياء الكم: التشابك الكمي')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap">⚛️ فيزياء الكم</button>
      </div>

    </div>

    <!-- Main Studio Workspace (Split Grid) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      <!-- Left Column: 9:16 Canvas Player with Gated Privacy (5 cols on lg) -->
      <div class="lg:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col items-center shadow-2xl space-y-4 sticky top-20">
        <div class="w-full flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <h2 id="previewTitle" class="font-bold text-xs uppercase tracking-widest text-slate-300">معاينة الفيديو (9:16 Shorts)</h2>
          </div>
          <div class="flex items-center gap-2">
            <button id="lockToggleBtn" onclick="togglePreviewLock()" class="hidden px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10 items-center gap-1.5 backdrop-blur-md transition-all">
              <i data-lucide="eye" id="lockToggleIcon" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span id="lockToggleText">فتح المعاينة</span>
            </button>
            <span class="text-[11px] bg-white/5 text-rose-300 font-mono font-semibold px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-md">720x1280 • 9:16</span>
          </div>
        </div>

        <!-- Canvas Container with 9:16 vertical ratio -->
        <div class="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] bg-black rounded-[2.5rem] border-[6px] border-white/10 shadow-2xl overflow-hidden group">
          <canvas id="videoCanvas" width="720" height="1280" class="w-full h-full object-cover block cursor-pointer transition-all duration-500" onclick="onCanvasClicked()"></canvas>

          <!-- 🔒 Privacy Gated Mask Overlay (Shown when preview is locked) -->
          <div id="privacyOverlay" class="hidden absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-md space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-xl">
              <i data-lucide="shield-check" class="w-7 h-7"></i>
            </div>
            <div class="space-y-1">
              <h3 id="privacyTitleText" class="font-bold text-sm text-slate-100">تم تجهيز الفيديو وحمايته</h3>
              <p id="privacyDescText" class="text-[11px] text-slate-300 leading-relaxed max-w-[240px]">
                تم توليد جميع المشاهد بنجاح. اضغط على الزر أدناه لتأكيد العرض وبدء المشاهدة.
              </p>
            </div>
            <button 
              onclick="unlockAndPlay()" 
              class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-xs font-bold shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 transition-all"
            >
              <i data-lucide="unlock" class="w-4 h-4"></i>
              <span id="unlockBtnText">تأكيد لعرض الفيديو</span>
            </button>
            <button 
              onclick="startVideoRecording()" 
              class="text-[11px] text-slate-400 hover:text-slate-200 underline flex items-center gap-1 transition-colors"
            >
              <i data-lucide="download" class="w-3 h-3"></i>
              <span id="directDownloadText">أو التحميل المباشر الآن</span>
            </button>
          </div>

          <!-- Center Play Overlay Button -->
          <button 
            id="centerPlayBtn"
            onclick="togglePlay()" 
            class="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md transition-all scale-100 hover:scale-110 shadow-2xl border border-white/30 hidden"
          >
            <i data-lucide="play" id="centerPlayIcon" class="w-7 h-7 ml-0.5 fill-white text-white"></i>
          </button>
        </div>

        <!-- Output Filename Badge -->
        <div id="outputFilenameBadge" class="hidden w-full text-center px-2">
          <span id="outputFilenameText" class="text-[11px] text-slate-400 font-mono bg-black/40 px-3 py-1 rounded-xl border border-white/5 truncate max-w-full inline-block">
            💾 DocuShorts_video.webm
          </span>
        </div>

        <!-- Video Controls Bar -->
        <div class="w-full space-y-3 pt-1">
          <!-- Timeline Slider -->
          <div class="flex items-center gap-3">
            <span id="currentTimeLabel" class="text-xs font-mono text-slate-400 w-10 text-center">00:00</span>
            <input 
              type="range" 
              id="timeSlider" 
              min="0" 
              max="24" 
              value="0" 
              step="0.05" 
              oninput="seekVideo(this.value)"
              class="flex-1 accent-rose-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
            />
            <span id="totalDurationLabel" class="text-xs font-mono text-slate-400 w-10 text-center">00:24</span>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button onclick="togglePlay()" id="playPauseBtn" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 backdrop-blur-md transition-colors shadow-sm">
                <i data-lucide="play" id="playIcon" class="w-4 h-4 text-rose-400 fill-rose-400"></i>
              </button>
              <button onclick="restartVideo()" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 backdrop-blur-md transition-colors shadow-sm" title="Replay">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              </button>
              <button onclick="togglePlaybackSpeed()" id="speedBtn" class="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 text-xs font-bold font-mono backdrop-blur-md transition-colors shadow-sm">
                1.0x
              </button>
            </div>

            <!-- Record & Export Video Button -->
            <button 
              id="exportVideoBtn"
              onclick="startVideoRecording()" 
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-900/30 hover:scale-[1.02] flex items-center gap-2 transition-all"
            >
              <i data-lucide="download" class="w-4 h-4"></i>
              <span id="exportVideoText">تسجيل وتحميل الفيديو</span>
            </button>
          </div>
        </div>

        <!-- 🎙️ Microsoft Azure Speech Neural Settings Panel -->
        <div class="w-full bg-white/5 backdrop-blur-xl border border-sky-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                <i data-lucide="mic-2" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="font-bold text-xs uppercase tracking-widest text-slate-200">أصوات Azure Neural فائقة النقاء</h3>
                <p class="text-[10px] text-slate-400">مزامنة 100% بالمللي ثانية بين الصوت والمشاهد</p>
              </div>
            </div>

            <!-- Azure Enable Switch -->
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                id="azureEnableToggle"
                onchange="toggleAzureSpeech(this.checked)"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
            </label>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <i data-lucide="key" class="w-3 h-3 text-amber-400"></i>
                  <span>Azure Speech Key</span>
                </label>
                <input
                  type="password"
                  id="azureKeyInput"
                  placeholder="مفتاح Azure Speech Key..."
                  onchange="saveAzureConfig()"
                  class="w-full px-3 py-1.5 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <i data-lucide="globe" class="w-3 h-3 text-sky-400"></i>
                  <span>المنطقة (Region)</span>
                </label>
                <select
                  id="azureRegionSelect"
                  onchange="saveAzureConfig()"
                  class="w-full px-3 py-1.5 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="eastus">eastus (شرق أمريكا)</option>
                  <option value="westeurope">westeurope (غرب أوروبا)</option>
                  <option value="uaenorth">uaenorth (الإمارات)</option>
                  <option value="qatarcentral">qatarcentral (قطر)</option>
                  <option value="southeastasia">southeastasia (سنغافورة)</option>
                </select>
              </div>
            </div>

            <!-- Voice Selection & Test -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <i data-lucide="volume-2" class="w-3 h-3 text-sky-400"></i>
                  <span>الصوت العصبي (Neural Voice)</span>
                </label>
                <button
                  type="button"
                  onclick="fetchAzureVoicesList()"
                  class="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                >
                  <i data-lucide="refresh-cw" class="w-2.5 h-2.5"></i>
                  <span>جلب الأصوات المتاحة</span>
                </button>
              </div>

              <div class="flex gap-2">
                <select
                  id="azureVoiceSelect"
                  onchange="saveAzureConfig()"
                  class="flex-1 px-3 py-1.5 bg-black/40 rounded-xl border border-white/10 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ar-EG-SalmaNeural">Salma (سلمى - مصر - أنثى)</option>
                  <option value="ar-EG-ShakirNeural">Shakir (شاكر - مصر - ذكر)</option>
                  <option value="ar-SA-HamedNeural">Hamed (حامد - السعودية - ذكر)</option>
                  <option value="ar-SA-ZariyahNeural">Zariyah (زارية - السعودية - أنثى)</option>
                  <option value="en-US-JennyNeural">Jenny (US - Storyteller)</option>
                  <option value="en-US-GuyNeural">Guy (US - Documentary)</option>
                  <option value="en-US-ChristopherNeural">Christopher (US - Deep Voice)</option>
                </select>

                <button
                  type="button"
                  id="azureTestBtn"
                  onclick="testAzureVoiceSample()"
                  class="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                >
                  <i data-lucide="play" class="w-3 h-3 fill-current"></i>
                  <span>تجربة الصوت</span>
                </button>
              </div>
            </div>

            <p class="text-[10px] text-slate-400 leading-tight">
              💡 يقيس هذا المحرك طول كل مشهد صوتي بالمللي ثانية لتبديل اللقطات وتأثيرات الكانفاس بدون أي ترحيل زمني.
            </p>
          </div>
        </div>

      </div>

      <!-- Right Column: Scenes & YouTube Metadata Dashboard (7 cols on lg) -->
      <div class="lg:col-span-7 space-y-6">

        <!-- Scene Cards Container (Dynamic 4 to 50 scenes) -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 id="scenesTitle" class="font-bold text-xs uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <i data-lucide="film" class="w-4 h-4 text-rose-400"></i>
              <span>مشاهد الفيديو والسيناريو</span>
            </h3>
            <span id="scenesCountTag" class="text-xs text-rose-300 font-mono">4 Scenes • Ken Burns Effect</span>
          </div>

          <div id="scenesContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
            <!-- Dynamically populated scene cards -->
          </div>
        </div>

        <!-- 🚀 YouTube Direct API v3 Upload Panel -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-900/30">
                <i data-lucide="youtube" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 id="ytUploadCardTitle" class="font-bold text-xs uppercase tracking-widest text-slate-200">الرفع المباشر إلى يوتيوب (YouTube Data API v3)</h3>
                <p id="ytUploadCardSub" class="text-xs text-slate-400 mt-0.5">نشر تلقائي بدون مغادرة الصفحة عبر Google OAuth 2.0</p>
              </div>
            </div>
            <div id="ytAuthBadge" class="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">
              <span class="w-2 h-2 rounded-full bg-slate-500"></span>
              <span id="ytAuthStatusText">غير متصل</span>
            </div>
          </div>

          <!-- OAuth Setup & Connection Bar -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label id="ytClientIdLabel" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="key" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>Google OAuth Client ID</span>
              </label>
              <input
                type="text"
                id="ytClientIdInput"
                placeholder="apps.googleusercontent.com..."
                onchange="saveYtClientId(this.value)"
                class="w-full bg-black/40 border border-white/10 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none font-mono"
              />
            </div>

            <div class="flex items-end">
              <button
                type="button"
                id="ytAuthBtn"
                onclick="handleYtAuth()"
                class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/10 shadow-sm"
              >
                <i data-lucide="log-in" class="w-4 h-4 text-rose-400"></i>
                <span id="ytAuthBtnText">تسجيل الدخول بقناة يوتيوب</span>
              </button>
            </div>
          </div>

          <!-- Channel Info (Hidden when disconnected) -->
          <div id="ytChannelBox" class="hidden p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div id="ytAvatar" class="w-10 h-10 rounded-full bg-red-600/30 flex items-center justify-center text-red-300 font-bold overflow-hidden border border-red-400/30">
                <i data-lucide="tv" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 id="ytChannelTitle" class="text-xs font-bold text-slate-100">My YouTube Channel</h4>
                <p id="ytChannelScope" class="text-[10px] text-emerald-400 flex items-center gap-1">
                  <i data-lucide="check-circle" class="w-3 h-3"></i>
                  <span>تصريح الرفع نشط (youtube.upload)</span>
                </p>
              </div>
            </div>
            <button onclick="handleYtDisconnect()" class="text-xs text-slate-400 hover:text-rose-400 p-1">
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Upload Options (Privacy & Category) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div class="space-y-1">
              <label id="ytPrivacyLabel" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <i data-lucide="shield" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>مستوى الخصوصية</span>
              </label>
              <select id="ytPrivacySelect" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none">
                <option value="public" selected>🌐 علني (Public - مباشر للجمهور)</option>
                <option value="unlisted">🔗 غير مدرج (Unlisted - برابط فقط)</option>
                <option value="private">🔒 خاص (Private - للمعاينة)</option>
              </select>
            </div>
            <div class="space-y-1">
              <label id="ytCatLabel" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <i data-lucide="folder" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>فئة يوتيوب</span>
              </label>
              <select id="ytCatSelect" class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none">
                <option value="28" selected>العلوم والتكنولوجيا (Science & Tech)</option>
                <option value="27">التعليم (Education)</option>
                <option value="24">الترفيه (Entertainment)</option>
                <option value="22">الناس والمدونات (People & Blogs)</option>
              </select>
            </div>
          </div>

          <!-- Upload Progress & Status -->
          <div id="ytUploadProgressBox" class="hidden space-y-2 p-3 bg-black/50 border border-rose-500/30 rounded-2xl">
            <div class="flex justify-between items-center text-xs">
              <span id="ytUploadStatusLabel" class="text-rose-400 font-semibold flex items-center gap-1.5">
                <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>
                <span id="ytUploadStatusSpan">جاري معالجة ورفع الفيديو...</span>
              </span>
              <span id="ytUploadPct" class="font-mono text-slate-300 font-bold">0%</span>
            </div>
            <div class="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div id="ytUploadProgressBar" class="h-full bg-gradient-to-r from-red-600 via-rose-600 to-rose-400 rounded-full transition-all duration-200 w-0"></div>
            </div>
          </div>

          <!-- Success Alert Card -->
          <div id="ytSuccessBox" class="hidden p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <i data-lucide="check-circle-2" class="w-6 h-6"></i>
              </div>
              <div>
                <h4 id="ytSuccessTitle" class="text-xs font-bold text-emerald-300">تم رفع الفيديو بنجاح إلى YouTube Shorts!</h4>
                <p id="ytSuccessSub" class="text-[11px] text-slate-300">الفيديو متاح الآن في قناتك وفق إعدادات الخصوصية المحددة.</p>
              </div>
            </div>
            <a id="ytWatchLink" href="#" target="_blank" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap transition-all">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span>مشاهدة الفيديو</span>
            </a>
          </div>

          <!-- Main 1-Click Upload Action Button -->
          <button
            type="button"
            id="ytUploadBtn"
            onclick="startDirectYouTubeUpload()"
            class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 hover:from-red-500 hover:to-rose-400 active:scale-95 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-900/30 hover:scale-[1.01]"
          >
            <i data-lucide="upload-cloud" class="w-5 h-5"></i>
            <span id="ytUploadBtnText">نشر ورفع الفيديو مباشرة إلى YouTube Shorts</span>
          </button>
        </div>

        <!-- YouTube Shorts SEO Metadata Dashboard -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 id="metadataHeaderTitle" class="font-bold text-xs uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <i data-lucide="trending-up" class="w-4 h-4 text-rose-500"></i>
                <span>بيانات يوتيوب شورتس المحسنة (SEO)</span>
              </h3>
              <p id="metadataSubtitle" class="text-xs text-slate-400 mt-0.5">جاهزة للنسخ المباشر إلى YouTube Studio لزيادة الانتشار</p>
            </div>
          </div>

          <!-- Viral Title Card -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span id="viralTitleLabel" class="font-semibold text-slate-300">العنوان الجذاب (Viral Title)</span>
              <button onclick="copyField('ytTitleValue', this)" class="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>نسخ</span>
              </button>
            </div>
            <div id="ytTitleValue" class="p-3 bg-black/40 rounded-2xl border border-white/10 text-sm font-bold text-rose-300 select-all">
              أسرار الكون الغامضة 🤯 #Shorts
            </div>
          </div>

          <!-- SEO Description & Hashtags -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span id="seoDescLabel" class="font-semibold text-slate-300">الوصف الكامل والهاشتاجات (SEO Description)</span>
              <button onclick="copyField('ytDescValue', this)" class="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>نسخ</span>
              </button>
            </div>
            <textarea id="ytDescValue" rows="4" readonly class="w-full p-3 bg-black/40 rounded-2xl border border-white/10 text-xs text-slate-300 select-all resize-none outline-none leading-relaxed font-sans">اكتشف في هذا الفيديو أسراراً مذهلة...\n\n#Shorts #وثائقي #علوم #حقائق</textarea>
          </div>

          <!-- Keywords & Tags -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span id="tagsLabel" class="font-semibold text-slate-300">الكلمات المفتاحية (Tags)</span>
              <button onclick="copyField('ytTagsValue', this)" class="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>نسخ</span>
              </button>
            </div>
            <div id="ytTagsValue" class="p-2.5 bg-black/40 rounded-2xl border border-white/10 text-xs text-slate-400 select-all leading-relaxed">
              Shorts, وثائقي, حقائق, علوم, أسرار, DocuShorts
            </div>
          </div>

          <!-- Upload Guidelines & Setting Card -->
          <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-xs space-y-2">
            <div class="font-bold text-rose-400 flex items-center gap-1.5">
              <i data-lucide="info" class="w-4 h-4"></i>
              <span id="tipsHeader">إرشادات ضبط الرفع على يوتيوب:</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div>• <strong id="catText">الفئة:</strong> <span id="ytCategoryValue">التعليم والعلوم (Education & Science)</span></div>
              <div>• <strong id="audText">الجمهور:</strong> <span id="ytAudienceValue">Not made for kids</span></div>
            </div>
          </div>

          <!-- Social Share Bar -->
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button onclick="openYouTubeStudio()" class="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all">
              <i data-lucide="youtube" class="w-4 h-4"></i>
              <span>YouTube Studio</span>
            </button>
            <button onclick="shareOnTwitter()" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors">
              <i data-lucide="twitter" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>X (Twitter)</span>
            </button>
            <button onclick="shareOnWhatsApp()" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors">
              <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/10 bg-white/5 backdrop-blur-xl py-4 text-center text-xs text-slate-400">
    <p>DocuShorts AI • 100% Free Automated YouTube Shorts Generator • Single File GitHub Pages Edition</p>
  </footer>

  <!-- Vanilla JavaScript Logic -->
  <script>
    // State
    let uiLang = 'ar';
    let videoLang = 'ar';
    let targetSceneCount = 4;
    let isGenerating = false;
    let isPreviewUnlocked = false;
    let isPlaying = false;
    let currentTime = 0;
    let playbackRate = 1.0;
    let totalDuration = 24;
    let currentScript = null;
    let animationFrameId = null;
    let lastTimestamp = null;
    let loadedImages = [];
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;

    // Audio & Sync State
    let audioCtx = null;
    let activeAudioSource = null;
    let sceneStartTimes = [];
    let isAutoUploadActive = false;

    // Azure Speech State
    let azureConfig = {
      enabled: false,
      key: '',
      region: 'eastus',
      voice: 'ar-EG-SalmaNeural'
    };

    // Dynamic Batch Production State
    let batchVideoCount = 1;
    let batchCardsData = [
      { topic: 'أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت', sceneCount: 4, fileName: '' }
    ];
    let isBatchRunning = false;

    // Presets
    const topicsAr = [
      'أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت',
      'كيف بُنيت الأهرامات بدقة هندسية حيرت العلماء؟',
      'كائنات غامضة ومخيفة تعيش في خندق ماريانا المظلم',
      'غرائب فيزياء الكم وتفسير التشابك الكمي',
      'لغز حريق مكتبة الإسكندرية وما فقدته البشرية',
      'اكتشافات تلسكوب جيمس ويب في أعماق الكون'
    ];
    const topicsEn = [
      'Secrets of Supermassive Black Holes & Time Distortion',
      'The Lost Ancient Engineering Behind the Great Pyramids',
      'Terrifying Bioluminescent Creatures of the Mariana Trench',
      'Quantum Entanglement and the Paradox of Reality',
      'The Great Mystery of the Burning of Library of Alexandria',
      'Mind-Blowing Deep Space Discoveries from James Webb Telescope'
    ];

    // Canvas setup
    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');

    // Initialize Lucide icons & configs
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      initAudioContext();
      initSavedSettings();
      drawPlaceholderCanvas();
      renderDynamicBatchCards();
      updateProduceBtnLabel();
    });

    function initAudioContext() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !audioCtx) {
        audioCtx = new AudioContextClass();
      }
    }

    function initSavedSettings() {
      // Azure
      const key = localStorage.getItem('azure_speech_key');
      const region = localStorage.getItem('azure_speech_region') || 'eastus';
      const voice = localStorage.getItem('azure_speech_voice') || 'ar-EG-SalmaNeural';
      const enabled = localStorage.getItem('azure_speech_enabled') === 'true';

      azureConfig = { key: key || '', region: region, voice: voice, enabled: enabled };

      const keyInp = document.getElementById('azureKeyInput');
      const regSel = document.getElementById('azureRegionSelect');
      const voiSel = document.getElementById('azureVoiceSelect');
      const enTog = document.getElementById('azureEnableToggle');

      if (keyInp && key) keyInp.value = key;
      if (regSel) regSel.value = region;
      if (voiSel) voiSel.value = voice;
      if (enTog) enTog.checked = enabled;

      // Auto Upload
      const autoUp = localStorage.getItem('yt_auto_upload') === 'true';
      isAutoUploadActive = autoUp;
      const autoUpTog = document.getElementById('queueAutoUploadToggle');
      if (autoUpTog) autoUpTog.checked = autoUp;

      // YouTube Client ID
      const savedClientId = localStorage.getItem('yt_client_id');
      if (savedClientId) {
        const inp = document.getElementById('ytClientIdInput');
        if (inp) inp.value = savedClientId;
      }
    }

    function saveAzureConfig() {
      const keyInp = document.getElementById('azureKeyInput');
      const regSel = document.getElementById('azureRegionSelect');
      const voiSel = document.getElementById('azureVoiceSelect');

      if (keyInp) azureConfig.key = keyInp.value.trim();
      if (regSel) azureConfig.region = regSel.value;
      if (voiSel) azureConfig.voice = voiSel.value;

      localStorage.setItem('azure_speech_key', azureConfig.key);
      localStorage.setItem('azure_speech_region', azureConfig.region);
      localStorage.setItem('azure_speech_voice', azureConfig.voice);
    }

    function toggleAzureSpeech(val) {
      azureConfig.enabled = !!val;
      localStorage.setItem('azure_speech_enabled', azureConfig.enabled ? 'true' : 'false');
      saveAzureConfig();
    }

    function toggleAutoUpload(val) {
      isAutoUploadActive = !!val;
      localStorage.setItem('yt_auto_upload', isAutoUploadActive ? 'true' : 'false');
    }

    async function fetchAzureVoicesList() {
      saveAzureConfig();
      if (!azureConfig.key) {
        alert(uiLang === 'ar' ? 'يرجى إدخال Azure Speech Key أولاً!' : 'Please enter your Azure Speech Key first!');
        return;
      }

      try {
        const res = await fetch(\`https://\${azureConfig.region}.tts.speech.microsoft.com/cognitiveservices/voices/list\`, {
          headers: { 'Ocp-Apim-Subscription-Key': azureConfig.key }
        });
        if (!res.ok) throw new Error('Failed to fetch voices: ' + res.statusText);
        const voices = await res.json();
        const prefix = videoLang === 'ar' ? 'ar-' : 'en-';
        const filtered = voices.filter(v => v.Locale && v.Locale.startsWith(prefix) && v.VoiceType === 'Neural');

        if (filtered.length > 0) {
          const select = document.getElementById('azureVoiceSelect');
          select.innerHTML = '';
          filtered.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.ShortName;
            opt.textContent = \`\${v.LocalName || v.DisplayName} (\${v.ShortName})\`;
            select.appendChild(opt);
          });
          select.value = filtered[0].ShortName;
          azureConfig.voice = filtered[0].ShortName;
          localStorage.setItem('azure_speech_voice', azureConfig.voice);
          alert(uiLang === 'ar' ? \`تم جلب \${filtered.length} صوت عصبي بنجاح!\` : \`Successfully fetched \${filtered.length} neural voices!\`);
        }
      } catch (err) {
        console.warn('Azure voice list fetch fallback:', err);
        alert(uiLang === 'ar' ? 'تعذر جلب الأصوات مباشرة من السحابة، تم الإبقاء على قائمة الأصوات الافتراضية.' : 'Could not fetch voices list directly, retaining standard neural list.');
      }
    }

    async function synthesizeAzureSpeechBuffer(text, voice, region, key) {
      if (!key) throw new Error('Missing Azure Key');
      const ssml = \`<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='\${voice}'>\${text}</voice></speak>\`;
      const res = await fetch(\`https://\${region}.tts.speech.microsoft.com/cognitiveservices/v1\`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
        },
        body: ssml
      });

      if (!res.ok) {
        throw new Error('Azure TTS API error: ' + res.status + ' ' + res.statusText);
      }

      const arrayBuf = await res.arrayBuffer();
      initAudioContext();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);
      return {
        audioBuffer: decodedBuffer,
        duration: decodedBuffer.duration
      };
    }

    async function testAzureVoiceSample() {
      saveAzureConfig();
      if (!azureConfig.key) {
        alert(uiLang === 'ar' ? 'يرجى إدخال مفتاح Azure Speech Key أولاً!' : 'Please enter your Azure Speech Key first!');
        return;
      }

      const btn = document.getElementById('azureTestBtn');
      btn.disabled = true;
      btn.classList.add('opacity-75');

      const sampleText = videoLang === 'ar' 
        ? 'مرحباً بكم، هذا نموذج تجريبي لصوت الذكاء الاصطناعي فائق النقاء بدقة ومزامنة تامة.' 
        : 'Welcome! This is a crystal clear neural voice test generated with Azure Cognitive Services.';

      try {
        const result = await synthesizeAzureSpeechBuffer(sampleText, azureConfig.voice, azureConfig.region, azureConfig.key);
        initAudioContext();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const source = audioCtx.createBufferSource();
        source.buffer = result.audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
      } catch (e) {
        console.error('Azure test error:', e);
        alert(uiLang === 'ar' ? 'فشل اختبار الصوت: ' + e.message : 'Voice test failed: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-75');
      }
    }

    // Language Toggle
    function toggleLanguage() {
      uiLang = uiLang === 'ar' ? 'en' : 'ar';
      document.documentElement.lang = uiLang;
      document.documentElement.dir = uiLang === 'ar' ? 'rtl' : 'ltr';

      document.getElementById('langBtnText').textContent = uiLang === 'ar' ? 'English' : 'عربي';
      document.getElementById('appSubtitle').textContent = uiLang === 'ar' 
        ? 'صانع فيديوهات يوتيوب شورتس الوثائقية التلقائي (4-15 مشهد)' 
        : 'Automated YouTube Shorts Documentary Generator (4-15 Scenes)';
      
      const vLangLabel = document.getElementById('videoLangText');
      if (vLangLabel) vLangLabel.textContent = uiLang === 'ar' ? 'لغة الصوت والسيناريو:' : 'Voice & Script Language:';

      const dTitle = document.getElementById('batchDropdownTitle');
      if (dTitle) {
        dTitle.innerHTML = '<span>' + (uiLang === 'ar' ? 'عدد الفيديوهات المطلوبة' : 'Select Video Count') + '</span> <span class="text-rose-400 font-mono">1-6</span>';
      }

      document.getElementById('previewTitle').textContent = uiLang === 'ar' ? 'معاينة الفيديو (9:16 Shorts)' : 'Video Preview (9:16 Shorts)';
      document.getElementById('exportVideoText').textContent = uiLang === 'ar' ? 'تسجيل وتحميل الفيديو' : 'Record & Export Video';
      document.getElementById('scenesTitle').innerHTML = '<i data-lucide="film" class="w-4 h-4 text-rose-400"></i> <span>' + (uiLang === 'ar' ? 'مشاهد الفيديو والسيناريو' : 'Generated Scenes & Script') + '</span>';
      document.getElementById('metadataHeaderTitle').innerHTML = '<i data-lucide="trending-up" class="w-4 h-4 text-rose-500"></i> <span>' + (uiLang === 'ar' ? 'بيانات يوتيوب شورتس المحسنة (SEO)' : 'YouTube Shorts SEO Metadata') + '</span>';
      document.getElementById('unlockBtnText').textContent = uiLang === 'ar' ? 'تأكيد لعرض الفيديو' : 'Confirm & Unlock Preview';
      document.getElementById('directDownloadText').textContent = uiLang === 'ar' ? 'أو التحميل المباشر الآن' : 'Or Direct Download Now';
      
      updateProduceBtnLabel();
      renderDynamicBatchCards();
      lucide.createIcons();
    }

    function setVideoLanguage(lang) {
      videoLang = lang;
      const arBtn = document.getElementById('vLangArBtn');
      const enBtn = document.getElementById('vLangEnBtn');
      if (lang === 'ar') {
        arBtn.className = 'py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-gradient-to-r from-red-600 to-rose-600 border-rose-400/50 text-white shadow-md';
        enBtn.className = 'py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200';
      } else {
        enBtn.className = 'py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-gradient-to-r from-red-600 to-rose-600 border-rose-400/50 text-white shadow-md';
        arBtn.className = 'py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200';
      }
    }

    function togglePlaybackSpeed() {
      playbackRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
      document.getElementById('speedBtn').textContent = playbackRate + 'x';
    }

    // ==========================================
    // 🎴 Dynamic Batch Cards & Split Button Logic
    // ==========================================
    function toggleBatchDropdown(event) {
      if (event) event.stopPropagation();
      const menu = document.getElementById('batchDropdownMenu');
      const chevron = document.getElementById('batchDropdownChevron');
      if (menu) {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
          menu.classList.remove('hidden');
          if (chevron) chevron.classList.add('rotate-180');
        } else {
          menu.classList.add('hidden');
          if (chevron) chevron.classList.remove('rotate-180');
        }
      }
    }

    // Close dropdown on outside click
    window.addEventListener('click', (e) => {
      const menu = document.getElementById('batchDropdownMenu');
      const chevron = document.getElementById('batchDropdownChevron');
      const toggle = document.getElementById('batchDropdownToggle');
      if (menu && !menu.classList.contains('hidden')) {
        if (toggle && toggle.contains(e.target)) return;
        menu.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    });

    function setBatchVideoCount(count) {
      syncBatchCardsFromDOM();
      batchVideoCount = Math.max(1, Math.min(6, parseInt(count) || 1));
      
      const list = videoLang === 'ar' ? topicsAr : topicsEn;

      // Adjust batchCardsData array length to match batchVideoCount
      while (batchCardsData.length < batchVideoCount) {
        const nextIdx = batchCardsData.length;
        const defaultTopic = list[nextIdx % list.length] || list[0];
        batchCardsData.push({
          topic: defaultTopic,
          sceneCount: 4,
          fileName: ''
        });
      }
      if (batchCardsData.length > batchVideoCount) {
        batchCardsData = batchCardsData.slice(0, batchVideoCount);
      }

      // Update main produce button label
      updateProduceBtnLabel();

      // Close dropdown menu
      const menu = document.getElementById('batchDropdownMenu');
      const chevron = document.getElementById('batchDropdownChevron');
      if (menu) menu.classList.add('hidden');
      if (chevron) chevron.classList.remove('rotate-180');

      // Render cards
      renderDynamicBatchCards();
    }

    function updateProduceBtnLabel() {
      const btnText = document.getElementById('mainProduceBtnText');
      if (!btnText) return;
      if (isBatchRunning) {
        btnText.textContent = uiLang === 'ar' ? 'جاري الإنتاج المتسلسل...' : 'Producing Batch...';
      } else {
        if (batchVideoCount === 1) {
          btnText.textContent = uiLang === 'ar' ? 'بدء الإنتاج (1 فيديو)' : 'Start Production (1 Video)';
        } else {
          btnText.textContent = uiLang === 'ar' ? ('بدء الإنتاج المتتالي (' + batchVideoCount + ' فيديوهات)') : ('Start Batch Production (' + batchVideoCount + ' Videos)');
        }
      }
    }

    function syncBatchCardsFromDOM() {
      for (let i = 0; i < batchCardsData.length; i++) {
        const topicInp = document.getElementById('batchTopic_' + i);
        const sceneInp = document.getElementById('batchSceneSlider_' + i);
        const fileInp = document.getElementById('batchFileName_' + i);
        if (topicInp) batchCardsData[i].topic = topicInp.value;
        if (sceneInp) batchCardsData[i].sceneCount = parseInt(sceneInp.value) || 4;
        if (fileInp) batchCardsData[i].fileName = fileInp.value.trim();
      }
    }

    function renderDynamicBatchCards() {
      const container = document.getElementById('dynamicBatchCardsContainer');
      if (!container) return;

      container.innerHTML = '';

      batchCardsData.forEach((card, i) => {
        const cardDiv = document.createElement('div');
        cardDiv.id = 'batchCard_' + i;
        cardDiv.className = 'batch-card bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all duration-300 hover:border-white/20';

        const estDurationSec = (card.sceneCount || 4) * 6;
        const isShortsCompat = (card.sceneCount || 4) <= 12;

        cardDiv.innerHTML = '<div class="flex items-center justify-between border-b border-white/5 pb-2.5">' +
          '<div class="flex items-center gap-2.5">' +
            '<span class="w-6 h-6 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-400 font-mono">' +
              (i + 1) +
            '</span>' +
            '<h4 class="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">' +
              '<span>' + (uiLang === 'ar' ? 'فيديو رقم ' + (i + 1) : 'Video #' + (i + 1)) + '</span>' +
              (batchVideoCount > 1 ? '<span class="text-[10px] text-slate-500 font-normal">(' + (uiLang === 'ar' ? 'ضمن الدفعة' : 'Batch Item') + ')</span>' : '') +
            '</h4>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<span id="batchCardStatus_' + i + '" class="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 font-medium">' +
              (uiLang === 'ar' ? 'جاهز' : 'Ready') +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="space-y-1.5">' +
          '<div class="flex items-center justify-between">' +
            '<label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">' +
              '<i data-lucide="compass" class="w-3.5 h-3.5 text-rose-400"></i>' +
              '<span>' + (uiLang === 'ar' ? 'موضوع الفيديو الوثائقي' : 'Documentary Topic') + '</span>' +
            '</label>' +
            '<button type="button" onclick="setRandomTopicForCard(' + i + ')" class="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors">' +
              '<i data-lucide="sparkles" class="w-3 h-3"></i>' +
              '<span>' + (uiLang === 'ar' ? 'فكرة عشوائية' : 'Random Idea') + '</span>' +
            '</button>' +
          '</div>' +
          '<input type="text" id="batchTopic_' + i + '" value="' + (card.topic || '').replace(/"/g, '&quot;') + '" oninput="batchCardsData[' + i + '].topic = this.value" placeholder="' + (uiLang === 'ar' ? 'اكتب موضوعاً وثائقياً مثل: أسرار الثقوب السوداء، حضارة الفراعنة...' : 'Enter documentary topic: Secrets of Black Holes, Ancient Egypt...') + '" class="w-full bg-black/50 border border-white/10 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner" />' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">' +
          '<div class="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/5">' +
            '<div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">' +
              '<span class="flex items-center gap-1">' +
                '<i data-lucide="sliders" class="w-3 h-3 text-rose-400"></i>' +
                '<span>' + (uiLang === 'ar' ? 'عدد الشرائح (4-15)' : 'Scenes (4-15)') + '</span>' +
              '</span>' +
              '<span id="batchSceneBadge_' + i + '" class="text-rose-400 font-mono text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">' +
                (card.sceneCount || 4) + ' ' + (uiLang === 'ar' ? 'مشاهد' : 'Scenes') + ' (~' + estDurationSec + 's)' +
              '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2 pt-0.5">' +
              '<input type="range" id="batchSceneSlider_' + i + '" min="4" max="15" step="1" value="' + (card.sceneCount || 4) + '" oninput="onCardSceneChange(' + i + ', this.value)" class="flex-1 accent-rose-500 h-1.5 bg-black/60 rounded-lg cursor-pointer" />' +
              '<span id="batchSceneNum_' + i + '" class="text-xs font-mono font-bold text-slate-200 w-5 text-center">' + (card.sceneCount || 4) + '</span>' +
            '</div>' +
            '<div id="batchShortsBadge_' + i + '" class="pt-0.5">' +
              (isShortsCompat 
                ? '<span class="text-[9px] text-emerald-400 font-medium">🟢 ' + (uiLang === 'ar' ? 'متوافق مع يوتيوب شورتس' : 'Shorts Compatible (<60s)') + '</span>'
                : '<span class="text-[9px] text-amber-300 font-medium">⚠️ ' + (uiLang === 'ar' ? 'أكثر من 60 ثانية' : '>60s Long Form') + '</span>') +
            '</div>' +
          '</div>' +
          '<div class="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/5">' +
            '<label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">' +
              '<span class="flex items-center gap-1">' +
                '<i data-lucide="file-text" class="w-3 h-3 text-rose-400"></i>' +
                '<span>' + (uiLang === 'ar' ? 'اسم الملف (اختياري)' : 'File Name (Optional)') + '</span>' +
              '</span>' +
              '<span class="text-[9px] text-slate-500 font-mono lowercase">.mp4 / .webm</span>' +
            '</label>' +
            '<input type="text" id="batchFileName_' + i + '" value="' + (card.fileName || '').replace(/"/g, '&quot;') + '" oninput="batchCardsData[' + i + '].fileName = this.value.trim()" placeholder="' + (uiLang === 'ar' ? 'مثال: black_holes_ep1' : 'e.g., black_holes_ep1') + '" class="w-full bg-black/50 border border-white/10 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none" />' +
            '<p class="text-[9px] text-slate-500 truncate">' +
              (uiLang === 'ar' ? '💡 يترك فارغاً للتسمية التلقائية من العنوان' : '💡 Leave blank for auto-title filename') +
            '</p>' +
          '</div>' +
        '</div>';

        container.appendChild(cardDiv);
      });

      lucide.createIcons();
    }

    function onCardSceneChange(index, val) {
      const count = Math.max(4, Math.min(15, parseInt(val) || 4));
      if (batchCardsData[index]) {
        batchCardsData[index].sceneCount = count;
      }
      const numSpan = document.getElementById('batchSceneNum_' + index);
      const badge = document.getElementById('batchSceneBadge_' + index);
      const shortsBadge = document.getElementById('batchShortsBadge_' + index);
      const estSec = count * 6;

      if (numSpan) numSpan.textContent = count;
      if (badge) badge.textContent = count + ' ' + (uiLang === 'ar' ? 'مشاهد' : 'Scenes') + ' (~' + estSec + 's)';
      if (shortsBadge) {
        if (count <= 12) {
          shortsBadge.innerHTML = '<span class="text-[9px] text-emerald-400 font-medium">🟢 ' + (uiLang === 'ar' ? 'متوافق مع يوتيوب شورتس' : 'Shorts Compatible (<60s)') + '</span>';
        } else {
          shortsBadge.innerHTML = '<span class="text-[9px] text-amber-300 font-medium">⚠️ ' + (uiLang === 'ar' ? 'أكثر من 60 ثانية' : '>60s Long Form') + '</span>';
        }
      }
    }

    function setRandomTopicForCard(index) {
      const list = videoLang === 'ar' ? topicsAr : topicsEn;
      const randomTopic = list[Math.floor(Math.random() * list.length)];
      if (batchCardsData[index]) {
        batchCardsData[index].topic = randomTopic;
      }
      const inp = document.getElementById('batchTopic_' + index);
      if (inp) inp.value = randomTopic;
    }

    function applyQuickTopicToFirstCard(topic) {
      if (batchCardsData.length > 0) {
        batchCardsData[0].topic = topic;
      }
      const inp = document.getElementById('batchTopic_0');
      if (inp) inp.value = topic;
    }

    // ==========================================
    // 🎬 Sequential Batch Pipeline Execution Loop
    // ==========================================
    async function startBatchProduction() {
      if (isBatchRunning) return;

      syncBatchCardsFromDOM();

      // Ensure every card has a valid topic
      const list = videoLang === 'ar' ? topicsAr : topicsEn;
      batchCardsData.forEach((c, idx) => {
        if (!c.topic || !c.topic.trim()) {
          c.topic = list[idx % list.length] || list[0];
          const inp = document.getElementById('batchTopic_' + idx);
          if (inp) inp.value = c.topic;
        }
      });

      isBatchRunning = true;
      updateProduceBtnLabel();

      const mainBtn = document.getElementById('mainProduceBtn');
      if (mainBtn) {
        mainBtn.disabled = true;
        mainBtn.classList.add('opacity-75', 'cursor-not-allowed');
      }

      const progressBanner = document.getElementById('batchProgressBanner');
      const progressMainStatus = document.getElementById('batchProgressMainStatus');
      const progressPct = document.getElementById('batchProgressPct');
      const progressBarFill = document.getElementById('batchProgressBarFill');
      const progressSubStatus = document.getElementById('batchProgressSubStatus');
      const completedCountSpan = document.getElementById('batchCompletedCount');

      if (progressBanner) progressBanner.classList.remove('hidden');

      const totalVideos = batchCardsData.length;
      let completedVideos = 0;

      // Sequential for...of loop
      for (let i = 0; i < totalVideos; i++) {
        const card = batchCardsData[i];
        const cardElem = document.getElementById('batchCard_' + i);
        const cardStatus = document.getElementById('batchCardStatus_' + i);

        if (cardElem) {
          cardElem.classList.remove('border-white/10');
          cardElem.classList.add('border-rose-500', 'bg-rose-950/20', 'shadow-rose-900/20');
        }
        if (cardStatus) {
          cardStatus.className = 'text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse flex items-center gap-1';
          cardStatus.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> <span>' + (uiLang === 'ar' ? 'جاري الإنتاج...' : 'Producing...') + '</span>';
          lucide.createIcons();
        }

        if (progressMainStatus) {
          progressMainStatus.textContent = uiLang === 'ar' 
            ? ('جاري إنتاج ومعالجة الفيديو ' + (i + 1) + ' من ' + totalVideos + ': "' + card.topic.substring(0, 35) + '..."')
            : ('Producing video ' + (i + 1) + ' of ' + totalVideos + ': "' + card.topic.substring(0, 35) + '..."');
        }

        try {
          // 1. Generation Pipeline (Script -> Neural Audio -> Images)
          await executeGenerationPipeline(card.topic, card.sceneCount || 4, card.fileName || '', (pct, statusText) => {
            const overallPct = Math.round(((i + (pct / 100)) / totalVideos) * 100);
            if (progressPct) progressPct.textContent = overallPct + '%';
            if (progressBarFill) progressBarFill.style.width = overallPct + '%';
            if (progressSubStatus) {
              progressSubStatus.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin text-rose-400"></i> <span>' + statusText + '</span>';
              lucide.createIcons();
            }
          });

          // 2. Render & Export (YouTube Auto-Upload OR Direct Download)
          if (progressSubStatus) {
            progressSubStatus.innerHTML = '<i data-lucide="video" class="w-3.5 h-3.5 text-rose-400"></i> <span>' + (uiLang === 'ar' ? 'جاري تصيير لقطات الفيديو وتصدير الملف...' : 'Rendering video & exporting...') + '</span>';
            lucide.createIcons();
          }

          if (isAutoUploadActive && ytAccessToken) {
            // Upload to YouTube
            await performSilentYouTubeUpload((pct, statusText) => {
              if (progressSubStatus) {
                progressSubStatus.innerHTML = '<i data-lucide="youtube" class="w-3.5 h-3.5 text-red-500"></i> <span>' + statusText + ' (' + pct + '%)</span>';
                lucide.createIcons();
              }
            });

            if (cardStatus) {
              cardStatus.className = 'text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1';
              cardStatus.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> <span>' + (uiLang === 'ar' ? 'تم الرفع على YouTube' : 'Uploaded to YT') + '</span>';
            }
          } else {
            // Record & Trigger instant direct download
            const blob = await recordVideoBlob();
            const outName = (card.fileName && card.fileName.trim()) 
              ? (card.fileName.trim().replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_') + '.webm')
              : getSafeFilename();

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = outName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (cardStatus) {
              cardStatus.className = 'text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1';
              cardStatus.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> <span>' + (uiLang === 'ar' ? 'تم التصدير والتحميل' : 'Downloaded') + '</span>';
            }
          }

          completedVideos++;
          if (completedCountSpan) {
            completedCountSpan.textContent = completedVideos + ' / ' + totalVideos + ' ' + (uiLang === 'ar' ? 'مكتمل' : 'Completed');
          }

          if (cardElem) {
            cardElem.classList.remove('border-rose-500', 'bg-rose-950/20', 'shadow-rose-900/20');
            cardElem.classList.add('border-emerald-500/30', 'bg-emerald-950/10');
          }

          // 1.5s Cooldown pause between items if more videos remain
          if (i < totalVideos - 1) {
            if (progressSubStatus) {
              progressSubStatus.innerHTML = '<i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i> <span>' + (uiLang === 'ar' ? 'استراحة قصيرة 1.5 ثانية قبل بدء الفيديو التالي...' : 'Cooling down 1.5s before next video...') + '</span>';
              lucide.createIcons();
            }
            await new Promise(r => setTimeout(r, 1500));
          }

        } catch (err) {
          console.error('Batch item ' + (i + 1) + ' failed:', err);
          if (cardStatus) {
            cardStatus.className = 'text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1';
            cardStatus.innerHTML = '<i data-lucide="alert-circle" class="w-3 h-3"></i> <span>' + (uiLang === 'ar' ? 'فشل' : 'Failed') + '</span>';
          }
          if (cardElem) {
            cardElem.classList.remove('border-rose-500', 'bg-rose-950/20');
            cardElem.classList.add('border-rose-500/30', 'bg-rose-950/10');
          }
        }
      }

      // Finish Batch
      if (progressPct) progressPct.textContent = '100%';
      if (progressBarFill) progressBarFill.style.width = '100%';
      if (progressMainStatus) {
        progressMainStatus.textContent = uiLang === 'ar' 
          ? ('🎉 اكتملت الدفعة بنجاح (' + completedVideos + ' من ' + totalVideos + ' فيديوهات)')
          : ('🎉 Batch completed successfully (' + completedVideos + ' of ' + totalVideos + ' videos)');
      }
      if (progressSubStatus) {
        progressSubStatus.innerHTML = '<span class="text-emerald-400 font-bold">' + (uiLang === 'ar' ? 'جميع العمليات تمت بنجاح!' : 'All processes finished successfully!') + '</span>';
      }

      if (window.confetti) {
        window.confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 } });
      }

      isBatchRunning = false;
      updateProduceBtnLabel();
      if (mainBtn) {
        mainBtn.disabled = false;
        mainBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }

    // ==========================================
    // 🎬 Core Generation & 100% Sync Pipeline
    // ==========================================
    async function executeGenerationPipeline(topic, sceneCount = 4, customFileName = '', onProgress) {
      targetSceneCount = sceneCount;

      // Step 1: Script Gen
      if (onProgress) onProgress(15, uiLang === 'ar' ? 'توليد السيناريو...' : 'Generating script...');
      const script = await fetchScriptFromPollinations(topic, videoLang, targetSceneCount, customFileName);
      currentScript = script;

      // Step 2: High Quality Audio Synthesis (Azure Neural or Speech Synthesis) & 100% Sync Duration Alignment
      if (onProgress) onProgress(30, uiLang === 'ar' ? 'توليد الصوت العصبي فائق النقاء وقياس التزامن بالمللي ثانية...' : 'Synthesizing Neural Audio & Calculating 100% sync...');
      await synthesizeAllScenesAudio(script);

      // Compute Timeline and Total Duration from real audio
      recalculateSceneTimings();

      updateMetadataUI(script);
      renderSceneCards(script);

      // Update output filename badge
      const outName = customFileName 
        ? (customFileName.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_') + '.mp4')
        : getSafeFilename();
      document.getElementById('outputFilenameText').textContent = '💾 ' + outName;
      document.getElementById('outputFilenameBadge').classList.remove('hidden');

      // Step 3: Batch Load Images with concurrency limit 2 (turbo model)
      if (onProgress) onProgress(50, uiLang === 'ar' ? ('تحميل وتوليد ' + script.scenes.length + ' صور سينمائية فائقة السرعة (Turbo)...') : ('Generating ' + script.scenes.length + ' cinematic turbo visual scenes...'));
      loadedImages = new Array(script.scenes.length).fill(null);
      await preloadImagesInBatches(script.scenes, 2, (loaded, total) => {
        const pct = 50 + Math.round((loaded / total) * 45);
        if (onProgress) onProgress(pct, (uiLang === 'ar' ? ('جاري تجهيز الصور: (' + loaded + ' / ' + total + ')...') : ('Loading images: (' + loaded + ' / ' + total + ')...')));
        const thumb = document.getElementById('sceneThumb' + loaded);
        if (thumb) {
          thumb.src = script.scenes[loaded - 1].imageUrl;
          thumb.classList.remove('hidden');
        }
      });

      if (onProgress) onProgress(100, uiLang === 'ar' ? 'الفيديو جاهز بنجاح!' : 'Video is ready!');
      lockPreview();
    }

    async function synthesizeAllScenesAudio(script) {
      saveAzureConfig();
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        if (azureConfig.enabled && azureConfig.key) {
          try {
            const res = await synthesizeAzureSpeechBuffer(scene.text, azureConfig.voice, azureConfig.region, azureConfig.key);
            scene.audioBuffer = res.audioBuffer;
            scene.durationSeconds = Math.max(3.5, res.duration + 0.3);
          } catch (err) {
            console.warn('Azure TTS scene failed, using estimated speech timing:', err);
            scene.durationSeconds = estimateTextDuration(scene.text);
          }
        } else {
          scene.durationSeconds = estimateTextDuration(scene.text);
        }
      }
    }

    function estimateTextDuration(text) {
      const words = text.trim().split(/\\s+/).length;
      return Math.max(4.5, Math.min(12, words * 0.45 + 1.2));
    }

    function recalculateSceneTimings() {
      if (!currentScript || !currentScript.scenes) return;
      sceneStartTimes = [];
      let acc = 0;
      currentScript.scenes.forEach(s => {
        sceneStartTimes.push(acc);
        acc += (s.durationSeconds || 6);
      });
      totalDuration = acc;
      document.getElementById('totalDurationLabel').textContent = formatSeconds(totalDuration);
      document.getElementById('timeSlider').max = totalDuration;
    }

    function getSceneAtTime(time) {
      if (!currentScript || !currentScript.scenes || currentScript.scenes.length === 0) {
        return { index: 0, progressInScene: 0, scene: null };
      }

      for (let i = sceneStartTimes.length - 1; i >= 0; i--) {
        if (time >= sceneStartTimes[i]) {
          const scene = currentScript.scenes[i];
          const dur = scene.durationSeconds || 6;
          const elapsed = time - sceneStartTimes[i];
          const progress = Math.min(1, Math.max(0, elapsed / dur));
          return { index: i, progressInScene: progress, scene: scene };
        }
      }
      return { index: 0, progressInScene: 0, scene: currentScript.scenes[0] };
    }

    function lockPreview() {
      isPreviewUnlocked = false;
      isPlaying = false;
      currentTime = 0;
      lastSpokenScene = -1;
      stopAllAudio();
      drawFrame(0);

      document.getElementById('privacyOverlay').classList.remove('hidden');
      canvas.classList.add('blur-xl', 'scale-105', 'opacity-40');
      document.getElementById('lockToggleBtn').classList.remove('hidden');
      document.getElementById('lockToggleText').textContent = uiLang === 'ar' ? 'فتح المعاينة' : 'Unlock Preview';
      document.getElementById('centerPlayBtn').classList.add('hidden');
    }

    function unlockAndPlay() {
      isPreviewUnlocked = true;
      document.getElementById('privacyOverlay').classList.add('hidden');
      canvas.classList.remove('blur-xl', 'scale-105', 'opacity-40');
      document.getElementById('lockToggleText').textContent = uiLang === 'ar' ? 'قفل المعاينة' : 'Lock Preview';
      togglePlay(true);
    }

    function togglePreviewLock() {
      if (isPreviewUnlocked) {
        lockPreview();
      } else {
        unlockAndPlay();
      }
    }

    function onCanvasClicked() {
      if (isPreviewUnlocked) {
        togglePlay();
      }
    }

    function showProgress(pct, status) {
      document.getElementById('progressContainer').classList.remove('hidden');
      document.getElementById('progressBarFill').style.width = pct + '%';
      document.getElementById('progressPercentage').textContent = pct + '%';
      document.getElementById('progressStatusText').textContent = status;
    }

    // Concurrency-limited batch image loader
    async function preloadImagesInBatches(scenes, limit, onProgress) {
      let loaded = 0;
      const total = scenes.length;

      for (let i = 0; i < total; i += limit) {
        const chunk = scenes.slice(i, i + limit);
        await Promise.all(
          chunk.map(async (scene, chunkIdx) => {
            const index = i + chunkIdx;
            try {
              const img = await loadImageAsync(scene.imageUrl);
              loadedImages[index] = img;
            } catch (e) {
              console.warn('Image failed to load for scene', index);
            }
            loaded++;
            if (onProgress) onProgress(loaded, total);
          })
        );
      }
    }

    async function fetchScriptFromPollinations(topic, lang, count, customFileName) {
      const isAr = lang === 'ar';
      const prompt = \`Create a \${count}-scene YouTube Shorts documentary script for topic "\${topic}" in \${isAr ? 'Arabic' : 'English'}. Return valid JSON with: title, description, tags, category, audience, scenes (array of \${count} items with text, imagePrompt, durationSeconds: 6).\`;
      
      try {
        const res = await fetch(\`https://text.pollinations.ai/\${encodeURIComponent(prompt)}?json=true\`);
        const text = await res.text();
        const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return formatScriptResponse(topic, data, lang, count, customFileName);
        }
      } catch (e) {
        console.warn('Network API fail, using intelligent offline fallback');
      }
      return getFallbackScript(topic, lang, count, customFileName);
    }

    function formatScriptResponse(topic, data, lang, count, customFileName) {
      const seed = Math.floor(Math.random() * 800000);
      let rawScenes = data.scenes || [];
      if (rawScenes.length < count) {
        rawScenes = getFallbackScript(topic, lang, count, customFileName).scenes;
      }

      const scenes = rawScenes.slice(0, count).map((s, idx) => ({
        id: idx + 1,
        text: s.text || 'Scene ' + (idx + 1),
        durationSeconds: 6,
        imageUrl: \`https://image.pollinations.ai/prompt/\${encodeURIComponent((s.imagePrompt || topic) + ', cinematic 8k, national geographic, vertical 9:16')}?width=720&height=1280&nologo=true&seed=\${seed + idx}&model=turbo\`
      }));

      return {
        topic: topic,
        title: data.title || (lang === 'ar' ? \`\${topic} 🤯 #Shorts\` : \`The Shocking Truth Behind \${topic} 🤯 #Shorts\`),
        description: data.description || \`\${topic} documentary facts.\\n\\n#Shorts #Documentary #Science\`,
        tags: data.tags || [topic, 'Shorts', 'Documentary', 'Facts', 'Science'],
        category: data.category || (lang === 'ar' ? 'التعليم والعلوم' : 'Science & Technology'),
        audience: 'Not made for kids',
        videoLanguage: lang,
        customFileName: customFileName,
        scenes: scenes
      };
    }

    function getFallbackScript(topic, lang, count, customFileName) {
      const isAr = lang === 'ar';
      const seed = Math.floor(Math.random() * 800000);
      const scenes = [];

      for (let i = 0; i < count; i++) {
        let text = '';
        if (isAr) {
          if (i === 0) text = \`هل تعلم أن \${topic} يخفي سراً حير أعظم العلماء؟\`;
          else if (i === count - 1) text = \`والآن ما هو رأيك في هذا الاكتشاف المدهش؟ اكتب في التعليقات واشترك!\`;
          else text = \`المشهد رقم \${i+1}: الأبحاث والدراسات الميدانية كشفت تفاصيل مذهلة عن \${topic}.\`;
        } else {
          if (i === 0) text = \`Did you know that \${topic} holds one of the deepest mysteries in science?\`;
          else if (i === count - 1) text = \`What is your theory on this mystery? Drop a comment below and subscribe!\`;
          else text = \`Scene \${i+1}: Groundbreaking research reveals astonishing phenomena surrounding \${topic}.\`;
        }

        scenes.push({
          id: i + 1,
          text: text,
          durationSeconds: 6,
          imageUrl: \`https://image.pollinations.ai/prompt/\${encodeURIComponent('Cinematic dramatic documentary shot of ' + topic + ' scene ' + (i+1))}?width=720&height=1280&nologo=true&seed=\${seed + i}&model=turbo\`
        });
      }

      return {
        topic: topic,
        title: isAr ? \`سر صادم لم تكن تعرفه عن \${topic} 🤯 #Shorts\` : \`The Shocking Truth Behind \${topic} 🤯 #Shorts\`,
        description: isAr 
          ? \`وثائقي قصير يكشف أسرار \${topic} المدهشة.\\n\\n#Shorts #وثائقي #علوم\`
          : \`A gripping documentary short explaining \${topic}.\\n\\n#Shorts #Documentary #Science #Facts\`,
        tags: [topic, 'Shorts', 'Documentary', 'Science', 'Facts', 'Viral'],
        category: isAr ? 'التعليم والعلوم' : 'Science & Technology',
        audience: 'Not made for kids',
        videoLanguage: lang,
        customFileName: customFileName,
        scenes: scenes
      };
    }

    function loadImageAsync(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          const c = document.createElement('canvas');
          c.width = 720; c.height = 1280;
          const g = c.getContext('2d');
          const grad = g.createLinearGradient(0,0,720,1280);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#020617');
          g.fillStyle = grad;
          g.fillRect(0,0,720,1280);
          const fallback = new Image();
          fallback.src = c.toDataURL();
          resolve(fallback);
        };
        img.src = url;
      });
    }

    function renderSceneCards(script) {
      const container = document.getElementById('scenesContainer');
      container.innerHTML = '';
      document.getElementById('scenesCountTag').textContent = \`\${script.scenes.length} Scenes • 100% Neural Sync\`;

      script.scenes.forEach((scene, i) => {
        const dur = (scene.durationSeconds || 6).toFixed(1);
        const card = document.createElement('div');
        card.className = 'border border-white/10 bg-black/40 rounded-2xl p-3 flex gap-3 items-center hover:border-white/20 transition-all';
        card.innerHTML = \`
          <div class="w-16 h-24 bg-black/60 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
            <img id="sceneThumb\${i+1}" src="\${scene.imageUrl}" class="w-full h-full object-cover" alt="Scene \${i+1}">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between text-[11px] text-rose-400 font-bold mb-1">
              <span>\${uiLang === 'ar' ? 'المشهد' : 'Scene'} \${i+1}</span>
              <span class="text-[10px] font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-500/20">\${dur}s</span>
            </div>
            <p class="text-xs text-slate-300 line-clamp-3 leading-relaxed">\${scene.text}</p>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function updateMetadataUI(script) {
      document.getElementById('ytTitleValue').textContent = script.title;
      document.getElementById('ytDescValue').value = script.description;
      document.getElementById('ytTagsValue').textContent = Array.isArray(script.tags) ? script.tags.join(', ') : script.tags;
      document.getElementById('ytCategoryValue').textContent = script.category;
      document.getElementById('ytAudienceValue').textContent = script.audience;
    }

    function getSafeFilename() {
      if (!currentScript) return 'DocuShorts_video.webm';
      let name = currentScript.customFileName?.trim();
      if (!name) {
        name = currentScript.title || currentScript.topic || 'DocuShorts_video';
      }
      const clean = name.replace(/[/\\\\?%*:|"<>#]+/g, '_').trim().replace(/\\s+/g, '_');
      return \`\${clean}.webm\`;
    }

    // Canvas Video Player & Ken Burns 100% Synced Rendering Engine
    function drawPlaceholderCanvas() {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, 720, 1280);

      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      grad.addColorStop(0, 'rgba(225, 29, 72, 0.15)');
      grad.addColorStop(0.5, 'rgba(220, 38, 38, 0.1)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 44px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DocuShorts AI 🎬', 360, 600);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.fillText(uiLang === 'ar' ? 'أدخل موضوعاً واضغط "إنشاء الفيديو الآن"' : 'Enter topic & click "Generate Video Now"', 360, 660);
    }

    function drawFrame(time) {
      if (!currentScript || !currentScript.scenes || currentScript.scenes.length === 0) {
        drawPlaceholderCanvas();
        return;
      }

      const { index: sceneIndex, progressInScene, scene } = getSceneAtTime(time);
      const img = loadedImages[sceneIndex];

      if (img && img.complete) {
        ctx.save();
        const scale = 1.0 + (progressInScene * 0.14);
        const panX = (sceneIndex % 2 === 0 ? 1 : -1) * (progressInScene * 25);
        const panY = progressInScene * 18;

        ctx.translate(360 + panX, 640 + panY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -360, -640, 720, 1280);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 720, 1280);
      }

      // Cinematic Vignette
      const bottomGrad = ctx.createLinearGradient(0, 780, 0, 1280);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.75)');
      bottomGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 780, 720, 500);

      const topGrad = ctx.createLinearGradient(0, 0, 0, 240);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, 720, 240);

      // Top Segmented Progress Bar
      const totalScenes = currentScript.scenes.length;
      const barY = 32;
      const totalWidth = 660;
      const startX = 30;
      const segGap = Math.max(2, 6 - Math.floor(totalScenes / 10));
      const segWidth = (totalWidth - (totalScenes - 1) * segGap) / totalScenes;

      for (let i = 0; i < totalScenes; i++) {
        const segX = startX + i * (segWidth + segGap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.roundRect(segX, barY, segWidth, 5, 3);
        ctx.fill();

        if (i < sceneIndex) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.roundRect(segX, barY, segWidth, 5, 3);
          ctx.fill();
        } else if (i === sceneIndex) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.roundRect(segX, barY, segWidth * progressInScene, 5, 3);
          ctx.fill();
        }
      }

      // Shorts Watermark
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(540, 56, 150, 36, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(562, 74, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SHORTS', 576, 80);
      ctx.restore();

      // Subtitles with 100% sync
      if (scene && scene.text) {
        drawSubtitles(scene.text);
      }
    }

    function drawSubtitles(text) {
      ctx.save();
      ctx.font = 'bold 36px Cairo, Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.direction = videoLang === 'ar' ? 'rtl' : 'ltr';

      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 580 && n > 0) {
          lines.push(currentLine.trim());
          currentLine = words[n] + ' ';
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine.trim());

      const lineHeight = 56;
      const startY = 1040 - ((lines.length - 1) * lineHeight / 2);

      lines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        const textWidth = ctx.measureText(line).width;
        const pillWidth = Math.max(textWidth + 48, 160);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.beginPath();
        ctx.roundRect(360 - pillWidth / 2, lineY - 38, pillWidth, 50, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 10;
        ctx.fillText(line, 360, lineY);
      });

      ctx.restore();
    }

    // ==========================================
    // 🎬 100% Event-Driven Audio-Visual Sync Engine
    // ==========================================
    let activeSceneIndex = 0;
    let sceneStartTime = 0;
    let isRecordingVideo = false;
    let activeUtterance = null;
    let activeFallbackTimer = null;

    function togglePlay(forcePlay, startIndex) {
      if (!isPreviewUnlocked) {
        unlockAndPlay();
        return;
      }

      isPlaying = forcePlay !== undefined ? forcePlay : !isPlaying;

      const playIcon = document.getElementById('playIcon');
      const centerPlayBtn = document.getElementById('centerPlayBtn');

      if (isPlaying) {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        playIcon.setAttribute('data-lucide', 'pause');
        centerPlayBtn.classList.add('hidden');
        
        const startIdx = startIndex !== undefined ? startIndex : activeSceneIndex;
        playScene(startIdx);
        requestAnimationFrame(renderLoop);
      } else {
        playIcon.setAttribute('data-lucide', 'play');
        centerPlayBtn.classList.remove('hidden');
        stopAllAudio();
      }
      lucide.createIcons();
    }

    function playScene(index) {
      if (!currentScript || !currentScript.scenes || !currentScript.scenes[index]) return;
      if (!isPlaying) return;

      stopAllAudio();

      activeSceneIndex = index;
      sceneStartTime = performance.now();
      const scene = currentScript.scenes[index];
      const sceneDuration = scene.durationSeconds || 6;

      if (scene.audioBuffer) {
        // 1. Azure Neural Speech AudioBuffer (Precise event-driven sync)
        try {
          initAudioContext();
          activeAudioSource = audioCtx.createBufferSource();
          activeAudioSource.buffer = scene.audioBuffer;
          activeAudioSource.playbackRate.value = playbackRate;
          activeAudioSource.connect(audioCtx.destination);
          
          activeAudioSource.onended = () => {
            onSceneAudioEnded(index);
          };
          activeAudioSource.start(0);
        } catch (e) {
          console.warn('AudioBuffer playback error, using timer fallback:', e);
          activeFallbackTimer = setTimeout(() => {
            onSceneAudioEnded(index);
          }, (sceneDuration * 1000) / playbackRate);
        }
      } else if ('speechSynthesis' in window && scene.text) {
        // 2. Web Speech API (Strict utterance.onend event sync)
        try {
          const utter = new SpeechSynthesisUtterance(scene.text);
          utter.lang = videoLang === 'ar' ? 'ar-SA' : 'en-US';
          utter.rate = playbackRate;

          utter.onend = () => {
            onSceneAudioEnded(index);
          };

          utter.onerror = (e) => {
            console.warn('Utterance error or interrupted:', e);
            onSceneAudioEnded(index);
          };

          activeUtterance = utter;
          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn('SpeechSynthesis error:', e);
          activeFallbackTimer = setTimeout(() => {
            onSceneAudioEnded(index);
          }, (sceneDuration * 1000) / playbackRate);
        }
      } else {
        // 3. Procedural timing fallback
        activeFallbackTimer = setTimeout(() => {
          onSceneAudioEnded(index);
        }, (sceneDuration * 1000) / playbackRate);
      }
    }

    function onSceneAudioEnded(completedIndex) {
      if (!isPlaying || activeSceneIndex !== completedIndex) return;

      const totalScenes = currentScript?.scenes?.length || 0;

      if (completedIndex < totalScenes - 1) {
        // Transition immediately to the next scene
        playScene(completedIndex + 1);
      } else {
        // Final scene audio ended
        if (isRecordingVideo && mediaRecorder && mediaRecorder.state === 'recording') {
          // Finish recording cleanly without artificial delays
          mediaRecorder.stop();
          isRecordingVideo = false;
          togglePlay(false);
        } else {
          // Loop back to start in preview mode
          playScene(0);
        }
      }
    }

    function stopAllAudio() {
      if (activeFallbackTimer) {
        clearTimeout(activeFallbackTimer);
        activeFallbackTimer = null;
      }
      if (activeAudioSource) {
        try {
          activeAudioSource.onended = null;
          activeAudioSource.stop();
        } catch (e) {}
        activeAudioSource = null;
      }
      if (activeUtterance) {
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
        activeUtterance = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    function renderLoop(timestamp) {
      if (!isPlaying || !currentScript || !currentScript.scenes) return;

      const scene = currentScript.scenes[activeSceneIndex];
      if (!scene) return;

      const sceneDuration = scene.durationSeconds || 6;
      const elapsedInScene = Math.max(0, ((timestamp - sceneStartTime) / 1000) * playbackRate);
      const progressInScene = Math.min(1.0, elapsedInScene / sceneDuration);

      const baseStartTime = sceneStartTimes[activeSceneIndex] || 0;
      currentTime = baseStartTime + (progressInScene * sceneDuration);

      drawFrame(currentTime);
      updateTimeSlider();

      requestAnimationFrame(renderLoop);
    }

    function updateTimeSlider() {
      document.getElementById('timeSlider').value = currentTime;
      document.getElementById('currentTimeLabel').textContent = formatSeconds(currentTime);
    }

    function formatSeconds(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return \`\${m}:\${s}\`;
    }

    function seekVideo(val) {
      currentTime = parseFloat(val);
      const { index } = getSceneAtTime(currentTime);
      stopAllAudio();
      activeSceneIndex = index;
      drawFrame(currentTime);
      updateTimeSlider();
      if (isPlaying) {
        playScene(index);
      }
    }

    function restartVideo() {
      currentTime = 0;
      stopAllAudio();
      activeSceneIndex = 0;
      drawFrame(0);
      updateTimeSlider();
      togglePlay(true, 0);
    }

    // MediaRecorder Video Export with 100% Event-Driven Completion
    async function startVideoRecording() {
      if (!currentScript || !currentScript.scenes || currentScript.scenes.length === 0) {
        alert(uiLang === 'ar' ? 'يرجى إنشاء الفيديو أولاً!' : 'Please generate video first!');
        return;
      }

      const btn = document.getElementById('exportVideoBtn');
      btn.disabled = true;
      btn.classList.add('opacity-75', 'animate-pulse');
      document.getElementById('exportVideoText').textContent = uiLang === 'ar' ? 'جاري الرندرة والتسجيل...' : 'Rendering Video...';

      stopAllAudio();
      currentTime = 0;
      activeSceneIndex = 0;
      isPlaying = false;
      drawFrame(0);

      try {
        const stream = canvas.captureStream(60);
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 8000000
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          isRecordingVideo = false;
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = getSafeFilename();
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          btn.disabled = false;
          btn.classList.remove('opacity-75', 'animate-pulse');
          document.getElementById('exportVideoText').textContent = uiLang === 'ar' ? 'تسجيل وتحميل الفيديو' : 'Record & Export Video';

          if (window.confetti) {
            window.confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f43f5e', '#ef4444', '#10b981', '#3b82f6'],
            });
          }
        };

        isRecordingVideo = true;
        mediaRecorder.start(100);
        togglePlay(true, 0);

      } catch (err) {
        console.error('Recording error:', err);
        isRecordingVideo = false;
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'animate-pulse');
        document.getElementById('exportVideoText').textContent = uiLang === 'ar' ? 'تسجيل وتحميل الفيديو' : 'Record & Export Video';
      }
    }

    // Helper Copy Function
    function copyField(elementId, btn) {
      const el = document.getElementById(elementId);
      const text = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.value : el.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> <span class="text-emerald-400">' + (uiLang === 'ar' ? 'تم النسخ!' : 'Copied!') + '</span>';
        lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = original;
          lucide.createIcons();
        }, 2000);
      });
    }

    // Social Sharing
    function openYouTubeStudio() {
      window.open('https://studio.youtube.com', '_blank');
    }
    function shareOnTwitter() {
      const title = currentScript ? currentScript.title : 'Check out this documentary Short!';
      window.open(\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&hashtags=Shorts,Documentary,AI\`, '_blank');
    }
    function shareOnWhatsApp() {
      const title = currentScript ? currentScript.title : 'Check out this documentary Short!';
      window.open(\`https://api.whatsapp.com/send?text=\${encodeURIComponent(title)}\`, '_blank');
    }

    // ==========================================
    // 📺 YouTube Data API v3 & GIS Integration
    // ==========================================
    let ytAccessToken = null;
    let ytTokenClient = null;

    function saveYtClientId(id) {
      if (id && id.trim()) {
        localStorage.setItem('yt_client_id', id.trim());
      }
    }

    function handleYtAuth() {
      const clientIdInput = document.getElementById('ytClientIdInput');
      const clientId = clientIdInput ? clientIdInput.value.trim() : '';

      if (!clientId) {
        alert(uiLang === 'ar' 
          ? 'يرجى إدخال Google Client ID أولاً للاتصال بقناتك على YouTube!' 
          : 'Please enter your Google OAuth Client ID first to connect your YouTube channel!');
        if (clientIdInput) clientIdInput.focus();
        return;
      }

      saveYtClientId(clientId);

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        alert(uiLang === 'ar' 
          ? 'جاري تحميل مكتبة Google Identity Services، يرجى المحاولة بعد لحظات.' 
          : 'Google Identity Services library is still loading, please retry in a moment.');
        return;
      }

      try {
        ytTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              ytAccessToken = tokenResponse.access_token;
              updateYtConnectionState(true);
              await fetchYtChannelInfo(ytAccessToken);
            }
          },
          error_callback: (err) => {
            console.error('Google OAuth Error:', err);
            alert((uiLang === 'ar' ? 'فشل تسجيل الدخول: ' : 'Authentication failed: ') + (err.message || 'Error'));
          }
        });

        ytTokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error('GIS initialization error:', err);
        alert('GIS Error: ' + err.message);
      }
    }

    function updateYtConnectionState(isConnected) {
      const badge = document.getElementById('ytAuthBadge');
      const btn = document.getElementById('ytAuthBtn');
      const box = document.getElementById('ytChannelBox');

      if (isConnected) {
        badge.className = 'flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs text-emerald-300';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> <span>' + (uiLang === 'ar' ? 'متصل بقناة يوتيوب' : 'Connected') + '</span>';
        btn.classList.add('hidden');
        box.classList.remove('hidden');
      } else {
        badge.className = 'flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span> <span>' + (uiLang === 'ar' ? 'غير متصل' : 'Disconnected') + '</span>';
        btn.classList.remove('hidden');
        box.classList.add('hidden');
        ytAccessToken = null;
      }
      lucide.createIcons();
    }

    async function fetchYtChannelInfo(token) {
      try {
        const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const ch = data.items[0].snippet;
          document.getElementById('ytChannelTitle').textContent = ch.title || 'YouTube Channel';
          if (ch.thumbnails && ch.thumbnails.default && ch.thumbnails.default.url) {
            document.getElementById('ytAvatar').innerHTML = '<img src="' + ch.thumbnails.default.url + '" class="w-full h-full object-cover" />';
          }
        }
      } catch (e) {
        console.warn('Could not fetch channel details:', e);
      }
    }

    function handleYtDisconnect() {
      ytAccessToken = null;
      updateYtConnectionState(false);
    }

    // Direct YouTube Upload Flow (Resumable Upload via XHR for progress tracking)
    async function startDirectYouTubeUpload() {
      if (!currentScript) {
        alert(uiLang === 'ar' ? 'يرجى إنشاء الفيديو أولاً!' : 'Please generate video first!');
        return;
      }

      if (!ytAccessToken) {
        alert(uiLang === 'ar' 
          ? 'يرجى تسجيل الدخول بقناة YouTube أولاً بالضغط على "تسجيل الدخول بقناة يوتيوب"!' 
          : 'Please connect your YouTube channel first by clicking "Connect YouTube Channel"!');
        handleYtAuth();
        return;
      }

      const uploadBtn = document.getElementById('ytUploadBtn');
      const progressBox = document.getElementById('ytUploadProgressBox');
      const progressBar = document.getElementById('ytUploadProgressBar');
      const pctSpan = document.getElementById('ytUploadPct');
      const statusSpan = document.getElementById('ytUploadStatusSpan');
      const successBox = document.getElementById('ytSuccessBox');

      uploadBtn.disabled = true;
      uploadBtn.classList.add('opacity-75', 'animate-pulse');
      progressBox.classList.remove('hidden');
      successBox.classList.add('hidden');
      progressBar.style.width = '5%';
      pctSpan.textContent = '5%';
      statusSpan.textContent = uiLang === 'ar' ? 'جاري تصيير لقطات الفيديو...' : 'Rendering video stream...';

      try {
        const res = await performSilentYouTubeUpload((pct, msg) => {
          progressBar.style.width = pct + '%';
          pctSpan.textContent = pct + '%';
          statusSpan.textContent = msg;
        });

        if (res && res.id) {
          progressBar.style.width = '100%';
          pctSpan.textContent = '100%';
          statusSpan.textContent = uiLang === 'ar' ? 'تم الرفع والنشر بنجاح!' : 'Uploaded successfully!';
          document.getElementById('ytWatchLink').href = 'https://www.youtube.com/shorts/' + res.id;
          successBox.classList.remove('hidden');

          if (window.confetti) {
            window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          }
        }
      } catch (err) {
        console.error('Upload process failed:', err);
        alert((uiLang === 'ar' ? 'فشلت عملية الرفع: ' : 'Upload failed: ') + err.message);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('opacity-75', 'animate-pulse');
      }
    }

    async function performSilentYouTubeUpload(onProgress) {
      if (!currentScript || !ytAccessToken) throw new Error('Missing script or token');

      if (onProgress) onProgress(10, uiLang === 'ar' ? 'جاري تسجيل الفيديو...' : 'Capturing video blob...');
      const blob = await recordVideoBlob();

      if (onProgress) onProgress(20, uiLang === 'ar' ? 'بدء جلسة الرفع على YouTube...' : 'Initiating YouTube session...');
      const privacy = document.getElementById('ytPrivacySelect').value || 'public';
      const categoryId = document.getElementById('ytCatSelect').value || '28';
      const metadata = {
        snippet: {
          title: currentScript.title.substring(0, 100),
          description: currentScript.description + '\\n\\nCreated automatically with DocuShorts AI.',
          tags: currentScript.tags || ['Shorts', 'Documentary', 'AI'],
          categoryId: categoryId,
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        }
      };

      const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + ytAccessToken,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': blob.size.toString(),
          'X-Upload-Content-Type': blob.type || 'video/webm'
        },
        body: JSON.stringify(metadata)
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        throw new Error('Upload init failed: ' + errText);
      }

      const uploadUrl = initRes.headers.get('Location');
      if (!uploadUrl) throw new Error('No resumable upload Location header received.');

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', blob.type || 'video/webm');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const rawPct = Math.round((e.loaded / e.total) * 75);
            onProgress(20 + rawPct, uiLang === 'ar' ? 'جاري رفع الفيديو إلى خوادم YouTube...' : 'Uploading video to YouTube servers...');
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during YouTube upload'));
        xhr.send(blob);
      });
    }

    // Helper to capture canvas video to Blob (100% event-driven)
    function recordVideoBlob() {
      return new Promise((resolve, reject) => {
        stopAllAudio();
        currentTime = 0;
        activeSceneIndex = 0;
        isPlaying = false;
        drawFrame(0);

        try {
          const stream = canvas.captureStream(60);
          recordedChunks = [];
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000
          });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            isRecordingVideo = false;
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            resolve(blob);
          };

          isRecordingVideo = true;
          mediaRecorder.start(100);
          togglePlay(true, 0);
        } catch (e) {
          isRecordingVideo = false;
          reject(e);
        }
      });
    }
  </script>
</body>
</html>`;
}
