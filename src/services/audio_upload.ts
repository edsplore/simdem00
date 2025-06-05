import apiClient from './api/interceptors';

export interface UploadAudioResponse {
  status: string;
  audio_url?: string;
}

export const uploadAttemptAudio = async (
  progressId: string,
  file: Blob,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const CHUNK_SIZE = 1024 * 1024; // 1MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = progressId;
  let audioUrl = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('upload_id', uploadId);
    formData.append('chunk_number', String(i + 1));
    formData.append('total_chunks', String(totalChunks));
    formData.append('file', chunk, 'recording.webm');

    const { data } = await apiClient.post<UploadAudioResponse>(
      '/audios/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (typeof onProgress === 'function') {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    if (data.audio_url) {
      audioUrl = data.audio_url;
    }
  }

  return audioUrl;
};

export const getAttemptAudio = async (audioId: string): Promise<Blob> => {
  const response = await apiClient.get(`/audios/${audioId}`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};
