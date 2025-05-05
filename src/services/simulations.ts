import apiClient from './api/interceptors';

export interface Simulation {
  id: string;
  sim_name: string;
  version: string;
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  last_modified: string;
  modified_by: string;
  created_on: string;
  created_by: string;
  islocked: boolean;
  division_id?: string;
  department_id?: string;
  lvl1?: {
    isEnabled: boolean;
    enablePractice: boolean;
    hideAgentScript: boolean;
    hideCustomerScript: boolean;
    hideKeywordScores: boolean;
    hideSentimentScores: boolean;
    hideHighlights: boolean;
    hideCoachingTips: boolean;
    enablePostSimulationSurvey: boolean;
    aiPoweredPausesAndFeedback: boolean;
  };
  lvl2?: {
    isEnabled: boolean;
  };
  lvl3?: {
    isEnabled: boolean;
  };
  script?: any[];
  slidesData?: any[];
}

export interface SimulationPaginationParams {
  page: number;
  pagesize: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
  division?: string;
  department?: string;
  createdBy?: string;
  status?: string | string[];
  simType?: string;
  search?: string;
  searchQuery?: string; // For backward compatibility
  tags?: string | string[];
  level?: string;
  modifiedBy?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
}

export interface SimulationsResponse {
  simulations: Simulation[];
  pagination: {
    total_count: number;
    page: number;
    pagesize: number;
    total_pages: number;
  };
}

/**
 * Fetches simulations with pagination, filtering, and sorting
 * @param userId User ID
 * @param pagination Pagination, filtering, and sorting parameters
 * @returns Promise with simulations response
 */
export const fetchSimulations = async (
  userId: string,
  pagination?: SimulationPaginationParams
): Promise<SimulationsResponse> => {
  try {
    const payload: any = {
      user_id: userId
    };

    // Add pagination parameters if provided
    if (pagination) {
      payload.pagination = {
        page: pagination.page,
        pagesize: pagination.pagesize
      };

      // Add optional sorting
      if (pagination.sortBy) {
        payload.pagination.sortBy = pagination.sortBy;
      }
      if (pagination.sortDir) {
        payload.pagination.sortDir = pagination.sortDir;
      }

      // Add optional date filters
      if (pagination.createdFrom) {
        payload.pagination.createdFrom = pagination.createdFrom;
      }
      if (pagination.createdTo) {
        payload.pagination.createdTo = pagination.createdTo;
      }
      if (pagination.modifiedFrom) {
        payload.pagination.modifiedFrom = pagination.modifiedFrom;
      }
      if (pagination.modifiedTo) {
        payload.pagination.modifiedTo = pagination.modifiedTo;
      }

      // Add optional filters
      if (pagination.division) {
        payload.pagination.division = pagination.division;
      }
      if (pagination.department) {
        payload.pagination.department = pagination.department;
      }
      if (pagination.createdBy) {
        payload.pagination.createdBy = pagination.createdBy;
      }
      if (pagination.modifiedBy) {
        payload.pagination.modifiedBy = pagination.modifiedBy;
      }
      if (pagination.level) {
        payload.pagination.level = pagination.level;
      }

      // Status can be a string or array of strings
      if (pagination.status) {
        if (Array.isArray(pagination.status)) {
          payload.pagination.status = pagination.status;
        } else {
          payload.pagination.status = [pagination.status];
        }
      }

      if (pagination.simType) {
        payload.pagination.simType = pagination.simType;
      }

      // Map searchQuery to search as per API model
      if (pagination.search) {
        payload.pagination.search = pagination.search;
      } else if (pagination.searchQuery) {
        payload.pagination.search = pagination.searchQuery;
      }

      // Tags should be an array of strings
      if (pagination.tags) {
        if (Array.isArray(pagination.tags)) {
          payload.pagination.tags = pagination.tags;
        } else if (pagination.tags !== "All Tags") {
          // If it's a single string (not "All Tags"), convert to array
          payload.pagination.tags = [pagination.tags];
        }
      }
    }

    console.log('Fetching simulations with payload:', payload);
    const response = await apiClient.post('/simulations/fetch', payload);
    console.log('Simulations API response:', response.data);

    // Return the response with the correct structure based on the API response
    return {
      simulations: response.data.simulations || [],
      pagination: response.data.pagination || {
        total_count: response.data.simulations?.length || 0,
        page: pagination?.page || 1,
        pagesize: pagination?.pagesize || 10,
        total_pages: Math.ceil((response.data.simulations?.length || 0) / (pagination?.pagesize || 10))
      }
    };
  } catch (error) {
    console.error('Error fetching simulations:', error);
    throw error;
  }
};

export const fetchSimulationById = async (simulationId: string): Promise<Simulation> => {
  try {
    const response = await apiClient.get(`/simulations/fetch/${simulationId}`);
    return response.data.simulation;
  } catch (error) {
    console.error('Error fetching simulation:', error);
    throw error;
  }
};