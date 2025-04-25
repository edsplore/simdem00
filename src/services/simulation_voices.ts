import apiClient from "./api/interceptors";

/**
 * Interface for a voice entry
 */
export interface Voice {
  voice_id: string;
  voice_type: string;
  voice_name: string;
  provider: string;
  accent: string;
  gender: string;
  age: string;
  avatar_url: string;
  preview_audio_url: string;
  [key: string]: any;
}

/**
 * Interface for the listVoices request
 */
export interface ListVoicesRequest {
  user_id: string;
}

/**
 * Interface for the listVoices response
 */
export interface ListVoicesResponse {
  voices: Voice[];
  status?: string;
  [key: string]: any;
}

/**
 * Fetches available voices for simulations
 * @param userId - The ID of the user making the request
 * @returns A promise with the list of available voices
 */
export const listVoices = async (
  userId: string,
): Promise<ListVoicesResponse> => {
  try {
    const response = await apiClient.post<ListVoicesResponse>("/list-voices", {
      user_id: userId,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw error;
  }
};

/**
 * Filters voices based on specified criteria
 * @param voices - Array of voices to filter
 * @param criteria - Object containing filter criteria
 * @returns Filtered array of voices
 */
export const filterVoices = (
  voices: Voice[],
  criteria: {
    accent?: string;
    gender?: string;
    age?: string;
    provider?: string;
  },
): Voice[] => {
  return voices.filter(
    (voice) =>
      (!criteria.accent || voice.accent === criteria.accent) &&
      (!criteria.gender ||
        voice.gender.toLowerCase() === criteria.gender.toLowerCase()) &&
      (!criteria.age || voice.age === criteria.age) &&
      (!criteria.provider || voice.provider === criteria.provider),
  );
};

/**
 * Gets a voice by ID
 * @param voices - Array of voices to search
 * @param voiceId - ID of the voice to find
 * @returns The voice with the matching ID or undefined if not found
 */
export const getVoiceById = (
  voices: Voice[],
  voiceId: string,
): Voice | undefined => {
  return voices.find((voice) => voice.voice_id === voiceId);
};
