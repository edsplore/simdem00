import apiClient from "./api/interceptors";

export interface TextToSpeechRequest {
  text: string;
  voice_id?: string;
}

export const textToSpeech = async (
  params: TextToSpeechRequest,
): Promise<Blob> => {
  const response = await apiClient.post<Blob>("/text-to-speech", params, {
    responseType: "blob",
  });
  return response.data;
};
