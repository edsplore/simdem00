import apiClient from "./api/interceptors";

export interface CreateModuleResponse {
  id: string;
  status: string;
}

export interface ManagerDashboardAggregatedDataPayload {
  user_id: string;
}

export interface ManagerDashboardTrainingEntityCounts {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

export interface ManagerDashboardAggregateValues {
  trainingPlans: number;
  modules: number;
  simulations: number;
}

export interface ManagerDashboardLeaderBoardTeamWiseMetrics {
    team: string;
    score: number;
}

export interface ManagerDashboardLeaderBoard {
    completion: ManagerDashboardLeaderBoardTeamWiseMetrics[];
    averageScore: ManagerDashboardLeaderBoardTeamWiseMetrics[];
    adherence: ManagerDashboardLeaderBoardTeamWiseMetrics[];
}

export interface TrainingPlansManagerDashboard {
  id: number;
  name: string;
  assigned_trainees: number;
  completion_rate: string;
  adherence_rate: string;
  avg_score: string;
  est_time: string;
  trainees: {
    name: string;
    class_id: number;
    status: string;
    due_date: string;
    avg_score?: string;
  }[];
}

export interface SimulationsManagerDashboard {
  id: number;
  name: string;
  assigned_trainees: number;
  completion_rate: string;
  adherence_rate: string;
  avg_score: string;
  est_time: string;
  trainees: {
    name: string;
    class_id: number;
    status: string;
    due_date: string;
    avg_score?: string;
  }[];
}

export interface ModulesManagerDashboard {
  id: number;
  name: string;
  assigned_trainees: number;
  completion_rate: string;
  adherence_rate: string;
  avg_score: string;
  est_time: string;
  trainees: {
    name: string;
    class_id: number;
    status: string;
    due_date: string;
    avg_score?: string;
  }[];
}

export interface ManagerDashboardTrainingEntityAttemptsStatsPayload {
    user_id: string;
    type: string;
}

export interface ManagerDashboardTrainingEntityAttemptsStatsResponse {
    id: number;
    name: string;
    assigned_trainees: number;
    completion_rate: string;
    adherence_rate: string;
    avg_score: string;
    est_time: string;
    trainees: {
      name: string;
      class_id: number;
      status: string;
      due_date: string;
      avg_score?: string;
    }[];
}

export interface ManagerDashboardAggregatedDataResponse {
  assignmentCounts: {
    trainingPlans: ManagerDashboardTrainingEntityCounts;
    modules: ManagerDashboardTrainingEntityCounts;
    simulations: ManagerDashboardTrainingEntityCounts;
  };
  completionRates: ManagerDashboardAggregateValues;
  averageScores: ManagerDashboardAggregateValues;
  adherenceRates: ManagerDashboardAggregateValues;
  leaderBoards: ManagerDashboardLeaderBoard;
}

export const fetchManagerDashboardAggregatedData = async (
  payload: ManagerDashboardAggregatedDataPayload
): Promise<ManagerDashboardAggregatedDataResponse> => {
  try {
    const response = await apiClient.post(
      "/manager-dashboard-data/fetch",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching manager dashboard aggregated data:", error);
    throw error;
  }
};

export const fetchTrainingEntityAttemptsStatsForManagerDashboard = async (
    payload: ManagerDashboardTrainingEntityAttemptsStatsPayload
  ): Promise<any> => {
    try {
      const response = await apiClient.post(
        "/manager-dashboard-data/fetch/training-entity",
        payload
      );
      return response.data.training_entity;
    } catch (error) {
      console.error("Error fetching training entity attempts stats:", error);
      throw error;
    }
  };

export const fetchTrainingPlansForManagerDashboard = async (
  userId: string
): Promise<any> => {
  try {
    const response = await apiClient.post(
      "/manager-dashboard-data/training-plans/fetch",
      {
        user_id: userId,
      }
    );
    return response.data.training_plans;
  } catch (error) {
    console.error("Error fetching simulations:", error);
    throw error;
  }
};

export const fetchSimulationsForManagerDashboard = async (
  userId: string
): Promise<any> => {
  try {
    const response = await apiClient.post(
      "/manager-dashboard-data/simulations/fetch",
      {
        user_id: userId,
      }
    );
    return response.data.simulations;
  } catch (error) {
    console.error("Error fetching simulations:", error);
    throw error;
  }
};

export const fetchModulesForManagerDashboard = async (
  userId: string
): Promise<any> => {
  try {
    const response = await apiClient.post(
      "/manager-dashboard-data/modules/fetch",
      {
        user_id: userId,
      }
    );
    return response.data.modules;
  } catch (error) {
    console.error("Error fetching simulations:", error);
    throw error;
  }
};
