import apiClient from "./api/interceptors";

export interface Assignment {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  team_id: string[];
  trainee_id: string[];
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
  status: string;
}

export interface CreateAssignmentPayload {
  user_id: string;
  name: string;
  type: "TrainingPlan" | "Module" | "Simulation";
  id: string;
  start_date: string;
  end_date: string;
  team_id?: string[];
  trainee_id: string[];
}

export interface CreateAssignmentResponse {
  id: string;
  status: string;
}

export interface AssignmentPaginationParams {
  page: number;
  pagesize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  createdFrom?: string;
  createdTo?: string;
  createdBy?: string;
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface AssignmentsResponse {
  assignments: Assignment[];
  pagination?: {
    total_count: number;
    page: number;
    pagesize: number;
    total_pages: number;
  };
}

/**
 * Fetches all assignments with pagination, filtering, and sorting
 * @param pagination Pagination, filtering, and sorting parameters
 * @returns Promise with array of assignments and pagination info
 */
export const fetchAssignments = async (
  pagination?: AssignmentPaginationParams
): Promise<AssignmentsResponse> => {
  try {
    const payload: any = {};

    // Add pagination parameters if provided
    if (pagination) {
      payload.pagination = {
        page: pagination.page,
        pagesize: pagination.pagesize,
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
      if (pagination.startDate) {
        payload.pagination.startDate = pagination.startDate;
      }
      if (pagination.endDate) {
        payload.pagination.endDate = pagination.endDate;
      }

      // Add optional creator filter
      if (pagination.createdBy) {
        payload.pagination.createdBy = pagination.createdBy;
      }

      // Add optional search
      if (pagination.search) {
        payload.pagination.search = pagination.search;
      }

      // Add optional type filter
      if (pagination.type) {
        payload.pagination.type = pagination.type;
      }

      // Add optional status filter
      if (pagination.status) {
        payload.pagination.status = pagination.status;
      }
    }

    console.log("Fetching assignments with payload:", payload);
    const response = await apiClient.post("/fetch-assignments", payload);
    console.log("Assignments API response:", response.data);

    // Return the response with the correct structure
    return {
      assignments: response.data.assignments || [],
      pagination: response.data.pagination || {
        total_count: response.data.assignments?.length || 0,
        page: pagination?.page || 1,
        pagesize: pagination?.pagesize || 10,
        total_pages: Math.ceil(
          (response.data.assignments?.length || 0) /
            (pagination?.pagesize || 10)
        ),
      },
    };
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

/**
 * Creates a new assignment
 * @param payload Assignment data
 * @returns Promise with assignment creation response
 */
export const createAssignment = async (
  payload: CreateAssignmentPayload
): Promise<CreateAssignmentResponse> => {
  try {
    const response = await apiClient.post("/create-assignment", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};
