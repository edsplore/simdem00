import apiClient from "./api/interceptors";

// Types for Visual Chat simulations
export interface ImageData {
  image_id: string;
  image_data: string;
}

export interface SequenceItem {
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
}

export interface SlideData {
  imageId: string;
  imageName: string;
  imageUrl: string;
  sequence: SequenceItem[];
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
  };
  lvl3: {
    isEnabled: boolean;
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
}

export interface EndVisualChatResponse {
  id: string;
  status: string;
  scores: {
    sim_accuracy: number;
    keyword_score: number;
    click_score: number;
    confidence: number;
    energy: number;
    concentration: number;
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
 * @returns A promise with the simulation start response
 */
export const startVisualChatAttempt = async (
  userId: string,
  simulationId: string,
  assignmentId: string,
): Promise<StartVisualChatResponse> => {
  try {
    const response = await apiClient.post<StartVisualChatResponse>(
      "/simulations/start-visual-chat-attempt",
      {
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
      },
    );

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
 * @returns A promise with the simulation end response including scores
 */
export const endVisualChatAttempt = async (
  userId: string,
  simulationId: string,
  simulationProgressId: string,
): Promise<EndVisualChatResponse> => {
  try {
    const response = await apiClient.post<EndVisualChatResponse>(
      "/simulations/end-visual-chat-attempt",
      {
        user_id: userId,
        simulation_id: simulationId,
        usersimulationprogress_id: simulationProgressId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error ending visual chat simulation:", error);
    throw error;
  }
};
