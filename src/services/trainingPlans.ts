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

export const fetchTrainingPlans = async (userId: string): Promise<TrainingPlan[]> => {
  try {
    const response = await apiClient.post('/api/training-plans/fetch', {
      user_id: userId
    });
    return response.data.training_plans;
  } catch (error) {
    console.error('Error fetching training plans:', error);
    throw error;
  }
};

export const createTrainingPlan = async (payload: CreateTrainingPlanPayload): Promise<CreateTrainingPlanResponse> => {
  try {
    const response = await apiClient.post('/api/training-plans/create', {
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

    const response = await apiClient.put(`/api/training-plans/${trainingPlanId}/update`, {
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