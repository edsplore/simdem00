import apiClient from "./api/interceptors";

export interface FeedbackFormData {
  effectivenessRating: string;
  objectivesClarityRating: string;
  skillsAcquisition: string;
  confidenceRating: string;
  scoringEffectivenessRating: string;
  impactfulPart: string;
  improvementSuggestions: string;
}

export interface SubmitFeedbackRequest {
  user_id: string;
  simulation_id: string;
  /** The level of the simulation, e.g. "beginner" */
  simulation_level: string;
  attempt_id: string;
  feedback: FeedbackFormData;
}

export interface SubmitFeedbackResponse {
  status: string;
  message?: string;
}

/**
 * Submits user feedback for a simulation attempt
 * @param payload - The feedback submission payload
 * @returns A promise with the submission response
 */
export const submitFeedback = async (
  payload: SubmitFeedbackRequest
): Promise<SubmitFeedbackResponse> => {
  try {
    const response = await apiClient.post<SubmitFeedbackResponse>(
      "/simulations/submit-feedback",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};
