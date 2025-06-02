import { AttemptInterface } from "../types/attempts";
import apiClient from "./api/interceptors";

// Interfaces for simulation data structures
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
}

export interface Masking {
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
}

export interface MaskingItem {
  id: string;
  type: string;
  content: Masking;
  timestamp?: number;
}

export interface SimulationSlideData {
  imageId: string;
  imageName: string;
  imageUrl: string;
  sequence: SimulationSequenceItem[];
  masking: MaskingItem[];
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
  lvl2: SimulationLevelSettings;
  lvl3: SimulationLevelSettings;
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
  attempt_type: string; // "Test" or "Practice"
  simulation_level: string;
}

export interface EndVisualSimulationRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
  userAttemptSequence: AttemptInterface[];
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
 * Start a visual simulation
 * @param userId - The ID of the user starting the simulation
 * @param simulationId - The ID of the simulation to start
 * @param assignmentId - The ID of the assignment
 * @param attemptType - Type of attempt ("Test" or "Practice")
 * @returns A promise with the visual simulation response
 */
export const startVisualSimulation = async (
  userId: string,
  simulationId: string,
  assignmentId: string,
  attemptType: string,
  simulationLevel: string,
): Promise<VisualSimulationResponse> => {
  try {
    const response = await apiClient.post<VisualSimulationResponse>(
      "/simulations/start-visual-attempt",
      {
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
        attempt_type: attemptType,
        simulation_level: simulationLevel,
      },
    );

    // Process response to add percentage coordinates if needed
    if (response.data.simulation && response.data.simulation.slidesData) {
      response.data.simulation.slidesData.forEach((slide) => {
        if (slide.sequence) {
          slide.sequence.forEach((item) => {
            // If only absolute coordinates exist, calculate percentage coordinates
            if (item.coordinates && !item.percentageCoordinates) {
              // The calculation would ideally happen server-side
              // This is just a placeholder - actual implementation would need image dimensions
            }
          });
        }

        // Also process masking items
        if (slide.masking) {
          slide.masking.forEach((maskingItem) => {
            if (
              maskingItem.content &&
              maskingItem.content.coordinates &&
              !maskingItem.content.percentageCoordinates
            ) {
            }
          });
        }
      });
    }

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
 * @param userAttemptSequence - Array of user interaction data
 * @returns A promise with the end visual simulation response
 */
export const endVisualSimulation = async (
  userId: string,
  simulationId: string,
  simulationProgressId: string,
  userAttemptSequence: AttemptInterface[],
): Promise<EndVisualSimulationResponse> => {
  try {
    // Process attempt data to ensure all click coordinates have both absolute and percentage values
    const processedAttemptSequence = userAttemptSequence.map((attempt) => {
      // Process wrong_clicks to ensure they have percentage values
      if (attempt.wrong_clicks && attempt.wrong_clicks.length > 0) {
        attempt.wrong_clicks = attempt.wrong_clicks.map((click) => {
          // Add percentage values if they don't exist
          if (
            click.x_cordinates !== undefined &&
            click.y_cordinates !== undefined &&
            click.x_percent === undefined &&
            click.y_percent === undefined
          ) {
            // We need container dimensions to calculate percentages accurately
            // This is a placeholder - actual implementation would need container dimensions
            return {
              ...click,
              // These are placeholder values - real implementation would calculate from container dimensions
              x_percent: 0,
              y_percent: 0,
            };
          }
          return click;
        });
      }
      return attempt;
    });

    const response = await apiClient.post<EndVisualSimulationResponse>(
      "/simulations/end-visual-attempt",
      {
        user_id: userId,
        simulation_id: simulationId,
        usersimulationprogress_id: simulationProgressId,
        userAttemptSequence: processedAttemptSequence,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error ending visual simulation:", error);
    throw error;
  }
};
