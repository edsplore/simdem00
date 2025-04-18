import apiClient from "./api/interceptors";

// Staging
// const SUGGESTIONS_URL = 'https://eu2ccapsal001.eastus2.cloudapp.azure.com/uam/api/suggestions';

// Dev
const SUGGESTIONS_URL =  "https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/api/suggestions";

/**
 * Fetches divisions for a specific workspace
 * @param workspaceId The workspace ID
 * @returns Promise with array of division names
 */
export const fetchDivisions = async (
  workspaceId: string,
): Promise<string[]> => {
  try {
    console.log(`Fetching divisions for workspace: ${workspaceId}`);
    const response = await apiClient.get(`${SUGGESTIONS_URL}/${workspaceId}`, {
      params: {
        type: "division",
      },
    });
    console.log("Divisions API response:", response.data);
    // Extract the array from the response object
    return response.data?.division || [];
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }
};

/**
 * Fetches departments for a specific workspace
 * @param workspaceId The workspace ID
 * @returns Promise with array of department names
 */
export const fetchDepartments = async (
  workspaceId: string,
): Promise<string[]> => {
  try {
    console.log(`Fetching departments for workspace: ${workspaceId}`);
    const response = await apiClient.get(`${SUGGESTIONS_URL}/${workspaceId}`, {
      params: {
        type: "department",
      },
    });
    console.log("Departments API response:", response.data);
    // Extract the array from the response object
    return response.data?.department || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};
