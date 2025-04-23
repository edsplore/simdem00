import apiClient from './api/interceptors';

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
  };
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

// Staging URL - can be switched to staging as needed
// const TEAMS_URL = 'https://eu2ccapsal001.eastus2.cloudapp.azure.com/uam/api/teams';

// Dev URL - can be switched to staging as needed
const TEAMS_URL = 'https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/api/teams';

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
  search?: string
): Promise<TeamResponse> => {
  try {
    console.log(`Fetching teams for workspace: ${workspaceId}, page: ${page}, limit: ${limit}`);

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      workspace_id: workspaceId
    });

    // Add optional search parameter if provided
    if (search) {
      params.append('search', search);
    }

    const response = await apiClient.get(`${TEAMS_URL}?${params.toString()}`);

    console.log('Teams API response:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    // Return empty response instead of throwing to prevent UI crashes
    return { teams: [], items: [] };
  }
};