import apiClient from './api/interceptors';

export interface Module {
  id: string;
  name: string;
  tags: string[];
  simulations_id: string[];
  status?: string;
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

export interface ModulePaginationParams {
  page: number;
  pagesize: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
  createdBy?: string;
  tags?: string | string[];
  search?: string;
  status?: string | string[];
}

export interface ModulesResponse {
  modules: Module[];
  pagination?: {
    total_count: number;
    page: number;
    pagesize: number;
    total_pages: number;
  };
}

export interface CloneModuleRequest {
  user_id: string;
  module_id: string;
}

export interface CloneModuleResponse {
  id: string;
  status: string;
}


/**
 * Clones an existing module
 * @param userId The user ID making the request
 * @param moduleId The ID of the module to clone
 * @returns Promise with the cloned module response
 */
export const cloneModule = async (
  userId: string,
  moduleId: string
): Promise<CloneModuleResponse> => {
  try {
    const response = await apiClient.post('/modules/clone', {
      user_id: userId,
      module_id: moduleId
    });
    return response.data;
  } catch (error) {
    console.error('Error cloning module:', error);
    throw error;
  }
};

export const createModule = async (payload: CreateModulePayload): Promise<CreateModuleResponse> => {
  try {
    const response = await apiClient.post('/modules/create', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

/**
 * Fetches modules with pagination, filtering, and sorting
 * @param userId User ID
 * @param pagination Pagination, filtering, and sorting parameters
 * @returns Promise with modules response
 */
export const fetchModules = async (
  userId: string,
  pagination?: ModulePaginationParams
): Promise<ModulesResponse> => {
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

      // Add optional status filter
      if (pagination.status) {
        if (Array.isArray(pagination.status)) {
          payload.pagination.status = pagination.status;
        } else if (pagination.status !== "All") {
          payload.pagination.status = [pagination.status];
        }
      }
    }

    console.log('Fetching modules with payload:', payload);
    const response = await apiClient.post('/modules/fetch', payload);
    console.log('Modules API response:', response.data);

    // Return the response with the correct structure
    return {
      modules: response.data.modules || [],
      pagination: response.data.pagination || {
        total_count: response.data.modules?.length || 0,
        page: pagination?.page || 1,
        pagesize: pagination?.pagesize || 10,
        total_pages: Math.ceil((response.data.modules?.length || 0) / (pagination?.pagesize || 10))
      }
    };
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

export interface ArchiveModuleResponse {
  id: string;
  status: string;
}

export const archiveModule = async (
  userId: string,
  moduleId: string
): Promise<ArchiveModuleResponse> => {
  try {
    const payload = { user_id: userId, module_id: moduleId };
    const response = await apiClient.post('/modules/archive', payload);
    return response.data;
  } catch (error) {
    console.error('Error archiving module:', error);
    throw error;
  }
};

export const unarchiveModule = async (
  userId: string,
  moduleId: string
): Promise<ArchiveModuleResponse> => {
  try {
    const payload = { user_id: userId, module_id: moduleId };
    const response = await apiClient.post('/modules/unarchive', payload);
    return response.data;
  } catch (error) {
    console.error('Error unarchiving module:', error);
    throw error;
  }
};