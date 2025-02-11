import React, { useEffect, useState } from 'react';
import { Stack, Container } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import DashboardContent from '../DashboardContent';
import WelcomeBanner from './WelcomeBanner';
import StatsGrid from './StatsGrid';
import TrainingPlanTable from './TrainingPlanTable';
import { fetchTrainingData } from '../../../services/training';
import type { TrainingData } from '../../../types/training';

const TraineeDashboard = () => {
  const { user } = useAuth();
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);

  useEffect(() => {
    const loadTrainingData = async () => {
      if (user?.id) {
        try {
          user.id = 'userId11';
          const data = await fetchTrainingData(user.id);
          setTrainingData(data);
        } catch (error) {
          console.error('Error loading training data:', error);
        }
      }
    };

    loadTrainingData();
  }, [user?.id]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          <WelcomeBanner userName={user?.name || ''} />
          {trainingData && <StatsGrid stats={trainingData.stats} />}
          {trainingData && <TrainingPlanTable trainingPlans={trainingData.training_plans} />}
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default TraineeDashboard;