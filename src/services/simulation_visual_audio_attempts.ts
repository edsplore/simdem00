import { AttemptInterface } from "../types/attempts";
import apiClient from "./api/interceptors";

export interface ImageData {
  image_id: string;
  image_data: string;
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
  slidesData: Array<{
    imageId: string;
    imageName: string;
    imageUrl: string;
    sequence: Array<{
      type: string;
      id: string;
      name?: string;
      hotspotType?: string;
      coordinates?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      settings?: any;
      role?: string;
      text?: string;
      options?: string[];
      tipText?: string;
    }>;
    masking: Array<{
      id: string;
      type: string;
      content: {
        id: string;
        type: string;
        coordinates?: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
        settings?: {
          color: string;
          solid_mask: boolean;
          blur_mask: boolean;
        };
      };
      timestamp?: number;
    }>;
  }>;
}

export interface StartVisualAudioRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
}

export interface StartVisualAudioResponse {
  id: string;
  status: string;
  simulation: SimulationData;
  images: ImageData[];
}

export interface EndVisualAudioRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
  slides_data?: any[]; // Added to include modified slides data with transcriptions
}

export interface EndVisualAudioResponse {
  id: string;
  status: string;
  scores: {
    ContextualAccuracy: number;
    KeywordScore: number;
    ClickScore: number;
    Confidence: number;
    Energy: number;
    Concentration: number;
  };
  duration: number;
  transcript: string;
  audio_url: string;
}

/**
 * Starts a visual-audio simulation attempt
 * @param userId - The ID of the user making the attempt
 * @param simulationId - The ID of the simulation to attempt
 * @param assignmentId - The ID of the assignment (if applicable)
 * @returns A promise with the simulation data and images
 */
export const startVisualAudioAttempt = async (
  userId: string,
  simulationId: string,
  assignmentId: string
): Promise<StartVisualAudioResponse> => {
  try {
    const response = await apiClient.post<StartVisualAudioResponse>(
      "/simulations/start-visual-audio-attempt",
      {
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error starting visual-audio simulation:", error);
    throw error;
  }
};

/**
 * Ends a visual-audio simulation attempt
 * @param userId - The ID of the user making the attempt
 * @param simulationId - The ID of the simulation attempted
 * @param progressId - The ID of the simulation progress record
 * @param modifiedSlidesData - Optional modified slides data with user responses
 * @returns A promise with the simulation results including scores
 */
export const endVisualAudioAttempt = async (
  userId: string,
  simulationId: string,
  progressId: string,
  userAttemptSequence: AttemptInterface[],
  modifiedSlidesData?: any[]
): Promise<EndVisualAudioResponse> => {
  try {
    const response = await apiClient.post<EndVisualAudioResponse>(
      "/simulations/end-visual-audio-attempt",
      {
        user_id: userId,
        simulation_id: simulationId,
        usersimulationprogress_id: progressId,
        userAttemptSequence: userAttemptSequence,
        slides_data: modifiedSlidesData, // Include modified slides data in request
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error ending visual-audio simulation:", error);
    throw error;
  }
};
