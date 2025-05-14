interface Simulation {
  simulation_id: string;
  name: string;
  type: string;
  level: string;
  est_time: number;
  dueDate?: string;
  due_date?: string | null;
  status: 'not_started' | 'ongoing' | 'finished';
  highest_attempt_score: number | null;
  assignment_id?: string;
}

interface Module {
  id: string;
  name: string;
  total_simulations: number;
  average_score: number;
  due_date: string | null;
  status: 'not_started' | 'ongoing' | 'finished';
  simulations: Simulation[];
  estimated_time?: number;
  est_time?: number;
}

interface TrainingPlan {
  id: string;
  name: string;
  completion_percentage: number;
  total_modules: number;
  total_simulations: number;
  est_time: number;
  average_sim_score: number;
  due_date: string | null;
  status: 'not_started' | 'ongoing' | 'finished';
  modules: Module[];
}

interface TrainingStats {
  simulation_completed: {
    total_simulations: number;
    completed_simulations: number;
    percentage: number;
  };
  timely_completion: {
    total_simulations: number;
    completed_simulations: number;
    percentage: number;
  };
  average_sim_score: number;
  highest_sim_score: number;
}

interface TrainingData {
  training_plans: TrainingPlan[];
  modules: Module[];
  simulations: Simulation[];
  stats: TrainingStats;
}

export type { TrainingData, TrainingPlan, Module, Simulation, TrainingStats };