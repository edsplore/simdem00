import apiClient from "./api/interceptors";
import { TrainingData, TrainingStats } from "../types/training";

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

export interface FetchAssignedStatsPayload {
  user_id: string;
  pagination?: {
    page: number;
    pagesize: number;
  };
}

export const fetchAssignedStats = async (
  payload: FetchAssignedStatsPayload,
): Promise<TrainingStats> => {
  try {
    const response = await apiClient.post('/fetch-assigned-stats', payload);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned stats:', error);
    throw error;
  }
};
