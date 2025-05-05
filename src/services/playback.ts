import apiClient from "./api/interceptors";

export interface FetchPlaybackRowDataPayload {
  user_id: string;
}

export interface FetchPlaybackRowDataResponse {
  id: string;
  trainingPlan: string;
  moduleName: string;
  simId: string;
  simName: string;
  simType: string;
  simLevel: string;
  score: number;
  timeTaken: number;
  status: string;
  dueDate: string | null;
  attemptType: string;
  estTime: number;
  attemptCount: number;
}

export interface FetchPlaybackByIdRowDataPayload {
  user_id: string;
  attempt_id: string;
}

export interface FetchPlaybackByIdRowDataResponse {
  id: string;
  sentencewiseAnalytics: any[];
  audioUrl: string;
  transcript: string;
  transcriptObject: any[];
  timeTakenSeconds: number;
  clickScore: number;
  textFieldKeywordScore: number;
  keywordScore: number;
  simAccuracyScore: number;
  confidence: number;
  energy: number;
  concentration: number;
  minPassingScore: number;
  name: string;
  completedAt: string;
  type: string;
  simLevel: string;
}

export const fetchPlaybackRowData = async (
  payload: FetchPlaybackRowDataPayload
): Promise<FetchPlaybackRowDataResponse[]> => {
  try {
    const response = await apiClient.post("/attempts/fetch", payload);
    return response.data.attempts;
  } catch (error) {
    console.error("Error fetching manager dashboard aggregated data:", error);
    throw error;
  }
};

export const fetchPlaybackByIdRowData = async (
  payload: FetchPlaybackByIdRowDataPayload
): Promise<FetchPlaybackByIdRowDataResponse> => {
  try {
    const response = await apiClient.post("/attempt/fetch", payload);
    return response.data.attempt;
  } catch (error) {
    console.error("Error fetching playback by id row data:", error);
    throw error;
  }
};
