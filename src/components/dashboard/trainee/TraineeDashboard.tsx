import React, { useEffect, useState } from 'react';
import { Stack, Container, Typography, Chip, styled  } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import DashboardContent from '../DashboardContent';
import WelcomeBanner from './WelcomeBanner';
import StatsGrid from './StatsGrid';
import TrainingPlanTable from './TrainingPlanTable';
import { fetchTrainingData } from '../../../services/training';
import type { TrainingData } from '../../../types/training';

const HeaderChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  height: 24,
  fontSize: '0.75rem',
}));

const TraineeDashboard = () => {
  const { user } = useAuth();
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalSimulationsCount =
    (trainingData?.training_plans?.reduce(
      (acc, plan) => acc + plan.total_simulations,
      0,
    ) ?? 0) +
    (trainingData?.modules?.reduce(
      (acc, module) => acc + module.total_simulations,
      0,
    ) ?? 0) +
    (trainingData?.simulations?.length ?? 0);
  
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
        <Stack spacing={4} sx={{ py: 1 }}>
          <WelcomeBanner userName={user?.name || ''} trainingData={trainingData} />
          <Typography variant="h5" fontWeight="medium">
            My Overall Stats
          </Typography>
          {trainingData?.stats && <StatsGrid stats={trainingData.stats} />}
          {trainingData && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h5" fontWeight="600">Training Plan</Typography>
                  <HeaderChip label={`${totalSimulationsCount} Simulations`} size="small" />
                </Stack>
              </Stack>
              <TrainingPlanTable
                trainingPlans={trainingData.training_plans || []}
                modules={trainingData.modules || []}
                simulations={trainingData.simulations || []}
                isLoading={isLoading}
                error={error}
              />
            </>
          )}
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default TraineeDashboard;