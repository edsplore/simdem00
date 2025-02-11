import React from 'react';
import { Stack, Typography, Container } from '@mui/material';
import Layout from '../../layout/Layout';
import DashboardContent from '../DashboardContent';
import StatsGrid from './StatsGrid';
import TrainingPlanTable from './TrainingPlanTable';

const TrainingPlanPage = () => {
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
            <StatsGrid />
            <TrainingPlanTable />
          </Stack>
        </Container>
      </DashboardContent>
    
  );
};

export default TrainingPlanPage;