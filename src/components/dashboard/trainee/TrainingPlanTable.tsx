import React from "react";
import type { TrainingPlan, Module, Simulation } from "../../../types/training";
import TrainingItemsTable from "./TrainingItemsTable";

interface TrainingPlanTableProps {
  trainingPlans: TrainingPlan[];
  modules?: Module[];
  simulations?: Simulation[];
  isLoading?: boolean;
  error?: string | null;
}

const TrainingPlanTable: React.FC<TrainingPlanTableProps> = ({
  trainingPlans,
  modules = [],
  simulations = [],
  isLoading = false,
  error = null,
}) => {
  return (
    <TrainingItemsTable
      trainingPlans={trainingPlans}
      modules={modules}
      simulations={simulations}
      isLoading={isLoading}
      error={error}
      showTrainingPlans={true}
    />
  );
};

export default TrainingPlanTable;