import apiClient from "./api/interceptors";

// Types for chat simulation requests
export interface ChatStartRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
  attempt_type: string; // "Test" or "Practice"
}

export interface ChatMessageRequest {
  user_id: string;
  sim_id: string;
  assignment_id: string;
  message: string;
  usersimulationprogress_id: string;
}

export interface ChatEndRequest {
  user_id: string;
  simulation_id: string;
  usersimulationprogress_id: string;
  chat_history?: Array<{
    sentence: string;
    role: string;
  }>;
}

// Types for chat simulation responses
export interface ChatResponse {
  id: string;
  status: string;
  access_token?: string | null;
  response?: string | null;
  call_id?: string | null;
}

export interface EndChatResponse {
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
 * Start a chat simulation
 * @param userId - The ID of the user starting the simulation
 * @param simId - The ID of the simulation
 * @param assignmentId - The ID of the assignment
 * @param attemptType - Type of attempt ("Test" or "Practice")
 * @returns A promise with the chat simulation response
 */
export const startChatSimulation = async (
  userId: string,
  simId: string,
  assignmentId: string,
  attemptType: string,
): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post<ChatResponse>(
      "/simulations/start-chat",
      {
        user_id: userId,
        sim_id: simId,
        assignment_id: assignmentId,
        attempt_type: attemptType,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error starting chat simulation:", error);
    throw error;
  }
};

/**
 * Send a message in the chat simulation
 * @param userId - The ID of the user
 * @param simId - The ID of the simulation
 * @param assignmentId - The ID of the assignment
 * @param message - The message content to send
 * @param simulationProgressId - The ID of the ongoing simulation progress
 * @returns A promise with the chat message response
 */
export const sendChatMessage = async (
  userId: string,
  simId: string,
  assignmentId: string,
  message: string,
  simulationProgressId: string,
): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post<ChatResponse>(
      "/simulations/start-chat", // Note: The endpoint is still start-chat despite being used for message sending
      {
        user_id: userId,
        sim_id: simId,
        assignment_id: assignmentId,
        message: message,
        usersimulationprogress_id: simulationProgressId,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * End a chat simulation
 * @param userId - The ID of the user
 * @param simId - The ID of the simulation
 * @param simulationProgressId - The ID of the simulation progress to end
 * @param chatHistory - Optional array of chat messages with roles
 * @returns A promise with the end chat response containing scores
 */
export const endChatSimulation = async (
  userId: string,
  simId: string,
  simulationProgressId: string,
  chatHistory?: Array<{ sentence: string; role: string }>,
): Promise<EndChatResponse> => {
  try {
    const response = await apiClient.post<EndChatResponse>(
      "/simulations/end-chat",
      {
        user_id: userId,
        simulation_id: simId,
        usersimulationprogress_id: simulationProgressId,
        chat_history: chatHistory || [],
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error ending chat simulation:", error);
    throw error;
  }
};
