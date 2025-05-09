import apiClient from "./api/interceptors";

export interface Team {
  team_id: string;
  team_name?: string;
  name?: string;
  workspace_id?: string;
  leader_user_ids?: string[];
  member_user_ids?: string[];
  leader?: {
    id: string;
    name: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_no?: string;
    fullName?: string;
  };
  team_members?: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: string;
    fullName: string;
  }>;
  team_members_count?: number;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  created?: {
    user: {
      id: string;
      name: string;
    };
    time: string;
  };
  updated?: {
    user: {
      id: string;
      name: string;
    };
    time: string;
  };
  status?: string;
}

export interface TeamResponse {
  teams?: Team[];
  items?: Team[];
  total_count?: number;
}

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_BACKEND_URL;
const TEAMS_URL = `${UAM_API_URL}/uam/api/teams`;

/**
 * Fetches teams for a specific workspace
 * @param workspaceId The workspace ID
 * @param page Page number (0-based)
 * @param limit Number of teams per page
 * @param search Optional search term
 * @returns Promise with team response
 */
export const fetchTeams = async (
  workspaceId: string,
  page: number = 0,
  limit: number = 100,
  search?: string,
  leaderUserId: string|null = null
): Promise<TeamResponse> => {
  try {
    console.log(
      `Fetching teams for workspace: ${workspaceId}, page: ${page}, limit: ${limit}`,
    );

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      workspace_id: workspaceId,
      status: "ACTIVE"
    });

    if(leaderUserId) {
      params.append("leader_user_ids", leaderUserId)
    }

    // Add optional search parameter if provided
    if (search) {
      params.append("search", search);
    }

    const response = await apiClient.get(`${TEAMS_URL}?${params.toString()}`);

    console.log("Teams API response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching teams:", error);
    // Return empty response instead of throwing to prevent UI crashes
    return { teams: [], items: [] };
  }
};

/**
 * Fetches detailed information for a specific team
 * @param workspaceId The workspace ID
 * @param teamId The team ID
 * @returns Promise with detailed team information
 */
export const fetchTeamDetails = async (
  workspaceId: string,
  teamId: string
): Promise<Team> => {
  try {
    console.log(`Fetching details for team ${teamId} in workspace ${workspaceId}`);

    const response = await apiClient.get(`${TEAMS_URL}/${teamId}`, {
      headers: {
        'X-WORKSPACE-ID': workspaceId
      }
    });

    console.log('Team details response:', response.data);

    return response.data;
  } catch (error) {
    console.error(`Error fetching details for team ${teamId}:`, error);
    throw error;
  }
};