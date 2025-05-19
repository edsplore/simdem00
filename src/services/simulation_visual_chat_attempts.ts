import { AttemptInterface } from "../types/attempts";
import apiClient from "./api/interceptors";

// Types for Visual Chat simulations
export interface ImageData {
  image_id: string;
  image_data: string;
}

// Define common coordinate interfaces
export interface SimulationHotspotCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimulationHotspotPercentageCoordinates {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface SequenceItem {
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
}

export interface MaskingItem {
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
}

export interface SlideData {
  imageId: string;
  imageName: string;
  imageUrl: string;
  sequence: SequenceItem[];
  masking: MaskingItem[];
}

export interface SimulationData {
  id: string;
  sim_name: string;
  version: string;
  lvl1: {
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
  };
  lvl2: {
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
  };
  lvl3: {
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
  };
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  script: Array<{
    script_sentence: string;
    role: string;
    keywords: string[];
  }>;
  slidesData: SlideData[];
}

// Request and response interfaces for starting a visual chat simulation
export interface StartVisualChatRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
  attempt_type: string; // "Test" or "Practice"
}

export interface StartVisualChatResponse {
  id: string;
  status: string;
  simulation: SimulationData;
  images: ImageData[];
}

// Request and response interfaces for ending a visual chat simulation
export interface EndVisualChatRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
  userAttemptSequence: AttemptInterface[];
  slides_data?: SlideData[];
}

export interface EndVisualChatResponse {
  id: string;
  status: string;
  scores: {
    ContextualAccuracy: number;
    KeywordScore: number;
    ClickScore: number;
    Confidence: number;
    Energy: number;
    Concentration: number;
    FinalScore: number;
  };
  duration: number;
  transcript: string;
  audio_url: string;
}

/**
 * Starts a visual chat simulation attempt
 * @param userId - The ID of the user starting the simulation
 * @param simulationId - The ID of the simulation to start
 * @param assignmentId - The ID of the assignment
 * @param attemptType - Type of attempt ("Test" or "Practice")
 * @returns A promise with the simulation start response
 */
export const startVisualChatAttempt = async (
  userId: string,
  simulationId: string,
  assignmentId: string,
  attemptType: string,
): Promise<StartVisualChatResponse> => {
  try {
    const response = await apiClient.post<StartVisualChatResponse>(
      "/simulations/start-visual-chat-attempt",
      {
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
        attempt_type: attemptType,
      },
    );

    // Process response to ensure backward compatibility
    if (response.data.simulation && response.data.simulation.slidesData) {
      response.data.simulation.slidesData.forEach((slide) => {
        if (slide.sequence) {
          slide.sequence.forEach((item) => {
            // If only absolute coordinates exist, we'll rely on the component to handle conversion
            // This ensures backward compatibility with older data
            if (item.coordinates && !item.percentageCoordinates) {
              console.log(
                "Found item with only absolute coordinates, will convert in component:",
                item.id,
              );
            }
          });
        }

        if (slide.masking) {
          slide.masking.forEach((maskItem) => {
            if (
              maskItem.content &&
              maskItem.content.coordinates &&
              !maskItem.content.percentageCoordinates
            ) {
              console.log(
                "Found masking with only absolute coordinates, will convert in component:",
                maskItem.id,
              );
            }
          });
        }
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error starting visual chat simulation:", error);
    throw error;
  }
};

/**
 * Ends a visual chat simulation attempt
 * @param userId - The ID of the user
 * @param simulationId - The ID of the simulation
 * @param simulationProgressId - The ID of the simulation progress/attempt
 * @param userAttemptSequence - Array of user interactions and responses
 * @param modifiedSlidesData - Optional modified slides data with user responses
 * @returns A promise with the simulation end response including scores
 */
export const endVisualChatAttempt = async (
  userId: string,
  simulationId: string,
  simulationProgressId: string,
  userAttemptSequence: AttemptInterface[],
  modifiedSlidesData?: SlideData[],
): Promise<EndVisualChatResponse> => {
  try {
    // Clean up user attempt data before sending
    const cleanedAttemptData = userAttemptSequence.map((item) => {
      // Create a clean copy we can modify
      const cleanItem = { ...item };

      // If the item has wrong_clicks, ensure they include percentage values
      if (cleanItem.wrong_clicks && cleanItem.wrong_clicks.length > 0) {
        cleanItem.wrong_clicks = cleanItem.wrong_clicks.map((click) => {
          // Ensure each click has both absolute and percentage coordinates if available
          return {
            ...click,
            // If percentage values aren't present, they'll be calculated on the server
          };
        });
      }

      return cleanItem;
    });

    const response = await apiClient.post<EndVisualChatResponse>(
      "/simulations/end-visual-chat-attempt",
      {
        user_id: userId,
        simulation_id: simulationId,
        usersimulationprogress_id: simulationProgressId,
        userAttemptSequence: cleanedAttemptData,
        slides_data: modifiedSlidesData, // Send modified slides data if available
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error ending visual chat simulation:", error);
    throw error;
  }
};
