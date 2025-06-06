import apiClient from "./api/interceptors";

export interface ActiveUserMetricsHistoryItem {
  date: string;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
}

export interface ActiveUserMetricsHistoryResponse {
  metrics: ActiveUserMetricsHistoryItem[];
}

export interface ActiveUserMetricsHistoryRequest {
  days?: number;
  role?: string;
  start_time?: string;
  end_time?: string;
}

export const fetchActiveUserMetricsHistory = async (
  params: ActiveUserMetricsHistoryRequest
): Promise<ActiveUserMetricsHistoryResponse> => {
  try {
    const query: Record<string, string | number | undefined> = {};
    if (params.days !== undefined) query.days = params.days;
    if (params.role) query.role = params.role;
    if (params.start_time) query.start_time = params.start_time;
    if (params.end_time) query.end_time = params.end_time;

    const response = await apiClient.get("/metrics/active-users/history", {
      params: query,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching active user metrics history:", error);
    throw error;
  }
};
