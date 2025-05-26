import React, { useState, useEffect } from 'react';
import { Stack, Typography, Container } from '@mui/material';
import DashboardContent from '../DashboardContent';
import StatsGrid from './StatsGrid';
import TrainingPlanTable from './TrainingPlanTable';
import { useAuth } from '../../../context/AuthContext';
import { fetchTrainingStats } from '../../../services/training';
import type { TrainingStats } from '../../../types/training';

const TrainingPlanPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          const data = await fetchTrainingStats(user.id);
          setStats(data.stats ?? data);
        } catch (error) {
          console.error('Error loading training data:', error);
          setError('Failed to load training data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStats();
  }, [user?.id]);

  return (
      <DashboardContent>
        <Container>
          <Stack spacing={4} sx={{ py: 1 }}>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight="medium">
                Training Plan
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor your score and progress on your assigned training plans
              </Typography>
            </Stack>
            {stats && <StatsGrid stats={stats} />}
            <TrainingPlanTable />
          </Stack>
        </Container>
      </DashboardContent>
  );
};

export default TrainingPlanPage;
