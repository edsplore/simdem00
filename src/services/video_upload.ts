import apiClient from './api/interceptors';

export interface UploadVideoResponse {
  status: string;
  video_url?: string;
}

/**
 * Uploads a video file in chunks to the backend.
 * Returns the final video URL when the last chunk is processed.
 */
export const uploadOverviewVideo = async (
  simulationId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId =
    (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).substring(2);

  let videoUrl = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('simulation_id', simulationId);
    formData.append('upload_id', uploadId);
    formData.append('chunk_number', String(i + 1));
    formData.append('total_chunks', String(totalChunks));
    formData.append('file', chunk, file.name);

    const { data } = await apiClient.post<UploadVideoResponse>(
      '/videos/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (typeof onProgress === 'function') {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    if (data.video_url) {
      videoUrl = data.video_url;
    }
  }

  return videoUrl;
};
