import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Button, Typography, Box } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../context/AuthContext';
import type { TrainingData, Simulation } from '../../../types/training';
import welcomeBannerImage from '../../../assets/banner.svg';

interface WelcomeBannerProps {
  userName: string;
  trainingData?: TrainingData | null;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName, trainingData }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuth();

  // Find the first simulation with "not_started" status
  const findNextSimulation = (): string | null => {
    if (!trainingData) return null;

    // Check simulations within training plans
    for (const plan of trainingData.training_plans) {
      for (const module of plan.modules) {
        const nextPlanSimulation = module.simulations.find(
          sim => sim.status === 'not_started'
        );
        if (nextPlanSimulation) {
          return nextPlanSimulation.simulation_id;
        }
      }
    }

    // Check simulations within modules
    for (const module of trainingData.modules) {
      const nextModuleSimulation = module.simulations.find(
        sim => sim.status === 'not_started'
      );
      if (nextModuleSimulation) {
        return nextModuleSimulation.simulation_id;
      }
    }
    
    // Check standalone simulations first
    const nextStandaloneSimulation = trainingData.simulations.find(
      sim => sim.status === 'not_started'
    );
    if (nextStandaloneSimulation) {
      return nextStandaloneSimulation.simulation_id;
    }

    return null;
  };

  const handleGoToNextSimulation = () => {
    const nextSimulationId = findNextSimulation();
    if (nextSimulationId) {
      const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
      navigate(`/simulation/${nextSimulationId}/attempt${workspaceParam}`);
    } else {
      // If no simulation is found, we could show a message or navigate to a default page
      console.log('No pending simulations found');
    }
  };

  const handleGoToPlayback = () => {
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
    navigate(`/playback${workspaceParam}`);
  };

  return (
    <Stack
      sx={{
        borderRadius: theme.shape.borderRadius,
        background: 'linear-gradient(to right, #0D6878, #31B5CC)',
        px: 4,
        py: 2,
        color: 'white',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={2}>
          <Typography variant="h2" fontWeight="high">
            Hi {userName}, Welcome to
            <br />
            Humana Telesales - Operations
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Monitor Progress, Sharpen Skills, and Ace
            <br />
            Your Simulations!
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleGoToNextSimulation}
              sx={{
                bgcolor: 'white',
                color: 'black',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Go to Next Simulation
            </Button>
            <Button
              sx={{
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
              onClick={handleGoToPlayback}
            >
              My Playbacks
            </Button>
          </Stack>
        </Stack>
        <Box
          component="img"
          src={welcomeBannerImage}
          alt="Dashboard illustration"
          sx={{
            width: 300,
            height: 250,
            objectFit: 'contain',
          }}
        />
      </Stack>
    </Stack>
  );
};

export default WelcomeBanner;