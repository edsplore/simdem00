import apiClient from "./api/interceptors";

// Types
export type SimulationType =
  | "audio"
  | "visual-audio"
  | "chat"
  | "visual-chat"
  | "visual";

export interface CreateSimulationRequest {
  user_id: string;
  name: string;
  division_id?: string;
  department_id?: string;
  type: SimulationType;
  tags?: string[];
  script?: any[];
  status: "draft" | "published" | "archived";
}

export interface CreateSimulationResponse {
  status: string;
  id: string;
  [key: string]: any; // For any additional fields that might be returned
}

export interface PublishSimulationRequest {
  user_id: string;
  sim_name: string;
  division_id?: string;
  department_id?: string;
  sim_type: SimulationType;
  tags?: string[];
  status: "published" | "draft" | "archived";
  lvl1?: {
    is_enabled?: boolean;
    enable_practice?: boolean;
    hide_agent_script?: boolean;
    hide_customer_script?: boolean;
    hide_keyword_scores?: boolean;
    hide_sentiment_scores?: boolean;
    hide_highlights?: boolean;
    hide_coaching_tips?: boolean;
    enable_post_simulation_survey?: boolean;
    ai_powered_pauses_and_feedback?: boolean;
  };
  lvl2?: {
    is_enabled?: boolean;
    enable_practice?: boolean;
    hide_agent_script?: boolean;
    hide_customer_script?: boolean;
    hide_keyword_scores?: boolean;
    hide_sentiment_scores?: boolean;
    hide_highlights?: boolean;
    hide_coaching_tips?: boolean;
    enable_post_simulation_survey?: boolean;
    ai_powered_pauses_and_feedback?: boolean;
  };
  lvl3?: {
    is_enabled?: boolean;
    enable_practice?: boolean;
    hide_agent_script?: boolean;
    hide_customer_script?: boolean;
    hide_keyword_scores?: boolean;
    hide_sentiment_scores?: boolean;
    hide_highlights?: boolean;
    hide_coaching_tips?: boolean;
    enable_post_simulation_survey?: boolean;
    ai_powered_pauses_and_feedback?: boolean;
  };
  estimated_time_to_attempt_in_mins?: number;
  key_objectives?: string[];
  quick_tips?: string[];
  overview_video?: string;
  voice_id?: string;
  language?: string;
  mood?: string;
  voice_speed?: string;
  prompt?: string;
  simulation_completion_repetition?: number;
  minimum_passing_score: number;
  simulation_max_repetition?: number;
  final_simulation_score_criteria?: string;
  simulation_scoring_metrics?: {
    is_enabled?: boolean;
    keyword_score?: number;
    click_score?: number;
    points_per_keyword?: number;
    points_per_click?: number;
  };
  metric_weightage?: {
    click_accuracy?: number;
    keyword_accuracy?: number;
    data_entry_accuracy?: number;
    contextual_accuracy?: number;
    sentiment_measures?: number;
  };
  sim_practice?: {
    is_unlimited?: boolean;
    pre_requisite_limit?: number;
  };
  is_locked?: boolean;
  version?: number;
  script?: Array<{
    script_sentence: string;
    role: string;
    keywords?: string[];
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface UpdateSimulationRequest {
  user_id: string;
  sim_name: string;
  division_id?: string;
  department_id?: string;
  sim_type: SimulationType;
  script?: any[]; // Using any[] to match the existing code format
  tags?: string[];
  [key: string]: any; // For any additional fields
}

export interface UpdateSimulationResponse {
  status: string;
  id: string;
  prompt?: string;
  [key: string]: any; // For any additional fields that might be returned
}

export interface FetchSimulationResponse {
  id: string;
  sim_name: string;
  division_id?: string;
  department_id?: string;
  sim_type: SimulationType;
  status: string;
  prompt?: string;
  tags?: string[];
  script?: Array<{
    script_sentence: string;
    role: string;
    keywords?: string[];
    [key: string]: any;
  }>;
  slidesData?: Array<{
    imageId: string;
    imageName: string;
    imageUrl: string;
    sequence: Array<any>;
    masking?: Array<any>;
  }>;
  lvl1?: any;
  lvl2?: any;
  lvl3?: any;
  estimated_time_to_attempt_in_mins?: number;
  key_objectives?: string[];
  quick_tips?: string[];
  overview_video?: string;
  voice_id?: string;
  language?: string;
  mood?: string;
  voice_speed?: string;
  simulation_completion_repetition?: number;
  simulation_max_repetition?: number;
  final_simulation_score_criteria?: string;
  simulation_scoring_metrics?: {
    is_enabled?: boolean;
    keyword_score?: number;
    click_score?: number;
    points_per_keyword?: number;
    points_per_click?: number;
  };
  metric_weightage?: {
    click_accuracy?: number;
    keyword_accuracy?: number;
    data_entry_accuracy?: number;
    contextual_accuracy?: number;
    sentiment_measures?: number;
  };
  sim_practice?: {
    is_unlimited?: boolean;
    pre_requisite_limit?: number;
  };
  is_locked?: boolean;
  version?: number;
  [key: string]: any;
}

export interface CompleteSimulationResponse {
  simulation?: FetchSimulationResponse;
  images?: Array<{
    image_id: string;
    image_data: string;
  }>;
  document?: {
    simulation: FetchSimulationResponse;
    images?: Array<{
      image_id: string;
      image_data: string;
    }>;
  };
  [key: string]: any; // For any additional fields or direct simulation data
}

// New interface for simulation cloning request
export interface CloneSimulationRequest {
  user_id: string;
  simulation_id: string;
}

// New interface for simulation cloning response
export interface CloneSimulationResponse {
  status: string;
  id?: string;
  message?: string;
  [key: string]: any; // For any additional fields that might be returned
}

// Interface for archiving a simulation
export interface ArchiveSimulationRequest {
  user_id: string;
  simulation_id: string;
}

export interface ArchiveSimulationResponse {
  id: string;
  status: string;
}

// Interface for unarchiving a simulation
export interface UnarchiveSimulationRequest {
  user_id: string;
  simulation_id: string;
}

export interface UnarchiveSimulationResponse {
  id: string;
  status: string;
}

export interface UpdateImageMaskingObjectResponse {
  status: string;
  message?: string;
}

export interface MaskingItem {
  id: string;
  type: "masking";
  content: {
    id: string;
    type: "masking";
    coordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    percentageCoordinates?: {
      xPercent: number;
      yPercent: number;
      widthPercent: number;
      heightPercent: number;
    };
    settings?: {
      color: string;
      solid_mask: boolean;
      blur_mask: boolean;
    };
  };
  timestamp?: number;
}

export interface DetectMaskPHIResponse {
  id: string;
  masking: {
    imageWidth: number;
    imageHeight: number;
    rectangles: Array<{
      id: string;
      x: string | number;
      y: string | number;
      width: string | number;
      height: string | number;
      text?: string;
    }>;
  };
}

/**
 * Creates a new simulation
 * @param simulationData - The data for the new simulation
 * @returns A promise with the simulation creation response
 */
export const createSimulation = async (
  simulationData: CreateSimulationRequest,
): Promise<CreateSimulationResponse> => {
  try {
    const response = await apiClient.post<CreateSimulationResponse>(
      "/simulations/create",
      simulationData,
    );

    return response.data;
  } catch (error) {
    console.error("Error creating simulation:", error);
    // Make sure to rethrow the error so it can be caught and handled by the component
    throw error;
  }
};

/**
 * Helper function to create a simulation with default values
 * @param userId - The ID of the user creating the simulation
 * @param name - The name of the simulation
 * @param simulationType - The type of simulation
 * @param options - Additional options for the simulation
 * @returns A promise with the simulation creation response
 */
export const createSimulationWithDefaults = async (
  userId: string,
  name: string,
  simulationType: SimulationType,
  options?: {
    division_id?: string;
    department_id?: string;
    tags?: string[];
  },
): Promise<CreateSimulationResponse> => {
  const simulationData: CreateSimulationRequest = {
    user_id: userId,
    name,
    division_id: options?.division_id || "",
    department_id: options?.department_id || "",
    type: simulationType.toLowerCase() as SimulationType,
    tags: options?.tags || [],
    script: [], // Empty script to be filled later
    status: "draft", // Start as draft
  };

  return createSimulation(simulationData);
};

/**
 * Updates an existing simulation
 * @param simulationId - The ID of the simulation to update
 * @param updateData - The data to update
 * @returns A promise with the simulation update response
 */
export const updateSimulation = async (
  simulationId: string,
  updateData: UpdateSimulationRequest,
): Promise<UpdateSimulationResponse> => {
  try {
    const response = await apiClient.put<UpdateSimulationResponse>(
      `/simulations/${simulationId}/update`,
      updateData,
    );

    return response.data;
  } catch (error) {
    console.error("Error updating simulation:", error);
    throw error;
  }
};

/**
 * Updates a simulation with FormData (for handling file uploads)
 * @param simulationId - The ID of the simulation to update
 * @param formData - The FormData containing the update data and files
 * @returns A promise with the simulation update response
 */
export const updateSimulationWithFormData = async (
  simulationId: string,
  formData: FormData,
): Promise<UpdateSimulationResponse> => {
  try {
    const response = await apiClient.put<UpdateSimulationResponse>(
      `/simulations/${simulationId}/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error updating simulation with form data:", error);
    throw error;
  }
};

/**
 * Updates a masking array of an image in a simulation
 * @param simulationId - The ID of the simulation to update
 * @param imageId - The ID of the image to update
 * @param maskingData - The masking data to update
 * @returns A promise with the masking update response
 */
export const updateSimulationWithMasking = async (
  simulationId: string,
  imageId: string,
  maskingData: MaskingItem[],
) => {
  try {
    // Convert masking data to the right format for the backend
    const processedMaskingData = maskingData.map((item) => {
      const masking = item.content;

      // Ensure we have the right properties
      return {
        id: item.id,
        type: item.type,
        content: {
          id: masking.id,
          type: masking.type,
          // Include both coordinate formats
          coordinates: masking.coordinates,
          percentageCoordinates: masking.percentageCoordinates,
          settings: masking.settings,
        },
      };
    });

    // Make the API call
    const response = await api.post(
      `/simulations/${simulationId}/images/${imageId}/masking`,
      {
        masking: processedMaskingData,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error updating simulation masking:", error);
    throw error;
  }
};

/**
 * Publishes a simulation with complete settings
 * @param simulationId - The ID of the simulation to publish
 * @param publishData - The complete publish data including all settings
 * @returns A promise with the simulation update response
 */
export const publishSimulation = async (
  simulationId: string,
  publishData: PublishSimulationRequest,
): Promise<UpdateSimulationResponse> => {
  try {
    const response = await apiClient.put<UpdateSimulationResponse>(
      `/simulations/${simulationId}/update`,
      publishData,
    );

    return response.data;
  } catch (error) {
    console.error("Error publishing simulation:", error);
    throw error;
  }
};

/**
 * Publishes a simulation with FormData (for handling file uploads)
 * @param simulationId - The ID of the simulation to publish
 * @param formData - The FormData containing the publish data and files
 * @returns A promise with the simulation update response
 */
export const publishSimulationWithFormData = async (
  simulationId: string,
  formData: FormData,
): Promise<UpdateSimulationResponse> => {
  try {
    // Make sure the status is set to "published" in the FormData
    if (!formData.has("status")) {
      formData.append("status", "published");
    }

    const response = await apiClient.put<UpdateSimulationResponse>(
      `/simulations/${simulationId}/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error publishing simulation with form data:", error);
    throw error;
  }
};

/**
 * Fetches a complete simulation with all associated data
 * @param simulationId - The ID of the simulation to fetch
 * @returns A promise with the complete simulation data response
 */
export const fetchCompleteSimulation = async (
  simulationId: string,
): Promise<CompleteSimulationResponse> => {
  try {
    const response = await apiClient.get<CompleteSimulationResponse>(
      `/simulations/fetch/${simulationId}`,
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching simulation:", error);
    throw error;
  }
};

/**
 * Clones an existing simulation
 * @param userId - The ID of the user cloning the simulation
 * @param simulationId - The ID of the simulation to clone
 * @returns A promise with the simulation cloning response
 */
export const cloneSimulation = async (
  userId: string,
  simulationId: string,
): Promise<CloneSimulationResponse> => {
  try {
    const cloneData: CloneSimulationRequest = {
      user_id: userId,
      simulation_id: simulationId,
    };

    const response = await apiClient.post<CloneSimulationResponse>(
      "/simulations/clone",
      cloneData,
    );

    return response.data;
  } catch (error) {
    console.error("Error cloning simulation:", error);
    throw error;
  }
};

export const detectMaskAreas = async (
  formData: FormData,
): Promise<DetectMaskPHIResponse[]> => {
  try {
    const response = await apiClient.post<DetectMaskPHIResponse[]>(
      `/simulations/detect-mask-areas`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error cloning simulation:", error);
    throw error;
  }
};

/**
 * Archives a simulation
 * @param userId - ID of the user performing the action
 * @param simulationId - ID of the simulation to archive
 * @returns A promise with the archive response
 */
export const archiveSimulation = async (
  userId: string,
  simulationId: string,
): Promise<ArchiveSimulationResponse> => {
  try {
    const payload: ArchiveSimulationRequest = {
      user_id: userId,
      simulation_id: simulationId,
    };

    const response = await apiClient.post<ArchiveSimulationResponse>(
      '/simulations/archive',
      payload,
    );

    return response.data;
  } catch (error) {
    console.error('Error archiving simulation:', error);
    throw error;
  }
};

/**
 * Unarchives a simulation
 * @param userId - ID of the user performing the action
 * @param simulationId - ID of the simulation to unarchive
 * @returns A promise with the unarchive response
 */
export const unarchiveSimulation = async (
  userId: string,
  simulationId: string,
): Promise<UnarchiveSimulationResponse> => {
  try {
    const payload: UnarchiveSimulationRequest = {
      user_id: userId,
      simulation_id: simulationId,
    };

    const response = await apiClient.post<UnarchiveSimulationResponse>(
      '/simulations/unarchive',
      payload,
    );

    return response.data;
  } catch (error) {
    console.error('Error unarchiving simulation:', error);
    throw error;
  }
};
