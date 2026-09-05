export interface RecorderOptions {
  canvas: HTMLCanvasElement;
  audioTrack?: MediaStreamTrack | null;
  onProgress?: (progress: number) => void;
  fps?: number;
}

export class VideoRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  /**
   * Check best supported MIME type
   */
  public getBestMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }

  /**
   * Start recording the canvas stream
   */
  public startRecording(options: RecorderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { canvas, audioTrack, fps = 60 } = options;
        this.recordedChunks = [];

        const canvasStream = canvas.captureStream(fps);
        const combinedStream = new MediaStream();

        // Add video tracks
        canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

        // Add audio track if provided
        if (audioTrack) {
          combinedStream.addTrack(audioTrack);
        }

        const mimeType = this.getBestMimeType();
        const recorderOptions: MediaRecorderOptions = {
          mimeType,
          videoBitsPerSecond: 8000000, // 8 Mbps for sharp 720x1280
        };

        this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstart = () => {
          this.isRecording = true;
          resolve();
        };

        this.mediaRecorder.onerror = (e) => {
          console.error('MediaRecorder error:', e);
          reject(e);
        };

        this.mediaRecorder.start(100); // 100ms timeslice
      } catch (err) {
        console.error('Failed to start MediaRecorder:', err);
        reject(err);
      }
    });
  }

  /**
   * Stop recording and return Blob + Blob URL
   */
  public stopRecording(): Promise<{ blob: Blob; url: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        if (this.recordedChunks.length > 0) {
          const mimeType = this.getBestMimeType();
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          return resolve({ blob, url, mimeType });
        }
        return reject(new Error('MediaRecorder was not active and no chunks captured.'));
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const mimeType = this.mediaRecorder?.mimeType || this.getBestMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, mimeType });
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Download a blob directly as video file
   */
  public downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  public get recordingStatus() {
    return this.isRecording;
  }
}

export const videoRecorderService = new VideoRecorderService();
