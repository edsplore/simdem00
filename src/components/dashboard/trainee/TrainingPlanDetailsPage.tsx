import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import DashboardContent from '../DashboardContent';
import { useAuth } from '../../../context/AuthContext';
import { fetchTrainingPlanDetails } from '../../../services/training';
import { fetchModuleDetails } from '../../../services/modules';
import type { Module, TrainingPlan, Simulation } from '../../../types/training';

const TrainingPlanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('50');
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [expandedModules, setExpandedModules] = useState<{ [key: string]: boolean }>({});
  const [moduleSimulations, setModuleSimulations] = useState<{ [key: string]: Simulation[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrainingPlanDetails = async () => {
      if (!id || !user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTrainingPlanDetails(user.id, id);

        // Separate modules and simulations
        const newModules: Module[] = [];
        const newSimulations: Simulation[] = [];

        data.added_object.forEach(obj => {
          if (obj.type === 'module') {
            newModules.push({
              id: obj.id,
              name: `Module ${obj.id.slice(-4)}`,
              total_simulations: 0,
              average_score: 0,
              status: 'not_started',
              simulations: []
            });
          } else {
            newSimulations.push({
              simulation_id: obj.id,
              name: `Simulation ${obj.id.slice(-4)}`,
              type: 'audio',
              level: 'Level 1',
              est_time: 15,
              status: 'not_started',
              highest_attempt_score: null
            });
          }
        });

        setTrainingPlan(data);
        setModules(newModules);
        setSimulations(newSimulations);
      } catch (err) {
        console.error('Error loading training plan details:', err);
        setError('Failed to load training plan details');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrainingPlanDetails();
  }, [id, user?.id]);

  const handleModuleExpand = async (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));

    // If already expanded, don't fetch again
    if (expandedModules[moduleId] && moduleSimulations[moduleId]) return;

    try {
      const moduleData = await fetchModuleDetails(moduleId);
      const simulations = moduleData.simulations_id.map(simId => ({
        simulation_id: simId,
        name: `Simulation ${simId.slice(-4)}`,
        type: 'audio',
        level: 'Level 1',
        est_time: 15,
        status: 'not_started' as const,
        highest_attempt_score: null
      }));

      setModuleSimulations(prev => ({
        ...prev,
        [moduleId]: simulations
      }));
    } catch (err) {
      console.error(`Error loading module ${moduleId} details:`, err);
    }
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

  const handleSimulationClick = (simulationId: string) => {
    navigate(`/simulation/${simulationId}/attempt`);
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

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Link 
              to="/training" 
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
              {modules.map((module) => (
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
                    onClick={() => handleModuleExpand(module.id)}
                  >
                    <Grid item xs={4}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small">
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: expandedModules[module.id] ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s'
                            }} 
                          />
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
                      <Typography>No due date</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Chip
                        label={module.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(module.status).bg,
                          color: getStatusColor(module.status).color,
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Module's Simulations */}
                  {expandedModules[module.id] && moduleSimulations[module.id]?.map((sim) => (
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
                      onClick={() => handleSimulationClick(sim.simulation_id)}
                    >
                      <Grid item xs={4}>
                        <Typography>{sim.name}</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Chip
                          label="simulation"
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
                        <Typography>No due date</Typography>
                      </Grid>
                      <Grid item xs={1}>
                        <Chip
                          label={sim.status}
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

              {/* Render Standalone Simulations */}
              {simulations.map((sim) => (
                <Grid
                  container
                  key={sim.simulation_id}
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => handleSimulationClick(sim.simulation_id)}
                >
                  <Grid item xs={4}>
                    <Typography>{sim.name}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Chip
                      label="simulation"
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
                    <Typography>No due date</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Chip
                      label={sim.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(sim.status).bg,
                        color: getStatusColor(sim.status).color,
                      }}
                    />
                  </Grid>
                </Grid>
              ))}
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
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="20">20</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="100">100</MenuItem>
                </Select>
              </Stack>
              <Pagination
                count={Math.ceil((modules.length + simulations.length) / parseInt(rowsPerPage))}
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