import apiClient from "./api/interceptors";

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_BACKEND_URL;
const ROLES_URL = `${UAM_API_URL}/uam/api/simulator/roles`;

export interface Role {
  role_id: string;
  name: string;
}

export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const response = await apiClient.get(ROLES_URL);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};
