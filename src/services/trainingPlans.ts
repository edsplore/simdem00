import apiClient from './api/interceptors';

export interface TrainingPlan {
  id: string;
  name: string;
  tags: string[];
  added_object: Array<{
    type: 'module' | 'simulation';
    id: string;
  }>;
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
  estimated_time: number;
}

export interface CreateTrainingPlanResponse {
  id: string;
  status: string;
}

export interface CreateTrainingPlanPayload {
  user_id: string;
  training_plan_name: string;
  tags: string[];
  added_object: Array<{
    type: 'module' | 'simulation';
    id: string;
  }>;
}

export interface UpdateTrainingPlanPayload {
  user_id: string;
  training_plan_name: string;
  tags: string[];
  added_object: Array<{
    type: 'module' | 'simulation';
    id: string;
  }>;
}

export interface UpdateTrainingPlanResponse {
  id: string;
  name: string;
  tags: string[];
  added_object: Array<{
    type: 'module' | 'simulation';
    id: string;
  }>;
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
  estimated_time: number;
}

export interface TrainingPlanPaginationParams {
  page: number;
  pagesize: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
  createdBy?: string;
  tags?: string | string[];
  search?: string;
}

export interface TrainingPlansResponse {
  training_plans: TrainingPlan[];
  pagination?: {
    total_count: number;
    page: number;
    pagesize: number;
    total_pages: number;
  };
}

export interface CloneTrainingPlanRequest {
  user_id: string;
  training_plan_id: string;
}

export interface CloneTrainingPlanResponse {
  id: string;
  status: string;
}

/**
 * Clones an existing training plan
 * @param userId The user ID making the request
 * @param trainingPlanId The ID of the training plan to clone
 * @returns Promise with the cloned training plan response
 */
export const cloneTrainingPlan = async (
  userId: string,
  trainingPlanId: string
): Promise<CloneTrainingPlanResponse> => {
  try {
    const response = await apiClient.post('/training-plans/clone', {
      user_id: userId,
      training_plan_id: trainingPlanId
    });
    return response.data;
  } catch (error) {
    console.error('Error cloning training plan:', error);
    throw error;
  }
};

/**
 * Fetches training plans with pagination, filtering, and sorting
 * @param userId User ID
 * @param pagination Pagination, filtering, and sorting parameters
 * @returns Promise with training plans response
 */
export const fetchTrainingPlans = async (
  userId: string,
  pagination?: TrainingPlanPaginationParams
): Promise<TrainingPlansResponse> => {
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

      // Add optional creator filter
      if (pagination.createdBy) {
        payload.pagination.createdBy = pagination.createdBy;
      }

      // Add optional search
      if (pagination.search) {
        payload.pagination.search = pagination.search;
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

    console.log('Fetching training plans with payload:', payload);
    const response = await apiClient.post('/training-plans/fetch', payload);
    console.log('Training plans API response:', response.data);

    // Return the response with the correct structure
    return {
      training_plans: response.data.training_plans || [],
      pagination: response.data.pagination || {
        total_count: response.data.training_plans?.length || 0,
        page: pagination?.page || 1,
        pagesize: pagination?.pagesize || 10,
        total_pages: Math.ceil((response.data.training_plans?.length || 0) / (pagination?.pagesize || 10))
      }
    };
  } catch (error) {
    console.error('Error fetching training plans:', error);
    throw error;
  }
};

export const createTrainingPlan = async (payload: CreateTrainingPlanPayload): Promise<CreateTrainingPlanResponse> => {
  try {
    const response = await apiClient.post('/training-plans/create', {
      user_id: payload.user_id,
      training_plan_name: payload.training_plan_name,
      tags: payload.tags,
      added_object: payload.added_object
    });
    return response.data;
  } catch (error) {
    console.error('Error creating training plan:', error);
    throw error;
  }
};

/**
 * Updates an existing training plan
 * @param trainingPlanId The ID of the training plan to update
 * @param payload The update payload
 * @returns Promise with update response
 */
export const updateTrainingPlan = async (
  trainingPlanId: string,
  payload: UpdateTrainingPlanPayload
): Promise<UpdateTrainingPlanResponse> => {
  try {
    console.log(`Updating training plan ${trainingPlanId} with payload:`, payload);

    const response = await apiClient.put(`/training-plans/${trainingPlanId}/update`, {
      user_id: payload.user_id,
      training_plan_name: payload.training_plan_name,
      tags: payload.tags,
      added_object: payload.added_object
    });

    console.log('Update training plan response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating training plan ${trainingPlanId}:`, error);
    throw error;
  }
};