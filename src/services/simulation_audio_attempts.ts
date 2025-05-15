import apiClient from "./api/interceptors";

/**
 * Request interface for starting an audio simulation attempt
 */
export interface StartAudioSimulationRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
  message?: string;
  usersimulationprogress_id?: string;
}

/**
 * Response interface for starting an audio simulation
 */
export interface StartAudioSimulationResponse {
  id: string;
  status: string;
  access_token: string;
  call_id: string | null;
  response: string | null;
  simulation_details?: {
    sim_name: string;
    version: number;
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
    slidesData: any;
    prompt: string;
    [key: string]: any;
  };
}

/**
 * Request interface for ending an audio simulation attempt
 */
export interface EndAudioSimulationRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
  call_id: string;
}

/**
 * Response interface for ending an audio simulation
 */
export interface EndAudioSimulationResponse {
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
 * Starts an audio simulation attempt
 * @param params - Parameters for starting the audio simulation
 * @returns Promise with the audio simulation response
 */
export const startAudioSimulation = async (
  params: StartAudioSimulationRequest
): Promise<StartAudioSimulationResponse> => {
  try {
    const response = await apiClient.post<StartAudioSimulationResponse>(
      "/simulations/start-audio",
      params
    );
    return response.data;
  } catch (error) {
    console.error("Error starting audio simulation:", error);
    throw error;
  }
};

/**
 * Ends an audio simulation attempt
 * @param params - Parameters for ending the audio simulation
 * @returns Promise with the end audio simulation response including scores
 */
export const endAudioSimulation = async (
  params: EndAudioSimulationRequest
): Promise<EndAudioSimulationResponse> => {
  try {
    console.log("Executing end-audio API call with params:", params);

    const response = await apiClient.post<EndAudioSimulationResponse>(
      "/simulations/end-audio",
      params,
      {
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("End audio API success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error ending audio simulation:", error);
    throw error;
  }
};
