import React from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  Checkbox,
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

interface CreateModuleFormData {
  name: string;
  tags: string[];
  selectedSimulations: SimulationItem[];
}

interface CreateModuleDialogProps {
  open: boolean;
  onClose: () => void;
}

const availableTags = ['Tag 01', 'Tag 02', 'Tag 03', 'Tag 04', 'Tag 05'];
const availableSimulations: SimulationItem[] = [
  { id: 'SIM 007', name: 'Humana_Processing Refills transition to RTE' },
  { id: 'SIM 008', name: 'Humana_Customer Service Basics' },
  { id: 'SIM 009', name: 'Humana_Claims Processing Overview' },
  { id: 'SIM 010', name: 'Humana_Member Authentication Process' },
  { id: 'SIM 011', name: 'Humana_Benefits Verification' },
];

const CreateModuleDialog: React.FC<CreateModuleDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<CreateModuleFormData>({
    mode: 'onChange',
    defaultValues: {
      name: 'Untitled Module 01',
      tags: [],
      selectedSimulations: [],
    },
  });

  const selectedSimulations = watch('selectedSimulations');

  const onSubmit = (data: CreateModuleFormData) => {
    console.log('Form data:', data);
    onClose();
  };

  const removeSimulation = (simulationToRemove: SimulationItem) => {
    setValue(
      'selectedSimulations',
      selectedSimulations.filter(sim => sim.id !== simulationToRemove.id),
      { shouldValidate: true }
    );
  };

  const isSimulationSelected = (simulation: SimulationItem) => {
    return selectedSimulations.some(selected => selected.id === simulation.id);
  };

  const handleSimulationToggle = (simulation: SimulationItem) => {
    const currentSimulations = selectedSimulations;
    const isCurrentlySelected = isSimulationSelected(simulation);

    let newSimulations: SimulationItem[];
    if (isCurrentlySelected) {
      newSimulations = currentSimulations.filter(selected => selected.id !== simulation.id);
    } else {
      newSimulations = [...currentSimulations, simulation];
    }

    setValue('selectedSimulations', newSimulations, { shouldValidate: true });
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
              <BookIcon sx={{ color: '#444CE7' }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Create Module
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add module details and simulation
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
            <Stack direction="row" spacing={2}>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Module Name"
                    required
                    sx={{ width: '50%' }}
                    size="medium"
                  />
                )}
              />
              <TextField
                value="MOD007"
                label="Module Plan ID"
                disabled
                sx={{ width: '50%' }}
              />
            </Stack>

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
                            onDelete={() => {
                              const newTags = field.value.filter(t => t !== tag);
                              field.onChange(newTags);
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
                <Typography variant="subtitle1">
                  Add Simulations
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    label={`${selectedSimulations.length} Sims`}
                    sx={{
                      bgcolor: '#F5F6FF',
                      color: '#444CE7',
                      borderRadius: 16,
                      height: 28,
                    }}
                  />
                </Box>

                <Controller
                  name="selectedSimulations"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      multiple
                      fullWidth
                      displayEmpty
                      renderValue={() => (
                        <Typography color="text.secondary">
                          Search Simulation
                        </Typography>
                      )}
                      startAdornment={<SearchIcon sx={{ ml: 1, color: 'text.secondary' }} />}
                      onChange={() => {}}
                    >
                      {availableSimulations.map((simulation) => (
                        <MenuItem 
                          key={simulation.id} 
                          value={simulation}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSimulationToggle(simulation);
                          }}
                          sx={{ width: '100%' }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Checkbox 
                              checked={isSimulationSelected(simulation)}
                              sx={{ p: 0, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ width: 80 }}>
                              {simulation.id}
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {simulation.name}
                            </Typography>
                            <Chip
                              label="Sim"
                              size="small"
                              sx={{
                                bgcolor: '#F5F6FF',
                                color: '#444CE7',
                              }}
                            />
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />

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
                            <TableCell>{simulation.id}</TableCell>
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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!isValid}
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
              Create Module
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateModuleDialog;