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

export const createModule = async (payload: CreateModulePayload): Promise<CreateModuleResponse> => {
  try {
    const response = await apiClient.post('/api/modules/create', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

export const fetchModules = async (userId: string): Promise<Module[]> => {
  try {
    const response = await apiClient.post('/api/modules/fetch', {
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
    const response = await apiClient.get(`/api/modules/fetch/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching module details:', error);
    throw error;
  }
};