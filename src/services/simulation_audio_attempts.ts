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
    "Sim Accuracy": number;
    "Keyword Score": number;
    "Click Score": number;
    Confidence: number;
    Energy: number;
    Concentration: number;
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
  params: StartAudioSimulationRequest,
): Promise<StartAudioSimulationResponse> => {
  try {
    const response = await apiClient.post<StartAudioSimulationResponse>(
      "/simulations/start-audio",
      params,
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
  params: EndAudioSimulationRequest,
): Promise<EndAudioSimulationResponse> => {
  try {
    console.log("Executing end-audio API call with params:", params);

    const response = await apiClient.post<EndAudioSimulationResponse>(
      "/simulations/end-audio",
      params,
      {
        timeout: 10000, // 10 second timeout
      },
    );

    console.log("End audio API success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error ending audio simulation:", error);
    throw error;
  }
};
