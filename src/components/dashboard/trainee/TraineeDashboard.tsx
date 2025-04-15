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
    let isMounted = true;
    
    const loadTrainingData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTrainingData(user.id);
        if (isMounted) {
          setTrainingData(data);
        }
      } catch (error) {
        console.error('Error loading training data:', error);
        if (isMounted) {
          setError('Failed to load training data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrainingData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          <WelcomeBanner userName={user?.name || ''} />
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