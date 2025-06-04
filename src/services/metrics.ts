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

export const fetchActiveUserMetricsHistory = async (
  days: number
): Promise<ActiveUserMetricsHistoryResponse> => {
  try {
    const response = await apiClient.get("/metrics/active-users/history", {
      params: { days },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching active user metrics history:", error);
    throw error;
  }
};
