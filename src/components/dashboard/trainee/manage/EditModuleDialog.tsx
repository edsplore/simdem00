import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../../../context/AuthContext';
import { updateModule, Module } from '../../../../services/modules';
import { fetchSimulations, type Simulation } from '../../../../services/simulations';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  ClickAwayListener,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface SimulationItem {
  id: string;
  name: string;
}

interface EditModuleFormData {
  name: string;
  tags: string[];
  selectedSimulations: SimulationItem[];
}

interface EditModuleDialogProps {
  open: boolean;
  onClose: () => void;
  module: Module | null;
  onUpdateSuccess?: () => void;
}

const availableTags = ['Tag 01', 'Tag 02', 'Tag 03', 'Tag 04', 'Tag 05'];

const EditModuleDialog: React.FC<EditModuleDialogProps> = ({
  open,
  onClose,
  module,
  onUpdateSuccess,
}) => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulationsList, setShowSimulationsList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
    reset,
  } = useForm<EditModuleFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      tags: [],
      selectedSimulations: [],
    },
  });

  // Initialize form with module data when it changes
  useEffect(() => {
    if (module) {
      // Reset form with module data
      reset({
        name: module.name,
        tags: module.tags || [],
        selectedSimulations: [], // Will be populated after loading simulations
      });

      // Load simulations
      loadSimulations();
    }
  }, [module, reset]);

  const loadSimulations = async () => {
    if (!user?.id || !module) return;

    try {
      setIsLoading(true);
      setError(null);

      const simulationsData = await fetchSimulations(user.id);
      setSimulations(simulationsData);

      // Find the simulations that are in the module's simulations_id array
      const selectedSimulations: SimulationItem[] = module.simulations_id
        .map(simId => {
          const foundSim = simulationsData.find(sim => sim.id === simId);
          return foundSim ? { id: foundSim.id, name: foundSim.sim_name } : null;
        })
        .filter((sim): sim is SimulationItem => sim !== null);

      // Set the selected simulations in the form
      setValue('selectedSimulations', selectedSimulations);
    } catch (err) {
      setError('Failed to load simulations');
      console.error('Error loading simulations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSimulations = watch('selectedSimulations');
  const filteredSimulations = simulations.filter(sim => 
    sim.sim_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: EditModuleFormData) => {
    if (!user?.id || !module?.id) {
      setSubmitError('Missing required information');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setUpdateSuccess(false);

      const response = await updateModule(
        module.id,
        {
          user_id: user.id,
          module_name: data.name,
          tags: data.tags,
          simulations: data.selectedSimulations.map(sim => sim.id)
        }
      );

      // Check if response has an id, which indicates success
      if (response && response.id) {
        setUpdateSuccess(true);

        // Call the success callback to refresh the data in the parent component
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        setSubmitError('Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      setSubmitError('Failed to update module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSimulation = (simulationToRemove: SimulationItem) => {
    setValue(
      'selectedSimulations',
      selectedSimulations.filter(sim => sim.id !== simulationToRemove.id),
      { shouldValidate: true }
    );
  };

  const isSimulationSelected = (simulation: Simulation) => {
    return selectedSimulations.some(selected => selected.id === simulation.id);
  };

  const handleSimulationToggle = (simulation: Simulation) => {
    const currentSimulations = selectedSimulations;
    const isCurrentlySelected = isSimulationSelected(simulation);

    let newSimulations: SimulationItem[];
    if (isCurrentlySelected) {
      newSimulations = currentSimulations.filter(selected => selected.id !== simulation.id);
    } else {
      newSimulations = [...currentSimulations, { id: simulation.id, name: simulation.sim_name }];
    }

    setValue('selectedSimulations', newSimulations, { shouldValidate: true });
  };

  if (!module) {
    return null;
  }

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
              <BookIcon sx={{ color: '#444CE7' }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Edit Module
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update module details and simulations
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: '24px !important' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Module Name"
                    required
                    fullWidth
                    size="medium"
                  />
                )}
              />

            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  multiple
                  fullWidth
                  displayEmpty
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selected?.length === 0 ? (
                        <Typography color="text.secondary">Add Tags</Typography>
                      ) : (
                        selected.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            onDelete={(event) => {
                              event.stopPropagation();
                              const newTags = field.value.filter(t => t !== tag);
                              field.onChange(newTags);
                            }}
                            onMouseDown={(event) => {
                              // Also prevent the mousedown event from propagating
                              event.stopPropagation();
                            }}
                            sx={{
                              borderRadius: 20,
                              backgroundColor: '#F5F6FF',
                              border: '1px solid #DEE2FC',
                              color: '#444CE7',
                            }}
                          />
                        ))
                      )}
                    </Box>
                  )}
                >
                  {availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />

            <Box>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">
                    Add Simulations
                  </Typography>
                  <Chip
                    label={`${selectedSimulations.length} Sims`}
                    sx={{
                      bgcolor: '#F5F6FF',
                      color: '#444CE7',
                      borderRadius: 16,
                      height: 28,
                    }}
                  />
                </Stack>

                <Box position="relative" ref={searchFieldRef}>
                  <ClickAwayListener onClickAway={() => setShowSimulationsList(false)}>
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
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
                      {showSimulationsList && (
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            zIndex: 1300,
                            width: searchFieldRef.current?.offsetWidth || '100%',
                            left: 0,
                            mt: 0.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            boxShadow: 3,
                            maxHeight: 300,
                            minHeight: filteredSimulations.length > 0 ? 250 : 'auto',
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                            },
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
                                  handleSimulationToggle(simulation);
                                  setShowSimulationsList(false);
                                }}
                                sx={{
                                  p: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: '#F5F6FF' },
                                  display: 'grid',
                                  gridTemplateColumns: 'auto 80px 1fr auto',
                                  alignItems: 'center', 
                                  gap: 2,
                                  width: '100%'
                                }}
                              >
                                <Checkbox 
                                  checked={isSimulationSelected(simulation)}
                                  sx={{ p: 0 }}
                                />
                                <Typography variant="body2" noWrap>
                                  {simulation.id.slice(-6)}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {simulation.sim_name}
                                </Typography>
                                <Chip
                                  label="Sim"
                                  size="small"
                                  sx={{
                                    bgcolor: '#F5F6FF',
                                    color: '#444CE7',
                                    justifySelf: 'end'
                                  }}
                                />
                              </Box>
                            ))
                          )}
                        </Box>
                      )}
                    </Box>
                  </ClickAwayListener>
                </Box>

                {selectedSimulations.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSimulations.map((simulation) => (
                          <TableRow key={simulation.id}>
                            <TableCell>{simulation.id.slice(-6)}</TableCell>
                            <TableCell>{simulation.name}</TableCell>
                            <TableCell>
                              <Chip
                                label="Sim"
                                size="small"
                                sx={{
                                  bgcolor: '#F5F6FF',
                                  color: '#444CE7',
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => removeSimulation(simulation)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            </Box>

            {updateSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Module updated successfully!
              </Alert>
            )}

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}

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
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Updating...
                </Box>
              ) : (
                'Update Module'
              )}
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditModuleDialog;