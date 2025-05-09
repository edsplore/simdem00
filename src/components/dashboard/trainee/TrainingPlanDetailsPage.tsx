import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Stack,
  Container,
  Typography,
  TextField,
  IconButton,
  Paper,
  Grid,
  Chip,
  Select,
  MenuItem,
  Pagination,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DashboardContent from '../DashboardContent';
import { useAuth } from '../../../context/AuthContext';
import type { Module, TrainingPlan, Simulation } from '../../../types/training';

const TrainingPlanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentWorkspaceId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('50');
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [expandedModules, setExpandedModules] = useState<{ [key: string]: boolean }>({});
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

  const handleModuleExpand = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleSimulationClick_old = (simulationId: string) => {
    // Include workspace ID in the URL if available
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
    navigate(`/simulation/${simulationId}/attempt${workspaceParam}`);
  };
  // Updated to include assignment_id in navigation
  const handleSimulationClick = (
    simulationId: string,
    assignmentId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const workspaceParam = currentWorkspaceId
      ? `?workspace_id=${currentWorkspaceId}`
      : "";
    navigate(
      `/simulation/${simulationId}/${assignmentId}/attempt${workspaceParam}`,
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return { bg: '#EEF4FF', color: '#3538CD' };
      case 'finished':
        return { bg: '#ECFDF3', color: '#027A48' };
      default:
        return { bg: '#FFFAEB', color: '#B54708' };
    }
  };

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

  // Filter modules based on search query
  const filteredModules = trainingPlan.modules.filter(module => 
    searchQuery ? module.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
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

          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <TextField
                placeholder="Search"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ maxWidth: 300 }}
              />
              <Stack direction="row" spacing={1}>
                <IconButton>
                  <FilterListIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton>
                  <SortIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            </Stack>

            <Paper variant="outlined">
              <Grid container sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" color="text.secondary">Assignment</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" color="text.secondary">Score</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                </Grid>
              </Grid>

              {/* Render Modules */}
              {filteredModules.map((module) => (
                <React.Fragment key={module.id}>
                  <Grid
                    container
                    sx={{
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      cursor: 'pointer',
                    }}
                    onClick={(e) => handleModuleExpand(module.id, e)}
                  >
                    <Grid item xs={4}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small">
                          {expandedModules[module.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Typography>{module.name}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={2}>
                      <Chip
                        label="module"
                        size="small"
                        sx={{
                          bgcolor: '#F5F6FF',
                          color: '#444CE7',
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography>Module Assignment</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography
                        sx={{
                          color: module.average_score >= 80 ? 'success.main' :
                            module.average_score >= 60 ? 'warning.main' : 'error.main'
                        }}
                      >
                        {module.average_score ? `${module.average_score}%` : 'NA'}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography>{module.due_date || 'No due date'}</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Chip
                        label={module.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(module.status).bg,
                          color: getStatusColor(module.status).color,
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Module's Simulations */}
                  {expandedModules[module.id] && module.simulations.map((sim) => (
                    <Grid
                      container
                      key={sim.simulation_id}
                      sx={{
                        p: 2,
                        pl: 6,
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                        },
                      }}
                      onClick={(e) =>
                        handleSimulationClick(
                          sim.simulation_id,
                          sim.assignment_id,
                          e,
                        )
                      }
                    >
                      <Grid item xs={4}>
                        <Typography>{sim.name}</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Chip
                          label={sim.type}
                          size="small"
                          sx={{
                            bgcolor: '#F5F6FF',
                            color: '#444CE7',
                          }}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <Typography>Simulation Task</Typography>
                      </Grid>
                      <Grid item xs={1}>
                        <Typography
                          sx={{
                            color: sim.highest_attempt_score && sim.highest_attempt_score >= 80 ? 'success.main' :
                              sim.highest_attempt_score && sim.highest_attempt_score >= 60 ? 'warning.main' : 'error.main'
                          }}
                        >
                          {sim.highest_attempt_score ? `${sim.highest_attempt_score}%` : 'NA'}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography>{sim.dueDate || sim.due_date || 'No due date'}</Typography>
                      </Grid>
                      <Grid item xs={1}>
                        <Chip
                          label={sim.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(sim.status).bg,
                            color: getStatusColor(sim.status).color,
                          }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </React.Fragment>
              ))}

              {filteredModules.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No modules match your search criteria.</Typography>
                </Box>
              )}
            </Paper>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                  size="small"
                  sx={{ minWidth: 80 }}
                >
                  <MenuItem value="5">5</MenuItem>
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                </Select>
              </Stack>
              <Pagination
                count={Math.ceil(filteredModules.length / parseInt(rowsPerPage))}
                shape="rounded"
                size="small"
              />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default TrainingPlanDetailsPage;