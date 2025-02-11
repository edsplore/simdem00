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
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  Search as SearchIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

type SimulationItem = {
  id: string;
  name: string;
  type: 'Sim' | 'Module';
  simCount?: number;
}

type CreateTrainingPlanFormData = {
  name: string;
  tags: string[];
  selectedItems: SimulationItem[];
}

type CreateTrainingPlanDialogProps = {
  open: boolean;
  onClose: () => void;
}

const availableTags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5'];
const availableItems: SimulationItem[] = [
  { id: 'SIM 007', name: 'Humana_Processing Refills transition to RTE', type: 'Sim' },
  { id: 'MOD 007', name: 'Humana_Inbound Authentication', type: 'Module', simCount: 2 },
  { id: 'SIM 008', name: 'Humana_Customer Service Basics', type: 'Sim' },
  { id: 'MOD 008', name: 'Humana_Claims Processing', type: 'Module', simCount: 3 },
];

const CreateTrainingPlanDialog: React.FC<CreateTrainingPlanDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<CreateTrainingPlanFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      tags: [],
      selectedItems: [],
    },
  });

  const selectedItems = watch('selectedItems');

  const getModuleAndSimCount = () => {
    const modules = selectedItems.filter(item => item.type === 'Module').length;
    const sims = selectedItems.filter(item => item.type === 'Sim').length;
    return { modules, sims };
  };

  const { modules, sims } = getModuleAndSimCount();

  const onSubmit = (data: CreateTrainingPlanFormData) => {
    console.log('Form data:', data);
    onClose();
  };

  const removeItem = (itemToRemove: SimulationItem) => {
    setValue(
      'selectedItems',
      selectedItems.filter(item => item.id !== itemToRemove.id),
      { shouldValidate: true }
    );
  };

  const isItemSelected = (item: SimulationItem) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const handleItemToggle = (item: SimulationItem) => {
    const currentItems = selectedItems;
    const isCurrentlySelected = isItemSelected(item);

    let newItems: SimulationItem[];
    if (isCurrentlySelected) {
      newItems = currentItems.filter(selected => selected.id !== item.id);
    } else {
      newItems = [...currentItems, item];
    }

    setValue('selectedItems', newItems, { shouldValidate: true });
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
              Create Training Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add training plan details and simulation
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
                    label="Training Plan Name"
                    required
                    sx={{ width: '50%' }}
                    size="medium"
                  />
                )}
              />
              <TextField
                value="TRP007"
                label="Training Plan ID"
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
                  Add Simulations and Modules
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    label={`${modules} Modules | ${sims} Sims`}
                    sx={{
                      bgcolor: '#F5F6FF',
                      color: '#444CE7',
                      borderRadius: 16,
                      height: 28,
                    }}
                  />
                </Box>

                <Controller
                  name="selectedItems"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      multiple
                      fullWidth
                      displayEmpty
                      renderValue={() => (
                        <Typography color="text.secondary">
                          Search Sim or Modules
                        </Typography>
                      )}
                      startAdornment={<SearchIcon sx={{ ml: 1, color: 'text.secondary' }} />}
                      onChange={() => {}}
                    >
                      {availableItems.map((item) => (
                        <MenuItem 
                          key={item.id} 
                          value={item}
                          onClick={(e) => {
                            e.preventDefault();
                            handleItemToggle(item);
                          }}
                          sx={{ width: '100%' }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Checkbox 
                              checked={isItemSelected(item)}
                              sx={{ p: 0, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ width: 80 }}>
                              {item.id}
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.type === 'Module' ? `Module | ${item.simCount} Sim` : 'Sim'}
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

                {selectedItems.length > 0 && (
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
                        {selectedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.type === 'Module' ? `Module | ${item.simCount} Sim` : 'Sim'}
                                size="small"
                                sx={{
                                  bgcolor: '#F5F6FF',
                                  color: '#444CE7',
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => removeItem(item)}>
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
              Create Training Plan
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrainingPlanDialog;