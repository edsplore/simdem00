import apiClient from "./api/interceptors";

export interface AdminDashboardUserActivityPayloadParams {
  department?: string;
  division?: string;
  role?: string;
  status?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface AdminDashboardUserActivityPayload {
  user_id: string;
  pagination?: AdminDashboardUserActivityPayloadParams;
}

export interface AdminDashboardUserStatsPayload {
  user_id: string;
}

export interface AdminDashboardUserActivityResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  division: string;
  department: string;
  addedOn: string;
  status: string;
  assignedSimulations: number;
  completionRate: number;
  adherenceRate: number;
  averageScore: number;
  activatedOn: string;
  deActivatedOn: string;
  loginCount: number;
  lastLoginOn: string;
  lastSessionDuration: number;
}

export interface AdminDashboardUserStatsResponse {
  new_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
  active_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
  deactivated_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
  daily_active_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
  weekly_active_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
  monthly_active_users: {
    total_users: number;
    breakdown: {
      admin: number;
      manager: number;
      designer: number;
      trainees: number;
    };
  };
}

export const fetchAdminDashboardUserActivity = async (
  payload: AdminDashboardUserActivityPayload
): Promise<AdminDashboardUserActivityResponse[]> => {
  try {
    const response = await apiClient.post(
      "/admin-dashboard/users/activity",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
};

export const fetchAdminDashboardStats = async (
  payload: AdminDashboardUserStatsPayload
): Promise<AdminDashboardUserStatsResponse> => {
  try {
    const response = await apiClient.post(
      "/admin-dashboard/users/stats",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
};
