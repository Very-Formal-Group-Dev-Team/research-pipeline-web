import { uploadTranscriptionChunk } from '@/lib/transcriptions/uploadChunk';

export function recordAudioChunk(stream: MediaStream, durationMs: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, durationMs);
  });
}

export function startLiveTranscriptionChunks(
  scheduleId: string,
  stream: MediaStream,
  options: { chunkMs?: number; deviceKey?: string | null; onUploadError?: (message: string) => void } = {},
): () => void {
  let stopped = false;
  let recording = false;
  const chunkMs = options.chunkMs ?? 10000;

  const loop = async () => {
    while (!stopped) {
      if (!recording) {
        recording = true;
        try {
          const blob = await recordAudioChunk(stream, chunkMs);
          if (!stopped && blob.size > 0) {
            const result = await uploadTranscriptionChunk(scheduleId, blob, options.deviceKey);
            if (!result.ok && !stopped) {
              options.onUploadError?.(result.error || 'Live transcription upload failed');
            }
          }
        } catch {
          // Keep the recording loop alive even if a single chunk fails.
        } finally {
          recording = false;
        }
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
  };

  void loop();
  return () => {
    stopped = true;
  };
}
