import React, { useState, useEffect } from 'react';
import { Stack, Typography, Container } from '@mui/material';
import DashboardContent from '../DashboardContent';
import StatsGrid from './StatsGrid';
import TrainingPlanTable from './TrainingPlanTable';
import { useAuth } from '../../../context/AuthContext';
import { fetchTrainingData } from '../../../services/training';
import type { TrainingData } from '../../../types/training';

const TrainingPlanPage = () => {
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
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight="medium">
                Training Plan
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor your score and progress on your assigned training plans
              </Typography>
            </Stack>
            {trainingData?.stats && <StatsGrid stats={trainingData.stats} />}
            {trainingData?.training_plans && (
              <TrainingPlanTable 
                trainingPlans={trainingData.training_plans}
                isLoading={isLoading}
                error={error}
              />
            )}
          </Stack>
        </Container>
      </DashboardContent>
  );
};

export default TrainingPlanPage;