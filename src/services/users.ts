import apiClient from "./api/interceptors";

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  fullName: string;
  profile_img_url?: string;
  class_id?: string;
}

export interface UserSummary {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}


export interface UserDetails {
  user: {
    user_id: string;
    profile_img_url: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: string;
    division: string;
    department: string;
    reporting_to: {
      id: string;
      name: string;
    };
    hiring_date: string;
    class_id: string;
    internal_user_id: string;
    external_user_id: string;
    status: string;
    timezone?: string;
    created: {
      user: {
        id: string;
        name: string;
      };
      time: string;
    };
    updated: {
      user: {
        id: string;
        name: string;
      };
      time: string;
    };
    active: boolean;
    fullName: string;
    alreadyActivated: boolean;
  };
  workspace_roles_details: Record<string, any>;
}

export interface createUserPaylod {
  user_id: string;
}

export interface createUserResponse {
  user_id: string;
}

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_BACKEND_URL;
const USERS_URL = `${UAM_API_URL}/uam/api/users`;
const REPORTEE_USERS_URL = `${UAM_API_URL}/uam/api/users/self/reportees`;

export const fetchUsers = async (workspaceId: string): Promise<User[]> => {
  try {
    const response = await apiClient.post(USERS_URL, {
      params: {
        status: "ACTIVE",
      },
      headers: {
        "X-WORKSPACE-ID": workspaceId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const fetchReporteeUsers = async (
  workspaceId: string,
): Promise<User[]> => {
  try {
    const response = await apiClient.get(REPORTEE_USERS_URL, {
      params: {
        status: "ACTIVE",
      },
      headers: {
        "X-WORKSPACE-ID": workspaceId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching manager dashboard aggregated data:", error);
    throw error;
  }
};

export const fetchUsersSummary = async (
  workspaceId: string,
): Promise<User[]> => {
  try {
    // Directly encode the workspaceId since Axios handles its own URL encoding
    console.log(`Fetching users summary for workspace: ${workspaceId}`)
    const encodedWorkspaceId = encodeURIComponent(workspaceId);
    console.log(`Encoded workspace: ${encodedWorkspaceId}`)

    const response = await apiClient.get(`${USERS_URL}/platform?page=0&limit=50&workspace_id=${encodedWorkspaceId}&status=ACTIVE&fields=(user_id,email,first_name,last_name)`, {
      headers: {
        accept: "application/json",
      },
    });
    return response.data.items;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Fetch user details by user IDs
 * @param workspaceId The workspace ID
 * @param userIds Array of user IDs to fetch details for
 * @returns Promise with array of user details
 */
export const fetchUsersByIds = async (
  workspaceId: string,
  userIds: string[],
): Promise<User[]> => {
  try {
    // Encode the workspaceId to ensure proper handling of special characters
    const encodedWorkspaceId = encodeURIComponent(workspaceId);
    const response = await apiClient.post(
      `${USERS_URL}/summary?workspace_id=${encodedWorkspaceId}`,
      {
        user_ids: userIds,
        status: "ACTIVE",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
};

export const fetchUserDetails = async (
  userId: string,
  workspaceId: string,
): Promise<UserDetails> => {
  try {
    console.log(
      `Fetching user details from ${USERS_URL}/${userId} with workspace ID ${workspaceId}`,
    );
    const response = await apiClient.get(`${USERS_URL}/self`, {
      headers: {
        "X-WORKSPACE-ID": workspaceId,
      },
    });
    console.log("User details response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export const createUser = async (
  payload: createUserPaylod,
): Promise<createUserResponse> => {
  try {
    console.log(`Add Users to DB`);
    const response = await apiClient.post(`/users/create`, payload);
    console.log("User details response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};
