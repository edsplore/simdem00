import apiClient from './api/interceptors';

export interface Module {
  id: string;
  name: string;
  tags: string[];
  simulations_id: string[];
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
  estimated_time: number;
}

export interface CreateModuleResponse {
  id: string;
  status: string;
}

export interface CreateModulePayload {
  user_id: string;
  module_name: string;
  tags: string[];
  simulations: string[];
}

export interface UpdateModulePayload {
  user_id: string;
  module_name: string;
  tags: string[];
  simulations: string[];
}

export interface UpdateModuleResponse {
  id: string;
  name: string;
  tags: string[];
  simulations_id: string[];
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
  estimated_time: number;
}

export const createModule = async (payload: CreateModulePayload): Promise<CreateModuleResponse> => {
  try {
    const response = await apiClient.post('/modules/create', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

export const fetchModules = async (userId: string): Promise<Module[]> => {
  try {
    const response = await apiClient.post('/modules/fetch', {
      user_id: userId
    });
    return response.data.modules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

export const fetchModuleDetails = async (moduleId: string): Promise<Module> => {
  try {
    const response = await apiClient.get(`/modules/fetch/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching module details:', error);
    throw error;
  }
};

/**
 * Updates an existing module
 * @param moduleId The ID of the module to update
 * @param payload The update payload
 * @returns Promise with update response
 */
export const updateModule = async (
  moduleId: string,
  payload: UpdateModulePayload
): Promise<UpdateModuleResponse> => {
  try {
    console.log(`Updating module ${moduleId} with payload:`, payload);

    const response = await apiClient.put(`/modules/${moduleId}/update`, {
      user_id: payload.user_id,
      module_name: payload.module_name,
      tags: payload.tags,
      simulations: payload.simulations
    });

    console.log('Update module response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating module ${moduleId}:`, error);
    throw error;
  }
};