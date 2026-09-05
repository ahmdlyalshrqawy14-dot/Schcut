export type Language = 'ar' | 'en';

export interface Scene {
  id: number;
  text: string;
  imagePrompt: string;
  imageUrl: string;
  durationSeconds: number;
  loadedImage?: HTMLImageElement | null;
  imageLoading?: boolean;
  audioBuffer?: AudioBuffer | null;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
}

export interface ShortsScript {
  topic: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  audience: string;
  videoLanguage: Language;
  customFileName?: string;
  scenes: Scene[];
}

export type GenerationStep = 'idle' | 'script' | 'images' | 'audio_prep' | 'ready' | 'error';

export interface GenerationProgress {
  step: GenerationStep;
  progress: number;
  message: string;
  loadedCount?: number;
  totalCount?: number;
}

export interface PlayerControls {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  currentSceneIndex: number;
  isMuted: boolean;
  volume: number;
  musicVolume: number;
  playbackRate: number;
  isPreviewUnlocked: boolean;
}

export type YouTubePrivacy = 'public' | 'unlisted' | 'private';

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  subscriberCount?: string;
}

export interface YouTubeUploadState {
  isUploading: boolean;
  progress: number;
  step: 'idle' | 'recording' | 'initiating' | 'uploading' | 'completed' | 'error';
  videoId?: string;
  videoUrl?: string;
  errorMessage?: string;
}

export interface AzureVoiceInfo {
  name: string;
  displayName: string;
  localName: string;
  shortName: string;
  gender: 'Female' | 'Male';
  locale: string;
  localeName: string;
}

export interface AzureSpeechConfig {
  apiKey: string;
  region: string;
  selectedVoice: string;
  enabled: boolean;
  speakingRate: number;
  pitch: number;
}

export interface QueueItem {
  id: string;
  topic: string;
  sceneCount: number;
  language: Language;
  status: 'pending' | 'processing' | 'rendering' | 'uploading' | 'completed' | 'error';
  progress: number;
  statusMessage?: string;
  videoUrl?: string;
  youtubeId?: string;
  errorMessage?: string;
  script?: ShortsScript;
  createdAt: number;
}


