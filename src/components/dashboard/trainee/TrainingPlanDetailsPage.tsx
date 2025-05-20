import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Stack,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import DashboardContent from '../DashboardContent';
import { useAuth } from '../../../context/AuthContext';
import type { TrainingPlan } from '../../../types/training';
import TrainingItemsTable from './TrainingItemsTable';

const TrainingPlanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspaceId } = useAuth();
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get training plan data from location state
  useEffect(() => {
    if (location.state?.trainingPlan) {
      setTrainingPlan(location.state.trainingPlan);
      setIsLoading(false);
    } else if (id) {
      // Fallback to fetch from API if not available in state
      setError("Training plan details not found. Please go back to the dashboard.");
      setIsLoading(false);
    }
  }, [id, location.state]);

  if (isLoading) {
    return (
      <DashboardContent>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Container>
          <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        </Container>
      </DashboardContent>
    );
  }

  if (!trainingPlan) {
    return (
      <DashboardContent>
        <Container>
          <Alert severity="info" sx={{ mt: 4 }}>Training plan not found</Alert>
        </Container>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Link 
              to={`/training${currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <Typography variant="h4" color="text.secondary">
                Training Plan
              </Typography>
            </Link>
            <Typography variant="h4" color="text.secondary">/</Typography>
            <Typography variant="h4">{trainingPlan.name}</Typography>
          </Stack>

          {/* Use the reusable table component */}
          <TrainingItemsTable 
            modules={trainingPlan.modules || []}
            simulations={trainingPlan.simulations || []}
            isLoading={false}
            error={null}
            showTrainingPlans={false} // Don't show training plans section
          />
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default TrainingPlanDetailsPage;