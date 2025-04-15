import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Grid,
  Paper,
  TextField,
  Typography,
  Chip,
  Select,
  MenuItem,
  Pagination,
  Box,
  styled,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { TrainingPlan, Module, Simulation } from '../../../types/training';

interface TrainingPlanTableProps {
  trainingPlans: TrainingPlan[];
  modules?: Module[];
  simulations?: Simulation[];
  isLoading?: boolean;
  error?: string | null;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
}));

const HeaderChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  height: 24,
  fontSize: '0.75rem',
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[100],
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const TrainingPlanTable: React.FC<TrainingPlanTableProps> = ({ 
  trainingPlans, 
  modules = [],
  simulations = [],
  isLoading = false,
  error = null 
}) => {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState('50');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedModules, setExpandedModules] = useState<{ [key: string]: boolean }>({});

  // Calculate total items
  const totalTrainingPlans = trainingPlans.length;
  const totalModules = modules.length;
  const totalSimulations = simulations.length;
  const totalItems = totalTrainingPlans + totalModules + totalSimulations;

  // Calculate total simulations across all items
  const totalSimulationsCount = trainingPlans.reduce(
    (acc, plan) => acc + plan.total_simulations,
    0
  ) + modules.reduce(
    (acc, module) => acc + module.total_simulations,
    0
  ) + simulations.length;

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

  // Filter all items based on search query and status
  const filteredTrainingPlans = trainingPlans.filter((plan) => {
    if (searchQuery && !plan.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && plan.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const filteredModules = modules.filter((module) => {
    if (searchQuery && !module.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && module.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const filteredSimulations = simulations.filter((sim) => {
    if (searchQuery && !sim.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && sim.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Calculate total filtered items
  const totalFilteredItems = filteredTrainingPlans.length + filteredModules.length + filteredSimulations.length;

  const toggleModuleExpand = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleSimulationClick = (simulationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/simulation/${simulationId}/attempt`);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" fontWeight="600">Training Plan</Typography>
          <HeaderChip label={`${totalSimulationsCount} Simulations`} size="small" />
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: '#F9FAFB',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 240 }}
        />
        <Stack direction="row" spacing={2}>
          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            size="small"
            sx={{
              minWidth: 120,
              bgcolor: 'background.paper',
            }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="7days">Next 7 Days</MenuItem>
            <MenuItem value="30days">Next 30 Days</MenuItem>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{
              minWidth: 120,
              bgcolor: 'background.paper',
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="not_started">Not Started</MenuItem>
            <MenuItem value="ongoing">Ongoing</MenuItem>
            <MenuItem value="finished">Finished</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : totalItems === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Alert severity="info">No training plans, modules, or simulations assigned yet.</Alert>
        </Box>
      ) : (
        <StyledPaper>
          <Grid container sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid item xs={3}>
              <Typography variant="subtitle2" color="text.secondary">Name</Typography>
            </Grid>
            <Grid item xs={2.5}>
              <Typography variant="subtitle2" color="text.secondary">Contents</Typography>
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="subtitle2" color="text.secondary">Est. Time</Typography>
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="subtitle2" color="text.secondary">Score</Typography>
            </Grid>
            <Grid item xs={1.5}>
              <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            </Grid>
          </Grid>

          {/* Training Plans Section */}
          {filteredTrainingPlans.length > 0 && (
            <>
              <SectionHeader>Training Plans</SectionHeader>
              {filteredTrainingPlans.map((plan) => (
                <Grid
                  key={plan.id}
                  container
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => navigate(`/training/${plan.id}`)}
                >
                  <Grid item xs={3}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="500">
                        {plan.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plan.completion_percentage}% completed
                      </Typography>
                      <Box sx={{
                        height: 2,
                        width: '100%',
                        bgcolor: 'primary.50',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}>
                        <Box sx={{
                          height: '100%',
                          width: `${plan.completion_percentage}%`,
                          bgcolor: 'primary.main',
                        }} />
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Typography variant="body2">
                      {plan.total_modules} Modules | {plan.total_simulations} Sims
                    </Typography>
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography variant="body2">{plan.est_time}m</Typography>
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: plan.average_sim_score >= 80 ? 'success.main' :
                          plan.average_sim_score >= 60 ? 'warning.main' : 'error.main',
                      }}
                    >
                      {plan.average_sim_score}%
                    </Typography>
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography variant="body2">{plan.due_date || 'No due date'}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Chip
                      label={plan.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(plan.status).bg,
                        color: getStatusColor(plan.status).color,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Grid>
                </Grid>
              ))}
            </>
          )}

          {/* Modules Section */}
          {filteredModules.length > 0 && (
            <>
              <SectionHeader>Modules</SectionHeader>
              {filteredModules.map((module) => (
                <React.Fragment key={module.id}>
                  <Grid
                    container
                    sx={{
                      p: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => navigate(`/training/${module.id}`)}
                  >
                    <Grid item xs={3}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton 
                          size="small" 
                          onClick={(e) => toggleModuleExpand(module.id, e)}
                          sx={{ mr: 1 }}
                        >
                          {expandedModules[module.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="500">
                            {module.name}
                          </Typography>
                          <Chip
                            label="Module"
                            size="small"
                            sx={{
                              bgcolor: '#F5F6FF',
                              color: '#444CE7',
                              height: 20,
                              width: 'fit-content',
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid item xs={2.5}>
                      <Typography variant="body2">
                        {module.total_simulations} Simulations
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">{module.estimated_time || 0}m</Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: module.average_score >= 80 ? 'success.main' :
                            module.average_score >= 60 ? 'warning.main' : 'error.main',
                        }}
                      >
                        {module.average_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">{module.due_date || 'No due date'}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Chip
                        label={module.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(module.status).bg,
                          color: getStatusColor(module.status).color,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Expandable Simulations within Module */}
                  <Collapse in={expandedModules[module.id]} timeout="auto" unmountOnExit>
                    {module.simulations.map((sim) => (
                      <Grid
                        container
                        key={sim.simulation_id}
                        sx={{
                          p: 2,
                          pl: 6,
                          borderTop: 1,
                          borderColor: 'divider',
                          bgcolor: 'grey.50',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            cursor: 'pointer',
                          },
                        }}
                        onClick={(e) => handleSimulationClick(sim.simulation_id, e)}
                      >
                        <Grid item xs={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight="500">
                              {sim.name}
                            </Typography>
                            <Chip
                              label="Simulation"
                              size="small"
                              sx={{
                                bgcolor: '#F5F6FF',
                                color: '#444CE7',
                                height: 20,
                                width: 'fit-content',
                              }}
                            />
                          </Stack>
                        </Grid>
                        <Grid item xs={2.5}>
                          <Chip
                            label={sim.type}
                            size="small"
                            sx={{
                              bgcolor: '#F5F6FF',
                              color: '#444CE7',
                              height: 20,
                            }}
                          />
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography variant="body2">{sim.est_time || 0}m</Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: sim.highest_attempt_score && sim.highest_attempt_score >= 80 ? 'success.main' :
                                sim.highest_attempt_score && sim.highest_attempt_score >= 60 ? 'warning.main' : 'error.main',
                            }}
                          >
                            {sim.highest_attempt_score ? `${sim.highest_attempt_score}%` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography variant="body2">{sim.dueDate || sim.due_date || 'No due date'}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Chip
                            label={sim.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(sim.status).bg,
                              color: getStatusColor(sim.status).color,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Grid>
                      </Grid>
                    ))}
                  </Collapse>
                </React.Fragment>
              ))}
            </>
          )}

          {/* Simulations Section */}
          {filteredSimulations.length > 0 && (
            <>
              <SectionHeader>Simulations</SectionHeader>
              {filteredSimulations.map((simulation) => (
                <Grid
                  key={simulation.simulation_id}
                  container
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => navigate(`/simulation/${simulation.simulation_id}/attempt`)}
                >
                  <Grid item xs={3}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight="500">
                        {simulation.name}
                      </Typography>
                      <Chip
                        label="Simulation"
                        size="small"
                        sx={{
                          bgcolor: '#F5F6FF',
                          color: '#444CE7',
                          height: 20,
                          width: 'fit-content',
                        }}
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Chip
                      label={simulation.type}
                      size="small"
                      sx={{
                        bgcolor: '#F5F6FF',
                        color: '#444CE7',
                        height: 20,
                      }}
                    />
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography variant="body2">{simulation.est_time || 0}m</Typography>
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: simulation.highest_attempt_score && simulation.highest_attempt_score >= 80 ? 'success.main' :
                          simulation.highest_attempt_score && simulation.highest_attempt_score >= 60 ? 'warning.main' : 'error.main',
                      }}
                    >
                      {simulation.highest_attempt_score ? `${simulation.highest_attempt_score}%` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={1.5}>
                    <Typography variant="body2">{simulation.dueDate || simulation.due_date || 'No due date'}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Chip
                      label={simulation.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(simulation.status).bg,
                        color: getStatusColor(simulation.status).color,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Grid>
                </Grid>
              ))}
            </>
          )}

          {totalFilteredItems === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No items match your search criteria.</Typography>
            </Box>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Rows per page:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
                size="small"
                sx={{ minWidth: 70 }}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </Stack>
            <Pagination
              count={Math.ceil(totalFilteredItems / parseInt(rowsPerPage))}
              shape="rounded"
              size="small"
            />
          </Stack>
        </StyledPaper>
      )}
    </Stack>
  );
};

export default TrainingPlanTable;