import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { fetchSimulations, type Simulation } from '../../../services/simulations';
import { fetchUsersSummary, type User } from '../../../services/users';
import { fetchTeams, type Team } from '../../../services/teams';
import { createAssignment } from '../../../services/assignments';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  IconButton,
  TextField,
  Box,
  Button,
  Avatar,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ClickAwayListener,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as SmartToyIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';

interface Assignee {
  id: string;
  name: string;
  email?: string;
  type: 'team' | 'trainee';
}

interface CreateSimulationFormData {
  name: string;
  simulationId: string;
  startDate: string;
  dueDate: string;
  assignTo: string[];
}

interface AssignSimulationsDialogProps {
  open: boolean;
  onClose: () => void;
  onAssignmentCreated?: () => void;
}

const AssignSimulationsDialog: React.FC<AssignSimulationsDialogProps> = ({
  open,
  onClose,
  onAssignmentCreated,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulationsList, setShowSimulationsList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [showAssigneesList, setShowAssigneesList] = useState(false);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<CreateSimulationFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      simulationId: '',
      startDate: '',
      dueDate: '',
      assignTo: [],
    },
  });

  useEffect(() => {
    const loadSimulations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSimulations(user?.id || 'user123');
        setSimulations(data);
      } catch (err) {
        setError('Failed to load simulations');
        console.error('Error loading simulations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadSimulations();
    }
  }, [open, user?.id]);

  useEffect(() => {
    const loadAssignees = async () => {
      if (!currentWorkspaceId) {
        console.error('No workspace ID available');
        return;
      }

      setIsLoadingAssignees(true);
      try {
        // Fetch both users and teams in parallel
        const [usersResponse, teamsResponse] = await Promise.all([
          fetchUsersSummary(currentWorkspaceId),
          fetchTeams(currentWorkspaceId)
        ]);

        console.log('Users response:', usersResponse);
        console.log('Teams response:', teamsResponse);

        // Process users
        const userAssignees: Assignee[] = Array.isArray(usersResponse) ? 
          usersResponse.map(user => ({
            id: user.user_id,
            name: user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            type: 'trainee'
          })) : [];

        // Process teams
        const teamAssignees: Assignee[] = teamsResponse && teamsResponse.teams ? 
          teamsResponse.teams.map(team => ({
            id: team.team_id,
            name: team.team_name,
            type: 'team'
          })) : [];

        // Combine users and teams
        const allAssignees = [...teamAssignees, ...userAssignees];
        setAssignees(allAssignees);

        console.log('Loaded assignees:', {
          teams: teamAssignees.length,
          users: userAssignees.length,
          total: allAssignees.length
        });
      } catch (error) {
        console.error('Error loading assignees:', error);
        setError('Failed to load users and teams');
      } finally {
        setIsLoadingAssignees(false);
      }
    };

    if (open && currentWorkspaceId) {
      loadAssignees();
    }
  }, [open, currentWorkspaceId]);

  const selectedAssignees = watch('assignTo');
  const filteredSimulations = simulations.filter(simulation => 
    simulation.sim_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignees = assignees.filter(assignee => 
    assignee.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
    (assignee.email && assignee.email.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
  );

  const onSubmit = async (data: CreateSimulationFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Split assignees into teams and trainees
      const teams = data.assignTo.filter(id => 
        assignees.find(a => a.id === id)?.type === 'team'
      );
      const trainees = data.assignTo.filter(id => 
        assignees.find(a => a.id === id)?.type === 'trainee'
      );

      const response = await createAssignment({
        user_id: user?.id || 'user123',
        name: data.name,
        type: 'Simulation',
        id: data.simulationId,
        start_date: data.startDate,
        end_date: data.dueDate,
        team_id: teams,
        trainee_id: trainees
      });

      if (response.status === 'success') {
        onAssignmentCreated?.();
        onClose();
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setSubmitError('Failed to create assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedAssigneeName = (id: string) => {
    return assignees.find(assignee => assignee.id === id)?.name || '';
  };

  const handleDeleteAssignee = (assigneeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = selectedAssignees.filter(id => id !== assigneeId);
    setValue('assignTo', newValue, { shouldValidate: true });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              position: 'relative',
              width: 48,
              height: 48,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: -6,
                left: -6,
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: '#EEF4FF',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'relative',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#F5F6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <SmartToyIcon sx={{ color: '#444CE7' }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Assign Simulation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign simulation to teams and trainees
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Assignment Name"
                    required
                    fullWidth
                    size="medium"
                  />
                )}
              />

              <Controller
                name="simulationId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const selectedSimulationDetails = selectedSimulation ? (
                    <Stack spacing={0.5} sx={{ width: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {selectedSimulation.id.slice(-6)}
                        </Typography>
                        <Chip
                          label={selectedSimulation.sim_type}
                          size="small"
                          sx={{
                            bgcolor: '#F5F6FF',
                            color: '#444CE7',
                            height: 24,
                            '& .MuiChip-label': {
                              px: 1,
                              fontSize: '12px',
                            },
                          }}
                        />
                      </Stack>
                      <Typography variant="body1">
                        {selectedSimulation.sim_name}
                      </Typography>
                    </Stack>
                  ) : null;

                  return (
                    <Box position="relative" ref={searchFieldRef}>
                      <ClickAwayListener onClickAway={() => setShowSimulationsList(false)}>
                        <Box>
                          <TextField
                            {...field}
                            fullWidth
                            placeholder="Search simulations..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowSimulationsList(true);
                            }}
                            onClick={() => setShowSimulationsList(true)}
                            InputProps={{
                              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                          />
                          {selectedSimulationDetails && !showSimulationsList && (
                            <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                              {selectedSimulationDetails}
                            </Box>
                          )}
                          {showSimulationsList && (
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                zIndex: 1300,
                                width: '100%',
                                left: 0,
                                mt: 0.5,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                boxShadow: 3,
                                maxHeight: 300,
                                minHeight: filteredSimulations.length > 0 ? 250 : 'auto',
                                overflow: 'auto',
                              }}
                            >
                              {isLoading ? (
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                  <CircularProgress size={24} />
                                </Box>
                              ) : error ? (
                                <Typography sx={{ p: 2, color: 'error.main' }}>{error}</Typography>
                              ) : filteredSimulations.length === 0 ? (
                                <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                                  No matches found
                                </Typography>
                              ) : (
                                filteredSimulations.map((simulation) => (
                                  <Box
                                    key={simulation.id}
                                    onClick={() => {
                                      field.onChange(simulation.id);
                                      setSelectedSimulation(simulation);
                                      setShowSimulationsList(false);
                                      setSearchQuery('');
                                    }}
                                    sx={{
                                      p: 1.5,
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: '#F5F6FF' },
                                    }}
                                  >
                                    <Stack spacing={0.5}>
                                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                          {simulation.id.slice(-6)}
                                        </Typography>
                                        <Chip
                                          label={simulation.sim_type}
                                          size="small"
                                          sx={{
                                            bgcolor: '#F5F6FF',
                                            color: '#444CE7',
                                            height: 24,
                                            '& .MuiChip-label': {
                                              px: 1,
                                              fontSize: '12px',
                                            },
                                          }}
                                        />
                                      </Stack>
                                      <Typography variant="body1">
                                        {simulation.sim_name}
                                      </Typography>
                                    </Stack>
                                  </Box>
                                ))
                              )}
                            </Box>
                          )}
                        </Box>
                      </ClickAwayListener>
                    </Box>
                  );
                }}
              />

              <Stack direction="row" spacing={2}>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Start Date"
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />

                <Controller
                  name="dueDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Due Date"
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="assignTo"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    multiple
                    fullWidth
                    displayEmpty
                    onOpen={() => setShowAssigneesList(true)}
                    onClose={() => setShowAssigneesList(false)}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return (
                          <Typography color="text.secondary">
                            Assign to
                          </Typography>
                        );
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={getSelectedAssigneeName(value)}
                              onDelete={(e) => handleDeleteAssignee(value, e)}
                              deleteIcon={<CloseIcon />}
                              avatar={
                                <Avatar sx={{ bgcolor: '#F5F6FF' }}>
                                  {assignees.find(a => a.id === value)?.type === 'team' ? (
                                    <GroupIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                                  ) : (
                                    <PersonIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                                  )}
                                </Avatar>
                              }
                              sx={{
                                bgcolor: '#F5F6FF',
                                border: '1px solid #DEE2FC',
                                '& .MuiChip-deleteIcon': {
                                  color: '#444CE7',
                                  fontSize: 16,
                                  '&:hover': {
                                    color: '#3538CD',
                                  },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }}
                  >
                    <Box sx={{ p: 2, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search users or teams..."
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        }}
                      />
                    </Box>

                    {isLoadingAssignees ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : assignees.length === 0 ? (
                      <MenuItem disabled>No users or teams available</MenuItem>
                    ) : filteredAssignees.length === 0 ? (
                      <MenuItem disabled>No matches found</MenuItem>
                    ) : (
                      filteredAssignees.map((assignee) => (
                        <MenuItem
                          key={assignee.id}
                          value={assignee.id}
                          sx={{
                            py: 1,
                            px: 2,
                            '&:hover': {
                              bgcolor: '#F5F6FF',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Checkbox
                              checked={selectedAssignees.includes(assignee.id)}
                              sx={{
                                color: '#D0D5DD',
                                '&.Mui-checked': {
                                  color: '#444CE7',
                                },
                              }}
                            />
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#F5F6FF' }}>
                              {assignee.type === 'team' ? (
                                <GroupIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                              ) : (
                                <PersonIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                              )}
                            </Avatar>
                            <Stack spacing={0.5} flex={1}>
                              <Typography variant="body2">
                                {assignee.name}
                              </Typography>
                              {assignee.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {assignee.email}
                                </Typography>
                              )}
                            </Stack>
                            <Chip
                              label={assignee.type === 'team' ? 'Team' : 'Trainee'}
                              size="small"
                              sx={{
                                bgcolor: '#F5F6FF',
                                color: '#444CE7',
                                height: 24,
                                '& .MuiChip-label': {
                                  px: 1,
                                  fontSize: '12px',
                                },
                              }}
                            />
                          </Stack>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                )}
              />
            </Stack>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!isValid || isSubmitting}
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: '#444CE7',
                color: 'white',
                '&:hover': {
                  bgcolor: '#3538CD',
                },
                '&.Mui-disabled': {
                  bgcolor: '#F5F6FF',
                  color: '#444CE7',
                },
              }}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Simulation'}
            </Button>

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSimulationsDialog;