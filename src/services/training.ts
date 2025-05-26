import apiClient from "./api/interceptors";
import type {
  TrainingData,
  TrainingStats,
  TrainingPlan,
  Module,
  Simulation,
} from "../types/training";

export const fetchTrainingPlanDetails = async (
  userId: string,
  planId: string,
) => {
  try {
    const response = await apiClient.get(`/training-plans/fetch/${planId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching training plan details:", error);
    throw error;
  }
};

export const fetchTrainingData = async (
  userId: string,
): Promise<TrainingData> => {
  try {
    const response = await apiClient.post('/fetch-assigned-plans', {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching training data:", error);
    throw error;
  }
};

export const fetchTrainingStats = async (
  userId: string,
): Promise<TrainingStats> => {
  try {
    const response = await apiClient.post('/fetch-assigned-stats', {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching training stats:', error);
    throw error;
  }
};

export interface TrainingItemsPaginationParams {
  page: number;
  pagesize: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface TrainingItemsResponse {
  training_plans: TrainingPlan[];
  modules: Module[];
  simulations: Simulation[];
  pagination?: {
    total_count: number;
    page: number;
    pagesize: number;
    total_pages: number;
  };
}

export const fetchTrainingItems = async (
  userId: string,
  params: TrainingItemsPaginationParams,
): Promise<TrainingItemsResponse> => {
  try {
    const payload: Record<string, unknown> = { user_id: userId };

    if (params) {
      payload.pagination = {
        page: params.page,
        pagesize: params.pagesize,
      };
      if (params.search) {
        payload.pagination.search = params.search;
      }
      if (params.status) {
        payload.pagination.status = params.status;
      }
      if (params.startDate) {
        payload.pagination.startDate = params.startDate;
      }
      if (params.endDate) {
        payload.pagination.endDate = params.endDate;
      }
    }

    const response = await apiClient.post("/fetch-assigned-plans", payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching training items:", error);
    throw error;
  }
};
