import apiClient from './api/interceptors';


export interface CreateModuleResponse {
    id: string;
    status: string;
}

export interface FetchManagerDashboardAggregatedDataPayload {
    user_id: string;
}

export interface ManagerDashboardTrainingEntityCounts{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    overdue: number;
}

export interface ManagerDashboardAggregateValues{
    trainingPlans: number;
    modules: number;
    simulations: number;
}

export interface FetchManagerDashboardAggregatedDataResponse {
    assignmentCounts: {
        trainingPlans: ManagerDashboardTrainingEntityCounts;
        modules: ManagerDashboardTrainingEntityCounts;
        simulations: ManagerDashboardTrainingEntityCounts;
    };
    completionRates: ManagerDashboardAggregateValues;
    averageScores: ManagerDashboardAggregateValues;
    adherenceRates: ManagerDashboardAggregateValues;
}

export const fetchManagerDashboardAggregatedData = async (payload: FetchManagerDashboardAggregatedDataPayload): Promise<FetchManagerDashboardAggregatedDataResponse> => {
    try {
        debugger
      const response = await apiClient.post('/manager-dashboard-data/fetch', payload);
      return response.data;
    } catch (error) {
      console.error('Error fetching manager dashboard aggregated data:', error);
      throw error;
    }
  };