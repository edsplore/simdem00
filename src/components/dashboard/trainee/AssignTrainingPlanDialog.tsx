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
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

type AssignTrainingPlanFormData = {
  name: string;
  trainingPlan: string;
  startDate: string;
  dueDate: string;
  assignTo: string[];
};

type AssignTrainingPlanDialogProps = {
  open: boolean;
  onClose: () => void;
};

type TrainingPlan = {
  id: string;
  name: string;
  simCount: number;
};

type Assignee = {
  id: string;
  name: string;
  email?: string;
  type: 'team' | 'trainee';
};

const trainingPlans: TrainingPlan[] = [
  { id: 'TRP 007', name: 'Humana_Inbound Authentication', simCount: 8 },
  { id: 'TRP 007', name: 'Humana_Inbound Authentication', simCount: 8 },
  { id: 'TRP 007', name: 'Humana_Inbound Authentication', simCount: 8 },
  { id: 'TRP 007', name: 'Humana_Inbound Authentication', simCount: 8 },
  { id: 'TRP 007', name: 'Humana_Inbound Authentication', simCount: 8 },
];

const assignees: Assignee[] = [
  { id: 'team1', name: 'Team 01', type: 'team' },
  { id: 'team2', name: 'Team 02', type: 'team' },
  { 
    id: 'trainee1', 
    name: 'John Baker', 
    email: 'john.baker@everailabs.com', 
    type: 'trainee' 
  },
  { 
    id: 'trainee2', 
    name: 'John Doe', 
    email: 'john.baker@everailabs.com', 
    type: 'trainee' 
  },
  { 
    id: 'trainee3', 
    name: 'Lana Steiner', 
    email: 'lanasteiner@everailabs.com', 
    type: 'trainee' 
  },
];

const AssignTrainingPlanDialog: React.FC<AssignTrainingPlanDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<AssignTrainingPlanFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      trainingPlan: '',
      startDate: '',
      dueDate: '',
      assignTo: [],
    },
  });

  const selectedAssignees = watch('assignTo');

  const onSubmit = (data: AssignTrainingPlanFormData) => {
    console.log('Form data:', data);
    onClose();
  };

  const getSelectedAssigneeName = (id: string) => {
    return assignees.find(assignee => assignee.id === id)?.name || '';
  };

  const handleDeleteAssignee = (assigneeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent dropdown from opening
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
              <BookIcon sx={{ color: '#444CE7' }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Assign Training Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign training plan to teams and trainees
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

              <TextField
                value="ASN007"
                label="Assignment ID"
                disabled
                fullWidth
              />

              <Controller
                name="trainingPlan"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    displayEmpty
                    fullWidth
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Typography color="text.secondary">
                            Select Training Plan *
                          </Typography>
                        );
                      }
                      const selectedPlan = trainingPlans.find(plan => plan.id === selected);
                      return selectedPlan?.name || '';
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {trainingPlans.map((plan) => (
                      <MenuItem 
                        key={plan.id} 
                        value={plan.id}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            bgcolor: '#F5F6FF',
                          },
                        }}
                      >
                        <Stack spacing={0.5} sx={{ width: '100%' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              {plan.id}
                            </Typography>
                            <Chip
                              label={`Training plan | ${plan.simCount} Sim`}
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
                            {plan.name}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                )}
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
                    displayEmpty
                    fullWidth
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
                    {assignees.map((assignee) => (
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
                    ))}
                  </Select>
                )}
              />
            </Stack>

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
              Assign Training Plan
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTrainingPlanDialog;