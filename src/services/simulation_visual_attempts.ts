import apiClient from "./api/interceptors";

// Interfaces for simulation data structures
export interface SimulationHotspotCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimulationSequenceItem {
  type: string;
  id: string;
  name?: string;
  hotspotType?: string;
  coordinates?: SimulationHotspotCoordinates;
  settings?: any;
  role?: string;
  text?: string;
  options?: string[];
  tipText?: string;
}

export interface SimulationSlideData {
  imageId: string;
  imageName: string;
  imageUrl: string;
  sequence: SimulationSequenceItem[];
}

export interface SimulationLevelSettings {
  isEnabled?: boolean;
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

export interface SimulationScript {
  script_sentence: string;
  role: string;
  keywords: string[];
}

export interface SimulationData {
  id: string;
  sim_name: string;
  version: string;
  lvl1: SimulationLevelSettings;
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
  script: SimulationScript[];
  slidesData: SimulationSlideData[];
}

export interface ImageData {
  image_id: string;
  image_data: string;
}

// Request interfaces
export interface StartVisualSimulationRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
}

export interface EndVisualSimulationRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
}

// Response interfaces
export interface VisualSimulationResponse {
  id: string;
  status: string;
  simulation: SimulationData;
  images: ImageData[];
}

export interface SimulationScores {
  sim_accuracy: number;
  keyword_score: number;
  click_score: number;
  confidence: number;
  energy: number;
  concentration: number;
}

export interface EndVisualSimulationResponse {
  id: string;
  status: string;
  scores: SimulationScores;
  duration: number;
  transcript: string;
  audio_url: string;
}

/**
 * Start a visual simulation
 * @param userId - The ID of the user starting the simulation
 * @param simulationId - The ID of the simulation to start
 * @param assignmentId - The ID of the assignment
 * @returns A promise with the visual simulation response
 */
export const startVisualSimulation = async (
  userId: string,
  simulationId: string,
  assignmentId: string,
): Promise<VisualSimulationResponse> => {
  try {
    const response = await apiClient.post<VisualSimulationResponse>(
      "/simulations/start-visual-attempt",
      {
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error starting visual simulation:", error);
    throw error;
  }
};

/**
 * End a visual simulation
 * @param userId - The ID of the user ending the simulation
 * @param simulationId - The ID of the simulation to end
 * @param simulationProgressId - The ID of the simulation progress
 * @returns A promise with the end visual simulation response
 */
export const endVisualSimulation = async (
  userId: string,
  simulationId: string,
  simulationProgressId: string,
): Promise<EndVisualSimulationResponse> => {
  try {
    const response = await apiClient.post<EndVisualSimulationResponse>(
      "/simulations/end-visual-attempt",
      {
        user_id: userId,
        simulation_id: simulationId,
        usersimulationprogress_id: simulationProgressId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error ending visual simulation:", error);
    throw error;
  }
};
