import { YouTubeChannelInfo, YouTubePrivacy } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          hasGrantedAllScopes: (
            tokenResponse: any,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean;
        };
      };
    };
  }
}

export interface VideoUploadPayload {
  blob: Blob;
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  privacyStatus: YouTubePrivacy;
  videoLanguage?: string;
  onProgress?: (progress: number) => void;
}

export class YouTubeUploadService {
  private static readonly CLIENT_ID_STORAGE_KEY = 'docushorts_google_client_id';
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' ');

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private tokenClient: any = null;
  private currentClientId: string = '';

  constructor() {
    this.currentClientId = this.getStoredClientId();
  }

  /**
   * Get saved Google Client ID
   */
  public getStoredClientId(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(YouTubeUploadService.CLIENT_ID_STORAGE_KEY) || '';
  }

  /**
   * Save Google Client ID
   */
  public saveClientId(clientId: string): void {
    this.currentClientId = clientId.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(YouTubeUploadService.CLIENT_ID_STORAGE_KEY, this.currentClientId);
    }
    this.tokenClient = null; // reset token client when client ID changes
  }

  /**
   * Check if user is currently authenticated with valid token
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiresAt;
  }

  /**
   * Disconnect current session
   */
  public disconnect(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Initialize or request OAuth2 Access Token using Google Identity Services (GIS)
   */
  public requestAuthToken(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const activeClientId = (clientId || this.currentClientId || this.getStoredClientId()).trim();
      if (!activeClientId) {
        return reject(
          new Error('يرجى إدخال Google Client ID أولاً في إعدادات الاتصال.')
        );
      }

      if (this.isAuthenticated() && this.accessToken) {
        return resolve(this.accessToken);
      }

      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        return reject(
          new Error(
            'مكتبة Google Identity Services لم تكتمل بعد. يرجى التأكد من اتصال الإنترنت وإعادة المحاولة.'
          )
        );
      }

      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: YouTubeUploadService.SCOPES,
          callback: (response) => {
            if (response.error) {
              console.error('Google OAuth Error:', response);
              return reject(
                new Error(response.error_description || response.error || 'فشلت عملية المصادقة مع حساب جوجل.')
              );
            }
            if (response.access_token) {
              this.accessToken = response.access_token;
              const expiresIn = response.expires_in || 3599;
              this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
              this.saveClientId(activeClientId);
              return resolve(response.access_token);
            }
            reject(new Error('لم يتم استلام رمز المصادقة (Access Token).'));
          },
          error_callback: (err) => {
            console.error('Google Token Client error:', err);
            reject(new Error('تم إغلاق نافذة تسجيل الدخول أو حدث خطأ أثناء المصادقة.'));
          },
        });

        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        console.error('Error initializing Google token client:', err);
        reject(err);
      }
    });
  }

  /**
   * Fetch connected YouTube Channel profile details
   */
  public async fetchChannelInfo(token?: string): Promise<YouTubeChannelInfo> {
    const activeToken = token || this.accessToken;
    if (!activeToken) {
      throw new Error('غير مصرح. يرجى تسجيل الدخول بحساب يوتيوب.');
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        this.disconnect();
        throw new Error('انتهت صلاحية جلسة تسجيل الدخول. يرجى إعادة الاتصال بحساب يوتيوب.');
      }
      throw new Error(
        errData.error?.message || `فشل جلب بيانات القناة (رمز الخطأ: ${response.status})`
      );
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('لم يتم العثور على قناة يوتيوب مرتبطة بهذا الحساب.');
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet?.title || 'YouTube Channel',
      customUrl: item.snippet?.customUrl,
      avatarUrl: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url,
      subscriberCount: item.statistics?.subscriberCount,
    };
  }

  /**
   * Upload video file directly to YouTube using Resumable Media Upload protocol
   */
  public async uploadVideo(payload: VideoUploadPayload): Promise<{ videoId: string; url: string }> {
    const {
      blob,
      title,
      description,
      tags,
      categoryId = '28',
      privacyStatus = 'unlisted',
      videoLanguage = 'ar',
      onProgress,
    } = payload;

    // Ensure we have an active access token
    const token = await this.requestAuthToken();

    // 1. Prepare video metadata
    const metadata = {
      snippet: {
        title: title.slice(0, 100), // YouTube title limit is 100 chars
        description: description.slice(0, 5000),
        tags: tags.map((t) => t.replace(/^#/, '').trim()).filter(Boolean),
        categoryId: categoryId,
        defaultLanguage: videoLanguage === 'ar' ? 'ar' : 'en',
        defaultAudioLanguage: videoLanguage === 'ar' ? 'ar' : 'en',
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    const mimeType = blob.type || 'video/webm';

    // 2. Initiate Resumable Upload Session
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': blob.size.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const errData = await initResponse.json().catch(() => ({}));
      const message = errData.error?.message || `فشل بدء جلسة رفع الفيديو (${initResponse.status})`;
      if (initResponse.status === 403 && message.toLowerCase().includes('quota')) {
        throw new Error('تم تجاوز الحصة اليومية المتاحة لـ YouTube API. يرجى المحاولة غداً أو استخدام مشروع آخر.');
      }
      if (initResponse.status === 401) {
        this.disconnect();
        throw new Error('انتهت صلاحية جلسة الاتصال. يرجى إعادة تسجيل الدخول إلى يوتيوب والمحاولة ثانية.');
      }
      throw new Error(message);
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('لم يتم استلام عنوان الرفع (Resumable Upload Location) من يوتيوب.');
    }

    // 3. Upload binary stream with XMLHttpRequest to report real upload percentage (0-100%)
    return new Promise<{ videoId: string; url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', mimeType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const result = JSON.parse(xhr.responseText);
            const videoId = result.id;
            if (onProgress) onProgress(100);
            resolve({
              videoId,
              url: `https://youtu.be/${videoId}`,
            });
          } catch (e) {
            reject(new Error('تم رفع الفيديو ولكن فشل تحليل استجابة يوتيوب.'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || `فشل رفع الفيديو (رمز الحالة: ${xhr.status})`));
          } catch {
            reject(new Error(`فشل رفع الفيديو إلى خوادم يوتيوب (رمز الحالة: ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('انقطع الاتصال بالإنترنت أثناء رفع الفيديو إلى يوتيوب.'));
      };

      xhr.send(blob);
    });
  }
}

export const youtubeUploadService = new YouTubeUploadService();
