import apiClient from "./api/interceptors";

export interface FetchPlaybackRowDataPayload {
  user_id: string;
  pagination?: PlaybackRowPaginationParams;
}

export interface AttemptsResponse {
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
export interface FetchPlaybackRowDataResponse {
  attempts: AttemptsResponse[];
  total_attempts: number;
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

export interface FetchPlaybackStatsPayload {
  user_id: string;
}

export interface FetchPlaybackStatsResponse {
  simultion_completion: {
    completed: number;
    total: number;
    total_modules: number;
  };
  ontime_completion: {
    completed: number;
    total: number;
  };
  average_sim_score: {
    percentage: number;
    difference_from_last_week: number;
  };
  highest_sim_score: {
    percentage: number;
    difference_from_last_week: number;
  };
}

export interface PlaybackRowPaginationParams {
  page: number;
  pagesize: number;
  sortDir?: "asc" | "desc";
  search?: string;
}

// New interface for insights request
export interface FetchPlaybackInsightsPayload {
  user_id: string;
  attempt_id: string;
  simulation_id?: string;
  simulation_type?: string;
}

// New interface for insights response
export interface PlaybackInsight {
  category: string;
  score: string;
  things_done_well: Array<{
    title: string;
    description: string;
  }>;
  things_to_improve: Array<{
    title: string;
    description: string;
  }>;
}

export interface FetchPlaybackInsightsResponse {
  insights: {
    confidence: PlaybackInsight;
    concentration: PlaybackInsight;
    energy: PlaybackInsight;
    dead_air_time: {
      percentage: string;
      description: string;
    };
    click_score?: {
      score: string;
      total: string;
      description: string;
    };
    keyword_score?: {
      score: string;
      total: string;
      description: string;
    };
    text_field_keyword_score?: {
      score: string;
      total: string;
      description: string;
    };
    sim_accuracy_score?: {
      percentage: string;
      description: string;
    };
  };
}

export const fetchPlaybackRowData = async (
  payload: FetchPlaybackRowDataPayload
): Promise<FetchPlaybackRowDataResponse> => {
  try {
    const response = await apiClient.post("/attempts/fetch", payload);
    return response.data;
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

export const fetchPlaybackStats = async (
  payload: FetchPlaybackStatsPayload
): Promise<FetchPlaybackStatsResponse> => {
  try {
    const response = await apiClient.post("/attempts/fetch/stats", payload);
    return response.data.attempts;
  } catch (error) {
    console.error("Error fetching manager dashboard aggregated data:", error);
    throw error;
  }
};

// New function to fetch playback insights
export const fetchPlaybackInsights = async (
  payload: FetchPlaybackInsightsPayload
): Promise<FetchPlaybackInsightsResponse> => {
  try {
    const response = await apiClient.post("/attempt/insights", payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching playback insights:", error);
    throw error;
  }
};