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

export interface RoleCount {
  role: string;
  count: number;
}

export interface UserStat {
  total_count: number;
  role_breakdown: RoleCount[];
}

export interface AdminDashboardUserStatsResponse {
  new_users: UserStat;
  activation_pending_users: UserStat;
  active_users: UserStat;
  deactivated_users: UserStat;
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

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_BACKEND_URL;
const USER_REPORT_URL = `${UAM_API_URL}/uam/api/user-report`;

export const fetchAdminDashboardStats = async (
  workspaceId: string,
): Promise<AdminDashboardUserStatsResponse> => {
  try {
    const encodedWorkspaceId = encodeURIComponent(workspaceId);
    const response = await apiClient.get(
      `${USER_REPORT_URL}/${encodedWorkspaceId}/simulator/stats`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
};
