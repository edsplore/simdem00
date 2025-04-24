import apiClient from "./api/interceptors";

// Common Message interface used across different script functions
export interface ScriptMessage {
  id?: string;
  role: "Customer" | "Trainee" | "assistant" | string;
  message?: string;
  script_sentence?: string;
  keywords?: string[];
  [key: string]: any;
}

// Request and response interfaces for audio-to-script conversion
export interface AudioToScriptRequest {
  user_id: string;
  audio_file: File;
}

export interface AudioToScriptResponse {
  status?: string;
  script: ScriptMessage[];
  [key: string]: any;
}

// Request and response interfaces for audio-to-text conversion
export interface AudioToTextRequest {
  user_id: string;
  audio_data: Blob | File;
}

export interface AudioToTextResponse {
  status?: string;
  text: string;
  [key: string]: any;
}

// Request and response interfaces for text-to-script conversion
export interface TextToScriptRequest {
  user_id: string;
  prompt: string;
}

export interface TextToScriptResponse {
  status?: string;
  script: ScriptMessage[];
  [key: string]: any;
}

/**
 * Converts an audio file to a script
 * @param userId - The ID of the user making the request
 * @param audioFile - The audio file to convert
 * @param onUploadProgress - Optional callback for tracking upload progress
 * @returns A promise with the conversion response
 */
export const convertAudioToScript = async (
  userId: string,
  audioFile: File,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<AudioToScriptResponse> => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("audio_file", audioFile);

    const response = await apiClient.post<AudioToScriptResponse>(
      "/api/convert/audio-to-script",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minutes
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: onUploadProgress,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error converting audio to script:", error);
    throw error;
  }
};

/**
 * Converts an audio blob to text
 * @param userId - The ID of the user making the request
 * @param audioData - The audio data blob to convert
 * @returns A promise with the conversion response
 */
export const convertAudioToText = async (
  userId: string,
  audioData: Blob | File,
): Promise<AudioToTextResponse> => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("audio_file", audioData);

    const response = await apiClient.post<AudioToTextResponse>(
      "/api/convert/audio-to-text",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error converting audio to text:", error);
    throw error;
  }
};

/**
 * Generates a script from a text prompt
 * @param userId - The ID of the user making the request
 * @param prompt - The text prompt to generate a script from
 * @returns A promise with the generated script
 */
export const convertTextToScript = async (
  userId: string,
  prompt: string,
): Promise<TextToScriptResponse> => {
  try {
    const response = await apiClient.post<TextToScriptResponse>(
      "/api/convert/text-to-script",
      {
        user_id: userId,
        prompt: prompt,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error converting text to script:", error);
    throw error;
  }
};
