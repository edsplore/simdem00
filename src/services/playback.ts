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
  attemptNumber?: number;
  latestAttemptDate?: string;
}
export interface PaginationMetadata {
  total_count: number;
  page: number;
  pagesize: number;
  total_pages: number;
}

export interface FetchPlaybackRowDataResponse {
  attempts: AttemptsResponse[];
  total_attempts: number;
  pagination?: PaginationMetadata;
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
  finalScore: number;
  confidence: number;
  energy: number;
  concentration: number;
  minPassingScore: number;
  name: string;
  completedAt: string;
  type: string;
  simLevel: string;
  attemptType: string;
  keyword_analysis?: any[];
}

export interface FetchPlaybackStatsPayload {
  user_id: string;
}

export interface FetchPlaybackStatsResponse {
  simulation_completion: {
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
  simType?: string;
  type?: string;
  level?: string;
  createdFrom?: string;
  createdTo?: string;
}

// New interface for insights request
export interface FetchPlaybackInsightsPayload {
  user_id: string;
  attempt_id: string;
  simulation_id?: string;
  simulation_type?: string;
}

// Interface for individual insight items returned by the backend
export interface InsightItem {
  metric?: string | null;
  score?: number | null;
  insight: string;
}

// Interface for insights response based on the actual API response
export interface FetchPlaybackInsightsResponse {
  insights: {
    [key: string]: InsightItem[];
  };
}

export const fetchPlaybackRowData = async (
  payload: FetchPlaybackRowDataPayload
): Promise<FetchPlaybackRowDataResponse> => {
  try {
    const response = await apiClient.post("/attempts/fetch", payload);

    return {
      attempts: response.data.attempts || [],
      total_attempts: response.data.total_attempts || 0,
      pagination:
        response.data.pagination ||
        (payload.pagination
          ? {
              total_count: response.data.total_attempts || 0,
              page: payload.pagination.page,
              pagesize: payload.pagination.pagesize,
              total_pages: Math.ceil(
                (response.data.total_attempts || 0) /
                  payload.pagination.pagesize,
              ),
            }
          : undefined),
    };
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