import apiClient from "./api/interceptors";

// Common interfaces for simulation data structures
export interface SimulationHotspotCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// New interface for percentage-based coordinates
export interface SimulationHotspotPercentageCoordinates {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface SimulationSequenceItem {
  type: string;
  id: string;
  name?: string;
  hotspotType?: string;
  // Original absolute coordinates
  coordinates?: SimulationHotspotCoordinates;
  // New percentage-based coordinates
  percentageCoordinates?: SimulationHotspotPercentageCoordinates;
  settings?: any;
  role?: string;
  text?: string;
  options?: string[];
  tipText?: string;
  [key: string]: any;
}

export interface SimulationSlide {
  imageId: string;
  imageName: string;
  imageUrl: string;
  sequence: SimulationSequenceItem[];
  masking?: Array<{
    id: string;
    type: string;
    content: {
      id: string;
      type: string;
      // Original absolute coordinates
      coordinates?: SimulationHotspotCoordinates;
      // New percentage-based coordinates
      percentageCoordinates?: SimulationHotspotPercentageCoordinates;
      settings?: {
        color: string;
        solid_mask: boolean;
        blur_mask: boolean;
      };
    };
    timestamp?: number;
  }>;
}

export interface SimulationScriptItem {
  script_sentence: string;
  role: string;
  keywords: string[];
}

export interface SimulationLevel {
  isEnabled: boolean;
  enablePractice?: boolean;
  hideAgentScript?: boolean;
  hideCustomerScript?: boolean;
  hideKeywordScores?: boolean;
  hideSentimentScores?: boolean;
  hideHighlights?: boolean;
  hideCoachingTips?: boolean;
  enablePostSimulationSurvey?: boolean;
  aiPoweredPausesAndFeedback?: boolean;
}

export interface SimulationData {
  id: string;
  sim_name: string;
  version: string;
  lvl1: SimulationLevel;
  lvl2: SimulationLevel;
  lvl3: SimulationLevel;
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  script: SimulationScriptItem[];
  slidesData: SimulationSlide[];
  simulation_scoring_metrics?: {
    is_enabled?: boolean;
    keyword_score?: number;
    click_score?: number;
  };
  [key: string]: any;
}

export interface ImageData {
  image_id: string;
  image_data: string;
}

// Request interfaces
export interface SimulationPreviewRequest {
  user_id: string;
  sim_id: string;
}

export interface ChatPreviewRequest extends SimulationPreviewRequest {
  message?: string;
  usersimulationprogress_id?: string;
}

// Response interfaces
export interface SimulationLevelSettings {
  isEnabled: boolean;
  enablePractice: boolean;
  hideAgentScript: boolean;
  hideCustomerScript: boolean;
  hideKeywordScores: boolean;
  hideSentimentScores: boolean;
  hideHighlights: boolean;
  hideCoachingTips: boolean;
  enablePostSimulationSurvey: boolean;
  aiPoweredPausesAndFeedback: boolean;
}

export interface SimulationDetails {
  sim_name: string;
  version: number;
  lvl1: SimulationLevelSettings;
  lvl2: SimulationLevelSettings;
  lvl3: SimulationLevelSettings;
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  script: SimulationScriptItem[];
  slidesData: any;
  prompt: string;
  key_objectives: string[];
  overview_video: string;
  quick_tips: string[];
  [key: string]: any;
}

export interface AudioPreviewResponse {
  access_token: string;
  simulation_details: SimulationDetails;
  id?: string;
  call_id?: string;
  [key: string]: any;
}

export interface ChatPreviewResponse {
  id: string;
  status: string;
  response: string;
  [key: string]: any;
}

export interface VisualPreviewResponse {
  simulation: SimulationData;
  images: ImageData[];
  id?: string;
  [key: string]: any;
}

/**
 * Starts an audio simulation preview
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @returns A promise with the audio preview response containing an access token
 */
export const startAudioPreview = async (
  userId: string,
  simulationId: string,
): Promise<AudioPreviewResponse> => {
  try {
    const response = await apiClient.post<AudioPreviewResponse>(
      "/simulations/start-audio-preview",
      {
        user_id: userId,
        sim_id: simulationId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error starting audio preview:", error);
    throw error;
  }
};

/**
 * Starts or continues a chat simulation preview
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @param message - The user's message (empty string for initial call)
 * @param progressId - Optional progress ID for continuing a conversation
 * @returns A promise with the chat preview response containing the customer's response
 */
export const startChatPreview = async (
  userId: string,
  simulationId: string,
  message: string = "",
  progressId?: string,
): Promise<ChatPreviewResponse> => {
  try {
    const payload: ChatPreviewRequest = {
      user_id: userId,
      sim_id: simulationId,
      message: message,
    };

    // Add progress ID if provided (for continuing a conversation)
    if (progressId) {
      payload.usersimulationprogress_id = progressId;
    }

    console.log("Chat preview request payload:", payload);

    const response = await apiClient.post<ChatPreviewResponse>(
      "/simulations/start-chat-preview",
      {
        user_id: userId,
        sim_id: simulationId,
        message: message,
      },
    );

    console.log("Chat preview response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error with chat preview:", error);
    throw error;
  }
};

/**
 * Starts a visual-audio simulation preview
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @returns A promise with the visual-audio preview response containing simulation data and images
 */
export const startVisualAudioPreview = async (
  userId: string,
  simulationId: string,
): Promise<VisualPreviewResponse> => {
  try {
    const response = await apiClient.post<VisualPreviewResponse>(
      "/simulations/start-visual-audio-preview",
      {
        user_id: userId,
        sim_id: simulationId,
      },
    );

    // Process response to convert coordinates to percentage-based if needed
    if (response.data.simulation && response.data.simulation.slidesData) {
      response.data.simulation.slidesData.forEach((slide) => {
        if (slide.sequence) {
          slide.sequence.forEach((item) => {
            // If only absolute coordinates exist, calculate percentage coordinates when image dimensions are known
            if (item.coordinates && !item.percentageCoordinates) {
              // This calculation would ideally happen server-side
              // But we can handle it here for backward compatibility
              console.log(
                "Converting absolute coordinates to percentage-based in response",
              );
            }
          });
        }
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error starting visual-audio preview:", error);
    throw error;
  }
};

/**
 * Starts a visual-chat simulation preview
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @returns A promise with the visual-chat preview response containing simulation data and images
 */
export const startVisualChatPreview = async (
  userId: string,
  simulationId: string,
): Promise<VisualPreviewResponse> => {
  try {
    const response = await apiClient.post<VisualPreviewResponse>(
      "/simulations/start-visual-chat-preview",
      {
        user_id: userId,
        sim_id: simulationId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error starting visual-chat preview:", error);
    throw error;
  }
};

/**
 * Starts a visual-only simulation preview
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @returns A promise with the visual preview response containing simulation data and images
 */
export const startVisualPreview = async (
  userId: string,
  simulationId: string,
): Promise<VisualPreviewResponse> => {
  try {
    const response = await apiClient.post<VisualPreviewResponse>(
      "/simulations/start-visual-preview",
      {
        user_id: userId,
        sim_id: simulationId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error starting visual preview:", error);
    throw error;
  }
};

/**
 * Helper function to start the appropriate preview based on simulation type
 * @param userId - The ID of the user starting the preview
 * @param simulationId - The ID of the simulation to preview
 * @param simulationType - The type of simulation to start
 * @param message - Optional message for chat simulations
 * @returns A promise with the appropriate preview response
 */
export const startPreview = async (
  userId: string,
  simulationId: string,
  simulationType: "audio" | "chat" | "visual-audio" | "visual-chat" | "visual",
  message: string = "",
): Promise<
  AudioPreviewResponse | ChatPreviewResponse | VisualPreviewResponse
> => {
  switch (simulationType) {
    case "audio":
      return startAudioPreview(userId, simulationId);
    case "chat":
      return startChatPreview(userId, simulationId, message);
    case "visual-audio":
      return startVisualAudioPreview(userId, simulationId);
    case "visual-chat":
      return startVisualChatPreview(userId, simulationId);
    case "visual":
      return startVisualPreview(userId, simulationId);
    default:
      throw new Error(`Unsupported simulation type: ${simulationType}`);
  }
};

/**
 * Helper function to process image data into blob URLs
 * @param imageData - Base64 encoded image data
 * @returns A blob URL that can be used in an img src attribute
 */
export const processImageData = (imageData: string): string => {
  // If it's already a URL, return it
  if (
    imageData.startsWith("data:") ||
    imageData.startsWith("blob:") ||
    imageData.startsWith("http") ||
    imageData.startsWith("/api/")
  ) {
    return imageData;
  }

  try {
    // Convert base64 string to Uint8Array
    const binaryString = atob(imageData);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob from Uint8Array
    const blob = new Blob([bytes], { type: "image/png" });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error processing image data:", error);
    return "";
  }
};

/**
 * Helper function to create a Map of image IDs to blob URLs
 * @param images - Array of image data objects
 * @returns A Map with image IDs as keys and blob URLs as values
 */
export const createImageMap = (images: ImageData[]): Map<string, string> => {
  const imageMap = new Map<string, string>();

  for (const image of images) {
    const blobUrl = processImageData(image.image_data);
    if (blobUrl) {
      imageMap.set(image.image_id, blobUrl);
    }
  }

  return imageMap;
};
