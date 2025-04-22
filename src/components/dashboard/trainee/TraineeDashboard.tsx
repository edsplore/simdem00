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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrainingData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          const data = await fetchTrainingData(user.id);
          setTrainingData(data);
        } catch (error) {
          console.error('Error loading training data:', error);
          setError('Failed to load training data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTrainingData();
  }, [user?.id]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          <WelcomeBanner userName={user?.name || ''} trainingData={trainingData} />
          {trainingData?.stats && <StatsGrid stats={trainingData.stats} />}
          {trainingData && (
            <TrainingPlanTable 
              trainingPlans={trainingData.training_plans || []}
              modules={trainingData.modules || []}
              simulations={trainingData.simulations || []}
              isLoading={isLoading}
              error={error}
            />
          )}
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default TraineeDashboard;